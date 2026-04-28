// users.service.js 🟢 DEV 1 | Servicio de Usuarios para el Frontend
import axios from 'axios'
import { useAuthStore } from '../../../core/store/auth.store'

const API = import.meta.env.VITE_API_URL

// Crea una instancia con interceptor para token
const http = axios.create({ baseURL: API })

http.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
})

export const usersService = {
    /**
     * Listar usuarios con paginación y filtros
     * @param {{ page, limit, role, search }} params
     */
    getAll: (params = {}) => http.get('/users', { params }),

    /**
     * Obtener un usuario por ID
     */
    getById: (id) => http.get(`/users/${id}`),

    /**
     * Actualizar un usuario
     */
    update: (id, data) => http.put(`/users/${id}`, data),

    /**
     * Eliminar un usuario
     */
    remove: (id) => http.delete(`/users/${id}`),

    /**
     * Importar usuarios desde archivo Excel
     * @param {File} file
     */
    importExcel: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return http.post('/users/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    }
}
