import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Mock de modelos y dependencias
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Tracking = require('../src/modules/trackings-dev3/tracking.model');
const User = require('../src/modules/users-dev1/user.model');
const Batch = require('../src/modules/batches-dev1/batch.model');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');

describe('RF-INS-08: Gestión de seguimientos obligatorios (Cuotas e IA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Lógica de Cuotas Dinámicas por Nivel Académico', () => {
    it('debe permitir un máximo de 3 seguimientos para nivel Tecnólogo', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = { _id: mockStageId, apprenticeId: mockApprenticeId };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
      const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockImplementation(async (query) => {
        if (query.codigo_ficha === '12345') return mockBatch;
        return null;
      });

      const cupo = await trackingsService.obtenerCupoSeguimientos(mockStageId);
      expect(cupo.maxSeguimientos).toBe(3);
      expect(cupo.nivelFormacion).toBe('Tecnólogo');
    });

    it('debe permitir un máximo de 2 seguimientos para nivel Operario', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = { _id: mockStageId, apprenticeId: mockApprenticeId };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '54321' };
      const mockBatch = { codigo_ficha: '54321', nivel_formacion: 'Operario' };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockImplementation(async (query) => {
        if (query.codigo_ficha === '54321') return mockBatch;
        return null;
      });

      const cupo = await trackingsService.obtenerCupoSeguimientos(mockStageId);
      expect(cupo.maxSeguimientos).toBe(2);
      expect(cupo.nivelFormacion).toBe('Operario');
    });

    it('debe impedir crear una visita con número superior al permitido por su cuota', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = { _id: mockStageId, apprenticeId: mockApprenticeId };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '54321' };
      const mockBatch = { codigo_ficha: '54321', nivel_formacion: 'Operario' }; // max 2

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);

      // Intentar crear la visita #3 para un Operario
      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          instructorId: new mongoose.Types.ObjectId(),
          numeroVisita: 3,
          observaciones: 'Visita de prueba superior al cupo',
        })
      ).rejects.toThrow('solo requiere 2 seguimientos');
    });

    it('debe impedir crear una visita si ya se alcanzó el límite máximo del cupo', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = { _id: mockStageId, apprenticeId: mockApprenticeId };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
      const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' }; // max 3

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);

      // Simular que ya hay 3 seguimientos en la base de datos
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(3);
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null); // No duplicado en número de visita

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          instructorId: new mongoose.Types.ObjectId(),
          numeroVisita: 3,
          observaciones: 'Visita de prueba al límite',
        })
      ).rejects.toThrow('Se ha alcanzado el límite máximo de 3 seguimientos');
    });

    it('debe impedir crear una visita con número de visita duplicado', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = { _id: mockStageId, apprenticeId: mockApprenticeId };
      const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
      const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' }; // max 3

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
      vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);

      // Simular que ya hay 1 seguimiento en la base de datos
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(1);
      // Simular que la visita #1 ya existe
      vi.spyOn(Tracking, 'findOne').mockResolvedValue({ numeroVisita: 1 });

      await expect(
        trackingsService.crear({
          stageId: mockStageId,
          instructorId: new mongoose.Types.ObjectId(),
          numeroVisita: 1,
          observaciones: 'Visita duplicada en número',
        })
      ).rejects.toThrow('Ya existe la visita de seguimiento #1');
    });
  });
});
