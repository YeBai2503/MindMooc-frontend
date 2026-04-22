<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const CARD_WIDTH = 232
const CARD_HEIGHT = 88
const LR_COL_GAP = 92
const LR_ROW_GAP = 18
const TB_COL_GAP = 10
const TB_ROW_GAP = 64
const PADDING_X = 36
const PADDING_Y = 24
const MIN_CANVAS_HEIGHT = 560

const zoom = ref(1)
const orientation = ref('lr')
const scrollRef = ref(null)

const childrenMap = computed(() => {
  const map = new Map()
  props.nodes.forEach((node) => {
    const key = node.parentId || 'root'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(node)
  })

  map.forEach((items) => {
    items.sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return map
})

const layoutNodes = computed(() => {
  const roots = childrenMap.value.get('root') || []
  if (roots.length === 0) return []

  const placed = []
  let leafCursor = 0

  const leafSpan = orientation.value === 'lr'
    ? CARD_HEIGHT + LR_ROW_GAP
    : CARD_WIDTH + TB_COL_GAP
  const branchSpan = orientation.value === 'lr'
    ? CARD_WIDTH + LR_COL_GAP
    : CARD_HEIGHT + TB_ROW_GAP

  const walk = (node, depth) => {
    const children = childrenMap.value.get(node.id) || []
    const mainAxis = depth * branchSpan

    if (children.length === 0) {
      const crossAxis = leafCursor * leafSpan
      leafCursor += 1
      const placedNode = orientation.value === 'lr'
        ? { ...node, x: mainAxis, y: crossAxis }
        : { ...node, x: crossAxis, y: mainAxis }
      placed.push(placedNode)
      return crossAxis + (orientation.value === 'lr' ? CARD_HEIGHT : CARD_HEIGHT) / 2
    }

    const childCenters = children.map((child) => walk(child, depth + 1))
    const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2
    const crossAxis = center - CARD_HEIGHT / 2
    const placedNode = orientation.value === 'lr'
      ? { ...node, x: mainAxis, y: crossAxis }
      : { ...node, x: crossAxis, y: mainAxis }
    placed.push(placedNode)
    return center
  }

  roots.forEach((root, index) => {
    walk(root, 0)
    if (index < roots.length - 1) leafCursor += 1
  })

  const rawMinX = Math.min(...placed.map((n) => n.x))
  const rawMaxX = Math.max(...placed.map((n) => n.x + CARD_WIDTH))
  const rawMinY = Math.min(...placed.map((n) => n.y))
  const rawMaxY = Math.max(...placed.map((n) => n.y + CARD_HEIGHT))
  const rawRoot = placed.find((n) => n.id === roots[0].id)

  const contentWidth = rawMaxX - rawMinX
  const contentHeight = rawMaxY - rawMinY
  const canvasWidth = Math.max(contentWidth + PADDING_X * 2, MIN_CANVAS_HEIGHT)
  const canvasHeight = Math.max(contentHeight + PADDING_Y * 2, MIN_CANVAS_HEIGHT)

  const rootCenterX = rawRoot ? rawRoot.x + CARD_WIDTH / 2 : 0
  const rootCenterY = rawRoot ? rawRoot.y + CARD_HEIGHT / 2 : 0

  let shiftX
  let shiftY

  if (orientation.value === 'lr') {
    shiftX = PADDING_X - rawMinX
    shiftY = canvasHeight / 2 - rootCenterY
    const minYAfterShift = rawMinY + shiftY
    if (minYAfterShift < PADDING_Y) {
      shiftY += PADDING_Y - minYAfterShift
    }
  } else {
    shiftY = PADDING_Y - rawMinY
    shiftX = canvasWidth / 2 - rootCenterX
    const minXAfterShift = rawMinX + shiftX
    if (minXAfterShift < PADDING_X) {
      shiftX += PADDING_X - minXAfterShift
    }
  }

  return placed.map((node) => ({
    ...node,
    x: node.x + shiftX,
    y: node.y + shiftY
  }))
})

const layoutMap = computed(() => new Map(layoutNodes.value.map((node) => [node.id, node])))

const connectors = computed(() => {
  const lines = []
  props.nodes.forEach((node) => {
    if (!node.parentId) return
    const from = layoutMap.value.get(node.parentId)
    const to = layoutMap.value.get(node.id)
    if (!from || !to) return

    lines.push({
      id: `${from.id}-${to.id}`,
      x1: orientation.value === 'lr' ? from.x + CARD_WIDTH : from.x + CARD_WIDTH / 2,
      y1: orientation.value === 'lr' ? from.y + CARD_HEIGHT / 2 : from.y + CARD_HEIGHT,
      x2: orientation.value === 'lr' ? to.x : to.x + CARD_WIDTH / 2,
      y2: orientation.value === 'lr' ? to.y + CARD_HEIGHT / 2 : to.y
    })
  })
  return lines
})

const canvasSize = computed(() => {
  if (layoutNodes.value.length === 0) {
    return {
      width: CARD_WIDTH + PADDING_X * 2,
      height: MIN_CANVAS_HEIGHT
    }
  }

  const maxX = Math.max(...layoutNodes.value.map((node) => node.x + CARD_WIDTH))
  const maxY = Math.max(...layoutNodes.value.map((node) => node.y + CARD_HEIGHT))

  return {
    width: maxX + PADDING_X,
    height: Math.max(maxY + PADDING_Y, MIN_CANVAS_HEIGHT)
  }
})

const zoomViewportSize = computed(() => ({
  width: canvasSize.value.width * zoom.value,
  height: canvasSize.value.height * zoom.value
}))

const formatSeconds = (value) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0))
  const mins = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(remain).padStart(2, '0')}`
}

const isTextNode = (type) => type === 'text'

const isSingleLineNode = (node) => {
  const text = String(node?.content || '').replace(/\s+/g, ' ').trim()
  return text.length > 0 && text.length <= 18 && !/\n/.test(String(node?.content || ''))
}

const isSelectedNode = (node) => node.id === props.selectedId

const getNodeKind = (node) => node?.nodeType || 'text'

const extractLatex = (content) => {
  const source = String(content || '').trim()
  const blockMatch = source.match(/\$\$([\s\S]+?)\$\$/)
  if (blockMatch?.[1]) return blockMatch[1].trim()

  const inlineMatch = source.match(/\\\(([^]+?)\\\)/)
  if (inlineMatch?.[1]) return inlineMatch[1].trim()

  return source
}

const renderFormula = (content) => {
  try {
    return katex.renderToString(extractLatex(content), {
      throwOnError: false,
      strict: 'ignore'
    })
  } catch (error) {
    return `<span>${content}</span>`
  }
}

const zoomIn = () => {
  zoom.value = Math.min(1.8, Number((zoom.value + 0.1).toFixed(2)))
}

const zoomOut = () => {
  zoom.value = Math.max(0.6, Number((zoom.value - 0.1).toFixed(2)))
}

const toggleOrientation = () => {
  orientation.value = orientation.value === 'lr' ? 'tb' : 'lr'
}

const resetZoom = () => {
  zoom.value = 1
}

const centerScroll = async () => {
  await nextTick()
  const el = scrollRef.value
  if (!el) return

  if (orientation.value === 'lr') {
    el.scrollLeft = 0
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2)
    return
  }

  el.scrollTop = 0
  el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
}

// const preserveViewportCenterOnZoom = async (nextZoom, prevZoom) => {
//   await nextTick()
//   const el = scrollRef.value
//   if (!el || !prevZoom || !nextZoom) return

//   const centerX = (el.scrollLeft + el.clientWidth / 2) / prevZoom
//   const centerY = (el.scrollTop + el.clientHeight / 2) / prevZoom

//   el.scrollLeft = centerX * nextZoom - el.clientWidth / 2
//   el.scrollTop = centerY * nextZoom - el.clientHeight / 2
// }

watch(orientation, async () => {
  await centerScroll()
})

// watch(zoom, async (nextZoom, prevZoom) => {
//   if (!hasCenteredOnce) return
//   await preserveViewportCenterOnZoom(nextZoom, prevZoom)
// })

const handleClick = (node) => {
  emit('select', node)
}
</script>

<template>
  <div class="canvas-shell">
    <div class="canvas-header">
      <div class="toolbar-title">导图画布</div>
      <div class="toolbar-actions">
        <el-button size="small" @click="toggleOrientation">改变朝向</el-button>
        <el-button size="small" @click="zoomOut">-</el-button>
        <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="resetZoom">重置</el-button>
      </div>
    </div>

    <div ref="scrollRef" class="canvas-scroll">
      <div class="zoom-viewport" :style="{ width: `${zoomViewportSize.width}px`, height: `${zoomViewportSize.height}px` }">
        <div class="zoom-layer" :style="{ transform: `scale(${zoom})` }">
          
          <div class="canvas" :style="{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }">
            <svg class="canvas-lines" :width="canvasSize.width" :height="canvasSize.height">
              <g v-for="line in connectors" :key="line.id">
                <path
                  :d="orientation === 'lr'
                  ? `M ${line.x1} ${line.y1} C ${line.x1 + 36} ${line.y1}, ${line.x2 - 36} ${line.y2}, ${line.x2} ${line.y2}`
                  : `M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 36}, ${line.x2} ${line.y2 - 36}, ${line.x2} ${line.y2}`"
                  class="link-path"
                />
              </g>
            </svg>

            <button
              v-for="node in layoutNodes"
              :key="node.id"
              class="node-card"
              :class="{
                selected: isSelectedNode(node),
                formula: getNodeKind(node) === 'formula',
                chart: getNodeKind(node) === 'chart',
                text: getNodeKind(node) === 'text',
                single: isSingleLineNode(node)
              }"
              :style="{ left: `${node.x}px`, top: `${node.y}px` }"
              @click="handleClick(node)"
            >
              <div class="node-top">
                <div class="node-dot"></div>
                <div v-if="node.nodeType === 'formula'" class="node-time node-tag">公式</div>
                <div v-else-if="node.nodeType === 'chart'" class="node-time node-tag">图表</div>
                <div v-else-if="isTextNode(node.nodeType)" class="node-time">{{ formatSeconds(node.startTime) }} - {{ formatSeconds(node.endTime) }}</div>
                <div v-else class="node-time placeholder">&nbsp;</div>
              </div>

              <div v-if="node.nodeType === 'formula'" class="formula-content" v-html="renderFormula(node.content)"></div>

              <div v-else-if="node.nodeType === 'chart'" class="chart-content">
                <div class="chart-meta">
                  <span class="node-content chart-title">{{ node.content }}</span>
                </div>
                <div class="chart-preview-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="14" rx="2"></rect>
                    <path d="M3 15l5-5 4 4 4-5 5 6"></path>
                    <circle cx="9" cy="8" r="1.5"></circle>
                  </svg>
                </div>
              </div>

              <div v-else class="node-content" :class="{ single: isSingleLineNode(node) }">{{ node.content }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="chartPreviewVisible" :title="chartPreviewTitle" width="780px">
      <img :src="chartPreviewUrl" alt="chart" class="external-chart-preview">
    </el-dialog>
  </div>
</template>

<style scoped>
.canvas-shell {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background:
    linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    #fcfdfd;
  background-size: 28px 28px;
  display: flex;
  flex-direction: column;
}

.canvas-header {
  height: 46px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-value {
  min-width: 52px;
  text-align: center;
  color: #475569;
  font-size: 12px;
}

.canvas-scroll {
  width: 100%;
  height: calc(100% - 46px);
  overflow: auto;
}

.zoom-viewport {
  position: relative;
}

.zoom-layer {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: left top;
}

.canvas {
  position: relative;
}

.canvas-lines {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.link-path {
  fill: none;
  stroke: rgba(100, 116, 139, 0.7);
  stroke-width: 1.5;
}

.node-card {
  position: absolute;
  width: 232px;
  min-height: 88px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  text-align: left;
  padding: 10px 12px 11px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.node-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.38), transparent 35%);
}

.node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
}

.node-card.selected {
  border-color: rgba(59, 130, 246, 0.58);
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.16),
    0 8px 22px rgba(15, 23, 42, 0.08),
    0 0 0 9999px rgba(59, 130, 246, 0.035) inset;
  background: linear-gradient(180deg, rgba(248, 252, 255, 0.99) 0%, rgba(239, 246, 255, 0.98) 100%);
}

.node-card.formula {
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.98) 0%, rgba(255, 248, 225, 0.98) 100%);
}

.node-card.chart {
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.98) 0%, rgba(204, 251, 241, 0.84) 100%);
}

.node-card.text {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
}

.node-card.formula .node-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.14);
}

.node-card.chart .node-dot {
  background: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}

.node-card.text .node-dot {
  background: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

.node-top {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  padding-left: 2px;
}

.node-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #94a3b8;
  flex-shrink: 0;
}

.node-time {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.node-time.placeholder {
  color: transparent;
}

.node-tag {
  font-size: 11px;
  color: #334155;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  padding: 1px 8px;
}

.node-content {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2
}

.node-content.single {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  -webkit-line-clamp: 1;
  line-clamp: 1
}

.node-content.chart-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2
}

.formula-content {
  font-size: 17px;
  line-height: 1.2;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  overflow: hidden;
}

.chart-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chart-hint {
  font-size: 11px;
  color: #0f766e;
  opacity: 0.8;
  white-space: nowrap;
}

.chart-preview-icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(20, 184, 166, 0.26);
  color: #14b8a6;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}

.chart-preview-icon :deep(svg) {
  width: 17px;
  height: 17px;
}

.external-chart-preview {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
</style>
