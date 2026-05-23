// =============================================
// Integration Test: Dev 1 (Auth) + Dev 2 (EP)
// =============================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const mailer = require('../src/core/utils/mailer');
vi.spyOn(mailer, 'sendEmail').mockResolvedValue(true);

// Importamos los modelos antes de mockearlos para tener las referencias
const User            = require('../src/modules/users-dev1/user.model');
const Company         = require('../src/modules/companies-dev2/company.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const Document        = require('../src/modules/documents-dev2/document.model');
const Batch           = require('../src/modules/batches-dev1/batch.model');
const SystemConfig    = require('../src/modules/system-config-dev1/system-config.model');

// Mockear los métodos de Mongoose
vi.spyOn(Company, 'findById');
vi.spyOn(User, 'findById');
vi.spyOn(User, 'findOne');
vi.spyOn(User, 'find');
vi.spyOn(User, 'create');
vi.spyOn(ProductiveStage, 'findOne');
vi.spyOn(ProductiveStage, 'find');
vi.spyOn(ProductiveStage, 'create');
vi.spyOn(Document, 'create');
vi.spyOn(Document, 'findById');
vi.spyOn(Batch, 'findOne');
vi.spyOn(SystemConfig, 'findOne');

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
    SystemConfig.findOne.mockImplementation((query) => {
      if (query && query.clave === 'CLOUD_STORAGE_PROVIDER') {
        return makeChainableMock({ valor: 'GOOGLE_DRIVE' });
      }
      return makeChainableMock(null);
    });
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

  it('Debe registrar correctamente a un instructor con sus modalidades y a un aprendiz con su instructor asignado', async () => {
    const authService = require('../src/modules/auth-dev1/auth.service');

    User.findOne.mockImplementation(() => makeChainableMock(null));
    User.create.mockImplementation(async (data) => {
      return {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true)
      };
    });

    // 1. Registrar instructor
    const instructorData = {
      name: 'Instructor Modalidades',
      email: 'inst.mod@sena.edu.co',
      password: 'password123',
      role: 'INSTRUCTOR',
      documento: '987654322',
      telefono: '3001234568',
      modalidades: ['CONTRATO_APRENDIZAJE', 'PASANTIA']
    };

    await authService.registrar(instructorData);

    expect(User.create).toHaveBeenLastCalledWith(expect.objectContaining({
      role: 'INSTRUCTOR',
      modalidades: ['CONTRATO_APRENDIZAJE', 'PASANTIA']
    }));

    // 2. Registrar aprendiz
    const mockInstructorId = new mongoose.Types.ObjectId();
    const mockInstructor = {
      _id: mockInstructorId,
      name: 'Mock Instructor',
      role: 'INSTRUCTOR',
      activo: true,
      status: 'ACTIVO'
    };
    User.findById.mockImplementation((id) => {
      if (id && id.toString() === mockInstructorId.toString()) {
        return makeChainableMock(mockInstructor);
      }
      return makeChainableMock(null);
    });

    const apprenticeData = {
      name: 'Aprendiz Con Instructor',
      email: 'ap.inst@sena.edu.co',
      password: 'password123',
      role: 'APRENDIZ',
      documento: '987654323',
      telefono: '3001234569',
      instructorAsignado: mockInstructorId
    };

    await authService.registrar(apprenticeData);

    expect(User.create).toHaveBeenLastCalledWith(expect.objectContaining({
      role: 'APRENDIZ',
      instructorAsignado: mockInstructorId
    }));
  });

  describe('RF-ADM-15 Verificación de estado activo para instructores', () => {
    it('Debe rechazar el registro de un aprendiz con un instructor inactivo', async () => {
      const authService = require('../src/modules/auth-dev1/auth.service');
      const mockInactiveInstructorId = new mongoose.Types.ObjectId();

      const mockInactiveInstructor = {
        _id: mockInactiveInstructorId,
        name: 'Instructor Inactivo',
        role: 'INSTRUCTOR',
        activo: false,
        status: 'INACTIVO'
      };

      // Mock database lookups
      User.findById.mockImplementation((id) => {
        if (id.toString() === mockInactiveInstructorId.toString()) {
          return makeChainableMock(mockInactiveInstructor);
        }
        return makeChainableMock(null);
      });

      User.findOne.mockImplementation(() => makeChainableMock(null));

      const apprenticeData = {
        name: 'Aprendiz Test Inactivo',
        email: 'ap.inactivo@sena.edu.co',
        password: 'password123',
        role: 'APRENDIZ',
        documento: '987654324',
        instructorAsignado: mockInactiveInstructorId
      };

      await expect(
        authService.registrar(apprenticeData)
      ).rejects.toThrow('debe estar en estado activo.');
    });

    it('Debe rechazar la actualización de un aprendiz con un instructor técnico inactivo', async () => {
      const usersService = require('../src/modules/users-dev1/users.service');
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockInactiveInstructorId = new mongoose.Types.ObjectId();

      const mockInactiveInstructor = {
        _id: mockInactiveInstructorId,
        name: 'Instructor Técnico Inactivo',
        role: 'INSTRUCTOR',
        activo: true,
        status: 'INACTIVO'
      };

      User.findById.mockImplementation((id) => {
        if (id.toString() === mockInactiveInstructorId.toString()) {
          return makeChainableMock(mockInactiveInstructor);
        }
        return makeChainableMock(null);
      });

      await expect(
        usersService.actualizar(mockApprenticeId, {
          instructorTecnico: mockInactiveInstructorId
        })
      ).rejects.toThrow('debe estar en estado activo.');
    });
  });

  describe('RF-ADM-16 Gestión de reasignaciones', () => {
    it('Debe rechazar la reasignación de aprendices si el instructor destino está inactivo', async () => {
      const usersService = require('../src/modules/users-dev1/users.service');
      const mockOutgoingId = new mongoose.Types.ObjectId();
      const mockInactiveInstructorId = new mongoose.Types.ObjectId();

      const mockInactiveInstructor = {
        _id: mockInactiveInstructorId,
        name: 'Instructor Destino Inactivo',
        role: 'INSTRUCTOR',
        activo: false,
        status: 'INACTIVO'
      };

      User.findById.mockImplementation((id) => {
        if (id.toString() === mockInactiveInstructorId.toString()) {
          return makeChainableMock(mockInactiveInstructor);
        }
        return makeChainableMock(null);
      });

      await expect(
        usersService.reassignApprentices(mockOutgoingId, mockInactiveInstructorId)
      ).rejects.toThrow('debe estar en estado activo.');
    });
  });

  describe('RF-ADM-16 / RF-ADM-17 / RF-ADM-18: Gestión Completa de Instructores, Horas y Visitas Extraordinarias', () => {
    const usersService = require('../src/modules/users-dev1/users.service');
    const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
    const storageService = require('../src/modules/documents-dev2/storage.service');
    const mailer = require('../src/core/utils/mailer');

    vi.spyOn(storageService, 'moverCarpeta').mockResolvedValue({ id: 'folder_migrated' });
    vi.spyOn(storageService, 'crearCarpeta').mockResolvedValue({ id: 'new_inst_folder' });
    vi.spyOn(storageService, 'obtenerOCrearCarpeta').mockResolvedValue({ id: 'new_ficha_folder' });

    it('Debe reasignar instructores migrando físicamente la carpeta del aprendiz en Drive y enviar correo', async () => {
      const mockOutgoingId = new mongoose.Types.ObjectId();
      const mockNewInstructorId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();

      const mockNewInstructor = {
        _id: mockNewInstructorId,
        name: 'Nuevo Instructor Activo',
        email: 'nuevo.inst@sena.edu.co',
        role: 'INSTRUCTOR',
        activo: true,
        status: 'ACTIVO',
        driveFolderId: 'new_inst_folder',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockApprentice = {
        _id: mockApprenticeId,
        name: 'Aprendiz Afectado',
        email: 'aprendiz@sena.edu.co',
        role: 'APRENDIZ',
        ficha: '123456',
        instructorAsignado: mockOutgoingId,
        instructorTecnico: null,
        instructorProyecto: null
      };

      const mockStage = {
        _id: new mongoose.Types.ObjectId(),
        apprenticeId: mockApprenticeId,
        driveFolders: {
          aprendiz: 'folder_aprendiz_old',
          bitacoras: 'folder_bitacoras_old',
          documentos: 'folder_documentos_old'
        }
      };

      // Mock DB calls
      User.findById.mockImplementation((id) => {
        if (id.toString() === mockNewInstructorId.toString()) {
          return makeChainableMock(mockNewInstructor);
        }
        return makeChainableMock(null);
      });

      // User.find to find affected apprentices
      vi.spyOn(User, 'find').mockImplementation(() => makeChainableMock([mockApprentice]));

      // Mock ProductiveStage.findOne
      const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
      vi.spyOn(ProductiveStage, 'findOne').mockImplementation(() => makeChainableMock(mockStage));

      // Mock updateMany results
      vi.spyOn(User, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
      const Batch = require('../src/modules/batches-dev1/batch.model');
      vi.spyOn(Batch, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
      const Tracking = require('../src/modules/trackings-dev3/tracking.model');
      vi.spyOn(Tracking, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

      const result = await usersService.reassignApprentices(mockOutgoingId, mockNewInstructorId);

      expect(result.apprenticesReassigned).toBe(1);
      expect(storageService.moverCarpeta).toHaveBeenCalledWith('folder_aprendiz_old', 'new_ficha_folder');
      expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'aprendiz@sena.edu.co',
        subject: expect.stringContaining('Reasignación')
      }));
    });

    it('Debe calcular horas de instructor excluyendo seguimientos extraordinarios sin aprobar y registrar pagos', async () => {
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockInstructor = {
        _id: mockInstructorId,
        name: 'Instructor Horas',
        email: 'inst.horas@sena.edu.co',
        role: 'INSTRUCTOR',
        activo: true,
        horasPagadas: 5,
        save: vi.fn().mockResolvedValue(true)
      };

      // Mock User lookups
      User.findById.mockImplementation((id) => {
        if (id.toString() === mockInstructorId.toString()) {
          return makeChainableMock(mockInstructor);
        }
        return makeChainableMock(null);
      });
      vi.spyOn(User, 'find').mockImplementation((query) => {
        if (query && query.role === 'INSTRUCTOR') {
          return makeChainableMock([mockInstructor]);
        }
        return makeChainableMock([]);
      });

      // Mock countDocuments for trackings
      const Tracking = require('../src/modules/trackings-dev3/tracking.model');
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(3); // 3 visits = 6 hours

      const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(2); // 2 bitacoras = 2 hours

      const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
      vi.spyOn(ProductiveStage, 'countDocuments').mockResolvedValue(1); // 1 cert = 2 hours

      const result = await usersService.getInstructorsHours();
      const instData = result.find(r => r._id.toString() === mockInstructorId.toString());

      expect(instData.totalHoras).toBe(10); // 6 + 2 + 2 = 10
      expect(instData.horasPagadas).toBe(5);
      expect(instData.saldoHoras).toBe(5);

      // Probar registrar pago de horas
      await usersService.payInstructorsHours(mockInstructorId, 3);
      expect(mockInstructor.horasPagadas).toBe(8);
    });

    it('Debe crear visita extraordinaria como PENDIENTE de aprobación y permitir su aprobación', async () => {
      const mockStageId = new mongoose.Types.ObjectId();
      const mockInstructorId = new mongoose.Types.ObjectId();
      const mockApprenticeId = new mongoose.Types.ObjectId();
      const mockTrackingId = new mongoose.Types.ObjectId();

      const mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId
      };
      const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
      vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);

      const mockTracking = {
        _id: mockTrackingId,
        stageId: mockStageId,
        instructorId: mockInstructorId,
        apprenticeId: mockApprenticeId,
        numeroVisita: 1,
        fechaVisita: new Date(),
        esExtraordinario: true,
        estadoExtraordinario: 'PENDIENTE',
        save: vi.fn().mockImplementation(function() { return Promise.resolve(this); })
      };

      const Tracking = require('../src/modules/trackings-dev3/tracking.model');
      vi.spyOn(Tracking, 'create').mockResolvedValue(mockTracking);
      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      const created = await trackingsService.crear({
        stageId: mockStageId,
        instructorId: mockInstructorId,
        numeroVisita: 1,
        observaciones: 'Visita de emergencia',
        esExtraordinario: true
      });

      expect(created.esExtraordinario).toBe(true);
      expect(created.estadoExtraordinario).toBe('PENDIENTE');

      // Aprobar visita extraordinaria
      const approved = await trackingsService.approveExtraordinary(mockTrackingId, 'APROBADO');
      expect(approved.estadoExtraordinario).toBe('APROBADO');
    });
  });

  describe('RF-ADM-18 Aprobación/Rechazo de Seguimiento Extraordinario con observaciones obligatorias', () => {
    const trackingsService = require('../src/modules/trackings-dev3/trackings.service');
    const Tracking = require('../src/modules/trackings-dev3/tracking.model');

    it('Debe rechazar la evaluación de una visita extraordinaria si el estado es RECHAZADO y no se proporcionan observaciones', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        esExtraordinario: true,
        estadoExtraordinario: 'PENDIENTE',
        save: vi.fn().mockImplementation(function() { return Promise.resolve(this); })
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      await expect(
        trackingsService.approveExtraordinary(mockTrackingId, 'RECHAZADO', '')
      ).rejects.toThrow('Las observaciones son obligatorias para rechazar un seguimiento extraordinario.');

      await expect(
        trackingsService.approveExtraordinary(mockTrackingId, 'RECHAZADO', '   ')
      ).rejects.toThrow('Las observaciones son obligatorias para rechazar un seguimiento extraordinario.');
    });

    it('Debe permitir el rechazo si se proporcionan observaciones válidas', async () => {
      const mockTrackingId = new mongoose.Types.ObjectId();
      const mockTracking = {
        _id: mockTrackingId,
        esExtraordinario: true,
        estadoExtraordinario: 'PENDIENTE',
        observacionesEvaluacion: '',
        save: vi.fn().mockImplementation(function() { return Promise.resolve(this); })
      };

      vi.spyOn(Tracking, 'findById').mockResolvedValue(mockTracking);

      const result = await trackingsService.approveExtraordinary(mockTrackingId, 'RECHAZADO', 'No cumple con las firmas');
      expect(result.estadoExtraordinario).toBe('RECHAZADO');
      expect(result.observacionesEvaluacion).toBe('No cumple con las firmas');
      expect(mockTracking.save).toHaveBeenCalled();
    });
  });

  describe('RF-ADM-19 Validación de certificación final (certificarEP)', () => {
    const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
    const Tracking = require('../src/modules/trackings-dev3/tracking.model');
    const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
    const Document = require('../src/modules/documents-dev2/document.model');
    const storageService = require('../src/modules/documents-dev2/storage.service');

    let mockStage;
    let mockApprenticeId;
    let mockStageId;

    beforeEach(() => {
      mockApprenticeId = new mongoose.Types.ObjectId();
      mockStageId = new mongoose.Types.ObjectId();
      mockStage = {
        _id: mockStageId,
        apprenticeId: mockApprenticeId,
        estado: 'FINALIZADO',
        jornada: 'TIEMPO_COMPLETO',
        horasCompletadas: 880,
        horasRequeridas: 880,
        historialEstados: [],
        populate: vi.fn().mockReturnThis()
      };

      vi.spyOn(ProductiveStage, 'findById').mockImplementation(() => makeChainableMock(mockStage));
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(3);
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(12);
      vi.spyOn(Document, 'find').mockResolvedValue([
        { tipoDocumento: 'ACTA_INICIO', estado: 'APROBADO', stageId: mockStageId },
        { tipoDocumento: 'EVALUACION_FINAL', estado: 'APROBADO', stageId: mockStageId },
        { tipoDocumento: 'CERTIFICADO_EP', estado: 'APROBADO', stageId: mockStageId },
        { tipoDocumento: 'SOPORTES_FINALES', estado: 'APROBADO', stageId: mockStageId }
      ]);
    });

    it('Debe certificar con éxito si se cumplen todos los requisitos', async () => {
      mockStage.save = vi.fn().mockResolvedValue({
        ...mockStage,
        estado: 'CERTIFICADO'
      });

      const result = await epService.certificarEP(mockStageId, new mongoose.Types.ObjectId());
      expect(result.stage.estado).toBe('CERTIFICADO');
      expect(mockStage.save).toHaveBeenCalled();
    });

    it('Debe fallar la certificación si hay un seguimiento extraordinario pendiente', async () => {
      vi.spyOn(Tracking, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(), esExtraordinario: true, estadoExtraordinario: 'PENDIENTE' });

      await expect(
        epService.certificarEP(mockStageId, new mongoose.Types.ObjectId())
      ).rejects.toThrow('Existen solicitudes de seguimientos extraordinarios pendientes de evaluación.');
    });

    it('Debe fallar la certificación si hay menos de 3 visitas de seguimiento realizadas', async () => {
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValue(2);

      await expect(
        epService.certificarEP(mockStageId, new mongoose.Types.ObjectId())
      ).rejects.toThrow('Se requieren al menos 3 visitas de seguimiento realizadas');
    });

    it('Debe fallar la certificación si faltan bitácoras aprobadas para jornada TIEMPO_COMPLETO', async () => {
      mockStage.jornada = 'TIEMPO_COMPLETO';
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(11);

      await expect(
        epService.certificarEP(mockStageId, new mongoose.Types.ObjectId())
      ).rejects.toThrow('Se requieren al menos 12 bitácoras aprobadas');
    });

    it('Debe fallar la certificación si faltan bitácoras aprobadas para jornada MEDIO_TIEMPO', async () => {
      mockStage.jornada = 'MEDIO_TIEMPO';
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(23);

      await expect(
        epService.certificarEP(mockStageId, new mongoose.Types.ObjectId())
      ).rejects.toThrow('Se requieren al menos 24 bitácoras aprobadas');
    });

    it('Debe fallar la certificación si las horas completadas son menores a las requeridas', async () => {
      mockStage.horasCompletadas = 879;

      await expect(
        epService.certificarEP(mockStageId, new mongoose.Types.ObjectId())
      ).rejects.toThrow('El aprendiz no ha completado las horas requeridas');
    });

    it('Debe devolver el checklist de requisitos de cierre correcto en getEstadoCertificacion', async () => {
      vi.spyOn(Tracking, 'findOne').mockResolvedValue(null);
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValueOnce(0); // pending extraordinary
      vi.spyOn(Tracking, 'countDocuments').mockResolvedValueOnce(4); // completed visits
      vi.spyOn(Bitacora, 'countDocuments').mockResolvedValue(15);

      const result = await epService.getEstadoCertificacion(mockStageId);
      
      expect(result.checklist).toBeDefined();
      expect(result.checklist.visitas.completadas).toBe(4);
      expect(result.checklist.visitas.cumple).toBe(true);
      expect(result.checklist.bitacoras.aprobadas).toBe(15);
      expect(result.checklist.bitacoras.cumple).toBe(true);
      expect(result.checklist.horas.completadas).toBe(880);
      expect(result.checklist.horas.cumple).toBe(true);
      expect(result.checklist.extraordinarias.pendientes).toBe(0);
      expect(result.checklist.extraordinarias.cumple).toBe(true);
      expect(result.listoCertificar).toBe(true);
    });

    it('Debe archivar la documentación al certificar la EP (RF-ADM-20)', async () => {
      mockStage.save = vi.fn().mockResolvedValue({
        ...mockStage,
        estado: 'CERTIFICADO',
        archivado: true
      });
      mockStage.driveFolders = {
        aprendiz: 'folder_aprendiz_123',
        bitacoras: 'folder_bitacoras_123',
        documentos: 'folder_documentos_123'
      };

      const result = await epService.certificarEP(mockStageId, new mongoose.Types.ObjectId());
      expect(result.stage.archivado).toBe(true);
      expect(storageService.moverCarpeta).toHaveBeenCalledWith('folder_aprendiz_123', 'new_ficha_folder');
    });
  });

  // ──────────────────────────────────────────────────────────
  // RF-ADM-21: Generación de Reportes Estadísticos
  // ──────────────────────────────────────────────────────────
  describe('RF-ADM-21 Generación de reportes estadísticos', () => {
    const makeChainableFindMock = (val) => {
      const q = {
        populate: vi.fn().mockImplementation(() => q),
        lean: vi.fn().mockResolvedValue(val),
      };
      return q;
    };

    it('Debe retornar estadísticas correctas para un conjunto de EPs sin filtros', async () => {
      const mockEPs = [
        {
          _id: new mongoose.Types.ObjectId(),
          radicado: 'EP-2025-001',
          modalidad: 'CONTRATO_APRENDIZAJE',
          estado: 'CERTIFICADO',
          horasCompletadas: 880,
          horasRequeridas: 880,
          archivado: true,
          apprenticeId: { name: 'Aprendiz A', documento: '1001' },
          companyId: { razonSocial: 'Empresa X', nit: '900-1' },
        },
        {
          _id: new mongoose.Types.ObjectId(),
          radicado: 'EP-2025-002',
          modalidad: 'PASANTIA',
          estado: 'EN_CURSO',
          horasCompletadas: 400,
          horasRequeridas: 880,
          archivado: false,
          apprenticeId: { name: 'Aprendiz B', documento: '1002' },
          companyId: { razonSocial: 'Empresa Y', nit: '900-2' },
        },
      ];

      ProductiveStage.find.mockImplementation(() => makeChainableFindMock(mockEPs));

      const result = await epService.getReportStats({});

      expect(result.resumen.totalEPs).toBe(2);
      expect(result.resumen.totalHoras).toBe(1280);
      expect(result.resumen.promedioHoras).toBe(640);
      expect(result.resumen.certificadas).toBe(1);
      expect(result.resumen.archivadas).toBe(1);
      expect(result.porModalidad.CONTRATO_APRENDIZAJE).toBe(1);
      expect(result.porModalidad.PASANTIA).toBe(1);
      expect(result.lista).toHaveLength(2);
    });

    it('Debe filtrar correctamente por modalidad', async () => {
      const mockEPs = [
        {
          _id: new mongoose.Types.ObjectId(),
          radicado: 'EP-2025-003',
          modalidad: 'PASANTIA',
          estado: 'FINALIZADO',
          horasCompletadas: 880,
          horasRequeridas: 880,
          archivado: false,
          apprenticeId: { name: 'Aprendiz C', documento: '1003' },
          companyId: { razonSocial: 'Empresa Z', nit: '900-3' },
        },
      ];

      ProductiveStage.find.mockImplementation((query) => {
        expect(query.modalidad).toBe('PASANTIA');
        return makeChainableFindMock(mockEPs);
      });

      const result = await epService.getReportStats({ modalidad: 'PASANTIA' });

      expect(result.resumen.totalEPs).toBe(1);
      expect(result.porModalidad.PASANTIA).toBe(1);
      expect(result.filtrosAplicados.modalidad).toBe('PASANTIA');
    });

    it('Debe retornar lista vacía cuando no hay EPs que cumplan los filtros', async () => {
      ProductiveStage.find.mockImplementation(() => makeChainableFindMock([]));

      const result = await epService.getReportStats({ year: '2099' });

      expect(result.resumen.totalEPs).toBe(0);
      expect(result.resumen.totalHoras).toBe(0);
      expect(result.resumen.promedioHoras).toBe(0);
      expect(result.lista).toHaveLength(0);
    });
  });
});
