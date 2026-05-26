import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const Hour = require('../src/modules/hours-dev3/hour.model');
const hoursService = require('../src/modules/hours-dev3/hours.service');

describe('RF-INS-19: Cálculo automático de horas y prevención de doble cobro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe asignar automáticamente 2 horas de trabajo cuando se marca una tarea como ejecutada', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: false,
      cobrado: false,
      pendiente: true,
      horasTrabajadas: 0,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    const result = await hoursService.actualizarEstado(mockHourId, { ejecutado: true });
    
    expect(result.ejecutado).toBe(true);
    expect(result.horasTrabajadas).toBe(2.0);
    expect(mockHour.save).toHaveBeenCalled();
  });

  it('debe restablecer a 0 horas de trabajo cuando una tarea se desmarca como ejecutada', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: true,
      cobrado: false,
      pendiente: true,
      horasTrabajadas: 2.0,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    const result = await hoursService.actualizarEstado(mockHourId, { ejecutado: false });
    
    expect(result.ejecutado).toBe(false);
    expect(result.horasTrabajadas).toBe(0.0);
    expect(mockHour.save).toHaveBeenCalled();
  });

  it('debe impedir cobrar (cobrado=true) un registro de horas que no ha sido ejecutado', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: false,
      cobrado: false,
      pendiente: true,
      horasTrabajadas: 0,
      save: vi.fn()
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    await expect(
      hoursService.actualizarEstado(mockHourId, { cobrado: true })
    ).rejects.toThrow('No se puede cobrar un registro de horas que no ha sido ejecutado');
  });

  it('debe permitir cobrar un registro de horas que ya está ejecutado', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: true,
      cobrado: false,
      pendiente: true,
      horasTrabajadas: 2.0,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    const result = await hoursService.actualizarEstado(mockHourId, { cobrado: true });

    expect(result.cobrado).toBe(true);
    expect(result.pendiente).toBe(false); // Se cierra el registro automáticamente
    expect(result.horasTrabajadas).toBe(2.0);
    expect(mockHour.save).toHaveBeenCalled();
  });

  it('debe permitir cobrar un registro ejecutando y cobrando simultáneamente', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: false,
      cobrado: false,
      pendiente: true,
      horasTrabajadas: 0,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    const result = await hoursService.actualizarEstado(mockHourId, { ejecutado: true, cobrado: true });

    expect(result.ejecutado).toBe(true);
    expect(result.cobrado).toBe(true);
    expect(result.pendiente).toBe(false);
    expect(result.horasTrabajadas).toBe(2.0);
    expect(mockHour.save).toHaveBeenCalled();
  });

  it('debe impedir el doble cobro si el registro ya está cobrado', async () => {
    const mockHourId = new mongoose.Types.ObjectId();
    const mockHour = {
      _id: mockHourId,
      ejecutado: true,
      cobrado: true,
      pendiente: true, // simulamos abierto pero cobrado para probar la validación de cobrado
      horasTrabajadas: 2.0,
      save: vi.fn()
    };

    vi.spyOn(Hour, 'findById').mockResolvedValue(mockHour);

    await expect(
      hoursService.actualizarEstado(mockHourId, { cobrado: true })
    ).rejects.toThrow('Este registro de horas ya ha sido cobrado');
  });
});
