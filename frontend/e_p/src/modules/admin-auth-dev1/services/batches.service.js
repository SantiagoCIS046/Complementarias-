import http from '../../../core/api/http'

export const batchesService = {
    /**
     * Listar todas las fichas (Batches)
     */
    getAll: (params = {}) => http.get('/fichas', { params }),

    /**
     * Obtener una ficha por ID
     */
    getById: (id) => http.get(`/fichas/${id}`),

    /**
     * Crear una nueva ficha
     */
    create: (data) => http.post('/fichas', data),

    /**
     * Asignar instructor a ficha
     */
    asignarInstructor: (id, instructorId) => http.patch(`/fichas/${id}/asignar-instructor`, { instructor_id: instructorId }),

    /**
     * Ver aprendices de una ficha
     */
    getAprendices: (id) => http.get(`/fichas/${id}/aprendices`),
}
