<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, EditPen } from '@element-plus/icons-vue'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import MindmapCanvas from '@/components/MindmapCanvas.vue'
import { combineMindmapVideo, getTaskStatus, updateTaskTitle } from '@/api/task'
import { getMindmapByTask, getMindmapNodes, getNodeChartUrl } from '@/api/mindmap'
import { getVideoPlayUrl } from '@/api/video'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const videoRef = ref(null)
const playerRef = ref(null)
const floatingVisible = ref(false)
const floatingPosition = ref({ right: 24, bottom: 24 })
const clipEnd = ref(0)
const videoProgressByNodeId = ref(new Map())
const lastClosedNodeId = ref('')
const activeNodeId = ref('')
const chartPreviewVisible = ref(false)
const chartPreviewUrl = ref('')
const chartPreviewTitle = ref('')

const mindmap = ref({ id: '', taskId: '', title: '', createdAt: '', video: null, videoId: '', mermaidCode: '' })
const task = ref({ id: '', title: '' })
const flatNodes = ref([])
const selectedNodeId = ref('')
const titleEditing = ref(false)
const titleDraft = ref('')
const titleSaving = ref(false)

const taskTitle = computed(() => task.value.title || '任务详情')

const aiDialogVisible = ref(false)
const aiCommand = ref('')

const mergeDialogVisible = ref(false)
const mergeNodeIds = ref([])
const mergeSubmitting = ref(false)

const videoUrl = computed(() => mindmap.value?.video?.storageUrl || '')

const mergeCandidates = computed(() =>
  flatNodes.value
    .filter((node) => node.nodeType === 'text' && Number(node.endTime) > Number(node.startTime))
    .sort((a, b) => Number(a.startTime) - Number(b.startTime))
)

const mergeTreeNodes = computed(() => {
  const nodeMap = new Map()
  const roots = []

  mergeCandidates.value.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] })
  })

  nodeMap.forEach((node) => {
    const parentId = String(node.parentId || '')
    const parentNode = parentId ? nodeMap.get(parentId) : null
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortTree = (nodes) => {
    nodes.sort((a, b) => Number(a.startTime) - Number(b.startTime))
    nodes.forEach((node) => {
      if (node.children?.length) sortTree(node.children)
    })
  }

  sortTree(roots)
  return roots
})

const expandedMergeNodeIds = ref([])

const mergeVisibleNodes = computed(() => {
  const result = []
  const walk = (nodes, level = 0) => {
    nodes.forEach((node) => {
      result.push({ ...node, level, isExpanded: expandedMergeNodeIds.value.includes(node.id) })
      if (node.children?.length && expandedMergeNodeIds.value.includes(node.id)) {
        walk(node.children, level + 1)
      }
    })
  }
  walk(mergeTreeNodes.value)
  return result
})

const resetMergeExpandedState = () => {
  expandedMergeNodeIds.value = mergeTreeNodes.value.map((node) => node.id)
}

const toggleMergeNodeExpand = (nodeId) => {
  const next = new Set(expandedMergeNodeIds.value)
  if (next.has(nodeId)) next.delete(nodeId)
  else next.add(nodeId)
  expandedMergeNodeIds.value = [...next]
}

const selectedMergeNodes = computed(() =>
  mergeNodeIds.value
    .map((id) => mergeCandidates.value.find((node) => node.id === id))
    .filter(Boolean)
)

const mergeSelectionIndexMap = computed(() => {
  const map = new Map()
  mergeNodeIds.value.forEach((id, index) => {
    map.set(id, index + 1)
  })
  return map
})

const getMergeSelectionOrder = (nodeId) => mergeSelectionIndexMap.value.get(nodeId) || ''

const truncateText = (text, maxLength = 20) => {
  const value = String(text || '')
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

const normalizeNodes = (nodes = []) => {
  const result = []
  const walk = (items, parentId = null) => {
    ;(items || []).forEach((node, index) => {
      const normalized = {
        id: String(node.id || ''),
        mapId: String(node.mapId || mindmap.value.id || ''),
        parentId: parentId || node.parentId || null,
        order: Number(node.nodeOrder ?? node.order ?? index) || 0,
        content: node.content || '',
        nodeType: node.nodeType || 'text',
        chartUrl: node.chartUrl || '',
        startTime: Number(node.startTime) || 0,
        endTime: Number(node.endTime) || 0
      }
      result.push(normalized)
      if (node.children?.length) walk(node.children, normalized.id)
    })
  }
  walk(nodes)
  return result
}

const fetchTaskDetail = async () => {
  loading.value = true
  try {
    const taskId = String(route.params.id || '')
    if (!taskId) throw new Error('missing task id')

    const taskStatus = await getTaskStatus(taskId)
    if (!taskStatus || taskStatus.status !== 'completed') {
      router.replace(`/task/wait/${taskId}`)
      return
    }

    const mindmapData = await getMindmapByTask(taskId)
    task.value = { ...task.value, id: taskId, title: String(taskStatus.title || '') }
    mindmap.value = mindmapData || { id: '', taskId, title: '', createdAt: '', video: null }
    titleDraft.value = task.value.title || ''
    titleEditing.value = false

    if (mindmapData?.videoId) {
      const playUrlData = await getVideoPlayUrl(mindmapData.videoId)
      mindmap.value.video = {
        ...(mindmapData.video || {}),
        id: mindmapData.videoId,
        storageUrl: playUrlData?.playUrl || mindmapData.video?.storageUrl || ''
      }
    }

    const nodes = await getMindmapNodes(mindmap.value.id)
    flatNodes.value = normalizeNodes(nodes)
    selectedNodeId.value = flatNodes.value[0]?.id || ''
  } catch (error) {
    console.error(error)
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    playerRef.value?.destroy()
    playerRef.value = null
    floatingVisible.value = false
    clipEnd.value = 0
    activeNodeId.value = ''
    lastClosedNodeId.value = ''
    selectedNodeId.value = ''
    mindmap.value = { id: '', taskId: '', title: '', createdAt: '', video: null, videoId: '', mermaidCode: '' }
    task.value = { id: '', title: '' }
    flatNodes.value = []
    fetchTaskDetail()
  },
  { immediate: true }
)

const formatTime = (value) => {
  const seconds = Number(value) || 0
  const mins = Math.floor(seconds / 60)
  const remain = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${String(mins).padStart(2, '0')}:${remain}`
}

const formatCreatedAt = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date).replaceAll('/', '-')
}

const getVideoElement = () => videoRef.value?.querySelector('video') || null

const syncPlyrSource = () => {
  const player = playerRef.value
  const video = getVideoElement()
  if (!player || !video) return null
  const nextSrc = videoUrl.value || ''
  if (video.getAttribute('src') !== nextSrc) {
    player.source = { type: 'video', sources: [{ src: nextSrc, type: 'video/mp4' }] }
  }
  return player
}

const closeFloatingVideo = () => {
  const video = getVideoElement()
  if (video) {
    videoProgressByNodeId.value = new Map(videoProgressByNodeId.value).set(activeNodeId.value, video.currentTime || 0)
  }
  playerRef.value?.pause()
  lastClosedNodeId.value = activeNodeId.value
  clipEnd.value = 0
  floatingVisible.value = false
}

const handleVideoEnded = () => {
  clipEnd.value = 0
  if (activeNodeId.value) {
    videoProgressByNodeId.value = new Map(videoProgressByNodeId.value).set(activeNodeId.value, 0)
  }
  playerRef.value?.pause()
}

const handleVideoTimeUpdate = () => {
  const video = getVideoElement()
  if (!video || !clipEnd.value) return
  if (video.currentTime >= clipEnd.value) {
    playerRef.value?.pause()
    clipEnd.value = 0
  }
}

const initPlyr = () => {
  const video = getVideoElement()
  if (!video) return null
  if (!playerRef.value) {
    playerRef.value = new Plyr(video, { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'], seekTime: 10, invertTime: false })
  }
  return syncPlyrSource()
}

const playNodeVideo = async (nodeId, start, end, shouldResumeFromLastClose) => {
  activeNodeId.value = nodeId
  floatingVisible.value = true
  await nextTick()
  const player = initPlyr()
  const video = getVideoElement()
  if (!player || !video) return ElMessage.warning('视频播放器未就绪')
  const startPlayback = () => {
    clipEnd.value = end
    const resumeTime = videoProgressByNodeId.value.get(nodeId) || 0
    player.currentTime = shouldResumeFromLastClose ? Math.min(Math.max(resumeTime, start), end) : start
    const playPromise = player.play()
    playPromise?.catch?.((error) => console.warn('视频播放被浏览器阻止', error))
  }
  if (video.readyState >= 1) return startPlayback()
  const onLoadedMetadata = () => { video.removeEventListener('loadedmetadata', onLoadedMetadata); startPlayback() }
  video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
  if (video.readyState < 1) video.load()
}

const openChartPreview = async (node) => {
  if (!node?.id) return
  try {
    const res = await getNodeChartUrl(node.id)
    chartPreviewTitle.value = node.content || '图片预览'
    chartPreviewUrl.value = res?.url || ''
    chartPreviewVisible.value = true
  } catch (error) {
    console.error(error)
    ElMessage.error('获取图片地址失败')
  }
}

const handleCanvasSelect = async (node) => {
  selectedNodeId.value = node.id
  if (node.nodeType === 'chart') {
    await openChartPreview(node)
    return
  }
  if (node.nodeType !== 'text') return
  const start = Number(node.startTime)
  const end = Number(node.endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return ElMessage.warning('该文本节点未配置有效时间段')
  const shouldResumeFromLastClose = lastClosedNodeId.value === node.id
  await playNodeVideo(node.id, start, end, shouldResumeFromLastClose)
  lastClosedNodeId.value = ''
}

const openEditor = () => { router.push(`/editor/${mindmap.value.id}`) }
const openTitleEditor = () => {
  titleDraft.value = task.value.title || ''
  titleEditing.value = true
}
const cancelTitleEdit = () => {
  titleDraft.value = task.value.title || ''
  titleEditing.value = false
}
const submitTitleEdit = async () => {
  const nextTitle = titleDraft.value.trim()
  if (!nextTitle) return ElMessage.warning('标题不能为空')
  if (nextTitle === (task.value.title || '')) {
    titleEditing.value = false
    return
  }
  titleSaving.value = true
  try {
    const taskId = String(route.params.id || task.value.id || mindmap.value.taskId || '')
    await updateTaskTitle(taskId, { title: nextTitle })
    task.value = { ...task.value, title: nextTitle }
    mindmap.value = { ...mindmap.value, title: nextTitle }
    titleEditing.value = false
    ElMessage.success('标题已更新')
    window.location.reload()
  } catch (error) {
    console.error(error)
    ElMessage.error('更新标题失败')
  } finally {
    titleSaving.value = false
  }
}
const openAiDialog = () => { aiDialogVisible.value = true; aiCommand.value = '' }
const goAiReview = () => {
  if (!aiCommand.value.trim()) return ElMessage.warning('请输入 AI 编辑命令')
  const taskId = String(mindmap.value.taskId || route.params.id || '')
  const mindmapId = String(mindmap.value.id || '')
  const videoId = String(mindmap.value.videoId || mindmap.value.video?.id || '')
  aiDialogVisible.value = false
  router.push({
    path: `/ai-compare/${mindmapId}`,
    query: {
      aiCommand: aiCommand.value.trim(),
      taskId,
      mindmapId,
      videoId
    }
  })
}
const openMergeDialog = () => { mergeNodeIds.value = []; resetMergeExpandedState(); mergeDialogVisible.value = true }
const downloadFile = async (url, filename = 'merged-video.mp4') => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('download failed')
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

const submitMerge = async () => {
  if (mergeNodeIds.value.length === 0) return ElMessage.warning('请至少选择一个节点')
  mergeSubmitting.value = true
  try {
    const selectedNodes = selectedMergeNodes.value
    const result = await combineMindmapVideo({ video_id: mindmap.value.videoId || mindmap.value.video?.id || '', mindmapNodes: selectedNodes })
    const url = result?.url || result?.data?.url || ''
    if (!url) throw new Error('missing download url')
    await downloadFile(url, `${task.value.title || mindmap.value.title || 'merged-video'}.mp4`)
    ElMessage.success('视频合并完成，已开始下载')
    mergeDialogVisible.value = false
  } catch (error) {
    console.error(error)
    ElMessage.error('视频合并失败')
  } finally {
    mergeSubmitting.value = false
  }
}

onBeforeUnmount(() => { playerRef.value?.destroy(); playerRef.value = null })
</script>

<template>
  <div class="task-detail-page" v-loading="loading">
    <div class="page-header">
      <div class="left-info">
        <div class="title-block">
          <div v-if="!titleEditing" class="title-row">
            <h2 class="title">{{ taskTitle }}</h2>
            <el-button class="title-edit-btn" text :icon="EditPen" @click="openTitleEditor" />
          </div>
          <div v-else class="title-edit-row">
            <el-input
              v-model="titleDraft"
              class="title-input"
              size="large"
              maxlength="50"
              show-word-limit
              @keyup.enter="submitTitleEdit"
              @keyup.esc="cancelTitleEdit"
            />
            <el-button
              class="title-action-btn title-action-btn--cancel"
              :icon="Close"
              :loading="titleSaving"
              @click="cancelTitleEdit"
            />
            <el-button
              class="title-action-btn title-action-btn--confirm"
              :icon="Check"
              :loading="titleSaving"
              @click="submitTitleEdit"
            />
          </div>
          <div class="meta-row">
            <el-tag type="success" size="small">已完成</el-tag>
            <span>创建时间：{{ formatCreatedAt(mindmap.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="action-row">
        <el-button class="header-btn header-btn--soft" @click="openEditor">自定义编辑导图</el-button>
        <el-button class="header-btn header-btn--soft" @click="openAiDialog">AI 智能编辑导图</el-button>
        <el-button class="header-btn header-btn--solid" @click="openMergeDialog">微视频重组合成</el-button>
      </div>
    </div>

    <div v-show="floatingVisible" class="video-float" :style="floatingPosition">
      <div class="video-float-header">
        <div class="video-float-title">视频播放</div>
        <el-button text @click="closeFloatingVideo">关闭</el-button>
      </div>
      <div ref="videoRef" class="task-video-shell">
        <video
          v-if="videoUrl"
          class="task-video"
          :src="videoUrl"
          controls
          @ended="handleVideoEnded"
          @timeupdate="handleVideoTimeUpdate"
        />
      </div>
    </div>

    <el-dialog v-model="chartPreviewVisible" :title="chartPreviewTitle" width="780px" class="chart-preview-dialog">
      <div class="chart-preview-wrap">
        <img :src="chartPreviewUrl" alt="chart" class="external-chart-preview">
      </div>
    </el-dialog>

    <div class="canvas-wrap">
      <MindmapCanvas
        :nodes="flatNodes"
        :selected-id="selectedNodeId"
        @select="handleCanvasSelect"
      />
    </div>

    <el-dialog v-model="aiDialogVisible" title="AI 智能编辑导图" width="560px">
      <el-input
        v-model="aiCommand"
        type="textarea"
        :rows="4"
        placeholder="输入你的编辑要求，例如：交换某两个节点位置、减少节点数量"
      />
      <template #footer>
        <el-button class="dialog-btn dialog-btn--ghost" @click="aiDialogVisible = false">取消</el-button>
        <el-button class="dialog-btn dialog-btn--solid" @click="goAiReview">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mergeDialogVisible" title="微视频重组合成" width="720px" class="merge-dialog">
      <el-checkbox-group v-model="mergeNodeIds" class="merge-list">
        <template v-for="node in mergeVisibleNodes" :key="node.id">
          <div class="merge-tree-row" :style="{ paddingLeft: `${node.level * 20}px` }">
            <el-button
              v-if="node.children?.length"
              text
              class="merge-tree-toggle"
              @click="toggleMergeNodeExpand(node.id)"
            >
              {{ node.isExpanded ? '−' : '+' }}
            </el-button>
            <span v-else class="merge-tree-toggle merge-tree-toggle--placeholder">·</span>
            <el-checkbox
              :value="node.id"
              class="merge-item"
            >
              <div class="merge-item-content">
                <span class="merge-item-order">{{ getMergeSelectionOrder(node.id) || '' }}</span>
                <div class="merge-item-texts">
                  <div class="merge-item-main-line">
                    <span class="merge-item-time">{{ formatTime(node.startTime) }} - {{ formatTime(node.endTime) }}</span>
                    <span class="merge-item-content-text">{{ truncateText(node.content, 20) }}</span>
                  </div>
                </div>
              </div>
            </el-checkbox>
          </div>
        </template>
      </el-checkbox-group>
      <template #footer>
        <el-button class="dialog-btn dialog-btn--ghost" @click="mergeDialogVisible = false">取消</el-button>
        <el-button class="dialog-btn dialog-btn--solid" :loading="mergeSubmitting" @click="submitMerge">开始重组</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.plyr) {
  --plyr-color-main: #ffffff;
  --plyr-video-progress-buffered-background: rgba(255, 255, 255, 0.28);
  --plyr-video-progress-buffered-background-hover: rgba(255, 255, 255, 0.36);
  --plyr-video-range-fill-background: #ffffff;
  --plyr-range-fill-background: #ffffff;
  --plyr-range-thumb-background: #ffffff;
  --plyr-control-icon-size: 18px;
}

:deep(.plyr__controls) {
  color: #ffffff;
}

:deep(.plyr__control) {
  color: #ffffff;
}

.task-detail-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.left-info {
  display: flex;
  gap: 12px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row,
.title-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}

.title-edit-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  color: #0f766e;
  border-radius: 999px;
  flex: 0 0 auto;
}

.title-edit-btn :deep(.el-icon) {
  font-size: 16px;
}

.title-edit-btn:hover {
  background: rgba(34, 211, 238, 0.12);
}

.title-input {
  width: min(400px, 56vw);
}

.title-action-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
}

.title-action-btn:hover,
.title-action-btn:focus-visible {
  background: transparent;
  border: 0;
  box-shadow: none;
  opacity: 0.82;
}

.title-action-btn--cancel {
  color: #ef4444;
}

.title-action-btn--confirm {
  color: #22c55e;
}

.title-action-btn :deep(.el-icon) {
  font-size: 22px;
  font-weight: 800;
}

.title-action-btn :deep(svg) {
  stroke-width: 2.8;
}

.meta-row {
  margin-top: 6px;
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  flex-wrap: wrap;
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dialog-btn {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.dialog-btn--ghost {
  color: #0f766e;
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.22);
}

.dialog-btn--ghost:hover {
  color: #0f766e;
  background: rgba(34, 211, 238, 0.14);
  border-color: rgba(34, 211, 238, 0.34);
}

.dialog-btn--solid {
  color: #ffffff;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  box-shadow: 0 6px 18px rgba(34, 211, 238, 0.22);
}

.dialog-btn--solid:hover {
  color: #ffffff;
  background: linear-gradient(135deg, #22d3ee, #4ade80);
  box-shadow: 0 8px 22px rgba(34, 211, 238, 0.3);
}

.header-btn {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.header-btn--soft {
  color: #0f766e;
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.22);
}

.header-btn--soft:hover {
  color: #0f766e;
  background: rgba(34, 211, 238, 0.14);
  border-color: rgba(34, 211, 238, 0.34);
}

.header-btn--solid {
  color: #ffffff;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  box-shadow: 0 6px 18px rgba(34, 211, 238, 0.22);
}

.header-btn--solid:hover {
  color: #ffffff;
  background: linear-gradient(135deg, #22d3ee, #4ade80);
  box-shadow: 0 8px 22px rgba(34, 211, 238, 0.3);
}

.video-float {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: min(560px, calc(100vw - 48px));
  z-index: 2000;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.video-float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.98);
}

.video-float-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.task-video-shell {
  width: 100%;
  background: #000;
}

.task-video {
  display: block;
  width: 100%;
  background: #000;
}

.chart-preview-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.chart-preview-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 70vh;
  overflow: auto;
}

.external-chart-preview {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.canvas-wrap {
  height: calc(100vh - 150px);
  min-height: 420px;
  max-height: 680px;
}

.merge-dialog-tip {
  margin-bottom: 12px;
  font-size: 13px;
  color: #64748b;
}

.merge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow: auto;
}

.merge-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.merge-tree-toggle {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 999px;
  color: #0f766e;
}

.merge-tree-toggle--placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: transparent;
}

.merge-item {
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
}

.merge-item :deep(.el-checkbox__input) {
  margin-right: 12px;
  flex: 0 0 auto;
  align-self: center;
  transform: scale(1.1);
  transform-origin: center;
}

.merge-item :deep(.el-checkbox__label) {
  width: 100%;
  font-size: 16px;
}

.merge-item-content {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  width: 100%;
}

.merge-item-order {
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.merge-item-texts {
  min-width: 0;
  display: flex;
  align-items: center;
  flex: 1;
}

.merge-item-main-line {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.merge-item-time {
  flex: 0 0 auto;
  font-size: 16px;
  color: #0f766e;
  font-weight: 700;
  white-space: nowrap;
}

.merge-item-content-text {
  min-width: 0;
  flex: 1;
  font-size: 16px;
  color: #1e293b;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
