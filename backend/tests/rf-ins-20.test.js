import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar modelos y servicios
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const User = require('../src/modules/users-dev1/user.model');
const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
const Tracking = require('../src/modules/trackings-dev3/tracking.model');

const productiveStagesService = require('../src/modules/productive-stages-dev2/productive-stages.service');
const bitacorasService = require('../src/modules/bitacoras-dev3/bitacoras.service');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');

describe('RF-INS-20: Consulta de información detallada de aprendices a cargo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Consulta de lista de aprendices asignados', () => {
    it('debe filtrar las etapas productivas (aprendices) por el instructor asignado', async () => {
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockApprentice1Id = new mongoose.Types.ObjectId();
      const mockApprentice2Id = new mongoose.Types.ObjectId();

      const mockApprentices = [
        { _id: mockApprentice1Id, name: 'Andrés López', role: 'APRENDIZ', instructorAsignado: mockInstructorId },
        { _id: mockApprentice2Id, name: 'Beatriz Gómez', role: 'APRENDIZ', instructorAsignado: mockInstructorId }
      ];

      const mockStages = [
        {
          _id: new mongoose.Types.ObjectId(),
          apprenticeId: mockApprentices[0],
          companyId: { razonSocial: 'Empresa A', nit: '111-222' },
          modalidad: 'CONTRATO_APRENDIZAJE',
          estado: 'EN_CURSO',
          horasCompletadas: 80,
          horasRequeridas: 864,
          toObject: function() { return this; }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          apprenticeId: mockApprentices[1],
          companyId: { razonSocial: 'Empresa B', nit: '333-444' },
          modalidad: 'PASANTÍA',
          estado: 'EN_CURSO',
          horasCompletadas: 160,
          horasRequeridas: 864,
          toObject: function() { return this; }
        }
      ];

      // Mocks de Base de Datos
      vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockApprentices)
      });

      vi.spyOn(ProductiveStage, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockStages)
      });

      const result = await productiveStagesService.getAll({ instructorId: mockInstructorId });

      expect(result).toHaveLength(2);
      expect(result[0].apprenticeId.name).toBe('Andrés López');
      expect(result[0].modalidad).toBe('CONTRATO_APRENDIZAJE');
      expect(result[1].apprenticeId.name).toBe('Beatriz Gómez');
      expect(result[1].modalidad).toBe('PASANTÍA');
      expect(User.find).toHaveBeenCalledWith({
        instructorAsignado: mockInstructorId,
        role: 'APRENDIZ'
      });
    });
  });

  describe('Consulta de información detallada de Etapa Productiva (EP)', () => {
    it('debe recuperar los detalles completos de una etapa productiva específica por ID', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockApprentice = { _id: new mongoose.Types.ObjectId(), name: 'Carlos Mario', email: 'carlos@sena.edu.co' };
      const mockCompany = { _id: new mongoose.Types.ObjectId(), razonSocial: 'Empresa C', nit: '999-888', jefeInmediato: 'Ing. Supervisor' };

      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprentice,
        companyId: mockCompany,
        modalidad: 'VÍNCULO_LABORAL',
        estado: 'EN_CURSO',
        horasCompletadas: 120,
        horasRequeridas: 864,
        historialEstados: [],
        toObject: function() { return this; }
      };

      const mockQuery = {
        populate: vi.fn(),
        then: vi.fn()
      };
      mockQuery.populate.mockReturnValue(mockQuery);
      mockQuery.then.mockImplementation((resolve) => resolve(mockStage));

      vi.spyOn(ProductiveStage, 'findById').mockReturnValue(mockQuery);

      const Document = require('../src/modules/documents-dev2/document.model');
      const mockDocQuery = {
        populate: vi.fn(),
        then: vi.fn()
      };
      mockDocQuery.populate.mockReturnValue(mockDocQuery);
      mockDocQuery.then.mockImplementation((resolve) => resolve([]));

      vi.spyOn(Document, 'find').mockReturnValue(mockDocQuery);

      const result = await productiveStagesService.getById(mockStageId);

      expect(result.stage).toBeDefined();
      expect(result.stage._id).toBe(mockStageId);
      expect(result.stage.modalidad).toBe('VÍNCULO_LABORAL');
      expect(result.stage.apprenticeId.name).toBe('Carlos Mario');
      expect(result.stage.companyId.razonSocial).toBe('Empresa C');
    });
  });

  describe('Historial completo de Bitácoras del Aprendiz', () => {
    it('debe listar todas las bitácoras ordenadas cronológicamente para una etapa productiva', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockBitacoras = [
        { _id: new mongoose.Types.ObjectId(), stageId: mockStageId, semana: 2, horasReportadas: 40, estado: 'APROBADA' },
        { _id: new mongoose.Types.ObjectId(), stageId: mockStageId, semana: 4, horasReportadas: 40, estado: 'PENDIENTE' }
      ];

      vi.spyOn(Bitacora, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockBitacoras)
      });

      const result = await bitacorasService.getByStage(mockStageId);

      expect(result).toHaveLength(2);
      expect(result[0].semana).toBe(2);
      expect(result[0].estado).toBe('APROBADA');
      expect(result[1].semana).toBe(4);
      expect(result[1].estado).toBe('PENDIENTE');
    });
  });

  describe('Historial de Seguimientos/Visitas Técnicas del Aprendiz', () => {
    it('debe listar todas las visitas técnicas registradas asociadas al aprendiz', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockTrackings = [
        { _id: new mongoose.Types.ObjectId(), stageId: mockStageId, numeroVisita: 1, lugarVisita: 'Virtual Teams', calificacion: 'EXCELENTE' },
        { _id: new mongoose.Types.ObjectId(), stageId: mockStageId, numeroVisita: 2, lugarVisita: 'Presencial Oficina', calificacion: 'BUENO' }
      ];

      vi.spyOn(Tracking, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockTrackings)
      });

      const result = await trackingsService.getAll({ stageId: mockStageId });

      expect(result).toHaveLength(2);
      expect(result[0].numeroVisita).toBe(1);
      expect(result[0].lugarVisita).toBe('Virtual Teams');
      expect(result[1].numeroVisita).toBe(2);
      expect(result[1].lugarVisita).toBe('Presencial Oficina');
    });
  });
});
