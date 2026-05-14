import http from '../../../core/api/http'

export const companiesService = {
    /**
     * Listar todas las empresas
     */
    getAll: () => http.get('/companies'),

    /**
     * Obtener una empresa por ID
     */
    getById: (id) => http.get(`/companies/${id}`),

    /**
     * Crear una nueva empresa
     */
    create: (data) => http.post('/companies', data),

    /**
     * Actualizar una empresa
     */
    update: (id, data) => http.put(`/companies/${id}`, data),

    /**
     * Importar múltiples empresas desde archivo plano SGVA
     */
    bulkCreate: (data) => http.post('/companies/bulk', data)
}
