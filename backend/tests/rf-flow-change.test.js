import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Mutar stateMachine antes de requerir el servicio (técnica CommonJS)
const stateMachine = require('../src/modules/productive-stages-dev2/stateMachine');
stateMachine.ejecutarTransicion = vi.fn().mockImplementation(async (stage, nuevoEstado) => {
  stage.estado = nuevoEstado;
  return stage;
});
stateMachine.obtenerTransicionesDisponibles = vi.fn().mockReturnValue([]);

// Mock dependencies
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Document = require('../src/modules/documents-dev2/document.model');
const Notification = require('../src/modules/system-config-dev1/Notification.model');
const User = require('../src/modules/users-dev1/user.model');
const SystemConfig = require('../src/modules/system-config-dev1/system-config.model');
const notificationsUtil = require('../src/core/utils/notifications');

vi.spyOn(SystemConfig, 'findOne');

const productiveStagesService = require('../src/modules/productive-stages-dev2/productive-stages.service');

describe('Flujo de Aprobación de Etapa Productiva y Asignación de Instructores', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock global of SystemConfig.findOne
    SystemConfig.findOne.mockResolvedValue(null);

    // Mock global of Notification.create
    vi.spyOn(Notification, 'create').mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

    const makeChainableMock = (val) => {
      const query = {
        populate: vi.fn().mockImplementation(() => query),
        then: (resolve) => resolve(val)
      };
      return query;
    };

    // Mock Document.find and Document.updateMany
    vi.spyOn(Document, 'find').mockImplementation(() => makeChainableMock([
      { tipoDocumento: 'RUT', estado: 'PENDIENTE' },
      { tipoDocumento: 'CAMARA_COMERCIO', estado: 'PENDIENTE' }
    ]));
    vi.spyOn(Document, 'updateMany').mockResolvedValue({ modifiedCount: 2 });

    // Mock notifications assignment
    vi.spyOn(notificationsUtil, 'enviarNotificacionAsignacion').mockResolvedValue({ success: true });
  });

  describe('Petición de EP (enviarARevision)', () => {
    it('debe transicionar a VALIDACION y notificar a todos los administradores activos en lugar del instructor', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        estado: 'REGISTRO',
        radicado: 'EP-12345',
        historialEstados: []
      };

      const mockApprentice = {
        _id: mockApprenticeId,
        name: 'Carlos Aprendiz',
        role: 'APRENDIZ',
        instructorAsignado: new mongoose.Types.ObjectId() // Instructor asignado previamente
      };

      const mockAdmins = [
        { _id: new mongoose.Types.ObjectId(), name: 'Admin 1', role: 'ADMIN', activo: true },
        { _id: new mongoose.Types.ObjectId(), name: 'Admin 2', role: 'ADMIN', activo: true }
      ];

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(User, 'find').mockResolvedValue(mockAdmins);

      const result = await productiveStagesService.enviarARevision(mockStageId, mockApprenticeId);

      expect(result.estado).toBe('EN_REVISION');
      expect(result.mensaje).toContain('El administrador evaluará tus documentos');

      // Verificar que se haya notificado a los administradores
      expect(User.find).toHaveBeenCalledWith({ role: 'ADMIN', activo: true });
      expect(Notification.create).toHaveBeenCalledTimes(2);
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        usuario: mockAdmins[0]._id,
        mensaje: expect.stringContaining('ha enviado su Etapa Productiva'),
        tipo: 'WARNING'
      }));
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        usuario: mockAdmins[1]._id,
        mensaje: expect.stringContaining('ha enviado su Etapa Productiva'),
        tipo: 'WARNING'
      }));
    });
  });

  describe('Validación de Empresa (evaluarEP)', () => {
    it('debe requerir un instructorId al aprobar la etapa productiva', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockStage = {
        _id: mockStageId,
        estado: 'VALIDACION',
        apprenticeId: new mongoose.Types.ObjectId()
      };

      vi.spyOn(ProductiveStage, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStage)
      });

      await expect(
        productiveStagesService.evaluarEP(mockStageId, { decision: 'APROBADA', comentario: 'Empresa ok' }, new mongoose.Types.ObjectId())
      ).rejects.toThrow('Debe asignar un instructor para aprobar la Etapa Productiva.');
    });

    it('debe validar que el instructor sea válido, activo y de tipo SEGUIMIENTO', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockStage = {
        _id: mockStageId,
        estado: 'VALIDACION',
        apprenticeId: new mongoose.Types.ObjectId()
      };

      const mockInstructorInactivo = {
        _id: mockInstructorId,
        name: 'Instructor Inactivo',
        role: 'INSTRUCTOR',
        activo: false,
        status: 'INACTIVO'
      };

      vi.spyOn(ProductiveStage, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStage)
      });
      vi.spyOn(User, 'findById').mockResolvedValue(mockInstructorInactivo);

      await expect(
        productiveStagesService.evaluarEP(
          mockStageId,
          { decision: 'APROBADA', comentario: 'Empresa ok', instructorId: mockInstructorId },
          new mongoose.Types.ObjectId()
        )
      ).rejects.toThrow(/debe estar en estado activo/);
    });

    it('debe asignar el instructor al aprendiz, guardar historial y notificar al instructor al aprobar', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockAdminUserId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        estado: 'VALIDACION',
        apprenticeId: { _id: mockApprenticeId },
        radicado: 'EP-12345',
        chatObservaciones: [],
        historialEstados: [],
        save: vi.fn().mockResolvedValue(true)
      };

      const mockInstructor = {
        _id: mockInstructorId,
        name: 'Elena Seguimiento',
        role: 'INSTRUCTOR',
        activo: true,
        status: 'ACTIVO',
        tipoInstructor: 'SEGUIMIENTO'
      };

      const mockApprentice = {
        _id: mockApprenticeId,
        name: 'Carlos Aprendiz',
        role: 'APRENDIZ',
        instructorAsignado: null,
        historialInstructores: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ProductiveStage, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStage)
      });

      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === mockInstructorId.toString()) return mockInstructor;
        if (id.toString() === mockApprenticeId.toString()) return mockApprentice;
        return null;
      });

      const result = await productiveStagesService.evaluarEP(
        mockStageId,
        { decision: 'APROBADA', comentario: 'Aprobación exitosa', instructorId: mockInstructorId },
        mockAdminUserId
      );

      // Verificaciones en la base de datos simulada
      expect(mockApprentice.instructorAsignado).toBe(mockInstructorId);
      expect(mockApprentice.save).toHaveBeenCalled();
      expect(notificationsUtil.enviarNotificacionAsignacion).toHaveBeenCalledWith(mockApprenticeId, mockInstructorId);
      expect(result.decision).toBe('APROBADA');
    });
  });
});
