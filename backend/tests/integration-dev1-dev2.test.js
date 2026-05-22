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
vi.spyOn(Company, 'findById');
vi.spyOn(User, 'findById');
vi.spyOn(ProductiveStage, 'findOne');
vi.spyOn(ProductiveStage, 'create');
vi.spyOn(Document, 'create');

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

    const makeChainableMock = (val) => {
      const query = {
        sort: vi.fn().mockImplementation(() => query),
        select: vi.fn().mockImplementation(() => query),
        populate: vi.fn().mockImplementation(() => query),
        lean: vi.fn().mockImplementation(() => query),
        then: (resolve) => resolve(val)
      };
      return query;
    };

    // Configurar retornos
    Company.findById.mockImplementation(() => makeChainableMock(mockCompany));
    User.findById.mockImplementation(() => makeChainableMock(mockUser));
    ProductiveStage.findOne.mockImplementation(() => makeChainableMock(null));
    
    ProductiveStage.create.mockImplementation(async (data) => {
      const doc = {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        historialEstados: data.historialEstados || []
      };
      doc.save = vi.fn().mockResolvedValue(doc);
      return doc;
    });

    Document.create.mockImplementation(async (data) => {
      return {
        ...data,
        _id: new mongoose.Types.ObjectId()
      };
    });

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
