import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const User = require('../src/modules/users-dev1/user.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Notification = require('../src/modules/system-config-dev1/Notification.model');
const Company = require('../src/modules/companies-dev2/company.model');

// Mock de mailer
vi.mock('../src/core/utils/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue(true)
}));

const { enviarNotificacionAsignacion } = require('../src/core/utils/notifications');

describe('RF-INS-04: Notificaciones de reasignación con motivos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe registrar el motivo de reasignación en la alerta interna e email de enviarNotificacionAsignacion', async () => {
    const mockApprentice = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Juan Mancilla',
      documento: '1037000111',
      email: 'mancilla@gmail.com',
      role: 'APRENDIZ'
    };

    const mockInstructor = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Elena Rodríguez',
      email: 'elena@gmail.com',
      role: 'INSTRUCTOR'
    };

    // Spies para evitar llamadas reales a DB
    vi.spyOn(User.prototype, 'save').mockImplementation(function() {
      return Promise.resolve(this);
    });
    vi.spyOn(ProductiveStage.prototype, 'save').mockImplementation(function() {
      return Promise.resolve(this);
    });
    vi.spyOn(Notification.prototype, 'save').mockImplementation(function() {
      return Promise.resolve(this);
    });

    vi.spyOn(User, 'findById').mockImplementation(async (id) => {
      if (id.toString() === mockApprentice._id.toString()) return mockApprentice;
      if (id.toString() === mockInstructor._id.toString()) return mockInstructor;
      return null;
    });

    // Mockear findOne para retornar un objeto con populate
    vi.spyOn(ProductiveStage, 'findOne').mockReturnValue({
      populate: vi.fn().mockResolvedValue(null)
    });

    vi.spyOn(Company, 'findOne').mockResolvedValue(null);

    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });

    const motivo = 'Fin de contrato del tutor anterior';
    await enviarNotificacionAsignacion(mockApprentice._id, mockInstructor._id, motivo);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: mockInstructor._id,
        mensaje: expect.stringContaining(motivo),
        tipo: 'INFO'
      })
    );
  });
});
