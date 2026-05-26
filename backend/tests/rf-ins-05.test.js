import { describe, it, expect, vi, beforeEach } from 'vitest';
const controller = require('../src/modules/bitacoras-dev3/bitacoras.controller');

describe('RF-INS-05: Gestión de bitácoras con validación IA (Pruebas Unitarias de Firma)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar error 400 si no se proporciona ningún archivo', async () => {
    const req = {
      file: null
    };
    
    let responseStatus = 0;
    let responseJson = {};
    
    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseJson = data;
          }
        };
      },
      json: (data) => {
        responseJson = data;
      }
    };

    await controller.validarFirmasIA(req, res);

    expect(responseStatus).toBe(400);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toContain('No se ha proporcionado ningún archivo');
  });

  it('debe validar con éxito un archivo PDF que tiene todas las firmas', async () => {
    const req = {
      file: {
        originalname: 'bitacora_semana1.pdf',
        size: 2 * 1024 * 1024 // 2MB
      }
    };

    let responseJson = {};
    const res = {
      json: (data) => {
        responseJson = data;
      }
    };

    await controller.validarFirmasIA(req, res);

    expect(responseJson.success).toBe(true);
    expect(responseJson.valid).toBe(true);
    expect(responseJson.fileSize).toBe('2.00 MB');
    expect(responseJson.signatures.aprendiz.detected).toBe(true);
    expect(responseJson.signatures.instructor.detected).toBe(true);
    expect(responseJson.signatures.jefeInmediato.detected).toBe(true);
    expect(responseJson.message).toContain('Todas las firmas requeridas fueron detectadas y validadas con éxito');
  });

  it('debe fallar la validación si falta la firma del instructor (sin_firma_instructor)', async () => {
    const req = {
      file: {
        originalname: 'sin_firma_instructor_sem1.pdf',
        size: 1 * 1024 * 1024 // 1MB
      }
    };

    let responseJson = {};
    const res = {
      json: (data) => {
        responseJson = data;
      }
    };

    await controller.validarFirmasIA(req, res);

    expect(responseJson.success).toBe(true);
    expect(responseJson.valid).toBe(false);
    expect(responseJson.signatures.instructor.detected).toBe(false);
    expect(responseJson.signatures.aprendiz.detected).toBe(true);
    expect(responseJson.signatures.jefeInmediato.detected).toBe(true);
    expect(responseJson.message).toContain('Falta la firma obligatoria del Instructor');
  });

  it('debe fallar la validación si falta la firma del jefe inmediato (sin_firma_jefe)', async () => {
    const req = {
      file: {
        originalname: 'sin_firma_jefe_sem1.pdf',
        size: 1.5 * 1024 * 1024
      }
    };

    let responseJson = {};
    const res = {
      json: (data) => {
        responseJson = data;
      }
    };

    await controller.validarFirmasIA(req, res);

    expect(responseJson.success).toBe(true);
    expect(responseJson.valid).toBe(false);
    expect(responseJson.signatures.jefeInmediato.detected).toBe(false);
    expect(responseJson.signatures.aprendiz.detected).toBe(true);
    expect(responseJson.signatures.instructor.detected).toBe(true);
    expect(responseJson.message).toContain('Falta la firma obligatoria del Jefe Inmediato');
  });

  it('debe fallar la validación si falta la firma del aprendiz (sin_firma_aprendiz)', async () => {
    const req = {
      file: {
        originalname: 'sin-firma-aprendiz-sem1.pdf',
        size: 1.2 * 1024 * 1024
      }
    };

    let responseJson = {};
    const res = {
      json: (data) => {
        responseJson = data;
      }
    };

    await controller.validarFirmasIA(req, res);

    expect(responseJson.success).toBe(true);
    expect(responseJson.valid).toBe(false);
    expect(responseJson.signatures.aprendiz.detected).toBe(false);
    expect(responseJson.signatures.instructor.detected).toBe(true);
    expect(responseJson.signatures.jefeInmediato.detected).toBe(true);
    expect(responseJson.message).toContain('Falta la firma obligatoria del Aprendiz');
  });
});
