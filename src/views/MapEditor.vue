<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MindmapCanvas from '@/components/MindmapCanvas.vue'
import { batchSyncMindmapNodes, getMindmap, getMindmapByTask, getMindmapNodes } from '@/api/mindmap'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const mapMeta = ref({ id: '', taskId: '', title: '' })

const flatNodes = ref([])
const selectedNodeId = ref('')

const selectedNode = computed(() => flatNodes.value.find((node) => node.id === selectedNodeId.value) || null)


const typeOptions = [
  { label: '文本节点', value: 'text' },
  { label: '公式节点', value: 'formula' },
  { label: '图表节点', value: 'chart' }
]

const extractLatex = (content) => {
  const source = String(content || '').trim()
  const blockMatch = source.match(/\$\$([\s\S]+?)\$\$/)
  if (blockMatch?.[1]) return blockMatch[1].trim()

  const inlineMatch = source.match(/\\\(([^]+?)\\\)/)
  if (inlineMatch?.[1]) return inlineMatch[1].trim()

  return source
}

const formulaPreview = computed(() => {
  if (!selectedNode.value || selectedNode.value.nodeType !== 'formula') return ''
  try {
    return katex.renderToString(extractLatex(selectedNode.value.content || ''), {
      throwOnError: false,
      strict: 'ignore'
    })
  } catch (error) {
    return '<span>公式渲染失败</span>'
  }
})


const normalizeNodes = (nodes = []) => {
  const result = []
  const walk = (items, parentId = null) => {
    ;(items || []).forEach((node, index) => {
      const normalized = {
        id: String(node.id || ''),
        mapId: String(node.mapId || mapMeta.value.id || ''),
        parentId: parentId || node.parentId || null,
        order: Number(node.nodeOrder ?? node.order ?? index) || 0,
        content: String(node.content || ''),
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

const loadMapData = async () => {
  loading.value = true
  try {
    const mapId = String(route.params.id || '')
    const taskId = String(route.query.taskId || '')
    if (!mapId) throw new Error('missing map id')

    const mapDetail = taskId ? await getMindmapByTask(taskId) : await getMindmap(mapId)
    const mindmapData = mapDetail?.data || mapDetail || {}
    mapMeta.value = {
      id: String(mindmapData.id || mapId),
      taskId: String(mindmapData.taskId || taskId || ''),
      title: String(mindmapData.title || '思维导图编辑')
    }

    const nodesResult = await getMindmapNodes(mapMeta.value.id)
    const nodesData = nodesResult?.data || nodesResult || []
    flatNodes.value = normalizeNodes(nodesData)

      if (flatNodes.value.length > 0) {
      selectedNodeId.value = flatNodes.value[0].id
    }

  } catch (error) {
    console.error(error)
    ElMessage.error('导图加载失败')
  } finally {
    loading.value = false
  }
}

const setSelected = (node) => {
  selectedNodeId.value = node.id
}

const getSiblingNodes = (parentId) =>
  flatNodes.value
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.order - b.order)

const getNextOrder = (parentId) => {
  const siblings = getSiblingNodes(parentId)
  return siblings.length > 0 ? Math.max(...siblings.map((node) => Number(node.order) || 0)) + 1 : 1
}

const nextNodeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `editor-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const buildSyncNodesPayload = (nodes) =>
  nodes.map((node) => ({
    id: node.id || nextNodeId(),
    parentId: node.parentId || undefined,
    nodeOrder: Number(node.order) || 1,
    content: String(node.content || ''),
    nodeType: node.nodeType || 'text',
    chartUrl: node.nodeType === 'chart' ? String(node.chartUrl || '') : undefined,
    startTime: node.startTime ?? undefined,
    endTime: node.endTime ?? undefined
  }))

const addChildNode = () => {
  if (!selectedNode.value) return
  const node = {
    id: nextNodeId(),
    mapId: mapMeta.value.id,
    parentId: selectedNode.value.id,
    order: getNextOrder(selectedNode.value.id),
    content: '新节点',
    nodeType: 'text',
    chartUrl: '',
    startTime: selectedNode.value.startTime,
    endTime: selectedNode.value.endTime
  }
  flatNodes.value.push(node)
  selectedNodeId.value = node.id
}

const collectDescendants = (id, all) => {
  const ids = [id]
  const queue = [id]
  while (queue.length > 0) {
    const current = queue.shift()
    all.forEach((node) => {
      if (node.parentId === current) {
        ids.push(node.id)
        queue.push(node.id)
      }
    })
  }
  return ids
}

const deleteNodeTree = () => {
  if (!selectedNode.value) return
  const removeIds = collectDescendants(selectedNode.value.id, flatNodes.value)
  flatNodes.value = flatNodes.value.filter((node) => !removeIds.includes(node.id))
  selectedNodeId.value = flatNodes.value[0]?.id || ''
  loadChartPreview()
}

const unwrapApiData = (response) => response?.data || response || []

const saveAllNodes = async () => {
  saving.value = true
  try {
    const payload = {
      nodes: buildSyncNodesPayload(flatNodes.value)
    }
    const result = await batchSyncMindmapNodes(mapMeta.value.id, payload)
    const syncResult = unwrapApiData(result) || {}
    const totalCount = syncResult.totalCount ?? payload.nodes.length
    ElMessage.success(`已保存 ${totalCount} 个节点`)
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  const path = mapMeta.value.taskId ? `/task/${mapMeta.value.taskId}` : '/new-task'
  router.push(path)
}

onMounted(loadMapData)
</script>

<template>
  <div class="editor-page" v-loading="loading">
    <div class="toolbar">
        <div>
          <h3>画布编辑 - {{ mapMeta.title }}</h3>
      </div>
      <el-button class="toolbar-btn toolbar-btn--ghost page-head-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回详情
      </el-button>
    </div>

    <div class="layout-grid">
      <MindmapCanvas
        class="canvas-area"
        :nodes="flatNodes"
        :selected-id="selectedNodeId"
        @select="setSelected"
      />

      <div class="right-panel">
        <el-card class="ops-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>操作指令块</span>
            </div>
          </template>

          <div class="ops-grid">
            <el-button class="action-btn action-btn--soft" @click="addChildNode">新增</el-button>
            <el-button class="action-btn action-btn--danger" @click="deleteNodeTree">删除</el-button>
          </div>

          <div class="save-wrapper">
            <el-button class="action-btn action-btn--solid" :loading="saving" @click="saveAllNodes">保存节点列表</el-button>
          </div>
        </el-card>

        <el-card class="edit-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>节点属性</span>
            </div>
          </template>

          <template v-if="selectedNode">
            <el-form label-width="92px" class="node-form">
              <el-form-item label="节点类型">
                <el-segmented v-model="selectedNode.nodeType" :options="typeOptions" />
              </el-form-item>

              <el-form-item label="节点内容">
                <el-input v-model="selectedNode.content" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" />
              </el-form-item>

              <el-form-item label="起始时间">
                <el-input-number v-model="selectedNode.startTime" :precision="3" :step="0.5" :min="0" style="width: 100%" />
              </el-form-item>

              <el-form-item label="结束时间">
                <el-input-number v-model="selectedNode.endTime" :precision="3" :step="0.5" :min="0" style="width: 100%" />
              </el-form-item>

              <el-form-item v-if="selectedNode.nodeType === 'formula'" label="公式预览">
                <div class="formula-preview" v-html="formulaPreview"></div>
              </el-form-item>

            </el-form>
          </template>
          <el-empty v-else description="请选择节点" :image-size="90" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-head-btn {
  margin-left: auto;
}

.toolbar-btn {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.toolbar-btn--ghost {
  color: #166534;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.toolbar-btn--ghost:hover {
  color: #14532d;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.14));
  border-color: rgba(34, 197, 94, 0.42);
}

.action-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.action-btn--soft {
  color: #166534;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.action-btn--soft:hover {
  color: #14532d;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.12));
  border-color: rgba(34, 197, 94, 0.42);
}

.action-btn--solid {
  color: #ffffff;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #22c55e, #10b981);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.24);
}

.action-btn--solid:hover {
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a, #059669);
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.3);
}

.action-btn--danger {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
}

.action-btn--danger:hover {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.34);
}

.left {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.left h2 {
  margin: 0;
  font-size: 22px;
}

.left p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
}

.canvas-panel,
.edit-panel,
.ops-panel {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.canvas-panel {
  padding: 16px;
}

.canvas-header {
  margin-bottom: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
}

.canvas-area {
  height: 680px;
}

.right-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  min-height: 680px;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ops-grid .action-btn {
  width: 100%;
  min-width: 0;
  display: flex;
}

.save-wrapper {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.node-form {
  padding-right: 4px;
}

.node-form :deep(.el-segmented) {
  --el-segmented-item-selected-bg-color: rgba(12, 202, 82, 0.16);
  --el-segmented-item-selected-color: #166534;
  --el-segmented-item-hover-bg-color: rgba(23, 230, 99, 0.1);
}

.node-form :deep(.el-segmented__item.is-selected) {
  color: #166534;
}

.formula-preview {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
  overflow-x: auto;
}


@media (max-width: 1320px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }

  .right-panel {
    grid-template-rows: auto auto;
    min-height: auto;
  }

  .canvas-area {
    height: 580px;
  }
}
</style>
