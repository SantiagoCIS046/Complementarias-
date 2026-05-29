// =============================================================================
// Unit Tests: Profile & Change Password Features for All Sessions
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Import Mailer first and spy on it immediately
const mailer = require('../src/core/utils/mailer');
vi.spyOn(mailer, 'sendEmail').mockResolvedValue({ success: true, messageId: 'mock-id' });

// Import model and spy on it
const User = require('../src/modules/users-dev1/user.model');
vi.spyOn(User, 'findById');
vi.spyOn(User, 'findByIdAndUpdate');

// Helper to mock mongoose chainable query interfaces
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
const usersService = require('../src/modules/users-dev1/users.service');
const authService = require('../src/modules/auth-dev1/auth.service');

describe('Profile and Password Change Features for All Roles', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact Details Update (usersService.actualizar)', () => {
    it('should update email and telefono for a user and strip password from payload', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUserBefore = {
        _id: mockUserId,
        name: 'Carlos Perez',
        email: 'carlos@sena.edu.co',
        telefono: '1234567',
        role: 'INSTRUCTOR',
        tipoInstructor: 'SEGUIMIENTO',
        areaConocimiento: 'Sistemas',
        activo: true,
        status: 'ACTIVO'
      };

      const updatePayload = {
        email: 'carlos_new@sena.edu.co',
        telefono: '7654321',
        password: 'MaliciousPassword123!' // This should be stripped out
      };

      const mockUserAfter = {
        ...mockUserBefore,
        email: updatePayload.email,
        telefono: updatePayload.telefono
      };

      User.findById.mockImplementation(() => makeChainableMock(mockUserBefore));
      User.findByIdAndUpdate.mockImplementation(() => makeChainableMock(mockUserAfter));

      const result = await usersService.actualizar(mockUserId, updatePayload);

      // Verify password was deleted from target payload
      expect(updatePayload.password).toBeUndefined();

      // Verify findByIdAndUpdate was called with correct data
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          email: 'carlos_new@sena.edu.co',
          telefono: '7654321'
        }),
        expect.any(Object)
      );

      expect(result.email).toBe('carlos_new@sena.edu.co');
      expect(result.telefono).toBe('7654321');
    });

    it('should preserve instructor-specific fields (tipoInstructor, areaConocimiento)', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: 'Martin Pérez',
        email: 'martin@gmail.com',
        role: 'INSTRUCTOR',
        tipoInstructor: 'SEGUIMIENTO',
        areaConocimiento: 'Desarrollo de Software / ADSO',
        activo: true,
        status: 'ACTIVO'
      };

      User.findById.mockImplementation(() => makeChainableMock(mockUser));
      User.findByIdAndUpdate.mockImplementation(() => makeChainableMock(mockUser));

      const result = await usersService.actualizar(mockUserId, {
        email: 'martin_updated@gmail.com'
      });

      expect(result.tipoInstructor).toBe('SEGUIMIENTO');
      expect(result.areaConocimiento).toBe('Desarrollo de Software / ADSO');
    });
  });

  describe('Change Password Enforcement (authService.changePassword)', () => {
    it('should enforce complexity requirements for admins, instructors, and apprentices alike', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockAdmin = {
        _id: mockUserId,
        role: 'ADMIN',
        save: vi.fn().mockImplementation(function() { return Promise.resolve(this); })
      };

      User.findById.mockImplementation(() => makeChainableMock(mockAdmin));

      // Rejects too short
      await expect(authService.changePassword(mockUserId, 'Ab1!'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // Rejects no uppercase
      await expect(authService.changePassword(mockUserId, 'lowercase123!'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // Rejects no special characters
      await expect(authService.changePassword(mockUserId, 'UppercaseNumber123'))
        .rejects.toThrow(/La contraseña debe tener al menos 8 caracteres/);

      // Accepts strong password
      const response = await authService.changePassword(mockUserId, 'Sena2026_Robust!');
      expect(response.message).toBe('Contraseña actualizada exitosamente.');
      expect(mockAdmin.save).toHaveBeenCalled();
    });
  });
});
