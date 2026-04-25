// =============================================
// Integration Test: Dev 1 (Auth) + Dev 2 (EP)
// =============================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importamos los modelos antes de mockearlos para tener las referencias
const User            = require('../src/modules/users-dev1/user.model');
const Company         = require('../src/modules/companies-dev2/company.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Document        = require('../src/modules/documents-dev2/document.model');

// Mockear los métodos de Mongoose
vi.mock('../src/modules/users-dev1/user.model', () => ({
  findById: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../src/modules/companies-dev2/company.model', () => ({
  findById: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../src/modules/productive-stages-dev2/productive-stage.model', () => ({
  create: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
}));

vi.mock('../src/modules/documents-dev2/document.model', () => ({
  create: vi.fn(),
  findOne: vi.fn(),
}));

// Mock de Drive
vi.mock('../src/modules/documents-dev2/drive.service', () => ({
  subirDocumentoEP: vi.fn().mockResolvedValue({ viewUrl: 'http://drive.com/file' }),
  crearEstructuraCarpetas: vi.fn().mockResolvedValue({
    aprendiz: { id: 'f1', webViewLink: 'url1' },
    bitacoras: { id: 'f2', webViewLink: 'url2' },
    documentos: { id: 'f3', webViewLink: 'url3' }
  })
}));

// Importamos el servicio real
const epService = require('../src/modules/productive-stages-dev2/productive-stages.service');

describe('Integración DEV 1 (Usuarios) + DEV 2 (Etapas Productivas)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Flujo completo: Registro de usuario -> Registro de Empresa -> Registro de EP', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockCompanyId = new mongoose.Types.ObjectId();

    const mockUser = {
      _id: mockUserId,
      name: 'Santiago Aprendiz',
      email: 'santiago@sena.edu.co',
      role: 'APRENDIZ',
      documento: '102030',
      fechaFinLectiva: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    };
    
    const mockCompany = {
      _id: mockCompanyId,
      nit: '900-1',
      razonSocial: 'Tech Solutions SAS',
      activa: true,
    };

    // Configurar retornos
    Company.findById.mockResolvedValue(mockCompany);
    User.findById.mockResolvedValue(mockUser);
    ProductiveStage.findOne.mockResolvedValue(null);
    
    ProductiveStage.create.mockImplementation((data) => ({
      ...data,
      _id: new mongoose.Types.ObjectId(),
      save: vi.fn().mockResolvedValue(this),
      historialEstados: data.historialEstados || []
    }));

    const epData = {
      aprendiz: mockUser,
      companyId: mockCompanyId,
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'CONTRATO_APRENDIZAJE',
      documentos: [
        { tipoDocumento: 'RUT', nombreArchivo: 'rut.pdf', url: 'http://temp.com/rut' },
        { tipoDocumento: 'CAMARA_COMERCIO', nombreArchivo: 'cc.pdf', url: 'http://temp.com/cc' }
      ],
      observaciones: 'Inicio de practicas'
    };

    const resultado = await epService.registrar(epData);

    // Verificaciones
    expect(ProductiveStage.create).toHaveBeenCalled();
    expect(resultado.radicado).toBeDefined();
    expect(resultado.stage.estado).toBe('REGISTRO');
    expect(resultado.stage.companySnapshot.razonSocial).toBe('Tech Solutions SAS');

    console.log('✅ Prueba de integración exitosa: Dev 1 y Dev 2 trabajan coordinados.');
  });
});
