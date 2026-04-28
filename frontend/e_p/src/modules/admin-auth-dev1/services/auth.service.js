// auth.service.js  ?? DEV 1 | Llamadas Axios a /api/auth y /api/users
import axios from 'axios'
const API = import.meta.env.VITE_API_URL

export const authService = {
  login:          (credentials) => axios.post(`${API}/auth/login`, credentials),
  forgotPassword: (email)       => axios.post(`${API}/auth/forgot-password`, { email }),
  resetPassword:  (data)        => axios.post(`${API}/auth/reset-password`, data),
  changePassword: (password, token) => axios.post(`${API}/auth/change-password`, { password }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  registrar:      (data)        => axios.post(`${API}/auth/register`, data),
}
