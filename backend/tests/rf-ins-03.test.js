import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const User = require('../src/modules/users-dev1/user.model');
const Batch = require('../src/modules/batches-dev1/batch.model');

vi.mock('../src/modules/users-dev1/user.model', () => {
  return {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
    find: vi.fn(),
    prototype: {
      save: vi.fn()
    }
  };
});

vi.mock('../src/modules/batches-dev1/batch.model', () => {
  return {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    prototype: {
      save: vi.fn()
    }
  };
});

vi.mock('../src/core/utils/notifications', () => ({
  enviarNotificacionAsignacion: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../src/modules/documents-dev2/drive.service', () => ({
  transferirPermisos: vi.fn().mockResolvedValue(true)
}));

const usersService = require('../src/modules/users-dev1/users.service');
const batchesService = require('../src/modules/batches-dev1/batches.service');

describe('RF-INS-03: Registro de fecha de asignación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe registrar fechaAsignacionInstructor en actualizar si cambia el instructor', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      instructorAsignado: null,
      role: 'APRENDIZ'
    };

    vi.spyOn(User, 'findById').mockResolvedValue(mockUser);
    vi.spyOn(User, 'findByIdAndUpdate').mockImplementation(async (id, data, options) => {
      return { _id: id, ...data };
    });

    const updateData = { instructorAsignado: new mongoose.Types.ObjectId() };
    const result = await usersService.actualizar(mockUser._id, updateData);

    expect(result.fechaAsignacionInstructor).toBeDefined();
    expect(result.fechaAsignacionInstructor).toBeInstanceOf(Date);
  });

  it('debe registrar fecha_asignacion y fechaAsignacionInstructor en asignarInstructor', async () => {
    const instructorId = new mongoose.Types.ObjectId();
    const batchId = new mongoose.Types.ObjectId();
    const apprenticeId = new mongoose.Types.ObjectId();

    const mockInstructor = {
      _id: instructorId,
      name: 'Elena Rodríguez',
      role: 'INSTRUCTOR'
    };

    const mockBatch = {
      _id: batchId,
      codigo_ficha: '2670687',
      aprendices_ids: [apprenticeId]
    };

    vi.spyOn(User, 'findById').mockResolvedValue(mockInstructor);
    vi.spyOn(Batch, 'findById').mockResolvedValue(mockBatch);
    vi.spyOn(Batch, 'findByIdAndUpdate').mockImplementation(async (id, update, options) => {
      return { 
        _id: id, 
        instructor_asignado: { 
          instructor_id: instructorId, 
          fecha_asignacion: update['instructor_asignado.fecha_asignacion'] 
        } 
      };
    });
    vi.spyOn(User, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

    const result = await batchesService.asignarInstructor(batchId, instructorId);

    expect(result.instructor_asignado.fecha_asignacion).toBeDefined();
    expect(result.instructor_asignado.fecha_asignacion).toBeInstanceOf(Date);
    expect(User.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [apprenticeId] } },
      expect.objectContaining({
        instructorAsignado: instructorId,
        fechaAsignacionInstructor: expect.any(Date)
      })
    );
  });
});
