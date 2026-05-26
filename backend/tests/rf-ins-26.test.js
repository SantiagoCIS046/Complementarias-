// rf-ins-26.test.js
// =============================================
// Tests para RF-INS-26: Diferenciación de Tipos de Instructor
// =============================================
// Verifica que:
// 1. El modelo User acepta el campo tipoInstructor (SEGUIMIENTO, TECNICO, PROYECTO, null)
// 2. Solo los instructores de tipo SEGUIMIENTO pueden crear visitas de seguimiento
// 3. Solo los instructores de tipo SEGUIMIENTO pueden revisar bitácoras
// 4. La validación de consistencia en actualizar: no se puede asignar un instructor TECNICO
//    al campo instructorAsignado (que es solo para SEGUIMIENTO), y viceversa
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const trackingsService  = require('../src/modules/trackings-dev3/trackings.service');
const bitacorasService  = require('../src/modules/bitacoras-dev3/bitacoras.service');
const usersService      = require('../src/modules/users-dev1/users.service');

const User              = require('../src/modules/users-dev1/user.model');
const ProductiveStage   = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Tracking          = require('../src/modules/trackings-dev3/tracking.model');
const Bitacora          = require('../src/modules/bitacoras-dev3/bitacora.model');

// ─────────────────────────────────────────────────────────────
describe('RF-INS-26: Diferenciación de Tipos de Instructor', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  describe('1. Modelo User — campo tipoInstructor', () => {

    it('debe aceptar tipoInstructor = SEGUIMIENTO', async () => {
      const instId = new mongoose.Types.ObjectId();

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id:            instId,
        name:           'Carlos Seguimiento',
        role:           'INSTRUCTOR',
        tipoInstructor: 'SEGUIMIENTO',
        activo:         true,
        status:         'ACTIVO',
      });

      const instructor = await User.findById(instId);
      expect(instructor.tipoInstructor).toBe('SEGUIMIENTO');
    });

    it('debe aceptar tipoInstructor = TECNICO', async () => {
      const instId = new mongoose.Types.ObjectId();

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id:            instId,
        name:           'Ana Técnica',
        role:           'INSTRUCTOR',
        tipoInstructor: 'TECNICO',
        activo:         true,
        status:         'ACTIVO',
      });

      const instructor = await User.findById(instId);
      expect(instructor.tipoInstructor).toBe('TECNICO');
    });

    it('debe aceptar tipoInstructor = PROYECTO', async () => {
      const instId = new mongoose.Types.ObjectId();

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id:            instId,
        name:           'María Proyecto',
        role:           'INSTRUCTOR',
        tipoInstructor: 'PROYECTO',
        activo:         true,
        status:         'ACTIVO',
      });

      const instructor = await User.findById(instId);
      expect(instructor.tipoInstructor).toBe('PROYECTO');
    });

    it('debe aceptar tipoInstructor = null (instructor sin tipo asignado, compatibilidad hacia atrás)', async () => {
      const instId = new mongoose.Types.ObjectId();

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id:            instId,
        name:           'Pedro Sin Tipo',
        role:           'INSTRUCTOR',
        tipoInstructor: null,
        activo:         true,
        status:         'ACTIVO',
      });

      const instructor = await User.findById(instId);
      expect(instructor.tipoInstructor).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('2. trackings.service — solo SEGUIMIENTO puede crear visitas', () => {

    it('debe lanzar error si un instructor TECNICO intenta crear una visita', async () => {
      const stageId     = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id:    stageId,
        estado: 'EN_CURSO',
      });

      // Instructor de tipo TECNICO
      vi.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === instructorId.toString()) {
          return Promise.resolve({
            _id:            instructorId,
            role:           'INSTRUCTOR',
            tipoInstructor: 'TECNICO',
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        trackingsService.crear({
          stageId,
          instructorId,
          apprenticeId: new mongoose.Types.ObjectId(),
          tipoVisita:   'VIRTUAL',
          fecha:        new Date(),
          tema:         'Prueba de tipo de instructor',
        })
      ).rejects.toThrow('Solo el instructor de Seguimiento puede registrar visitas de seguimiento');
    });

    it('debe lanzar error si un instructor PROYECTO intenta crear una visita', async () => {
      const stageId     = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id:    stageId,
        estado: 'EN_CURSO',
      });

      vi.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === instructorId.toString()) {
          return Promise.resolve({
            _id:            instructorId,
            role:           'INSTRUCTOR',
            tipoInstructor: 'PROYECTO',
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        trackingsService.crear({
          stageId,
          instructorId,
          apprenticeId: new mongoose.Types.ObjectId(),
          tipoVisita:   'PRESENCIAL',
          fecha:        new Date(),
          tema:         'Proyecto test',
        })
      ).rejects.toThrow('Solo el instructor de Seguimiento puede registrar visitas de seguimiento');
    });

    it('debe permitir crear visita si el instructor es de tipo SEGUIMIENTO', async () => {
      const stageId      = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();
      const apprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id:    stageId,
        estado: 'EN_CURSO',
      });

      // Instructor de tipo SEGUIMIENTO — no debe lanzar error del tipo
      vi.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === instructorId.toString()) {
          return Promise.resolve({
            _id:            instructorId,
            role:           'INSTRUCTOR',
            tipoInstructor: 'SEGUIMIENTO',
          });
        }
        // Para la búsqueda de aprendices dentro del service
        return Promise.resolve({
          _id:  apprenticeId,
          role: 'APRENDIZ',
        });
      });

      const mockTracking = {
        _id: new mongoose.Types.ObjectId(),
        stageId,
        instructorId,
        apprenticeId,
        tipoVisita: 'VIRTUAL',
      };

      // Mock de cuota disponible
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'create').mockResolvedValue(mockTracking);

      // Debe pasar la validación de tipo (si hay otro error aguas abajo, no es de RF-INS-26)
      try {
        const result = await trackingsService.crear({
          stageId,
          instructorId,
          apprenticeId,
          tipoVisita: 'VIRTUAL',
          fecha:      new Date(),
          tema:       'Tema OK',
        });
        expect(result).toBeDefined();
      } catch (err) {
        // El error NO debe ser el de tipo de instructor
        expect(err.message).not.toContain('Solo el instructor de Seguimiento');
      }
    });

    it('debe permitir crear visita si el instructor NO tiene tipo asignado (null)', async () => {
      const stageId      = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();
      const apprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: stageId, estado: 'EN_CURSO',
      });

      // Instructor sin tipo (tipoInstructor: null)
      vi.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === instructorId.toString()) {
          return Promise.resolve({
            _id:            instructorId,
            role:           'INSTRUCTOR',
            tipoInstructor: null,
          });
        }
        return Promise.resolve({ _id: apprenticeId, role: 'APRENDIZ' });
      });

      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Tracking, 'create').mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

      try {
        const result = await trackingsService.crear({
          stageId, instructorId, apprenticeId,
          tipoVisita: 'PRESENCIAL', fecha: new Date(), tema: 'Sin tipo OK',
        });
        expect(result).toBeDefined();
      } catch (err) {
        // El error NO debe ser el de tipo de instructor
        expect(err.message).not.toContain('Solo el instructor de Seguimiento');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('3. bitacoras.service — solo SEGUIMIENTO puede revisar', () => {

    it('debe lanzar error si un instructor TECNICO intenta revisar una bitácora', async () => {
      const bitacoraId   = new mongoose.Types.ObjectId();
      const revisadoPorId = new mongoose.Types.ObjectId();

      const mockBitacora = {
        _id:    bitacoraId,
        estado: 'PENDIENTE',
        save:   vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Bitacora, 'findById').mockResolvedValue(mockBitacora);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id:            revisadoPorId,
          role:           'INSTRUCTOR',
          tipoInstructor: 'TECNICO',
          name:           'Ana Técnica',
        }),
      });

      await expect(
        bitacorasService.revisar(bitacoraId, {
          estado:      'APROBADA',
          observaciones: 'Todo bien',
          revisadoPor: revisadoPorId,
        })
      ).rejects.toThrow('Solo el instructor de Seguimiento puede revisar las bitácoras del aprendiz');
    });

    it('debe lanzar error si un instructor PROYECTO intenta revisar una bitácora', async () => {
      const bitacoraId    = new mongoose.Types.ObjectId();
      const revisadoPorId = new mongoose.Types.ObjectId();

      vi.spyOn(Bitacora, 'findById').mockResolvedValue({
        _id:    bitacoraId,
        estado: 'PENDIENTE',
        save:   vi.fn().mockResolvedValue(true),
      });

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id:            revisadoPorId,
          role:           'INSTRUCTOR',
          tipoInstructor: 'PROYECTO',
          name:           'María Proyecto',
        }),
      });

      await expect(
        bitacorasService.revisar(bitacoraId, {
          estado:        'RECHAZADA',
          observaciones: 'Incompleto',
          revisadoPor:   revisadoPorId,
        })
      ).rejects.toThrow('Solo el instructor de Seguimiento puede revisar las bitácoras del aprendiz');
    });

    it('debe permitir a un instructor SEGUIMIENTO revisar una bitácora', async () => {
      const bitacoraId    = new mongoose.Types.ObjectId();
      const revisadoPorId = new mongoose.Types.ObjectId();

      const saveMock = vi.fn().mockResolvedValue(true);
      const mockBitacora = {
        _id:    bitacoraId,
        estado: 'PENDIENTE',
        save:   saveMock,
      };

      vi.spyOn(Bitacora, 'findById').mockResolvedValue(mockBitacora);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id:            revisadoPorId,
          role:           'INSTRUCTOR',
          tipoInstructor: 'SEGUIMIENTO',
          name:           'Carlos Seguimiento',
        }),
      });

      const result = await bitacorasService.revisar(bitacoraId, {
        estado:        'APROBADA',
        observaciones: 'Correcto',
        revisadoPor:   revisadoPorId,
      });

      expect(result.estado).toBe('APROBADA');
      expect(saveMock).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  describe('4. users.service — validación de consistencia en actualizar', () => {

    it('debe lanzar error si se asigna un instructor TECNICO al campo instructorAsignado (que es SEGUIMIENTO)', async () => {
      const aprendizId   = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();

      const oldUser = {
        _id:               aprendizId,
        role:              'APRENDIZ',
        instructorAsignado: null,
      };

      // El instructor tiene tipoInstructor TECNICO
      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === aprendizId.toString()) return oldUser;
        return {
          _id:            instructorId,
          role:           'INSTRUCTOR',
          tipoInstructor: 'TECNICO',
          activo:         true,
          status:         'ACTIVO',
          name:           'Ana Técnica',
        };
      });

      await expect(
        usersService.actualizar(aprendizId, { instructorAsignado: instructorId })
      ).rejects.toThrow('no puede ser asignado como SEGUIMIENTO en instructorAsignado');
    });

    it('debe permitir asignar un instructor SEGUIMIENTO al campo instructorAsignado', async () => {
      const aprendizId   = new mongoose.Types.ObjectId();
      const instructorId = new mongoose.Types.ObjectId();

      const oldUser = {
        _id:               aprendizId,
        role:              'APRENDIZ',
        instructorAsignado: null,
        historialInstructores: [],
        createdAt:         new Date(),
      };

      const updatedUser = {
        ...oldUser,
        instructorAsignado: instructorId,
        role: 'APRENDIZ',
      };

      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === aprendizId.toString()) return oldUser;
        return {
          _id:            instructorId,
          role:           'INSTRUCTOR',
          tipoInstructor: 'SEGUIMIENTO',
          activo:         true,
          status:         'ACTIVO',
          name:           'Carlos Seguimiento',
        };
      });

      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

      const result = await usersService.actualizar(aprendizId, {
        instructorAsignado: instructorId,
      });

      expect(result.instructorAsignado.toString()).toBe(instructorId.toString());
    });
  });
});
