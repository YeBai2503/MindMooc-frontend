const DEFAULT_MAP_ID = 'mock-map-001'

const baseNodes = [
  {
    id: 'n-1',
    mapId: DEFAULT_MAP_ID,
    parentId: null,
    order: 0,
    content: 'Nacos SDK 版本兼容性',
    nodeType: 'text',
    chartUrl: '',
    startTime: 0,
    endTime: 28.5
  },
  {
    id: 'n-2',
    mapId: DEFAULT_MAP_ID,
    parentId: 'n-1',
    order: 0,
    content: 'V1 与 V2 的主要差异事实上事实上事实上事实上方法反反复复的地方那咖啡咖啡咖啡发',
    nodeType: 'text',
    chartUrl: '',
    startTime: 28.5,
    endTime: 86
  },
  {
    id: 'n-3',
    mapId: DEFAULT_MAP_ID,
    parentId: 'n-1',
    order: 1,
    content: '\H(X) = -\sum_{x} p(x) \log_2 p(x)',
    nodeType: 'formula',
    chartUrl: '',
    startTime: 86,
    endTime: 120
  },
  {
    id: 'n-4',
    mapId: DEFAULT_MAP_ID,
    parentId: 'n-2',
    order: 0,
    content: '兼容模式的调用链路图',
    nodeType: 'chart',
    chartUrl: 'https://th.bing.com/th/id/OIP.zoLTjWcWu0_xZnWVaHGKgQHaEI?w=304&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3',
    startTime: 120,
    endTime: 170
  },
  {
    id: 'n-5',
    mapId: DEFAULT_MAP_ID,
    parentId: 'n-2',
    order: 1,
    content: '老版本 User-Agent 常量说明',
    nodeType: 'text',
    chartUrl: '',
    startTime: 170,
    endTime: 230
  },
  {
    id: 'n-6',
    mapId: DEFAULT_MAP_ID,
    parentId: 'n-1',
    order: 2,
    content: '迁移建议与风险点',
    nodeType: 'text',
    chartUrl: '',
    startTime: 230,
    endTime: 300
  }
]

function cloneNode(node) {
  return { ...node }
}

export function getMockMindmapMeta(taskId = '1001') {
  return {
    id: DEFAULT_MAP_ID,
    taskId: String(taskId),
    title: `课程导图任务 ${taskId}`,
    status: 'completed',
    createdAt: '2026-04-10 14:25:00',
    videoUrl: '/王道计算机考研 操作系统-p02-64.mp4'
  }
}

export function getMockMindmapNodes(mapId = DEFAULT_MAP_ID) {
  return baseNodes
    .filter((node) => node.mapId === mapId)
    .map(cloneNode)
}

function nextNodeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function withAIMark(node, mark) {
  return {
    ...node,
    aiMark: mark
  }
}

export function generateAiSuggestion(currentNodes, command) {
  const text = String(command || '').trim()
  const next = currentNodes.map((node) => withAIMark(node, 'none'))

  if (!text) {
    return next
  }

  const firstText = next.find((node) => node.nodeType === 'text')

  if (text.includes('公式') && firstText) {
    next.push(
      withAIMark(
        {
          id: nextNodeId(),
          mapId: firstText.mapId,
          parentId: firstText.id,
          order: 99,
          content: '\\( E = mc^2 \\) 是质能关系公式',
          nodeType: 'formula',
          chartUrl: '',
          startTime: firstText.startTime,
          endTime: Math.min(firstText.endTime + 10, 360)
        },
        'add'
      )
    )
  }

  if (text.includes('图') || text.includes('图表')) {
    next.push(
      withAIMark(
        {
          id: nextNodeId(),
          mapId: DEFAULT_MAP_ID,
          parentId: 'n-6',
          order: 100,
          content: '新增图表节点：迁移效果对比',
          nodeType: 'chart',
          chartUrl: 'https://picsum.photos/920/540',
          startTime: 250,
          endTime: 295
        },
        'add'
      )
    )
  }

  const editTarget = next.find((node) => node.id === 'n-5')
  if (editTarget) {
    editTarget.content = `${editTarget.content}（AI已补充）`
    editTarget.aiMark = 'edit'
  }

  // Re-assign order within siblings.
  const grouped = new Map()
  next.forEach((node) => {
    const key = node.parentId || 'root'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(node)
  })
  grouped.forEach((items) => {
    items.sort((a, b) => a.order - b.order)
    items.forEach((item, idx) => {
      item.order = idx
    })
  })

  return next
}

export function buildDiffMarks(currentNodes, suggestedNodes) {
  const currentMap = new Map(currentNodes.map((n) => [n.id, n]))
  const nextMap = new Map(suggestedNodes.map((n) => [n.id, n]))
  const marks = []

  suggestedNodes.forEach((node) => {
    const prev = currentMap.get(node.id)
    if (!prev) {
      marks.push({ id: node.id, type: 'add', label: `新增：${node.content}` })
      return
    }

    const edited =
      prev.content !== node.content ||
      prev.nodeType !== node.nodeType ||
      prev.chartUrl !== node.chartUrl ||
      prev.startTime !== node.startTime ||
      prev.endTime !== node.endTime

    if (edited) {
      marks.push({ id: node.id, type: 'edit', label: `修改：${node.content}` })
    }

    if (prev.parentId !== node.parentId || prev.order !== node.order) {
      marks.push({ id: node.id, type: 'move', label: `移动：${node.content}` })
    }
  })

  currentNodes.forEach((node) => {
    if (!nextMap.has(node.id)) {
      marks.push({ id: node.id, type: 'delete', label: `删除：${node.content}` })
    }
  })

  return marks
}
