import http from './http'
import { setToken } from './http'

// 用户注册
export function register(data) {
  // data: { username, email, password }
  return http.post('/users/register', data)
}

// 用户登录 - 返回 LoginResponse，并自动保存 token（如果有）
export async function login(data) {
  // data: { username, password }
  const res = await http.post('/users/login', data)
  if (res?.token) {
    setToken(res.token)
  }
  return res
}

// 获取当前用户信息
export function getCurrentUser() {
  return http.get('/users/me')
}

// 更新当前用户信息
export function updateMe(data) {
  // data: { username?, email?, avatarUrl? }
  return http.put('/users/me', data)
}

// 获取指定用户信息
export function getUserById(userId) {
  return http.get(`/users/${userId}`)
}


