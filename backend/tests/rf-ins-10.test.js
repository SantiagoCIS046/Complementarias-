import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Mock de modelos y dependencias
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Tracking = require('../src/modules/trackings-dev3/tracking.model');
const User = require('../src/modules/users-dev1/user.model');
const Batch = require('../src/modules/batches-dev1/batch.model');
const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
const stageService = require('../src/modules/productive-stages-dev2/productive-stages.service');
const Hour = require('../src/modules/hours-dev3/hour.model');

describe('RF-INS-10: Gestión de seguimientos extraordinarios (Previa autorización de Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tracking, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });
    vi.spyOn(Hour, 'create').mockImplementation(async (data) => {
      return { _id: new mongoose.Types.ObjectId(), ...data };
    });
  });

  it('debe impedir registrar una visita extraordinaria si el administrador no ha autorizado la etapa productiva', async () => {
    const mockStageId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();

    const mockStage = { 
      _id: mockStageId, 
      apprenticeId: mockApprenticeId,
      extraordinaryTrackingAuthorized: false // Sin autorización
    };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
    const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' };

    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);

    await expect(
      trackingsService.crear({
        stageId: mockStageId,
        instructorId: new mongoose.Types.ObjectId(),
        numeroVisita: 4,
        observaciones: 'Visita de seguimiento extraordinaria sin autorización',
        esExtraordinario: true
      })
    ).rejects.toThrow('No está autorizado a registrar seguimientos extraordinarios');
  });

  it('debe autorizar correctamente la EP para seguimientos extraordinarios mediante el servicio', async () => {
    const mockStageId = new mongoose.Types.ObjectId();
    const mockStage = { 
      _id: mockStageId, 
      extraordinaryTrackingAuthorized: false,
      save: vi.fn().mockImplementation(function() {
        this.extraordinaryTrackingAuthorized = true;
        return Promise.resolve(this);
      })
    };

    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);

    const updatedStage = await stageService.authorizeExtraordinary(mockStageId, true);
    
    expect(mockStage.save).toHaveBeenCalled();
    expect(updatedStage.extraordinaryTrackingAuthorized).toBe(true);
  });

  it('debe permitir registrar una visita extraordinaria si el administrador autorizó la etapa productiva, omitiendo cuotas normales', async () => {
    const mockStageId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();

    const mockStage = { 
      _id: mockStageId, 
      apprenticeId: mockApprenticeId,
      extraordinaryTrackingAuthorized: true // Autorizado por Admin
    };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '12345' };
    const mockBatch = { codigo_ficha: '12345', nivel_formacion: 'Tecnólogo' }; // max standard: 3

    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);
    vi.spyOn(Tracking, 'findOne').mockResolvedValue(null); // No duplicado en número de visita
    
    // Simular que ya existen 3 seguimientos estándar en DB
    vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(3);

    // Crear visita #4 (mayor a la cuota normal de 3)
    const newTracking = await trackingsService.crear({
      stageId: mockStageId,
      instructorId: new mongoose.Types.ObjectId(),
      numeroVisita: 4,
      observaciones: 'Visita extraordinaria de seguimiento autorizada',
      esExtraordinario: true
    });

    expect(newTracking).toBeDefined();
    expect(newTracking.esExtraordinario).toBe(true);
    expect(newTracking.numeroVisita).toBe(4);
  });

  it('debe validar que los seguimientos extraordinarios no restrinjan la creación de seguimientos estándar dentro de su cuota', async () => {
    const mockStageId = new mongoose.Types.ObjectId();
    const mockApprenticeId = new mongoose.Types.ObjectId();

    const mockStage = { 
      _id: mockStageId, 
      apprenticeId: mockApprenticeId,
      extraordinaryTrackingAuthorized: true 
    };
    const mockApprentice = { _id: mockApprenticeId, name: 'Carlos Aprendiz', ficha: '54321' };
    const mockBatch = { codigo_ficha: '54321', nivel_formacion: 'Operario' }; // max standard: 2

    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    vi.spyOn(Batch, 'findOne').mockResolvedValue(mockBatch);
    vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);

    // Simular que hay 2 seguimientos en DB, pero uno de ellos es extraordinario (quedando 1 estándar libre de los 2 permitidos)
    vi.spyOn(Tracking, 'countDocuments').mockImplementation(async (query) => {
      if (query.esExtraordinario && query.esExtraordinario.$ne === true) {
        return 1; // Solo 1 estándar
      }
      return 2; // Total 2
    });

    // Intentar crear la visita #2 como estándar. Debe ser permitida porque la cuota es 2 y solo hay 1 estándar.
    const standardTracking = await trackingsService.crear({
      stageId: mockStageId,
      instructorId: new mongoose.Types.ObjectId(),
      numeroVisita: 2,
      observaciones: 'Visita estándar #2 de prueba',
      esExtraordinario: false
    });

    expect(standardTracking).toBeDefined();
    expect(standardTracking.esExtraordinario).toBe(false);
    expect(standardTracking.numeroVisita).toBe(2);
  });
});
