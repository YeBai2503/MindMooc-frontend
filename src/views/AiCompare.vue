<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import MindmapCanvas from '@/components/MindmapCanvas.vue'
import { manualReviewMindmap, startMindmapEdit } from '@/api/task'
import { getMindmapByTask, getMindmapNodes } from '@/api/mindmap'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const waitingAi = ref(false)
const submitting = ref(false)

const mapMeta = ref({ id: '', taskId: '', title: '' })
const aiCommand = ref('')
const videoId = ref('')
const userId = ref('')

const originalNodes = ref([])
const suggestedNodes = ref([])
const aiErrorText = ref('')

const hasSuggestion = computed(() => suggestedNodes.value.length > 0)

const normalizeNodes = (nodes = []) => {
  const result = []
  const walk = (items, parentId = null) => {
    ;(items || []).forEach((node, index) => {
      const normalized = {
        id: String(node?.id || ''),
        mapId: String(node?.map_id || node?.mapId || mapMeta.value.id || ''),
        parentId: parentId || node?.parent_id || node?.parentId || null,
        order: Number(node?.node_order ?? node?.nodeOrder ?? node?.order ?? index) || 0,
        content: String(node?.content || ''),
        nodeType: node?.node_type || node?.nodeType || 'text',
        chartUrl: node?.chart_url || node?.chartUrl || '',
        startTime: Number(node?.start_time ?? node?.startTime ?? 0) || 0,
        endTime: Number(node?.end_time ?? node?.endTime ?? 0) || 0
      }
      result.push(normalized)
      if (node?.children?.length) walk(node.children, normalized.id)
    })
  }
  walk(nodes)
  return result
}

const buildAgentUserData = () => ({
  user_id: String(route.query.userId || '123456'),
  video_id: String(videoId.value || route.query.videoId || ''),
  task_id: String(mapMeta.value.taskId || route.query.taskId || ''),
  mindmap_id: String(mapMeta.value.id || route.params.id || route.query.mindmapId || ''),
  instruction: String(aiCommand.value || '')
})

const loadBaseData = async () => {
  const mapId = String(route.params.id || '')
  const taskId = String(route.query.taskId || '')
  aiCommand.value = String(route.query.aiCommand || '')
  videoId.value = String(route.query.videoId || '')
  userId.value = String('123456')

  const mindmapData = taskId ? await getMindmapByTask(taskId) : { id: mapId, taskId, title: '' }
  const mindmap = mindmapData?.data || mindmapData || {}

  mapMeta.value = {
    id: String(mindmap.id || mapId || route.query.mindmapId || ''),
    taskId: String(mindmap.taskId || taskId || ''),
    title: String(mindmap.title || 'AI 对比审核')
  }

  if (!videoId.value) {
    videoId.value = String(mindmap.videoId || mindmap.video?.id || route.query.videoId || '')
  }

  const nodesResult = await getMindmapNodes(mapMeta.value.id)
  const nodesData = nodesResult?.data || nodesResult || []
  originalNodes.value = normalizeNodes(nodesData)
}

const requestAiEditedMindmap = async () => {
  if (!aiCommand.value.trim()) {
    ElMessage.warning('未提供 AI 编辑命令，无法生成新导图')
    return
  }

  waitingAi.value = true
  aiErrorText.value = ''
  suggestedNodes.value = []

  try {
    const res = await startMindmapEdit({ user_data: buildAgentUserData() })
    const nodes = res?.mindmapNodes || res?.data?.mindmapNodes || res?.data?.mindmap_nodes || []

    suggestedNodes.value = normalizeNodes(nodes)
    if (!suggestedNodes.value.length) {
      aiErrorText.value = 'AI 已返回，但没有可审核的新导图节点。'
    }
  } catch (error) {
    console.error(error)
    aiErrorText.value = 'AI 编辑请求失败，请重试。'
    ElMessage.error('AI 编辑请求失败')
  } finally {
    waitingAi.value = false
  }
}

const retryGenerate = async () => {
  await requestAiEditedMindmap()
}

const submitReview = async (isApproved) => {
  if (waitingAi.value) return ElMessage.warning('AI 仍在编辑中，请等待结果返回')
  if (!hasSuggestion.value) return ElMessage.warning('暂无可审核的新导图')

  submitting.value = true
  try {
    await manualReviewMindmap({ user_data: buildAgentUserData(), is_approved: isApproved })
    ElMessage.success(isApproved ? '已通过审核' : '已拒绝审核')
    router.push(`/task/${mapMeta.value.taskId || route.query.taskId || ''}`)
  } catch (error) {
    console.error(error)
    ElMessage.error('提交审核失败')
  } finally {
    submitting.value = false
  }
}

const goTaskDetail = () => {
  router.push(`/task/${mapMeta.value.taskId || route.query.taskId || '1001'}`)
}

onMounted(async () => {
  loading.value = true
  try {
    await loadBaseData()
    await requestAiEditedMindmap()
  } catch (error) {
    console.error(error)
    ElMessage.error('加载 AI 对比页失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="ai-compare-page">
    <div class="page-head">
      <div>
        <h2>{{ mapMeta.title }} - AI 对比审核</h2>
      </div>
      <el-button class="toolbar-btn toolbar-btn--ghost page-head-btn" @click="goTaskDetail">
        <el-icon><ArrowLeft /></el-icon>
        返回详情
      </el-button>
    </div>

    <el-card class="command-card" shadow="never">
      <template #header>
        <div class="card-title">AI 编辑命令</div>
      </template>
      <div class="command-text">{{ aiCommand || '未提供 AI 编辑命令' }}</div>
      <div class="toolbar">
        <el-button class="toolbar-action toolbar-action--primary" :loading="waitingAi" @click="retryGenerate">重新生成</el-button>
        <el-button class="toolbar-action toolbar-action--success" :disabled="!hasSuggestion || submitting || waitingAi" :loading="submitting" @click="submitReview(true)">通过</el-button>
        <el-button class="toolbar-action toolbar-action--danger" :disabled="submitting || waitingAi" :loading="submitting" @click="submitReview(false)">拒绝</el-button>
      </div>
    </el-card>

    <div class="compare-layout">
      <section class="canvas-panel">
        <div class="panel-title">编辑前</div>
        <MindmapCanvas :nodes="originalNodes" readonly />
      </section>

      <section class="canvas-panel">
        <div class="panel-title">AI 编辑后</div>
        <div v-if="waitingAi" class="waiting-block">
          <el-icon class="is-loading waiting-icon"><Loading /></el-icon>
          <div class="waiting-title">AI 正在编辑导图</div>
          <div class="waiting-desc">请求已发送，正在等待后端返回的新导图...</div>
        </div>
        <div v-else-if="aiErrorText" class="waiting-block waiting-block--error">
          <div class="waiting-title">{{ aiErrorText }}</div>
          <el-button class="toolbar-action toolbar-action--primary" @click="retryGenerate">重试生成</el-button>
        </div>
        <MindmapCanvas v-else :nodes="suggestedNodes" readonly />
      </section>
    </div>
  </div>
</template>

<style scoped>
.ai-compare-page { display: flex; flex-direction: column; gap: 12px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.page-head-btn { margin-left: auto; }
.toolbar-btn { min-height: 42px; padding: 0 16px; border-radius: 12px; font-size: 15px; font-weight: 600; transition: all 0.25s ease; }
.toolbar-btn--ghost { color: #166534; background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(34, 197, 94, 0.28); }
.toolbar-btn--ghost:hover { color: #14532d; background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.14)); border-color: rgba(34, 197, 94, 0.42); }
.page-head h2 { margin: 0; font-size: 22px; }
.command-card { border-radius: 14px; border: 1px solid #e5e7eb; }
.command-text { padding: 10px 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.card-title, .panel-title { font-weight: 600; color: #1f2937; }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.toolbar-action { min-height: 40px; padding: 0 16px; border-radius: 12px; font-size: 14px; font-weight: 600; transition: all 0.25s ease; }
.toolbar-action--primary { color: #166534; background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(34, 197, 94, 0.24); }
.toolbar-action--success { color: #ffffff; border: 1px solid transparent; background: linear-gradient(135deg, #22c55e, #10b981); }
.toolbar-action--danger { color: #b91c1c; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); }
.compare-layout { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.compare-layout::before { content: ''; position: absolute; top: 0; bottom: 0; left: calc(50% - 0.5px); width: 1px; background: linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.75), transparent); pointer-events: none; z-index: 2; }
.canvas-panel { border-radius: 14px; overflow: hidden; position: relative; z-index: 1; }
.canvas-panel :deep(.canvas-shell) { height: calc(100vh - 320px); min-height: 560px; border-radius: 14px; }
.panel-title { margin-bottom: 8px; }
.waiting-block { height: calc(100vh - 320px); min-height: 560px; border-radius: 14px; border: 1px dashed #cbd5e1; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 24px; color: #334155; }
.waiting-block--error { border-color: rgba(239, 68, 68, 0.35); background: rgba(254, 242, 242, 0.8); }
.waiting-icon { font-size: 28px; margin-bottom: 12px; color: #10b981; }
.waiting-title { font-size: 18px; font-weight: 700; color: #0f172a; }
.waiting-desc { margin-top: 8px; font-size: 14px; line-height: 1.6; color: #64748b; max-width: 520px; }
@media (max-width: 1100px) {
  .compare-layout { grid-template-columns: 1fr; }
  .compare-layout::before { display: none; }
  .canvas-panel :deep(.canvas-shell), .waiting-block { height: 520px; min-height: 520px; }
}
</style>
