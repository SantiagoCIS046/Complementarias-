// document.service.js 🟡 DEV 3 | Servicio de Documentos
import http from '../../../core/api/http'

export const documentService = {
  /**
   * Obtener documentos de una Etapa Productiva específica
   */
  getByStage: (stageId) => http.get(`/documents/stage/${stageId}`),

  /**
   * Revisar un documento (Aprobar/Rechazar)
   */
  revisar: (id, data) => http.patch(`/documents/${id}/review`, data),
}
