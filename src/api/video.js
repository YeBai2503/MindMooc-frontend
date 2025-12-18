import http from './http'

// 上传视频
export function uploadVideo(file, videoTitle) {
  const formData = new FormData()
  formData.append('file', file)
  if (videoTitle) {
    formData.append('videoTitle', videoTitle)
  }

  return http.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取视频信息
export function getVideo(videoId) {
  return http.get(`/videos/${videoId}`)
}

// 获取视频列表（分页）
export function listVideos(params) {
  // params: { pageNum, pageSize }
  return http.get('/videos/list', { params })
}

// 删除视频
export function deleteVideo(videoId) {
  return http.delete(`/videos/${videoId}`)
}


