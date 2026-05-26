// tracking.service.js 🟡 DEV 3 | Servicio de Seguimiento para el Instructor
// Usa el cliente HTTP centralizado que inyecta el token JWT automáticamente
import http from '../../../core/api/http'


export const trackingService = {
    /**
     * Listar etapas productivas (aprendices) asignadas al instructor
     */
    getMyApprentices: (params = {}) => http.get('/productive-stages', { params }),
    getStageDetails: (stageId) => http.get(`/productive-stages/${stageId}`),
    getFichas: () => http.get('/users/fichas/stats'),
    getUsers: (params = {}) => http.get('/users', { params }),


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
    }),

    /**
     * Validar firmas del acta de seguimiento con IA
     */
    validatePdf: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return http.post('/trackings/validate-pdf', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Autorizar seguimientos extraordinarios para una EP (Admin)
     */
    authorizeExtraordinary: (stageId, authorized = true) => {
        return http.patch(`/productive-stages/${stageId}/authorize-extraordinary`, { authorized });
    },

    /**
     * Listar horas adicionales de instructores (Seguimientos Extraordinarios)
     */
    getAdditionalHours: (params = {}) => {
        return http.get('/hours', { params: { ...params, isAdditionalHour: true } });
    },

    /**
     * Actualizar estado de las horas adicionales
     */
    updateAdditionalHourStatus: (id, payload) => {
        return http.patch(`/hours/${id}/estado`, payload);
    }
}
