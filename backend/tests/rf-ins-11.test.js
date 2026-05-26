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

describe('RF-INS-11: Registro de horas adicionales (Seguimiento extraordinario)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tracking, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });
    vi.spyOn(Hour, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });
  });

  it('debe registrar automáticamente una hora adicional (pendiente) al registrar una visita extraordinaria', async () => {
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
    vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);
    vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(3);

    // Espiar la creación de horas para validar que sea invocada automáticamente
    const hourSpy = vi.spyOn(Hour, 'create');

    const newTracking = await trackingsService.crear({
      stageId: mockStageId,
      instructorId: mockInstructorId,
      numeroVisita: 4,
      observaciones: 'Visita extraordinaria aprobada',
      esExtraordinario: true
    });

    expect(newTracking).toBeDefined();
    expect(newTracking.esExtraordinario).toBe(true);

    // Verificar que se haya creado el registro en Hour de forma automática
    expect(hourSpy).toHaveBeenCalled();
    const createdHourData = hourSpy.mock.calls[0][0];
    expect(createdHourData.isAdditionalHour).toBe(true);
    expect(createdHourData.trackingId).toBe(newTracking._id);
    expect(createdHourData.ejecutado).toBe(false);
    expect(createdHourData.cobrado).toBe(false);
    expect(createdHourData.pendiente).toBe(true);
  });

  it('debe no registrar una hora adicional si la visita creada NO es extraordinaria', async () => {
    const mockStageId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();
    const mockInstructorId = new mongoose.Types.ObjectId();

    const mockStage = { 
      _id: mockStageId, 
      apprenticeId: mockApprenticeId,
      extraordinaryTrackingAuthorized: false
    };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
    const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' };

    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);
    vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);
    vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(1);

    const hourSpy = vi.spyOn(Hour, 'create');

    const newTracking = await trackingsService.crear({
      stageId: mockStageId,
      instructorId: mockInstructorId,
      numeroVisita: 2,
      observaciones: 'Visita estándar #2',
      esExtraordinario: false
    });

    expect(newTracking).toBeDefined();
    expect(newTracking.esExtraordinario).toBe(false);
    expect(hourSpy).not.toHaveBeenCalled();
  });

  it('debe permitir actualizar reactivamente los estados del registro de horas adicionales mediante el servicio', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: false,
      cobrado: false,
      pendiente: true,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    // Simular que el usuario marca ejecutado en true y pendiente en false
    const updatedHour = await hoursService.actualizarEstado(mockHourId, {
      ejecutado: true,
      pendiente: false
    });

    expect(mockHour.save).toHaveBeenCalled();
    expect(updatedHour.ejecutado).toBe(true);
    expect(updatedHour.pendiente).toBe(false);
    expect(updatedHour.cobrado).toBe(false);
  });
});
