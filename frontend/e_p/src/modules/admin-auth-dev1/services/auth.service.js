// auth.service.js  ?? DEV 1 | Llamadas Axios a /api/auth y /api/users
import http from '../../../core/api/http'

export const authService = {
  login:          (credentials) => http.post('/auth/login', credentials),
  forgotPassword: (email)       => http.post('/auth/forgot-password', { email }),
  resetPassword:  (data)        => http.post('/auth/reset-password', data),
  changePassword: (password, token) => http.post('/auth/change-password', { password }, token ? {
    headers: { Authorization: `Bearer ${token}` }
  } : {}),
  registrar:      (data)        => http.post('/auth/register', data),
}
