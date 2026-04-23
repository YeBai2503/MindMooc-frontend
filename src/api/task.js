import http from './http'

const buildAgentUserData = (payload = {}) => ({
  user_id: String(payload.user_id || 10001),
  video_id: String(payload.video_id || ''),
  task_id: String(payload.task_id || ''),
  mindmap_id: String(payload.mindmap_id || ''),
  instruction: String(payload.instruction || '')
})

export function createTask(data) {
  return http.post('/tasks', data)
}

export function getTask(taskId) {
  return http.get(`/tasks/${taskId}`)
}

export function getTaskStatus(taskId) {
  return http.get(`/tasks/${taskId}/status`)
}

export function listMyTasks(params) {
  return http.get('/tasks/my', { params })
}

export function listMyTaskStatuses(params) {
  return http.get('/tasks/my/status', { params })
}

export function deleteTask(taskId) {
  return http.delete(`/tasks/${taskId}`)
}

export function updateTaskTitle(taskId, data) {
  return http.put(`/tasks/${taskId}/title`, data)
}

export function startMindmapEdit(data) {
  return http.post(
    '/agent/mindmap/edit',
    {
      user_data: buildAgentUserData(data?.user_data || data)
    },
    {
      timeout: 120000
    }
  )
}

export function manualReviewMindmap(data) {
  return http.post('/agent/mindmap/manual-review', {
    user_data: buildAgentUserData(data?.user_data || data),
    is_approved: !!data?.is_approved
  })
}

export function combineMindmapVideo(data) {
  const mindmapNodes = Array.isArray(data?.mindmapNodes)
    ? data.mindmapNodes.map((node) => ({
        id: String(node?.id || ''),
        map_id: String(node?.map_id || node?.mapId || ''),
        parent_id: node?.parent_id ?? node?.parentId ?? null,
        node_order: Number(node?.node_order ?? node?.nodeOrder ?? 0),
        content: String(node?.content || ''),
        node_type: String(node?.node_type || node?.nodeType || 'text'),
        chart_url: String(node?.chart_url || node?.chartUrl || ''),
        start_time: Number(node?.start_time ?? node?.startTime ?? 0),
        end_time: Number(node?.end_time ?? node?.endTime ?? 0)
      }))
    : []

  return http.post(
    '/agent/mindmap/video-combine',
    {
      video_id: String(data?.video_id || ''),
      mindmapNodes,
      need_watermark: !!data?.need_watermark
    },
    {
      timeout: 120000
    }
  )
}

