// rf-ins-28.test.js
// =============================================
// Tests para RF-INS-28: Descarga de Plantillas Oficiales
// =============================================
// Verifica que:
// 1. Descarga exitosa de plantilla de bitácora en PDF.
// 2. Descarga exitosa de plantilla de bitácora en DOCX.
// 3. Descarga exitosa de plantilla de seguimiento en PDF.
// 4. Descarga exitosa de plantilla de seguimiento en DOCX.
// 5. Validación de tipo de plantilla inválido lanza error 400.
// 6. Validación de formato de plantilla inválido lanza error 400.
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const documentsController = require('../src/modules/documents-dev2/documents.controller');

describe('RF-INS-28: Descarga de Plantillas Oficiales', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse = () => {
    const res = {};
    res.setHeader = vi.fn().mockReturnThis();
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis();
    return res;
  };

  describe('1. Descarga de Bitácora (F-GFPI-023)', () => {
    it('debe generar y descargar la plantilla de bitácora en formato PDF', async () => {
      const req = {
        params: { type: 'bitacora', format: 'pdf' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=F-GFPI-023_Plantilla_Bitacora.pdf'
      );
      expect(res.send).toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toBeInstanceOf(Buffer);
    });

    it('debe generar y descargar la plantilla de bitácora en formato DOCX', async () => {
      const req = {
        params: { type: 'bitacora', format: 'docx' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=F-GFPI-023_Plantilla_Bitacora.docx'
      );
      expect(res.send).toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toBeInstanceOf(Buffer);
    });
  });

  describe('2. Descarga de Seguimiento y Evaluación (F-GFPI-024)', () => {
    it('debe generar y descargar la plantilla de seguimiento en formato PDF', async () => {
      const req = {
        params: { type: 'seguimiento', format: 'pdf' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=F-GFPI-024_Plantilla_Seguimiento_Evaluacion.pdf'
      );
      expect(res.send).toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toBeInstanceOf(Buffer);
    });

    it('debe generar y descargar la plantilla de seguimiento en formato DOCX', async () => {
      const req = {
        params: { type: 'seguimiento', format: 'docx' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=F-GFPI-024_Plantilla_Seguimiento_Evaluacion.docx'
      );
      expect(res.send).toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toBeInstanceOf(Buffer);
    });
  });

  describe('3. Validaciones de Parámetros', () => {
    it('debe retornar 400 si el tipo de plantilla no es bitacora ni seguimiento', async () => {
      const req = {
        params: { type: 'otro', format: 'pdf' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El tipo de plantilla debe ser "bitacora" o "seguimiento".'
      });
    });

    it('debe retornar 400 si el formato de plantilla no es pdf ni docx', async () => {
      const req = {
        params: { type: 'bitacora', format: 'xlsx' }
      };
      const res = mockResponse();

      await documentsController.downloadOfficialTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El formato debe ser "pdf" o "docx".'
      });
    });
  });
});
