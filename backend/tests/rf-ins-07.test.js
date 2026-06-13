import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Mock de mailer
vi.mock('../src/core/utils/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue(true)
}));

const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
const Notification = require('../src/modules/system-config-dev1/Notification.model');
const User = require('../src/modules/users-dev1/user.model');
const { ejecutarEscaneoBitacoras } = require('../src/core/utils/alertsCron');

describe('RF-INS-07: Alertas por bitácoras pendientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe enviar alerta al aprendiz exactamente 4 días antes del vencimiento', async () => {
    const mockApprentice = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Carlos Aprendiz',
      email: 'carlos@gmail.com',
      role: 'APRENDIZ'
    };

    // La fechaInicio es hace exactamente 10 días.
    // La bitácora 1 vence en 14 días a partir de fechaInicio (es decir, en 4 días a partir de hoy).
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() - 26);

    const mockStage = {
      _id: new mongoose.Types.ObjectId(),
      estado: 'EN_CURSO',
      fechaInicio: fechaInicio,
      apprenticeId: mockApprentice
    };

    // Spies/Mocks para evitar llamadas reales a DB
    vi.spyOn(ProductiveStage, 'find').mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockStage])
    });

    vi.spyOn(User, 'find').mockResolvedValue([]);
    vi.spyOn(Bitacora, 'findOne').mockResolvedValue(null);
    vi.spyOn(Notification, 'findOne').mockResolvedValue(null);

    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });

    const result = await ejecutarEscaneoBitacoras();

    // Debe enviar alerta de vencimiento (1 alerta)
    expect(result.alertasVencimientoEnviadas).toBe(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockApprentice._id,
        mensaje: expect.stringContaining('vence'),
        tipo: 'ALERTA_BITACORA'
      })
    );
  });

  it('debe enviar alerta al coordinador si la entrega está vencida (overdue)', async () => {
    const mockApprentice = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Carlos Aprendiz',
      email: 'carlos@gmail.com',
      role: 'APRENDIZ',
      ficha: '2670687'
    };

    const mockCoordinator = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Ana Coordinadora',
      email: 'ana@gmail.com',
      role: 'ADMIN'
    };

    // La fechaInicio es hace exactamente 15 días.
    // La bitácora 1 vence en 14 días a partir de fechaInicio (es decir, venció hace 1 día).
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() - 31);

    const mockStage = {
      _id: new mongoose.Types.ObjectId(),
      estado: 'EN_CURSO',
      fechaInicio: fechaInicio,
      apprenticeId: mockApprentice
    };

    // Spies/Mocks para evitar llamadas reales a DB
    vi.spyOn(ProductiveStage, 'find').mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockStage])
    });

    vi.spyOn(User, 'find').mockResolvedValue([mockCoordinator]);
    vi.spyOn(Bitacora, 'findOne').mockResolvedValue(null);
    vi.spyOn(Notification, 'findOne').mockResolvedValue(null);

    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });

    const result = await ejecutarEscaneoBitacoras();

    // Debe enviar alerta de retraso (1 alerta)
    expect(result.alertasRetrasoEnviadas).toBe(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockCoordinator._id,
        mensaje: expect.stringContaining('no ha entregado'),
        tipo: 'ALERTA_BITACORA'
      })
    );
  });

  it('no debe enviar duplicados si las alertas ya fueron enviadas anteriormente', async () => {
    const mockApprentice = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Carlos Aprendiz',
      email: 'carlos@gmail.com',
      role: 'APRENDIZ'
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() - 26);

    const mockStage = {
      _id: new mongoose.Types.ObjectId(),
      estado: 'EN_CURSO',
      fechaInicio: fechaInicio,
      apprenticeId: mockApprentice
    };

    // Spies/Mocks para evitar llamadas reales a DB
    vi.spyOn(ProductiveStage, 'find').mockReturnValue({
      populate: vi.fn().mockResolvedValue([mockStage])
    });

    vi.spyOn(User, 'find').mockResolvedValue([]);
    vi.spyOn(Bitacora, 'findOne').mockResolvedValue(null);
    
    // Simular que ya existe una notificación enviada anteriormente
    vi.spyOn(Notification, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

    const createSpy = vi.spyOn(Notification, 'create');

    const result = await ejecutarEscaneoBitacoras();

    // No debe enviar alertas porque ya fueron notificadas
    expect(result.alertasVencimientoEnviadas).toBe(0);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
