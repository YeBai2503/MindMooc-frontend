# MindMooc AI微服务 接口文档

概述：本服务为 MindMooc 的 AI 辅助处理服务，基于 FastAPI 实现，主要提供思维导图生成、编辑、人工审核和视频片段合并能力。

启动示例：

```bash
uvicorn main:app --host 0.0.0.0 --port 10020
```

公共响应格式（统一包装）：
- `Result`：
	- `code` (int)：状态码（业务语义，可参考 200/202/500）
	- `message` (str)：简短描述
	- `data` (object)：接口返回的具体数据，默认 `{}`


------------------------------------------------------------------

**接口：生成编辑计划（开始编辑）**
- 方法：POST
- URL：/api/agent/mindmap/edit
- 请求体：`EditMindmapRequest`（含 `user_data`）
 - 请求体示例：

```json
{
	"user_data": {
		"user_id": "user123",
		"video_id": "vid001",
		"task_id": "task-abc",
		"mindmap_id": "map-001",
		"instruction": "可选的额外指令"
	}
}
```
- 功能说明与流程：
	1. 根据 `user_data.mindmap_id` 从 TiDB 拉取已有思维导图节点，构造 `mindmapNodes`。
	2. 构建 `MainGraphState`（mode="edit"）并调用 `main_graph.invoke` 执行编辑图流程。
	3. 若流程需要人工介入，`main_graph` 会把线程置为等待状态（`state.next`），此时接口会返回需要人工审查的节点或提示，后续通过 `/manual-review` 接口提交审核结果以恢复流程。
- 可能返回示例（等待人工审核）：

```json
{
	"code": 200,
	"message": "请进行人工审核，审核通过后会继续进行编辑计划的生成。",
	"data": {"mindmapNodes": [ /* MindmapNode 列表 */ ]}
}
```

- MindmapNode结构

```
class MindmapNode(TypedDict):
    """思维导图节点，和数据库对应"""
    id: str
    map_id: str
    parent_id: str|None # 父节点ID，根节点的parent_id为None
    node_order: int # 同级节点的顺序
    content: str
    node_type: Literal["text", "formula", "chart"] # 节点类型
    chart_url: str # 如果节点类型是chart，则提供图表URL
    start_time: float # 视频中该节点内容出现的开始时间
    end_time: float # 视频中该节点内容出现的结束时间
```

- cURL 示例：

```bash
curl -X POST http://localhost:10020/api/agent/mindmap/edit \
	-H "Content-Type: application/json" \
	-d '{"user_data":{"user_id":"user123","video_id":"vid001","task_id":"task-abc","mindmap_id":"map-001"}}'
```

------------------------------------------------------------------

**接口：人工审查（继续或中断编辑流程）**
- 方法：POST
- URL：/api/agent/mindmap/manual-review
- 请求体：`ManualReviewRequest`
	- `user_data`（同上）
	- `is_approved` (bool)：true 表示通过，false 表示不通过
 - 请求体示例：

```json
{
	"user_data": {
		"user_id": "user123",
		"video_id": "vid001",
		"task_id": "task-abc",
		"mindmap_id": "map-001",
		"instruction": ""
	},
	"is_approved": true
}
```
- 功能说明与流程：
	1. 根据 `user_id + '_' + task_id` 构造 `thread_id` 并通过 `main_graph.get_state(config)` 验证当前线程处于等待审查状态。
	2. 调用 `main_graph.invoke(Command(resume=is_approved), config=config)` 恢复或中止后续流程。
	3. 返回审查已提交信息，后续编辑继续在后台执行并可能更新 TiDB。
- 成功返回示例：

```json
{ "code": 200, "message": "人工审查接口调用成功。", "data": {"status":"编辑成功"} }
```
- cURL 示例：

```bash
curl -X POST http://localhost:10020/api/agent/mindmap/manual-review \
	-H "Content-Type: application/json" \
	-d '{"user_data":{"user_id":"user123","video_id":"vid001","task_id":"task-abc","mindmap_id":"map-001"},"is_approved":true}'
```

------------------------------------------------------------------

**接口：视频片段合并（导出复习视频）**
- 方法：POST
- URL：/api/agent/mindmap/video-combine
- 请求体：`VideoCombineRequest`
	- `video_id` (string)
	- `mindmapNodes` (array of `MindmapNode`) —— 主要使用每项的 `start_time`/`end_time`
 - 请求体示例：

```json
{
	"video_id": "vid001",
	"mindmapNodes": [
		{
			"id": "n1",
			"map_id": "map-001",
			"parent_id": null,
			"node_order": 0,
			"content": "章节一要点",
			"node_type": "text",
			"chart_url": "",
			"start_time": 10.0,
			"end_time": 20.0
		},
		{
			"id": "n2",
			"map_id": "map-001",
			"parent_id": "n1",
			"node_order": 0,
			"content": "章节一要点1",
			"node_type": "text",
			"chart_url": "",
			"start_time": 35.0,
			"end_time": 45.0
		}
	]
}
```

 - `MindmapNode` 结构说明：

```json
{
	"id": "string",
	"map_id": "string",
	"parent_id": "string|null",
	"node_order": 0,
	"content": "string",
	"node_type": "text|formula|chart",
	"chart_url": "string",
	"start_time": 0.0,
	"end_time": 0.0
}
```
- 功能说明与流程：
	1. 从 TiDB 获取视频记录并下载源视频到 `temp/videos/{video_id}.mp4`。
	2. 调用 `extract_and_concat_with_fade`（videoEdit）对每个时间段裁剪并合并（支持淡入淡出），生成合并后文件 `temp/videos/{video_id}_combined.mp4`。
	3. 上传合并后文件到 MinIO 的 files 桶，返回 presigned URL（当前实现示例过期时间为 3600 秒）。
- 成功返回示例：

```json
{ "code": 200, "message": "视频合并成功。", "data": {"success": true, "url": "https://...presigned-url..."} }
```
- cURL 示例：

```bash
curl -X POST http://localhost:10020/api/agent/mindmap/video-combine \
	-H "Content-Type: application/json" \
	-d '{"video_id":"vid001","mindmapNodes":[{"id":"n1","map_id":"map-001","parent_id":null,"node_order":0,"content":"","node_type":"text","chart_url":"","start_time":10.0,"end_time":20.0}]}'
```

------------------------------------------------------------------

常见错误与注意事项：
- `generate` 为异步任务：接口返回仅表示任务已接受，实际生成结果需查询 TiDB 或通过回调/通知机制获知。
- 若视频在 TiDB 中不存在，相关接口会将任务标记为失败并抛出错误（接口层可能返回 500，请在调用方捕获并体现友好提示）。
- `edit` / `manual-review` 依赖 `main_graph` 的线程状态：线程识别使用 `thread_id = user_id + '_' + task_id`，调用时请确保一致。
- 当前源码没有内置鉴权：生产环境请在入口处增加鉴权/签名校验（例如 JWT 或网关认证）。

依赖服务：TiDB、MinIO、LanceDB（可选）、以及内部组件 `topProcessorTool`、`main_graph` 等。

后续可选输出（我可以继续生成）：
- OpenAPI/Swagger YAML 片段
- Postman 集合或 Python/JS 调用示例
- 将 `generate` 的后台任务结果写入 TiDB 的示例 SQL 或回调设计

文件：本说明已写入本文件。

