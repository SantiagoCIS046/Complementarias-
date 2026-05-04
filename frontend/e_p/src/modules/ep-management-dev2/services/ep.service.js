// ep.service.js  🔵 DEV 2 | Llamadas Axios a /api/productive-stages y /api/companies
// Usa el cliente HTTP centralizado que inyecta el token JWT automáticamente
import http from '../../../core/api/http'

export const epService = {
  getAll:       ()          => http.get('/productive-stages'),
  getById:      (id)        => http.get(`/productive-stages/${id}`),
  create:       (data)      => http.post('/productive-stages', data),
  update:       (id, data)  => http.put(`/productive-stages/${id}`, data),
  remove:       (id)        => http.delete(`/productive-stages/${id}`),
  getCompanies: ()          => http.get('/companies'),
}

