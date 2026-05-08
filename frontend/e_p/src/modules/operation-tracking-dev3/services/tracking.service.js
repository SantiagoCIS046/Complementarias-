// tracking.service.js 🟡 DEV 3 | Servicio de Seguimiento para el Instructor
// Usa el cliente HTTP centralizado que inyecta el token JWT automáticamente
import http from '../../../core/api/http'


export const trackingService = {
    /**
     * Listar etapas productivas (aprendices) asignadas al instructor
     */
    getMyApprentices: (params = {}) => http.get('/productive-stages', { params }),

    /**
     * Listar visitas de seguimiento (Seguimientos Técnicos)
     */
    getAllTrackings: (params = {}) => http.get('/trackings', { params }),

    /**
     * Crear un nuevo seguimiento
     */
    createTracking: (data) => http.post('/trackings', data),

    /**
     * Actualizar un seguimiento existente
     */
    updateTracking: (id, data) => http.put(`/trackings/${id}`, data),

    /**
     * Subir acta PDF a Drive
     */
    uploadDocument: (formData) => http.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}
