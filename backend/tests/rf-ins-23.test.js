import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const User = require('../src/modules/users-dev1/user.model');
const Batch = require('../src/modules/batches-dev1/batch.model');
const Tracking = require('../src/modules/trackings-dev3/tracking.model');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
const trackingsController = require('../src/modules/trackings-dev3/trackings.controller');

describe('RF-INS-23: Verificación de firmas en seguimientos (IA Control)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creación de Seguimiento con Validación IA de Firmas', () => {
    it('debe arrojar un error si se intenta registrar validado por IA sin el objeto de firmas', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      
      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: false,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue({ _id: mockApprenticeId, role: 'APRENDIZ' });
      vi.spyOn(Batch, 'findOne').mockResolvedValue({ nivel_formacion: 'Tecnólogo' });
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          numeroVisita: 1,
          fechaVisita: new Date(),
          observaciones: 'Seguimiento mensual',
          isValidatedByIA: true,
          signaturesValidated: null
        })
      ).rejects.toThrow('Debe proporcionar los resultados de la validación de firmas por IA.');
    });

    it('debe arrojar un error si falta la firma digital del aprendiz', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      
      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: false
      };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue({ _id: mockApprenticeId, role: 'APRENDIZ' });
      vi.spyOn(Batch, 'findOne').mockResolvedValue({ nivel_formacion: 'Tecnólogo' });
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          numeroVisita: 1,
          fechaVisita: new Date(),
          observaciones: 'Seguimiento mensual',
          isValidatedByIA: true,
          signaturesValidated: {
            aprendiz: { detected: false, confidence: 0.0 },
            instructor: { detected: true, confidence: 0.98 }
          }
        })
      ).rejects.toThrow('El acta de seguimiento debe contar con la firma digital del aprendiz.');
    });

    it('debe arrojar un error si falta la firma digital del instructor', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      
      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: false
      };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue({ _id: mockApprenticeId, role: 'APRENDIZ' });
      vi.spyOn(Batch, 'findOne').mockResolvedValue({ nivel_formacion: 'Tecnólogo' });
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          numeroVisita: 1,
          fechaVisita: new Date(),
          observaciones: 'Seguimiento mensual',
          isValidatedByIA: true,
          signaturesValidated: {
            aprendiz: { detected: true, confidence: 0.98 },
            instructor: { detected: false, confidence: 0.0 }
          }
        })
      ).rejects.toThrow('El acta de seguimiento debe contar con la firma digital del instructor.');
    });

    it('debe registrar exitosamente si ambas firmas digitales obligatorias son detectadas', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      
      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: false
      };

      const mockTracking = {
        _id: new mongoose.Types.ObjectId(),
        stageId: mockStageId,
        numeroVisita: 1,
        isValidatedByIA: true,
        signaturesValidated: {
          aprendiz: { detected: true, confidence: 0.98 },
          instructor: { detected: true, confidence: 0.95 }
        }
      };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue({ _id: mockApprenticeId, role: 'APRENDIZ' });
      vi.spyOn(Batch, 'findOne').mockResolvedValue({ nivel_formacion: 'Tecnólogo' });
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);
      vi.spyOn(Tracking, 'create').mockResolvedValue(mockTracking);

      const result = await trackingsService.crear({
        stageId: mockStageId,
        numeroVisita: 1,
        fechaVisita: new Date(),
        observaciones: 'Seguimiento mensual completo',
        isValidatedByIA: true,
        signaturesValidated: {
          aprendiz: { detected: true, confidence: 0.98 },
          instructor: { detected: true, confidence: 0.95 }
        }
      });

      expect(result).toBeDefined();
      expect(result.isValidatedByIA).toBe(true);
      expect(result.signaturesValidated.aprendiz.detected).toBe(true);
      expect(result.signaturesValidated.instructor.detected).toBe(true);
    });
  });

  describe('Transición a REALIZADO en Actualización de Seguimiento', () => {
    it('debe denegar la transición a REALIZADO si la firma del aprendiz está ausente', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: 'SENA Principal',
        observaciones: 'Excelente avance',
        isValidatedByIA: true,
        signaturesValidated: {
          aprendiz: { detected: false, confidence: 0.0 },
          instructor: { detected: true, confidence: 0.96 }
        },
        estadoVisita: 'PROGRAMADO'
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      await expect(
        trackingsService.actualizar(mockTrackingId, { estadoVisita: 'REALIZADO' })
      ).rejects.toThrow('El acta de seguimiento debe contar con la firma digital del aprendiz para marcarse como REALIZADO.');
    });

    it('debe denegar la transición a REALIZADO si la firma del instructor está ausente', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: 'SENA Principal',
        observaciones: 'Excelente avance',
        isValidatedByIA: true,
        signaturesValidated: {
          aprendiz: { detected: true, confidence: 0.97 },
          instructor: { detected: false, confidence: 0.0 }
        },
        estadoVisita: 'PROGRAMADO'
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      await expect(
        trackingsService.actualizar(mockTrackingId, { estadoVisita: 'REALIZADO' })
      ).rejects.toThrow('El acta de seguimiento debe contar con la firma digital del instructor para marcarse como REALIZADO.');
    });

    it('debe permitir la transición a REALIZADO si ambas firmas obligatorias están presentes', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: 'SENA Principal',
        observaciones: 'Excelente avance',
        isValidatedByIA: true,
        signaturesValidated: {
          aprendiz: { detected: true, confidence: 0.97 },
          instructor: { detected: true, confidence: 0.96 }
        },
        estadoVisita: 'PROGRAMADO'
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);
      vi.spyOn(Tracking, 'findByIdAndUpdate').mockResolvedValue({
        ...mockTracking,
        estadoVisita: 'REALIZADO'
      });

      const result = await trackingsService.actualizar(mockTrackingId, { estadoVisita: 'REALIZADO' });
      expect(result.estadoVisita).toBe('REALIZADO');
    });
  });

  describe('Control de IA en Controller (validarPdfIA)', () => {
    it('debe denegar validación si el archivo se llama sin_firma_instructor', async () => {
      const mockReq = {
        file: {
          size: 1024 * 1024,
          originalname: 'acta_sin_firma_instructor.pdf'
        }
      };
      
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await trackingsController.validarPdfIA(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        valid: false,
        message: expect.stringContaining('Instructor')
      }));
    });

    it('debe denegar validación si el archivo se llama sin_firma_aprendiz', async () => {
      const mockReq = {
        file: {
          size: 1024 * 1024,
          originalname: 'acta_sin_firma_aprendiz.pdf'
        }
      };
      
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await trackingsController.validarPdfIA(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        valid: false,
        message: expect.stringContaining('Aprendiz')
      }));
    });

    it('debe validar exitosamente si el archivo tiene firmas completas', async () => {
      const mockReq = {
        file: {
          size: 1024 * 1024,
          originalname: 'acta_completa.pdf'
        }
      };
      
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await trackingsController.validarPdfIA(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        valid: true,
        message: expect.stringContaining('Todas las firmas')
      }));
    });
  });
});
