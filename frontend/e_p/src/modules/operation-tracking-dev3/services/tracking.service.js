// tracking.service.js 🟡 DEV 3 | Servicio de Seguimiento para el Instructor
import axios from 'axios'
import { useAuthStore } from '../../../core/store/auth.store'

const API = import.meta.env.VITE_API_URL

const http = axios.create({ baseURL: API })

http.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
})

export const trackingService = {
    /**
     * Listar etapas productivas (aprendices) asignadas al instructor
     */
    getMyApprentices: (params = {}) => http.get('/productive-stages', { params })
}
