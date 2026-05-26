import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Importar utilidades y servicios
const Hour = require('../src/modules/hours-dev3/hour.model');
const User = require('../src/modules/users-dev1/user.model');
const hoursService = require('../src/modules/hours-dev3/hours.service');
const hoursController = require('../src/modules/hours-dev3/hours.controller');
const alertsCron = require('../src/core/utils/alertsCron');
const mailer = require('../src/core/utils/mailer');

describe('RF-INS-24: Generación de resumen final del aprendiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Compilación de Datos Mensuales', () => {
    it('debe agrupar horas por área de conocimiento del aprendiz y sumar ejecutadas/cobradas correctamente', async () => {
      const mockApprentice1 = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Carlos Perez',
        documento: '11111',
        ficha: '22222',
        programa: 'ADSO',
        areaConocimiento: 'Tecnologías de la Información'
      };

      const mockApprentice2 = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Maria Gomez',
        documento: '33333',
        ficha: '44444',
        programa: 'ADSO',
        areaConocimiento: 'Diseño Digital'
      };

      const mockHours = [
        {
          fecha: new Date(2026, 4, 15), // Mayo 15, 2026
          horasTrabajadas: 2.0,
          ejecutado: true,
          cobrado: true,
          isAdditionalHour: true,
          apprenticeId: mockApprentice1,
          stageId: {
            instructorId: { areaConocimiento: 'Tecnologías de la Información' }
          }
        },
        {
          fecha: new Date(2026, 4, 16), // Mayo 16, 2026
          horasTrabajadas: 8.0,
          ejecutado: false,
          cobrado: false,
          isAdditionalHour: false, // Regular hour, counts as executed automatically
          apprenticeId: mockApprentice1,
          stageId: {
            instructorId: { areaConocimiento: 'Tecnologías de la Información' }
          }
        },
        {
          fecha: new Date(2026, 4, 20), // Mayo 20, 2026
          horasTrabajadas: 2.0,
          ejecutado: true,
          cobrado: false,
          isAdditionalHour: true,
          apprenticeId: mockApprentice2,
          stageId: {
            instructorId: { areaConocimiento: 'Diseño Digital' }
          }
        }
      ];

      // Spy y Mock de Mongoose Hour.find()
      const queryChain = {
        populate: vi.fn().mockReturnThis(),
      };
      vi.spyOn(Hour, 'find').mockReturnValue(queryChain);
      queryChain.populate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockHours)
      });

      const result = await hoursService.compilarDatosMensuales(5, 2026);

      expect(result).toBeDefined();
      expect(result.length).toBe(2); // Dos áreas: Tecnologías de la Información y Diseño Digital

      const tiArea = result.find(r => r.areaNombre === 'Tecnologías de la Información');
      expect(tiArea).toBeDefined();
      expect(tiArea.numAprendices).toBe(1);
      // H. Ejecutadas: 2.0 (adicional ejecutada) + 8.0 (regular) = 10.0
      expect(tiArea.totalEjecutadas).toBe(10.0);
      // H. Cobradas: 2.0 (adicional cobrada)
      expect(tiArea.totalCobradas).toBe(2.0);

      const disenoArea = result.find(r => r.areaNombre === 'Diseño Digital');
      expect(disenoArea).toBeDefined();
      expect(disenoArea.numAprendices).toBe(1);
      expect(disenoArea.totalEjecutadas).toBe(2.0);
      expect(disenoArea.totalCobradas).toBe(0.0);
    });

    it('debe aplicar fallbacks a la Red de Conocimiento del instructor o programa si el aprendiz no la especifica', async () => {
      const mockApprentice = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Santiago Cisneros',
        documento: '99999',
        ficha: '88888',
        programa: 'Multimedia',
        areaConocimiento: '' // Vacío para forzar fallback
      };

      const mockHours = [
        {
          fecha: new Date(2026, 4, 15),
          horasTrabajadas: 2.0,
          ejecutado: true,
          cobrado: true,
          isAdditionalHour: true,
          apprenticeId: mockApprentice,
          stageId: {
            instructorId: { areaConocimiento: 'Diseño e Innovación' }
          }
        }
      ];

      const queryChain = {
        populate: vi.fn().mockReturnThis(),
      };
      vi.spyOn(Hour, 'find').mockReturnValue(queryChain);
      queryChain.populate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockHours)
      });

      const result = await hoursService.compilarDatosMensuales(5, 2026);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].areaNombre).toBe('Diseño e Innovación'); // Fallback exitoso al instructor
    });
  });

  describe('Generación de PDF', () => {
    it('debe compilar los datos y generar un Buffer PDFKit válido', async () => {
      vi.spyOn(hoursService, 'compilarDatosMensuales').mockResolvedValue([
        {
          areaNombre: 'Tecnología',
          aprendices: [
            {
              name: 'Carlos Perez',
              documento: '11111',
              ficha: '22222',
              programa: 'ADSO',
              horasEjecutadas: 10.0,
              horasCobradas: 2.0
            }
          ],
          totalEjecutadas: 10.0,
          totalCobradas: 2.0,
          numAprendices: 1
        }
      ]);

      const buffer = await hoursService.generarPdfReporteMensual(5, 2026);
      
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Controlador descargarReporteMensual', () => {
    it('debe recibir parámetros, compilar el PDF y responder con las cabeceras de descarga apropiadas', async () => {
      const mockPdfBuffer = Buffer.from('Contenido simulado PDF');
      vi.spyOn(hoursService, 'generarPdfReporteMensual').mockResolvedValue(mockPdfBuffer);

      const mockReq = {
        query: {
          mes: '5',
          anio: '2026'
        }
      };

      const mockRes = {
        setHeader: vi.fn(),
        send: vi.fn()
      };

      await hoursController.descargarReporteMensual(mockReq, mockRes);

      expect(hoursService.generarPdfReporteMensual).toHaveBeenCalledWith(5, 2026);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(mockRes.send).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });

  describe('Cron Job compilarYEnviarReporteMensual', () => {
    it('debe recopilar el reporte mensual anterior y enviarlo adjunto por correo a los coordinadores activos', async () => {
      const mockPdfBuffer = Buffer.from('Contenido simulado PDF');
      vi.spyOn(hoursService, 'generarPdfReporteMensual').mockResolvedValue(mockPdfBuffer);

      const mockCoordinadores = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Coordinador Principal',
          email: 'coordinador@sena.edu.co',
          role: 'ADMIN',
          activo: true
        }
      ];

      vi.spyOn(User, 'find').mockResolvedValue(mockCoordinadores);
      const emailSpy = vi.spyOn(mailer, 'sendEmail').mockResolvedValue({ messageId: '12345' });

      // Configurar fecha mock para simular ejecución el 1 de Junio de 2026 (compilará Mayo 2026)
      const originalDate = global.Date;
      const mockDate = new originalDate(2026, 5, 1, 0, 0, 0); // Junio 1, 2026
      
      class MockedDate extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...args);
          }
        }
        static now() {
          return mockDate.getTime();
        }
      }
      
      global.Date = MockedDate;

      try {
        const result = await alertsCron.compilarYEnviarReporteMensual();

        expect(result).toBeDefined();
        expect(result.reportesEnviados).toBe(1);
        expect(hoursService.generarPdfReporteMensual).toHaveBeenCalledWith(5, 2026); // Mayo (5) 2026
        expect(emailSpy).toHaveBeenCalledWith(expect.objectContaining({
          to: 'coordinador@sena.edu.co',
          subject: expect.stringContaining('Mayo 2026'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringContaining('2026_5.pdf'),
              content: mockPdfBuffer
            })
          ])
        }));
      } finally {
        global.Date = originalDate;
      }
    });
  });
});
