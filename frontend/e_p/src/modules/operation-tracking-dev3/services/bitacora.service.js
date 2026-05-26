// bitacora.service.js 🟡 DEV 3 | Servicio de Bitácoras
import http from '../../../core/api/http'

export const bitacoraService = {
    /**
     * Listar todas las bitácoras (con filtros opcionales)
     */
    getAll: (params = {}) => http.get('/bitacoras', { params }),

    /**
     * Obtener bitácoras de una Etapa Productiva específica
     */
    getByStage: (stageId) => http.get(`/bitacoras?stageId=${stageId}`),

    /**
     * Revisar una bitácora (Aprobar/Rechazar)
     */
    revisar: (id, data) => http.patch(`/bitacoras/${id}/review`, data),

    /**
     * Crear una nueva bitácora (para el aprendiz)
     */
    crear: (data) => http.post('/bitacoras', data),

    /**
     * Actualizar una bitácora
     */
    actualizar: (id, data) => http.put(`/bitacoras/${id}`, data),

    /**
     * Validar firmas mediante IA en un archivo PDF de bitácora
     */
    validateSignatures: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return http.post('/bitacoras/validate-signatures', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    }
}
