import axios from 'axios'
import { ElMessage } from 'element-plus'

// Token 存取工具，方便后续登录页接入
const TOKEN_KEY = 'mindmooc_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// 通用 axios 实例
// 开发环境直接请求网关 http://localhost:80，通过 /api 前缀转发到后端业务服务
const http = axios.create({
  baseURL: 'http://localhost/api',
  timeout: 15000
})

// 请求拦截：附带 Authorization
http.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理 Result<T>
http.interceptors.response.use(
  (response) => {
    const res = response.data

    // /api/test 等非 Result 包装的接口，直接返回
    if (typeof res === 'string' || typeof res === 'number') {
      return res
    }

    const code = res.code
    const message = res.message || '请求失败'

    if (code === 200) {
      return res.data
    }

    // 其它 code 认为是错误
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      '网络异常，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default http


