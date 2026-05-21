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
   * Importar múltiples empresas desde JSON array (SGVA legacy)
   */
  bulkCreate: (data) => http.post('/companies/bulk', data),

  /**
   * Descargar la plantilla Excel oficial desde el backend (protegida por JWT).
   * Devuelve un Blob para que el frontend lo fuerce como descarga.
   */
  downloadTemplate: () =>
    http.get('/companies/template', { responseType: 'blob' }),

  /**
   * Subir un archivo .xlsx para importación masiva.
   * @param {File} file — objeto File del input/drop zone
   */
  uploadXlsx: (file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/companies/upload-xlsx', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Eliminar una empresa
   */
  delete: (id) => http.delete(`/companies/${id}`)
}
