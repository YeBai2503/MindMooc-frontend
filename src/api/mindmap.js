import http from './http'

// 根据导图ID获取思维导图
export function getMindmap(mindmapId) {
  return http.get(`/mindmaps/${mindmapId}`)
}

// 根据任务ID获取思维导图
export function getMindmapByTask(taskId) {
  return http.get(`/mindmaps/task/${taskId}`)
}

// 获取当前用户思维导图列表（分页）
export function listMyMindmaps(params) {
  // params: { pageNum, pageSize }
  return http.get('/mindmaps/my', { params })
}

// 获取导图节点树
export function getMindmapNodes(mindmapId) {
  return http.get(`/mindmaps/${mindmapId}/nodes`)
}

// 添加节点
export function addNode(mindmapId, data) {
  // data: UpdateNodeRequest
  return http.post(`/mindmapNodes/${mindmapId}/nodes`, data)
}

// 更新节点
export function updateNode(nodeId, data) {
  return http.put(`/mindmapNodes/nodes/${nodeId}`, data)
}

// 删除节点及其子节点
export function deleteNode(nodeId) {
  return http.delete(`/mindmapNodes/nodes/${nodeId}`)
}

// 重新生成 Mermaid 代码
export function regenerateMermaid(mindmapId) {
  return http.post(`/mindmaps/${mindmapId}/regenerate`)
}


