// users.service.js 🟢 DEV 1 | Servicio de Usuarios para el Frontend
// Usa el cliente HTTP centralizado que inyecta el token JWT automáticamente
import http from '../../../core/api/http'


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
     * Activar o desactivar un usuario (soft toggle, nunca elimina de la BD)
     */
    toggleStatus: (id) => http.patch(`/users/${id}/toggle-status`),

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
    },

    /**
     * Reasignación masiva de aprendices e instructores
     */
    reassignInstructor: (oldInstructorId, newInstructorId, motivo = '') => 
        http.post('/users/reassign-instructor', { oldInstructorId, newInstructorId, motivo })
}
