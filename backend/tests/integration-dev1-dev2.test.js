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
const Batch           = require('../src/modules/batches-dev1/batch.model');

// Mockear los métodos de Mongoose
vi.spyOn(Company, 'findById');
vi.spyOn(User, 'findById');
vi.spyOn(User, 'findOne');
vi.spyOn(User, 'create');
vi.spyOn(ProductiveStage, 'findOne');
vi.spyOn(ProductiveStage, 'create');
vi.spyOn(Document, 'create');
vi.spyOn(Document, 'findById');
vi.spyOn(Batch, 'findOne');

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
      activo: true,
      status: 'ACTIVO',
      ficha: '2670687',
      fechaFinLectiva: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    };
    
    const mockCompany = {
      _id: mockCompanyId,
      nit: '900-1',
      razonSocial: 'Tech Solutions SAS',
      activa: true,
    };

    // Configurar retornos
    Company.findById.mockImplementation(() => makeChainableMock(mockCompany));
    User.findById.mockImplementation(() => makeChainableMock(mockUser));
    ProductiveStage.findOne.mockImplementation(() => makeChainableMock(null));
    
    const mockBatch = {
      codigo_ficha: '2670687',
      estado: 'ACTIVA',
      fecha_inicio_ep: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fecha_fin_ep: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    };
    Batch.findOne.mockImplementation(() => makeChainableMock(mockBatch));
    
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

  it('Debe crear automáticamente la carpeta en OneDrive y Google Drive al registrar un instructor', async () => {
    const authService = require('../src/modules/auth-dev1/auth.service');
    const onedriveService = require('../src/modules/documents-dev2/onedrive.service');
    const driveService = require('../src/modules/documents-dev2/drive.service');

    const spyOneDrive = vi.spyOn(onedriveService, 'crearCarpeta').mockResolvedValue({
      id: 'mock_onedrive_folder_id',
      name: 'INSTRUCTOR_Juan_Perez',
      webViewLink: 'http://onedrive.com/mock_onedrive_folder_id'
    });

    const spyDrive = vi.spyOn(driveService, 'crearCarpeta').mockResolvedValue({
      id: 'mock_drive_folder_id',
      name: 'INSTRUCTOR_Juan_Perez',
      webViewLink: 'http://drive.com/mock_drive_folder_id'
    });

    const mockInstructorId = new mongoose.Types.ObjectId();
    const instructorData = {
      name: 'Juan Perez',
      email: 'juan.perez@sena.edu.co',
      password: 'password123',
      role: 'INSTRUCTOR',
      documento: '987654321',
      telefono: '3001234567'
    };

    const mockInstructorUser = {
      ...instructorData,
      _id: mockInstructorId,
      onedriveFolderId: null,
      driveFolderId: null,
      save: vi.fn().mockImplementation(function() {
        return Promise.resolve(this);
      })
    };

    User.findOne.mockImplementation(() => ({
      then: (resolve) => resolve(null)
    }));

    User.create.mockImplementation(() => Promise.resolve(mockInstructorUser));

    const result = await authService.registrar(instructorData);

    expect(spyOneDrive).toHaveBeenCalledWith('INSTRUCTOR_Juan_Perez');
    expect(spyDrive).toHaveBeenCalledWith('INSTRUCTOR_Juan_Perez');
    expect(mockInstructorUser.onedriveFolderId).toBe('mock_onedrive_folder_id');
    expect(mockInstructorUser.driveFolderId).toBe('mock_drive_folder_id');
    expect(mockInstructorUser.save).toHaveBeenCalled();
    expect(result.usuario.name).toBe('Juan Perez');

    spyOneDrive.mockRestore();
    spyDrive.mockRestore();
  });

  describe('RF-ADM-12 Revisión de documentos de aprendices', () => {
    const documentsService = require('../src/modules/documents-dev2/documents.service');

    it('Debe rechazar la revisión si el estado no es APROBADO o RECHAZADO', async () => {
      const mockDocId = new mongoose.Types.ObjectId();
      const mockReviewerId = new mongoose.Types.ObjectId();

      await expect(
        documentsService.revisarDocumento(mockDocId, {
          estado: 'INVALID_STATUS',
          observaciones: 'Incorrecto',
          revisadoPor: mockReviewerId
        })
      ).rejects.toThrow('Estado de revision debe ser APROBADO o RECHAZADO.');
    });

    it('Debe obligar a ingresar observaciones si se rechaza un documento', async () => {
      const mockDocId = new mongoose.Types.ObjectId();
      const mockReviewerId = new mongoose.Types.ObjectId();

      await expect(
        documentsService.revisarDocumento(mockDocId, {
          estado: 'RECHAZADO',
          observaciones: '  ',
          revisadoPor: mockReviewerId
        })
      ).rejects.toThrow('Las observaciones son obligatorias para rechazar un documento.');
    });

    it('Debe lanzar error si el documento no existe', async () => {
      const mockDocId = new mongoose.Types.ObjectId();
      const mockReviewerId = new mongoose.Types.ObjectId();

      Document.findById.mockImplementation(() => makeChainableMock(null));

      await expect(
        documentsService.revisarDocumento(mockDocId, {
          estado: 'APROBADO',
          observaciones: 'Todo correcto',
          revisadoPor: mockReviewerId
        })
      ).rejects.toThrow('Documento no encontrado.');
    });

    it('Debe aprobar correctamente un documento y guardar el revisor', async () => {
      const mockDocId = new mongoose.Types.ObjectId();
      const mockReviewerId = new mongoose.Types.ObjectId();

      const mockDocument = {
        _id: mockDocId,
        tipoDocumento: 'RUT',
        nombreArchivo: 'rut.pdf',
        estado: 'PENDIENTE',
        observaciones: '',
        revisadoPor: null,
        fechaRevision: null,
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      Document.findById.mockImplementation(() => makeChainableMock(mockDocument));

      const result = await documentsService.revisarDocumento(mockDocId, {
        estado: 'APROBADO',
        observaciones: 'Documento verificado',
        revisadoPor: mockReviewerId
      });

      expect(result.estado).toBe('APROBADO');
      expect(result.observaciones).toBe('Documento verificado');
      expect(result.revisadoPor).toBe(mockReviewerId);
      expect(result.fechaRevision).toBeInstanceOf(Date);
      expect(mockDocument.save).toHaveBeenCalled();
    });

    it('Debe rechazar correctamente un documento con observaciones', async () => {
      const mockDocId = new mongoose.Types.ObjectId();
      const mockReviewerId = new mongoose.Types.ObjectId();

      const mockDocument = {
        _id: mockDocId,
        tipoDocumento: 'CAMARA_COMERCIO',
        nombreArchivo: 'cc.pdf',
        estado: 'PENDIENTE',
        observaciones: '',
        revisadoPor: null,
        fechaRevision: null,
        save: vi.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      Document.findById.mockImplementation(() => makeChainableMock(mockDocument));

      const result = await documentsService.revisarDocumento(mockDocId, {
        estado: 'RECHAZADO',
        observaciones: 'Firma ilegible',
        revisadoPor: mockReviewerId
      });

      expect(result.estado).toBe('RECHAZADO');
      expect(result.observaciones).toBe('Firma ilegible');
      expect(result.revisadoPor).toBe(mockReviewerId);
      expect(result.fechaRevision).toBeInstanceOf(Date);
      expect(mockDocument.save).toHaveBeenCalled();
    });
  });
});
