import http from './http'

// 创建反馈
export function createFeedback(data) {
  // data: CreateFeedbackRequest { type, details }
  return http.post('/feedback', data)
}

// 获取反馈详情
export function getFeedback(feedbackId) {
  return http.get(`/feedback/${feedbackId}`)
}

// 获取当前用户反馈列表（分页）
export function listMyFeedback(params) {
  // params: { pageNum, pageSize }
  return http.get('/feedback/my', { params })
}

// 获取所有反馈列表（管理员）
export function listAllFeedback(params) {
  return http.get('/feedback/all', { params })
}

// 更新反馈状态（管理员）
export function updateFeedbackStatus(feedbackId, status) {
  return http.put(`/feedback/${feedbackId}/status`, null, {
    params: { status }
  })
}


