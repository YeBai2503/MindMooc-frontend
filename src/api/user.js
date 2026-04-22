import http, { setToken } from './http'

export async function login(data) {
  const res = await http.post('/users/login', data)
  if (res?.token) {
    setToken(res.token)
  }
  return res
}

export function register(data) {
  return http.post('/users/register', data)
}

export function sendResetCode(data) {
  return http.post('/users/password/reset-code', data)
}

export function resetPassword(data) {
  return http.post('/users/password/reset', data)
}

export function getCurrentUser() {
  return http.get('/users/me')
}

export function updateMe(data) {
  return http.put('/users/me', data)
}

export function deleteMe(data) {
  return http.delete('/users/me', { data })
}

export function getUserById(userId) {
  return http.get(`/users/${userId}`)
}
