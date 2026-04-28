// ep.service.js  🔵 DEV 2 | Llamadas Axios a /api/productive-stages y /api/companies
import axios from 'axios'
const API = import.meta.env.VITE_API_URL

export const epService = {
  getAll: () => axios.get(`${API}/productive-stages`),
  getById: (id) => axios.get(`${API}/productive-stages/${id}`),
  create: (data) => axios.post(`${API}/productive-stages`, data),
  update: (id, data) => axios.put(`${API}/productive-stages/${id}`, data),
  getCompanies: () => axios.get(`${API}/companies`),
}
