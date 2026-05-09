// ep.service.js  🔵 DEV 2 | Llamadas Axios a /api/productive-stages y /api/companies
// Usa el cliente HTTP centralizado que inyecta el token JWT automáticamente
import http from '../../../core/api/http'

export const epService = {
  // ── Etapas Productivas ─────────────────────────────────────────
  getAll:       ()          => http.get('/productive-stages'),
  getById:      (id)        => http.get(`/productive-stages/${id}`),
  create:       (data)      => http.post('/productive-stages', data),
  update:       (id, data)  => http.put(`/productive-stages/${id}`, data),
  remove:       (id)        => http.delete(`/productive-stages/${id}`),

  // ── Empresas ───────────────────────────────────────────────────
  getCompanies: ()          => http.get('/companies'),

  // ── Cronograma (Módulo 2) ──────────────────────────────────────
  getCronograma:  (id)      => http.get(`/productive-stages/${id}/schedule`),

  // ── Semáforo / Estado visual ───────────────────────────────────
  getSemaforo:    (id)      => http.get(`/productive-stages/${id}/semaforo`),

  // ── Aprobaciones (Módulo 4) ────────────────────────────────────
  enviarARevision: (id)     => http.patch(`/productive-stages/${id}/enviar-revision`),

  // ── Bitácoras (DEV 3 - consumidas desde dashboard del aprendiz) ─
  getBitacoras:       ()            => http.get('/bitacoras'),
  getBitacorasByStage:(stageId)     => http.get(`/bitacoras/stage/${stageId}`),
  crearBitacora:      (data)        => http.post('/bitacoras', data),
  actualizarBitacora: (id, data)    => http.put(`/bitacoras/${id}`, data),

  // ── Certificación ─────────────────────────────────────────────
  getEstadoCertificacion: (id)      => http.get(`/productive-stages/${id}/certificacion`),
}
