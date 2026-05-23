import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Mock de mailer
vi.mock('../src/core/utils/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue(true)
}));

const Tracking = require('../src/modules/trackings-dev3/tracking.model');
const Notification = require('../src/modules/system-config-dev1/Notification.model');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
const { ejecutarEscaneoRetrasoTrackings } = require('../src/core/utils/alertsCron');

describe('RF-INS-09: Alertas de vencimiento de seguimientos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe alertar al instructor si la visita está programada y lleva exactamente 4 días de retraso', async () => {
    const mockInstructorId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();

    const mockInstructor = { _id: mockInstructorId, name: 'Instructor Pruebas', email: 'inst@sena.edu.co' };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', email: 'carlos@gmail.com', ficha: '12345' };

    // Visita programada para hace exactamente 4 días
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaVisita = new Date(hoy);
    fechaVisita.setDate(fechaVisita.getDate() - 4);

    const mockTracking = {
      _id: new mongoose.Types.ObjectId(),
      numeroVisita: 1,
      fechaVisita: fechaVisita,
      estadoVisita: 'PROGRAMADO',
      instructorId: mockInstructor,
      apprenticeId: mockApprentice,
      stageId: new mongoose.Types.ObjectId()
    };

    // Mocks de BD
    vi.spyOn(Tracking, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([mockTracking])
        })
      })
    });

    vi.spyOn(trackingsService, 'obtenerCupoSeguimientos').mockResolvedValue({
      maxSeguimientos: 3, // Tecnólogo
      nivelFormacion: 'Tecnólogo'
    });

    vi.spyOn(Notification, 'findOne').mockResolvedValue(null);

    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });

    const result = await ejecutarEscaneoRetrasoTrackings();

    expect(result.alertasRetrasoGeneradas).toBe(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockInstructorId,
        mensaje: expect.stringContaining('lleva 4 días de retraso'),
        tipo: 'SEGUIMIENTO'
      })
    );
  });

  it('debe enviar alerta crítica al aprendiz e instructor si la última visita lleva exactamente 4 días de retraso', async () => {
    const mockInstructorId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();

    const mockInstructor = { _id: mockInstructorId, name: 'Instructor Pruebas', email: 'inst@sena.edu.co' };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', email: 'carlos@gmail.com', ficha: '12345' };

    // Última visita programada para hace exactamente 4 días
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaVisita = new Date(hoy);
    fechaVisita.setDate(fechaVisita.getDate() - 4);

    const mockTracking = {
      _id: new mongoose.Types.ObjectId(),
      numeroVisita: 3, // Última visita para Tecnólogo (cupo max 3)
      fechaVisita: fechaVisita,
      estadoVisita: 'PROGRAMADO',
      instructorId: mockInstructor,
      apprenticeId: mockApprentice,
      stageId: new mongoose.Types.ObjectId()
    };

    // Mocks de BD
    vi.spyOn(Tracking, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([mockTracking])
        })
      })
    });

    vi.spyOn(trackingsService, 'obtenerCupoSeguimientos').mockResolvedValue({
      maxSeguimientos: 3,
      nivelFormacion: 'Tecnólogo'
    });

    vi.spyOn(Notification, 'findOne').mockResolvedValue(null);

    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });

    const result = await ejecutarEscaneoRetrasoTrackings();

    expect(result.alertasRetrasoGeneradas).toBe(1);
    
    // Debe haber creado alerta para el instructor
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockInstructorId,
        mensaje: expect.stringContaining('lleva 4 días de retraso'),
        tipo: 'SEGUIMIENTO'
      })
    );

    // Debe haber creado alerta crítica para el aprendiz
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockApprenticeId,
        mensaje: expect.stringContaining('ALERTA CRÍTICA: Tu visita de seguimiento final'),
        tipo: 'SEGUIMIENTO'
      })
    );
  });
});
