// rf-ins-29.test.js
// =============================================
// Tests para RF-INS-29: Historial de acciones del instructor
// =============================================
// Verifica que:
// 1. AuditLog es inalterable y lanza error al intentar modificar/eliminar.
// 2. getMyLogs del servicio y controlador retorna exitosamente las acciones.
// 3. Revisar una bitácora desencadena el registro auditable automático.
// 4. Actualizar el estado de horas desencadena el registro auditable automático.
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const AuditLog = require('../src/modules/system-config-dev1/AuditLog.model');
const usersController = require('../src/modules/users-dev1/users.controller');
const bitacorasController = require('../src/modules/bitacoras-dev3/bitacoras.controller');
const bitacorasService = require('../src/modules/bitacoras-dev3/bitacoras.service');
const hoursController = require('../src/modules/hours-dev3/hours.controller');
const hoursService = require('../src/modules/hours-dev3/hours.service');
const auditUtility = require('../src/core/utils/audit');

describe('RF-INS-29: Historial de acciones del instructor', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.send = vi.fn().mockReturnThis();
    return res;
  };

  describe('1. Inalterabilidad de Logs de Auditoría', () => {
    it('debe registrar y bloquear cualquier actualización o eliminación del log de auditoría', async () => {
      const mockLog = new AuditLog({
        usuario: new mongoose.Types.ObjectId(),
        accion: 'LOGIN',
        detalle: 'Prueba de inalterabilidad'
      });

      // Buscar el middleware bloquearAlteracion en el arreglo de hooks de 'updateOne'
      const nextMock = vi.fn();
      const hooks = AuditLog.schema.s.hooks._pres.get('updateOne') || [];
      const ourHook = hooks.find(h => h.fn && h.fn.toString().includes('Los logs de auditoría son inalterables'));
      
      expect(ourHook).toBeDefined();
      const middleware = ourHook.fn;

      middleware.call({}, nextMock);
      expect(nextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Los logs de auditoría son inalterables y no pueden ser modificados o eliminados.'
        })
      );
    });
  });

  describe('2. Endpoint y Controlador getMyLogs', () => {
    it('debe retornar exitosamente el listado de auditoría del instructor actual', async () => {
      const instructorId = new mongoose.Types.ObjectId();
      const mockLogs = [
        { _id: new mongoose.Types.ObjectId(), usuario: instructorId, accion: 'LOGIN', createdAt: new Date() },
        { _id: new mongoose.Types.ObjectId(), usuario: instructorId, accion: 'REVISAR_BITACORA', createdAt: new Date() }
      ];

      vi.spyOn(AuditLog, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockLogs)
      });

      const req = { user: { _id: instructorId } };
      const res = mockResponse();

      await usersController.getMyLogs(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs
      });
    });
  });

  describe('3. Registro Automático al Revisar Bitácora', () => {
    it('debe registrar auditoría al momento de evaluar y revisar una bitácora', async () => {
      const instructorId = new mongoose.Types.ObjectId();
      const bitacoraId = new mongoose.Types.ObjectId();
      
      vi.spyOn(bitacorasService, 'revisar').mockResolvedValue({
        _id: bitacoraId,
        estado: 'APROBADA'
      });

      const spyAudit = vi.spyOn(auditUtility, 'registrarAuditoria').mockResolvedValue(true);

      const req = {
        user: { _id: instructorId, name: 'Instructor Carlos' },
        params: { id: bitacoraId },
        body: { estado: 'APROBADA' },
        ip: '127.0.0.1'
      };
      const res = mockResponse();

      await bitacorasController.revisar(req, res);

      expect(spyAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: instructorId,
          accion: 'REVISAR_BITACORA',
          entidad: 'Bitacora',
          entidadId: bitacoraId,
          detalle: expect.stringContaining('Instructor Carlos revisó la bitácora asignándole el estado APROBADA'),
          ip: '127.0.0.1'
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ _id: bitacoraId, estado: 'APROBADA' })
      });
    });
  });

  describe('4. Registro Automático al Actualizar Estado de Horas', () => {
    it('debe registrar auditoría al momento de modificar el estado de horas adicionales', async () => {
      const instructorId = new mongoose.Types.ObjectId();
      const hourId = new mongoose.Types.ObjectId();

      vi.spyOn(hoursService, 'actualizarEstado').mockResolvedValue({
        _id: hourId,
        ejecutado: true,
        cobrado: false,
        pendiente: true
      });

      const spyAudit = vi.spyOn(auditUtility, 'registrarAuditoria').mockResolvedValue(true);

      const req = {
        user: { _id: instructorId, name: 'Instructor Carlos' },
        params: { id: hourId },
        body: { ejecutado: true, cobrado: false, pendiente: true },
        ip: '127.0.0.1'
      };
      const res = mockResponse();

      await hoursController.actualizarEstado(req, res);

      expect(spyAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: instructorId,
          accion: 'ACTUALIZAR_ESTADO_HORA',
          entidad: 'Hour',
          entidadId: hourId,
          detalle: expect.stringContaining('Instructor Carlos actualizó el estado del registro de horas a: ejecutado=true, cobrado=false, pendiente=true'),
          ip: '127.0.0.1'
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ _id: hourId, ejecutado: true })
      });
    });
  });
});
