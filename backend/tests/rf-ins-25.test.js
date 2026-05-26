import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const Hour = require('../src/modules/hours-dev3/hour.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const hoursService = require('../src/modules/hours-dev3/hours.service');

describe('RF-INS-25: Manejo de múltiples modalidades de horas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registro y Validación por Tipo de Hora', () => {
    it('debe permitir registrar horas válidas para la modalidad REGULAR y PASANTIA (máximo 8 horas)', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      const mockHour = {
        _id: new mongoose.Types.ObjectId(),
        horasTrabajadas: 8,
        tipo: 'PASANTIA'
      };

      vi.spyOn(Hour, 'create').mockResolvedValue(mockHour);

      const result = await hoursService.registrar({
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasTrabajadas: 8,
        tipo: 'PASANTIA',
        horaEntrada: '08:00',
        horaSalida: '16:00'
      });

      expect(result.tipo).toBe('PASANTIA');
      expect(result.horasTrabajadas).toBe(8);
    });

    it('debe arrojar un error al registrar horas mayores a 8 en modalidad REGULAR', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      await expect(
        hoursService.registrar({
          stageId: mockStageId,
          apprenticeId: mockApprenticeId,
          horasTrabajadas: 9,
          tipo: 'REGULAR',
          horaEntrada: '08:00',
          horaSalida: '17:00'
        })
      ).rejects.toThrow('Las horas trabajadas para la modalidad REGULAR no pueden superar las 8 horas diarias.');
    });

    it('debe permitir registrar hasta 10 horas en la modalidad PROYECTO', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      const mockHour = {
        _id: new mongoose.Types.ObjectId(),
        horasTrabajadas: 10,
        tipo: 'PROYECTO'
      };

      vi.spyOn(Hour, 'create').mockResolvedValue(mockHour);

      const result = await hoursService.registrar({
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasTrabajadas: 10,
        tipo: 'PROYECTO',
        horaEntrada: '08:00',
        horaSalida: '18:00'
      });

      expect(result.tipo).toBe('PROYECTO');
      expect(result.horasTrabajadas).toBe(10);
    });

    it('debe arrojar un error si se exceden las 10 horas en la modalidad PROYECTO', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      await expect(
        hoursService.registrar({
          stageId: mockStageId,
          apprenticeId: mockApprenticeId,
          horasTrabajadas: 11,
          tipo: 'PROYECTO',
          horaEntrada: '08:00',
          horaSalida: '19:00'
        })
      ).rejects.toThrow('Las horas trabajadas para la modalidad PROYECTO no pueden superar las 10 horas diarias.');
    });

    it('debe permitir registrar hasta 12 horas en la modalidad BRIGADA', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      const mockHour = {
        _id: new mongoose.Types.ObjectId(),
        horasTrabajadas: 12,
        tipo: 'BRIGADA'
      };

      vi.spyOn(Hour, 'create').mockResolvedValue(mockHour);

      const result = await hoursService.registrar({
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasTrabajadas: 12,
        tipo: 'BRIGADA',
        horaEntrada: '08:00',
        horaSalida: '20:00'
      });

      expect(result.tipo).toBe('BRIGADA');
      expect(result.horasTrabajadas).toBe(12);
    });

    it('debe arrojar un error si se exceden las 12 horas en la modalidad BRIGADA', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      await expect(
        hoursService.registrar({
          stageId: mockStageId,
          apprenticeId: mockApprenticeId,
          horasTrabajadas: 13,
          tipo: 'BRIGADA',
          horaEntrada: '08:00',
          horaSalida: '21:00'
        })
      ).rejects.toThrow('Las horas trabajadas para la modalidad BRIGADA no pueden superar las 12 horas diarias.');
    });

    it('debe arrojar un error si el tipo de hora no es válido', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        estado: 'EN_CURSO'
      });

      await expect(
        hoursService.registrar({
          stageId: mockStageId,
          apprenticeId: mockApprenticeId,
          horasTrabajadas: 5,
          tipo: 'INVALID_TYPE',
          horaEntrada: '08:00',
          horaSalida: '13:00'
        })
      ).rejects.toThrow('El tipo de hora "INVALID_TYPE" no es válido.');
    });
  });

  describe('Consolidación de Horas en getResumen', () => {
    it('debe consolidar de manera correcta los subtotales de horas por tipo', async () => {
      const mockStageId = new mongoose.Types.ObjectId();

      const mockHoursList = [
        { horasTrabajadas: 8, tipo: 'REGULAR' },
        { horasTrabajadas: 8, tipo: 'REGULAR' },
        { horasTrabajadas: 10, tipo: 'PROYECTO' },
        { horasTrabajadas: 12, tipo: 'BRIGADA' },
        { horasTrabajadas: 6, tipo: 'PASANTIA' },
        { horasTrabajadas: 4, tipo: null } // Fallback a REGULAR
      ];

      vi.spyOn(Hour, 'find').mockResolvedValue(mockHoursList);
      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue({
        _id: mockStageId,
        horasRequeridas: 880,
        horasCompletadas: 48
      });

      const result = await hoursService.getResumen(mockStageId);

      expect(result).toBeDefined();
      expect(result.totalHoras).toBe(48); // 8+8+10+12+6+4
      expect(result.consolidadas.REGULAR).toBe(20); // 8 + 8 + 4
      expect(result.consolidadas.PROYECTO).toBe(10);
      expect(result.consolidadas.BRIGADA).toBe(12);
      expect(result.consolidadas.PASANTIA).toBe(6);
    });
  });
});
