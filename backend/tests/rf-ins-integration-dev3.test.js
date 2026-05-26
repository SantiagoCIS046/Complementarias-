import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Tracking = require('../src/modules/trackings-dev3/tracking.model');
const User = require('../src/modules/users-dev1/user.model');
const Batch = require('../src/modules/batches-dev1/batch.model');
const Hour = require('../src/modules/hours-dev3/hour.model');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
const hoursService = require('../src/modules/hours-dev3/hours.service');

describe('RF-INS-12, 13, 14, 15 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RF-INS-12: Validación de Cuotas y Seguimientos Extraordinarios', () => {
    it('debe denegar la creación de visita extraordinaria si no está autorizada para la etapa productiva', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockInstructorId = new mongoose.Types.ObjectId();

      const mockStage = { 
        _id: mockStageId, 
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: false // Sin autorización
      };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
      const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          instructorId: mockInstructorId,
          numeroVisita: 4,
          observaciones: 'Visita extraordinaria rechazada',
          esExtraordinario: true
        })
      ).rejects.toThrow('No está autorizado a registrar seguimientos extraordinarios');
    });

    it('debe denegar la creación si la visita numeroVisita ya está duplicada', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockInstructorId = new mongoose.Types.ObjectId();

      const mockStage = { 
        _id: mockStageId, 
        apprenticeId: mockApprenticeId,
        extraordinaryTrackingAuthorized: true
      };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
      const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(), numeroVisita: 2 });

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          instructorId: mockInstructorId,
          numeroVisita: 2,
          observaciones: 'Visita duplicada',
          esExtraordinario: false
        })
      ).rejects.toThrow('Ya existe la visita de seguimiento #2 registrada');
    });
  });

  describe('RF-INS-13: Inmutabilidad de Horas Adicionales', () => {
    it('debe impedir modificar un registro de horas cerrado (pendiente === false)', async () => {
      const mockHourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: mockHourId,
        ejecutado: true,
        cobrado: true,
        pendiente: false, // cerrado
        save: vi.fn()
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      await expect(
        hoursService.actualizarEstado(mockHourId, { ejecutado: false, pendiente: true })
      ).rejects.toThrow('Este registro de horas ya está cerrado');
    });

    it('debe permitir modificar un registro de horas abierto (pendiente === true)', async () => {
      const mockHourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: mockHourId,
        ejecutado: false,
        cobrado: false,
        pendiente: true, // abierto
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      const result = await hoursService.actualizarEstado(mockHourId, { ejecutado: true, pendiente: false });
      expect(result.ejecutado).toBe(true);
      expect(result.pendiente).toBe(false);
      expect(mockHour.save).toHaveBeenCalled();
    });
  });

  describe('RF-INS-14: Validación IA Requerida para estado REALIZADO', () => {
    it('debe fallar al actualizar una visita a REALIZADO sin observaciones o lugar', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: '',
        observaciones: '',
        isValidatedByIA: true,
        estadoVisita: 'PROGRAMADO'
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      await expect(
        trackingsService.actualizar(mockTrackingId, { estadoVisita: 'REALIZADO' })
      ).rejects.toThrow('Lugar y las Observaciones son obligatorios');
    });

    it('debe fallar al actualizar una visita a REALIZADO si no ha sido validada por IA', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: 'SENA Principal',
        observaciones: 'Todo correcto con el aprendiz',
        isValidatedByIA: false, // No validada
        estadoVisita: 'PROGRAMADO'
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      await expect(
        trackingsService.actualizar(mockTrackingId, { estadoVisita: 'REALIZADO' })
      ).rejects.toThrow('debe ser validada por IA antes de marcar la visita como REALIZADO');
    });

    it('debe actualizar exitosamente si Lugar, Observaciones e isValidatedByIA son correctos', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        lugarVisita: 'SENA Principal',
        observaciones: 'Todo correcto con el aprendiz',
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

  describe('RF-INS-17: Histórico de Pagos por Mes', () => {
    it('debe agrupar cronológicamente por mes y calcular KPIs globales correctos', async () => {
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockTrackingId = new mongoose.Types.ObjectId();
      
      const mockHours = [
        {
          _id: new mongoose.Types.ObjectId(),
          fecha: new Date('2026-05-10T12:00:00.000Z'),
          cobrado: true,
          ejecutado: true,
          pendiente: false,
          apprenticeId: { name: 'Juan Perez', documento: '1098765432', ficha: '2345678' },
          stageId: { radicado: 'REP-2026-001' },
          trackingId: { numeroVisita: 1, instructorId: mockInstructorId }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          fecha: new Date('2026-05-20T12:00:00.000Z'),
          cobrado: false,
          ejecutado: true,
          pendiente: true,
          apprenticeId: { name: 'Juan Perez', documento: '1098765432', ficha: '2345678' },
          stageId: { radicado: 'REP-2026-001' },
          trackingId: { numeroVisita: 2, instructorId: mockInstructorId }
        }
      ];

      const mockTracking = { _id: mockTrackingId };
      vi.spyOn(Tracking, 'find').mockResolvedValue([mockTracking]);

      vi.spyOn(Hour, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              sort: vi.fn().mockResolvedValue(mockHours)
            })
          })
        })
      });

      const res = await hoursService.obtenerHistoricoPagos({
        userId: mockInstructorId,
        userRole: 'INSTRUCTOR'
      });

      expect(res.resumenGlobal.totalCobrado).toBe(2); // 1 visita cobrada * 2h
      expect(res.resumenGlobal.totalPendiente).toBe(2); // 1 visita pendiente * 2h
      expect(res.resumenGlobal.visitasEjecutadas).toBe(2);

      expect(res.meses.length).toBe(1);
      expect(res.meses[0].totalHorasCobradas).toBe(2);
      expect(res.meses[0].totalHorasPendientes).toBe(2);
      expect(res.meses[0].cobradasCount).toBe(1);
      expect(res.meses[0].pendientesCount).toBe(1);
      expect(res.meses[0].detalles.length).toBe(2);
    });

    it('debe filtrar exclusivamente por el instructor logueado para garantizar la seguridad', async () => {
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockTracking = { _id: new mongoose.Types.ObjectId() };

      const trackingFindSpy = vi.spyOn(Tracking, 'find').mockResolvedValue([mockTracking]);
      const hourFindSpy = vi.spyOn(Hour, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              sort: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      await hoursService.obtenerHistoricoPagos({
        userId: mockInstructorId,
        userRole: 'INSTRUCTOR'
      });

      expect(trackingFindSpy).toHaveBeenCalledWith({ instructorId: mockInstructorId }, '_id');
      expect(hourFindSpy).toHaveBeenCalledWith({
        isAdditionalHour: true,
        trackingId: { $in: [mockTracking._id] }
      });
    });
  });
});
