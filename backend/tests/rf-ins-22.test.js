import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const User = require('../src/modules/users-dev1/user.model');
const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
const SystemConfig = require('../src/modules/system-config-dev1/system-config.model');
const bitacorasService = require('../src/modules/bitacoras-dev3/bitacoras.service');

describe('RF-INS-22: Gestión de bitácoras adicionales (Casos Especiales)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de SystemConfig.findOne para evitar timeouts de MongoDB
    vi.spyOn(SystemConfig, 'findOne').mockResolvedValue(null);
  });

  describe('Creación de Bitácoras Especiales / Adicionales', () => {
    it('debe registrar exitosamente una bitácora especial con motivo, fecha especial y responsable', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockResponsableId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        estado: 'EN_CURSO',
        horasCompletadas: 100,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockBitacora = {
        _id: new mongoose.Types.ObjectId(),
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasReportadas: 20,
        descripcion: 'Bitácora adicional por caso médico',
        esAdicional: true,
        motivo: 'Calamidad de salud con incapacidad de 15 días',
        fechaEspecial: new Date('2026-05-15'),
        responsable: mockResponsableId,
        toObject: function() { return this; }
      };

      // Mock de ProductiveStage
      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);

      // Mock de Bitacora.create
      vi.spyOn(Bitacora, 'create').mockResolvedValue(mockBitacora);

      // Mock de Bitacora.findById para el flujo de populate posterior a la creación
      const mockQueryChain = {
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockBitacora)
      };
      // También simular .then() para cuando Mongoose usa await directamente sobre el query
      mockQueryChain.populate.mockReturnValue(mockQueryChain);
      vi.spyOn(Bitacora, 'findById').mockReturnValue(mockQueryChain);
      mockQueryChain.then = vi.fn().mockImplementation((resolve) => resolve(mockBitacora));

      const result = await bitacorasService.crear({
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasReportadas: 20,
        descripcion: 'Bitácora adicional por caso médico',
        esAdicional: true,
        motivo: 'Calamidad de salud con incapacidad de 15 días',
        fechaEspecial: new Date('2026-05-15'),
        responsable: mockResponsableId
      });

      expect(result).toBeDefined();
      expect(result.esAdicional).toBe(true);
      expect(result.motivo).toBe('Calamidad de salud con incapacidad de 15 días');
      expect(result.fechaEspecial.toISOString()).toBe(new Date('2026-05-15').toISOString());
      expect(result.responsable).toBe(mockResponsableId);
      expect(Bitacora.create).toHaveBeenCalledWith(expect.objectContaining({
        esAdicional: true,
        motivo: 'Calamidad de salud con incapacidad de 15 días',
        fechaEspecial: expect.any(Date),
        responsable: mockResponsableId
      }));
      expect(mockStage.horasCompletadas).toBe(120);
      expect(mockStage.save).toHaveBeenCalled();
    });

    it('debe omitir el límite de MAX_BITACORAS al crear una bitácora adicional', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        estado: 'EN_CURSO',
        horasCompletadas: 200,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockBitacora = {
        _id: new mongoose.Types.ObjectId(),
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasReportadas: 40,
        esAdicional: true,
        toObject: function() { return this; }
      };

      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
      
      // Simular que el conteo de bitácoras normales ya llegó al límite (13 de 13)
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(13);
      vi.spyOn(Bitacora, 'create').mockResolvedValue(mockBitacora);

      const mockQueryChain = {
        populate: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(mockBitacora))
      };
      mockQueryChain.populate.mockReturnValue(mockQueryChain);
      vi.spyOn(Bitacora, 'findById').mockReturnValue(mockQueryChain);

      // Si es adicional, no debe tirar error de límite
      const result = await bitacorasService.crear({
        stageId: mockStageId,
        apprenticeId: mockApprenticeId,
        horasReportadas: 40,
        descripcion: 'Bitácora adicional 14',
        esAdicional: true
      });

      expect(result).toBeDefined();
      expect(result.esAdicional).toBe(true);
      // countDocuments no debe haberse llamado con { stageId } solo, sino que no debió disparar el bloqueo
      expect(Bitacora.create).toHaveBeenCalled();
    });
  });

  describe('Consulta de Bitácoras Pobladas con Responsable', () => {
    it('debe retornar las bitácoras poblando el campo responsable', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockResponsable = { _id: new mongoose.Types.ObjectId(), name: 'Pedro Instructor', email: 'pedro@sena.edu.co' };
      
      const mockBitacoras = [
        {
          _id: new mongoose.Types.ObjectId(),
          stageId: mockStageId,
          esAdicional: true,
          motivo: 'Caso de estudio especial',
          responsable: mockResponsable
        }
      ];

      vi.spyOn(Bitacora, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockBitacoras)
      });

      const result = await bitacorasService.getByStage(mockStageId);

      expect(result).toHaveLength(1);
      expect(result[0].esAdicional).toBe(true);
      expect(result[0].responsable.name).toBe('Pedro Instructor');
      expect(result[0].motivo).toBe('Caso de estudio especial');
    });
  });

  describe('Actualización de Bitácoras Especiales', () => {
    it('debe permitir actualizar motivo, fecha especial y responsable en una bitácora especial', async () => {
      const mockBitacoraId = new mongoose.Types.ObjectId();
      const mockNewResponsableId = new mongoose.Types.ObjectId();

      const mockBitacora = {
        _id: mockBitacoraId,
        stageId: new mongoose.Types.ObjectId(),
        estado: 'PENDIENTE',
        esAdicional: true,
        motivo: 'Motivo viejo',
        fechaEspecial: new Date('2026-05-01'),
        responsable: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Bitacora, 'findById').mockResolvedValue(mockBitacora);

      const mockQueryChain = {
        populate: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(mockBitacora))
      };
      mockQueryChain.populate.mockReturnValue(mockQueryChain);
      vi.spyOn(Bitacora, 'findById').mockImplementation(async (id) => {
        if (id.toString() === mockBitacoraId.toString()) {
          return mockBitacora;
        }
        return null;
      });

      // Mockear segundo findById (para el retorno poblado)
      vi.spyOn(Bitacora, 'findById').mockReturnValue(mockQueryChain);

      const result = await bitacorasService.actualizar(mockBitacoraId, {
        motivo: 'Motivo actualizado por Instructor',
        fechaEspecial: new Date('2026-05-10'),
        responsable: mockNewResponsableId
      });

      expect(mockBitacora.save).toHaveBeenCalled();
      expect(mockBitacora.motivo).toBe('Motivo actualizado por Instructor');
      expect(mockBitacora.fechaEspecial.toISOString()).toBe(new Date('2026-05-10').toISOString());
      expect(mockBitacora.responsable).toBe(mockNewResponsableId);
    });
  });
});
