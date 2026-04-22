import axios from 'axios'
import http from './http'

// 计算文件 SHA-256，供上传初始化接口使用
export async function getFileSha256(file) {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 初始化视频上传，获取 MinIO 预签名 URL
export function initVideoUpload(data) {
  return http.post('/videos/upload/init', data)
}

// 上传视频到后端返回的预签名 URL
export function uploadVideoToMinio(uploadUrl, file) {
  return axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    }
  })
}

// 上传完成确认并入库
export function completeVideoUpload(data) {
  return http.post('/videos/upload/complete', data)
}

// 获取视频信息
export function getVideo(videoId) {
  return http.get(`/videos/${videoId}`)
}

// 获取视频播放预签名 URL
export function getVideoPlayUrl(videoId) {
  return http.get(`/videos/${videoId}/play-url`)
}

// 获取视频列表（分页）
export function listVideos(params) {
  return http.get('/videos/list', { params })
}

// 删除视频
// export function deleteVideo(videoId) {
//   return http.delete(`/videos/${videoId}`)
// }
