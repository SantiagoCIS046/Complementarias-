// rf-ins-27.test.js
// =============================================
// Tests para RF-INS-27: Control de Horas Mediante Checkboxes
// =============================================
// Verifica que:
// 1. Marcar solo "ejecutado" actualiza ejecutado=true y horasTrabajadas=2.0.
// 2. Marcar "cobrado" sin haber ejecutado lanza error.
// 3. Marcar "cobrado" con ejecutado previo cierra el registro (pendiente=false).
// 4. Un registro cerrado lanza error al intentar modificar.
// 5. Los totales del histórico de pagos se recalculan correctamente.
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const hoursService = require('../src/modules/hours-dev3/hours.service');
const Hour         = require('../src/modules/hours-dev3/hour.model');

describe('RF-INS-27: Control de Horas Mediante Checkboxes', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Marcar Ejecutado', () => {
    it('debe permitir marcar ejecutado = true, lo cual actualiza ejecutado=true y horasTrabajadas=2.0', async () => {
      const hourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: hourId,
        ejecutado: false,
        cobrado: false,
        pendiente: true,
        horasTrabajadas: 0.0,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      const result = await hoursService.actualizarEstado(hourId, { ejecutado: true });

      expect(result.ejecutado).toBe(true);
      expect(result.horasTrabajadas).toBe(2.0);
      expect(result.cobrado).toBe(false);
      expect(result.pendiente).toBe(true);
      expect(mockHour.save).toHaveBeenCalled();
    });
  });

  describe('2. Marcar Cobrado sin Ejecutar', () => {
    it('debe lanzar error al intentar cobrar un registro de horas que no ha sido ejecutado', async () => {
      const hourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: hourId,
        ejecutado: false,
        cobrado: false,
        pendiente: true,
        horasTrabajadas: 0.0,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      await expect(
        hoursService.actualizarEstado(hourId, { cobrado: true })
      ).rejects.toThrow('No se puede cobrar un registro de horas que no ha sido ejecutado.');
    });
  });

  describe('3. Marcar Cobrado con Ejecutado Previo', () => {
    it('debe permitir cobrar si el registro ya está ejecutado, cerrando el registro (pendiente=false)', async () => {
      const hourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: hourId,
        ejecutado: true,
        cobrado: false,
        pendiente: true,
        horasTrabajadas: 2.0,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      const result = await hoursService.actualizarEstado(hourId, { cobrado: true });

      expect(result.cobrado).toBe(true);
      expect(result.pendiente).toBe(false);
      expect(result.horasTrabajadas).toBe(2.0);
      expect(mockHour.save).toHaveBeenCalled();
    });
  });

  describe('4. Registro Cerrado', () => {
    it('debe lanzar error al intentar modificar un registro de horas que ya está cerrado (pendiente=false)', async () => {
      const hourId = new mongoose.Types.ObjectId();
      const mockHour = {
        _id: hourId,
        ejecutado: true,
        cobrado: true,
        pendiente: false,
        horasTrabajadas: 2.0,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      await expect(
        hoursService.actualizarEstado(hourId, { ejecutado: false })
      ).rejects.toThrow('Este registro de horas ya está cerrado (Ejecutada/Cobrada) y no puede modificarse.');
    });

    it('debe lanzar error de doble cobro si el registro ya ha sido cobrado', async () => {
      const hourId = new mongoose.Types.ObjectId();
      // Si el registro ya fue cobrado pero por algún motivo pendiente es true, debe lanzar error de doble cobro
      const mockHour = {
        _id: hourId,
        ejecutado: true,
        cobrado: true,
        pendiente: true,
        horasTrabajadas: 2.0,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

      await expect(
        hoursService.actualizarEstado(hourId, { cobrado: true })
      ).rejects.toThrow('Este registro de horas ya ha sido cobrado.');
    });
  });

  describe('5. Recálculo de Totales en Histórico de Pagos', () => {
    it('debe calcular correctamente los totales cobrados y pendientes del histórico agrupado', async () => {
      const instructorId = new mongoose.Types.ObjectId();

      const mockHoras = [
        {
          _id: new mongoose.Types.ObjectId(),
          fecha: new Date('2026-05-10T10:00:00Z'),
          ejecutado: true,
          cobrado: true,
          pendiente: false,
          horasTrabajadas: 2.0,
          apprenticeId: { name: 'Juan Aprendiz', documento: '12345', ficha: 'F123' },
          stageId: { radicado: 'R123', estado: 'EN_CURSO' },
          trackingId: { numeroVisita: 1, instructorId }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          fecha: new Date('2026-05-12T10:00:00Z'),
          ejecutado: true,
          cobrado: false,
          pendiente: true,
          horasTrabajadas: 2.0,
          apprenticeId: { name: 'Pedro Aprendiz', documento: '67890', ficha: 'F123' },
          stageId: { radicado: 'R123', estado: 'EN_CURSO' },
          trackingId: { numeroVisita: 2, instructorId }
        }
      ];

      // Mocking del find y encadenamiento de populate/sort
      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockHoras)
      };

      vi.spyOn(Hour, 'find').mockReturnValue(mockFind);

      const result = await hoursService.obtenerHistoricoPagos({
        userId: instructorId,
        userRole: 'ADMIN'
      });

      expect(result.resumenGlobal.totalCobrado).toBe(2);      // 1 cobrada * 2 horas
      expect(result.resumenGlobal.totalPendiente).toBe(2);    // 1 pendiente * 2 horas
      expect(result.resumenGlobal.visitasEjecutadas).toBe(2);

      expect(result.meses).toHaveLength(1);
      const mesData = result.meses[0];
      expect(mesData.cobradasCount).toBe(1);
      expect(mesData.pendientesCount).toBe(1);
      expect(mesData.totalHorasCobradas).toBe(2);
      expect(mesData.totalHorasPendientes).toBe(2);
      expect(mesData.detalles).toHaveLength(2);
    });
  });
});
