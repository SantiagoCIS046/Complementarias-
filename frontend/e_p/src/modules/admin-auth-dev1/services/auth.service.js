// auth.service.js  🟢 DEV 1 | Llamadas Axios
import axios from 'axios'
const API = import.meta.env.VITE_API_URL

export const authService = {
  login:          (credentials) => axios.post(`${API}/auth/login`, credentials),
  register:       (data)        => axios.post(`${API}/auth/register`, data),
  forgotPassword: (email)       => axios.post(`${API}/auth/forgot-password`, { email }),
  getUsers:       ()            => axios.get(`${API}/users`),
}
