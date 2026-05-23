// =============================================================================
// Integration & Business Logic Tests: Apprentice Requirements (RF-APR-01 to RF-APR-20)
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Import Mailer first and spy on it immediately
const mailer = require('../src/core/utils/mailer');
vi.spyOn(mailer, 'sendEmail').mockResolvedValue({ success: true, messageId: 'mock-id' });

// Import other models and services
const User            = require('../src/modules/users-dev1/user.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');

// Spy on Mongoose Model Query chains
vi.spyOn(User, 'findOne');
vi.spyOn(User, 'find');
vi.spyOn(User, 'findById');
vi.spyOn(ProductiveStage, 'findOne');
vi.spyOn(ProductiveStage, 'find');

// Helper to mock mongoose chainable query interfaces (.select, .populate, .sort, etc.)
const makeChainableMock = (val) => {
  const query = {
    select: vi.fn().mockImplementation(() => query),
    populate: vi.fn().mockImplementation(() => query),
    sort: vi.fn().mockImplementation(() => query),
    lean: vi.fn().mockImplementation(() => query),
    then: (resolve) => resolve(val)
  };
  return query;
};

// Import Services under test
const authService = require('../src/modules/auth-dev1/auth.service');
const alertsCron  = require('../src/core/utils/alertsCron');

describe('Apprentice Requirements - Authentication, Security & Automated Alerts', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RF-APR-03 & Security Lockout Policy', () => {
    it('Should increment attempts on failed logins and lock for 2 min after 3 failures', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        email: 'aprendiz.bloqueo@sena.edu.co',
        password: 'hashedPassword123',
        loginAttempts: 0,
        lockUntil: null,
        status: 'ACTIVO',
        isFirstLogin: true,
        comparePassword: vi.fn().mockResolvedValue(false), // Simulate wrong password
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      Object.defineProperty(mockUser, 'isLocked', {
        get() {
          return !!(this.lockUntil && this.lockUntil > Date.now());
        }
      });

      // 1. Mock first user query
      User.findOne.mockImplementation(() => makeChainableMock(mockUser));

      // Attempt 1
      await expect(authService.login({ email: mockUser.email, password: 'wrong' }))
        .rejects.toThrow('Credenciales inválidas.');
      expect(mockUser.loginAttempts).toBe(1);
      expect(mockUser.lockUntil).toBeNull();

      // Attempt 2
      await expect(authService.login({ email: mockUser.email, password: 'wrong' }))
        .rejects.toThrow('Credenciales inválidas.');
      expect(mockUser.loginAttempts).toBe(2);
      expect(mockUser.lockUntil).toBeNull();

      // Attempt 3
      await expect(authService.login({ email: mockUser.email, password: 'wrong' }))
        .rejects.toThrow('Cuenta bloqueada temporalmente por 2 minutos tras 3 intentos fallidos.');
      expect(mockUser.loginAttempts).toBe(3);
      expect(mockUser.lockUntil).toBeInstanceOf(Date);
      expect(mockUser.isLocked).toBe(true);

      // Verify that calling login while locked throws the locked out message immediately
      await expect(authService.login({ email: mockUser.email, password: 'correct' }))
        .rejects.toThrow(/Cuenta bloqueada temporalmente por intentos fallidos/);
    });

    it('Should reset loginAttempts on a successful login', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        email: 'aprendiz.exito@sena.edu.co',
        password: 'hashedPassword123',
        loginAttempts: 2,
        lockUntil: null,
        status: 'ACTIVO',
        isFirstLogin: true,
        comparePassword: vi.fn().mockResolvedValue(true), // Correct password
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      Object.defineProperty(mockUser, 'isLocked', {
        get() {
          return !!(this.lockUntil && this.lockUntil > Date.now());
        }
      });

      User.findOne.mockImplementation(() => makeChainableMock(mockUser));

      const res = await authService.login({ email: mockUser.email, password: 'correctPassword' });
      expect(res.usuario.email).toBe(mockUser.email);
      expect(mockUser.loginAttempts).toBe(0);
      expect(mockUser.lockUntil).toBeNull();
    });
  });

  describe('RF-APR-13 & First Login Password Reset Policy', () => {
    it('Should reject new password if it does not meet the robust complexity rules', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      
      // Too short
      await expect(authService.changePassword(mockUserId, 'Short1!'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // No uppercase
      await expect(authService.changePassword(mockUserId, 'nouppercase123!'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // No number
      await expect(authService.changePassword(mockUserId, 'NoNumberHere!'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // No special character
      await expect(authService.changePassword(mockUserId, 'NoSpecialChar123'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);
    });

    it('Should allow password change and toggle isFirstLogin to false when password is robust', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        email: 'aprendiz.clave@sena.edu.co',
        password: 'initialPassword',
        isFirstLogin: true,
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      User.findById.mockImplementation(() => makeChainableMock(mockUser));

      // Valid robust password: 8+ chars, Mayus, minus, number, special char
      const res = await authService.changePassword(mockUserId, 'Sena2026_Rules!');
      expect(res.message).toBe('Contraseña actualizada exitosamente.');
      expect(mockUser.isFirstLogin).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('RF-APR-02 & RF-APR-11 Automated Cron Warnings', () => {
    it('enviarRecordatoriosRegistro should email active apprentices without EP record', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Aprendiz Alerta',
        email: 'aprendiz.alerta@sena.edu.co',
        role: 'APRENDIZ',
        activo: true,
        status: 'ACTIVO',
        fechaFinLectiva: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Finished 5 days ago
        lastRegistrationReminderSent: null,
        save: vi.fn().mockResolvedValue(true)
      };

      // Mock DB return lists
      User.find.mockImplementation(() => Promise.resolve([mockUser]));
      ProductiveStage.findOne.mockImplementation(() => makeChainableMock(null)); // No EP record found

      const report = await alertsCron.enviarRecordatoriosRegistro();
      expect(report.recordatoriosEnviados).toBe(1);
      expect(mailer.sendEmail).toHaveBeenCalled();
      expect(mockUser.lastRegistrationReminderSent).toBeInstanceOf(Date);
    });

    it('enviarAdvertenciasCertificacionDosMeses should email apprentices finishing their EP in <= 2 months', async () => {
      const mockApprentice = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Aprendiz Termino',
        email: 'aprendiz.termino@sena.edu.co',
        lastCronVisitReminderSent: null,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockStage = {
        _id: new mongoose.Types.ObjectId(),
        apprenticeId: mockApprentice,
        fechaProyectadaFin: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Ends in 45 days (less than 60 days)
        estado: 'EN_CURSO'
      };

      ProductiveStage.find.mockImplementation(() => makeChainableMock([mockStage]));

      const report = await alertsCron.enviarAdvertenciasCertificacionDosMeses();
      expect(report.advertenciasEnviadas).toBe(1);
      expect(mailer.sendEmail).toHaveBeenCalled();
      expect(mockApprentice.lastCronVisitReminderSent).toBeInstanceOf(Date);
    });
  });
});
