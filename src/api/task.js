import http from './http'

// 创建任务
export function createTask(data) {
  // data: CreateTaskRequest { videoId, title, requirement?, taskType? }
  return http.post('/tasks', data)
}

// 获取任务详情
export function getTask(taskId) {
  return http.get(`/tasks/${taskId}`)
}

// 获取当前用户任务列表（分页）
export function listMyTasks(params) {
  // params: { pageNum, pageSize }
  return http.get('/tasks/my', { params })
}


