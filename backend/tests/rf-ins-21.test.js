import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const User = require('../src/modules/users-dev1/user.model');
const usersService = require('../src/modules/users-dev1/users.service');
const productiveStagesService = require('../src/modules/productive-stages-dev2/productive-stages.service');

describe('RF-INS-21: Historial de modalidades e instructores anteriores del aprendiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de storage active provider para evitar llamadas a MongoDB
    const storageService = require('../src/modules/documents-dev2/storage.service');
    vi.spyOn(storageService, 'getActiveProvider').mockResolvedValue('DRIVE');

    // Mock de ProductiveStage.findOne para que no intente hacer queries reales a MongoDB
    vi.spyOn(ProductiveStage, 'findOne').mockResolvedValue(null);

    // Mock de enviarNotificacionAsignacion para evitar consultas a MongoDB
    const notifications = require('../src/core/utils/notifications');
    vi.spyOn(notifications, 'enviarNotificacionAsignacion').mockResolvedValue({ success: true });
  });

  describe('Historial de Instructores en Actualización de Usuario', () => {
    it('debe registrar el instructor anterior en historialInstructores al reasignar de forma individual', async () => {
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockOldInstructorId = new mongoose.Types.ObjectId();
      const mockNewInstructorId = new mongoose.Types.ObjectId();

      const mockOldInstructor = { _id: mockOldInstructorId, name: 'Instructor Viejo', role: 'INSTRUCTOR', activo: true };
      const mockNewInstructor = { _id: mockNewInstructorId, name: 'Instructor Nuevo', role: 'INSTRUCTOR', activo: true };

      const mockApprentice = {
        _id: mockApprenticeId,
        name: 'Carlos Aprendiz',
        role: 'APRENDIZ',
        instructorAsignado: mockOldInstructorId,
        fechaAsignacionInstructor: new Date('2026-01-01'),
        historialInstructores: [],
        createdAt: new Date('2026-01-01')
      };

      // Mocks de findById
      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === mockOldInstructorId.toString()) return mockOldInstructor;
        if (id.toString() === mockNewInstructorId.toString()) return mockNewInstructor;
        if (id.toString() === mockApprenticeId.toString()) return mockApprentice;
        return null;
      });

      // Mock findByIdAndUpdate para retornar al usuario actualizado
      const mockUpdatedApprentice = {
        ...mockApprentice,
        instructorAsignado: mockNewInstructorId,
        historialInstructores: [
          {
            instructorId: mockOldInstructorId,
            nombre: 'Instructor Viejo',
            fechaAsignacion: mockApprentice.fechaAsignacionInstructor,
            fechaFin: expect.any(Date)
          }
        ]
      };
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedApprentice);

      const result = await usersService.actualizar(mockApprenticeId, {
        instructorAsignado: mockNewInstructorId
      });

      expect(result.instructorAsignado).toBe(mockNewInstructorId);
      expect(result.historialInstructores).toHaveLength(1);
      expect(result.historialInstructores[0].nombre).toBe('Instructor Viejo');
      expect(result.historialInstructores[0].instructorId).toBe(mockOldInstructorId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockApprenticeId,
        expect.objectContaining({
          instructorAsignado: mockNewInstructorId,
          historialInstructores: expect.any(Array)
        }),
        expect.any(Object)
      );
    });
  });

  describe('Historial de Instructores en Reasignación por Lote', () => {
    it('debe registrar el instructor anterior al reasignar por fin de contrato individual/lote', async () => {
      const mockOldInstructorId = new mongoose.Types.ObjectId();
      const mockNewInstructorId = new mongoose.Types.ObjectId();
      
      const mockOldInstructor = { _id: mockOldInstructorId, name: 'Instructor Saliente', role: 'INSTRUCTOR', activo: true };
      const mockNewInstructor = { _id: mockNewInstructorId, name: 'Instructor Destino', role: 'INSTRUCTOR', activo: true };

      const mockApprentice = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Ana Aprendiz',
        email: 'ana@sena.edu.co',
        role: 'APRENDIZ',
        instructorAsignado: mockOldInstructorId,
        historialInstructores: [],
        save: vi.fn().mockImplementation(function() { return Promise.resolve(this); })
      };

      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === mockOldInstructorId.toString()) return mockOldInstructor;
        if (id.toString() === mockNewInstructorId.toString()) return mockNewInstructor;
        return null;
      });

      vi.spyOn(User, 'find').mockResolvedValue([mockApprentice]);

      // Mock updateMany para los otros instructores
      vi.spyOn(User, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

      const Batch = require('../src/modules/batches-dev1/batch.model');
      vi.spyOn(Batch, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

      const Tracking = require('../src/modules/trackings-dev3/tracking.model');
      vi.spyOn(Tracking, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

      await usersService.reassignApprentices(mockOldInstructorId, mockNewInstructorId);

      expect(mockApprentice.save).toHaveBeenCalled();
      expect(mockApprentice.instructorAsignado).toBe(mockNewInstructorId);
      expect(mockApprentice.historialInstructores).toHaveLength(1);
      expect(mockApprentice.historialInstructores[0].nombre).toBe('Instructor Saliente');
    });
  });

  describe('Recuperación de Etapas Previas y Modalidades Históricas', () => {
    it('debe devolver las etapas previas del aprendiz al consultar los detalles de etapa por ID', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        apprenticeId: { _id: mockApprenticeId, name: 'Beatriz Gomez' },
        companyId: { razonSocial: 'Empresa Principal' },
        modalidad: 'CONTRATO_APRENDIZAJE',
        estado: 'EN_CURSO'
      };

      const mockEtapasPrevias = [
        {
          _id: new mongoose.Types.ObjectId(),
          apprenticeId: mockApprenticeId,
          companyId: { razonSocial: 'Empresa Pasantía', nit: '111-222' },
          modalidad: 'PASANTÍA',
          estado: 'RECHAZADO'
        }
      ];

      const mockQuery = {
        populate: vi.fn(),
        then: vi.fn()
      };
      mockQuery.populate.mockReturnValue(mockQuery);
      mockQuery.then.mockImplementation((resolve) => resolve(mockStage));

      vi.spyOn(ProductiveStage, 'findById').mockReturnValue(mockQuery);

      // Mock de ProductiveStage.find para recuperar etapas previas
      vi.spyOn(ProductiveStage, 'find').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockEtapasPrevias)
      });

      const Document = require('../src/modules/documents-dev2/document.model');
      vi.spyOn(Document, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([])
        })
      });

      const result = await productiveStagesService.getById(mockStageId);

      expect(result.stage).toBeDefined();
      expect(result.etapasPrevias).toHaveLength(1);
      expect(result.etapasPrevias[0].modalidad).toBe('PASANTÍA');
      expect(result.etapasPrevias[0].companyId.razonSocial).toBe('Empresa Pasantía');
      expect(ProductiveStage.find).toHaveBeenCalledWith(expect.objectContaining({
        apprenticeId: mockApprenticeId,
        _id: { $ne: mockStageId }
      }));
    });
  });
});
