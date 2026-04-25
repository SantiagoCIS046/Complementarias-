// =============================================
// Tests DEV 2: Maquina de Estados, Cronograma,
// Enums, Elegibilidad, Drive, Certificacion
// =============================================
// Tests unitarios que NO requieren MongoDB.
// Validan la logica de negocio pura.
// =============================================

import { describe, it, expect } from 'vitest';

// --- 1. Enums ---
import enums from '../src/core/utils/enums.js';

describe('Enums - Definiciones correctas', () => {
  it('debe tener 7 estados de EP + RECHAZADO', () => {
    const estados = Object.keys(enums.ESTADO_EP);
    expect(estados).toContain('SOLICITUD');
    expect(estados).toContain('REGISTRO');
    expect(estados).toContain('VALIDACION');
    expect(estados).toContain('APROBADO');
    expect(estados).toContain('RECHAZADO');
    expect(estados).toContain('EN_CURSO');
    expect(estados).toContain('FINALIZADO');
    expect(estados).toContain('CERTIFICADO');
    expect(estados.length).toBe(8); // 7 + RECHAZADO
  });

  it('debe tener transiciones validas completas', () => {
    const t = enums.TRANSICIONES_EP;
    expect(t.SOLICITUD).toEqual(['REGISTRO']);
    expect(t.REGISTRO).toEqual(['VALIDACION']);
    expect(t.VALIDACION).toEqual(['APROBADO', 'RECHAZADO']);
    expect(t.APROBADO).toEqual(['EN_CURSO']);
    expect(t.RECHAZADO).toEqual(['REGISTRO']);
    expect(t.EN_CURSO).toEqual(['FINALIZADO']);
    expect(t.FINALIZADO).toEqual(['CERTIFICADO']);
    expect(t.CERTIFICADO).toEqual([]);
  });

  it('debe tener 2 tipos de jornada', () => {
    expect(enums.JORNADA.TIEMPO_COMPLETO).toBe('TIEMPO_COMPLETO');
    expect(enums.JORNADA.MEDIO_TIEMPO).toBe('MEDIO_TIEMPO');
  });

  it('debe tener configuracion de cronograma coherente', () => {
    const c = enums.CRONOGRAMA_CONFIG;
    expect(c.HORAS_TOTALES_EP).toBe(880);
    expect(c.HORAS_DIA_COMPLETO).toBe(8);
    expect(c.HORAS_DIA_MEDIO).toBe(4);
    expect(c.DIAS_LABORALES_SEMANA).toBe(5);
    expect(c.MESES_TIEMPO_COMPLETO).toBe(6);
    expect(c.MESES_MEDIO_TIEMPO).toBe(12);
  });

  it('debe tener 6 tipos de documento', () => {
    const tipos = Object.keys(enums.TIPO_DOCUMENTO);
    expect(tipos).toContain('RUT');
    expect(tipos).toContain('CAMARA_COMERCIO');
    expect(tipos).toContain('ACTA_INICIO');
    expect(tipos).toContain('EVALUACION_FINAL');
    expect(tipos).toContain('CERTIFICADO_EP');
    expect(tipos.length).toBe(6);
  });

  it('debe tener documentos de registro obligatorios: RUT y CAMARA_COMERCIO', () => {
    expect(enums.DOCUMENTOS_REGISTRO_OBLIGATORIOS).toContain('RUT');
    expect(enums.DOCUMENTOS_REGISTRO_OBLIGATORIOS).toContain('CAMARA_COMERCIO');
    expect(enums.DOCUMENTOS_REGISTRO_OBLIGATORIOS.length).toBe(2);
  });

  it('debe tener 3 documentos de certificacion obligatorios', () => {
    expect(enums.DOCUMENTOS_CERTIFICACION_OBLIGATORIOS).toContain('ACTA_INICIO');
    expect(enums.DOCUMENTOS_CERTIFICACION_OBLIGATORIOS).toContain('EVALUACION_FINAL');
    expect(enums.DOCUMENTOS_CERTIFICACION_OBLIGATORIOS).toContain('CERTIFICADO_EP');
    expect(enums.DOCUMENTOS_CERTIFICACION_OBLIGATORIOS.length).toBe(3);
  });

  it('ESTADO_ETAPA debe ser alias de ESTADO_EP', () => {
    expect(enums.ESTADO_ETAPA).toEqual(enums.ESTADO_EP);
  });

  it('todos los enums deben ser inmutables (frozen)', () => {
    expect(Object.isFrozen(enums.ESTADO_EP)).toBe(true);
    expect(Object.isFrozen(enums.TRANSICIONES_EP)).toBe(true);
    expect(Object.isFrozen(enums.JORNADA)).toBe(true);
    expect(Object.isFrozen(enums.CRONOGRAMA_CONFIG)).toBe(true);
    expect(Object.isFrozen(enums.TIPO_DOCUMENTO)).toBe(true);
  });
});

// --- 2. Maquina de Estados ---
import {
  esTransicionValida,
  obtenerTransicionesDisponibles,
} from '../src/modules/productive-stages-dev2/stateMachine.js';

describe('Maquina de Estados - Transiciones', () => {
  it('SOLICITUD solo puede ir a REGISTRO', () => {
    expect(esTransicionValida('SOLICITUD', 'REGISTRO')).toBe(true);
    expect(esTransicionValida('SOLICITUD', 'APROBADO')).toBe(false);
    expect(esTransicionValida('SOLICITUD', 'VALIDACION')).toBe(false);
  });

  it('REGISTRO solo puede ir a VALIDACION', () => {
    expect(esTransicionValida('REGISTRO', 'VALIDACION')).toBe(true);
    expect(esTransicionValida('REGISTRO', 'APROBADO')).toBe(false);
  });

  it('VALIDACION puede ir a APROBADO o RECHAZADO', () => {
    expect(esTransicionValida('VALIDACION', 'APROBADO')).toBe(true);
    expect(esTransicionValida('VALIDACION', 'RECHAZADO')).toBe(true);
    expect(esTransicionValida('VALIDACION', 'EN_CURSO')).toBe(false);
  });

  it('RECHAZADO puede volver a REGISTRO (correccion)', () => {
    expect(esTransicionValida('RECHAZADO', 'REGISTRO')).toBe(true);
    expect(esTransicionValida('RECHAZADO', 'APROBADO')).toBe(false);
  });

  it('APROBADO solo puede ir a EN_CURSO', () => {
    expect(esTransicionValida('APROBADO', 'EN_CURSO')).toBe(true);
    expect(esTransicionValida('APROBADO', 'FINALIZADO')).toBe(false);
  });

  it('EN_CURSO solo puede ir a FINALIZADO', () => {
    expect(esTransicionValida('EN_CURSO', 'FINALIZADO')).toBe(true);
    expect(esTransicionValida('EN_CURSO', 'CERTIFICADO')).toBe(false);
  });

  it('FINALIZADO solo puede ir a CERTIFICADO', () => {
    expect(esTransicionValida('FINALIZADO', 'CERTIFICADO')).toBe(true);
    expect(esTransicionValida('FINALIZADO', 'EN_CURSO')).toBe(false);
  });

  it('CERTIFICADO no puede ir a ningun estado (terminal)', () => {
    const disponibles = obtenerTransicionesDisponibles('CERTIFICADO');
    expect(disponibles).toEqual([]);
    expect(esTransicionValida('CERTIFICADO', 'SOLICITUD')).toBe(false);
  });

  it('un estado invalido retorna false', () => {
    expect(esTransicionValida('ESTADO_FALSO', 'REGISTRO')).toBe(false);
  });

  it('obtenerTransicionesDisponibles retorna array correcto', () => {
    expect(obtenerTransicionesDisponibles('SOLICITUD')).toEqual(['REGISTRO']);
    expect(obtenerTransicionesDisponibles('VALIDACION')).toEqual(['APROBADO', 'RECHAZADO']);
    expect(obtenerTransicionesDisponibles('ESTADO_FALSO')).toEqual([]);
  });
});

// --- 3. Motor de Cronogramas (scheduleCalculator) ---
import {
  calcularFechaProyectadaFin,
  calcularHorasRequeridas,
  calcularHorasPorSemana,
  calcularProgreso,
  verificarRitmo,
  generarResumenCronograma,
} from '../src/modules/productive-stages-dev2/scheduleCalculator.js';

describe('Motor de Cronogramas - Calculadora', () => {
  describe('calcularFechaProyectadaFin', () => {
    it('Tiempo Completo: debe ser 6 meses despues', () => {
      const inicio = new Date('2026-01-15T12:00:00Z');
      const fin = calcularFechaProyectadaFin(inicio, 'TIEMPO_COMPLETO');
      // Verificar que la diferencia es de 6 meses
      const diffMeses = (fin.getFullYear() - inicio.getFullYear()) * 12
        + (fin.getMonth() - inicio.getMonth());
      expect(diffMeses).toBe(6);
    });

    it('Medio Tiempo: debe ser 12 meses despues', () => {
      const inicio = new Date('2026-01-15T12:00:00Z');
      const fin = calcularFechaProyectadaFin(inicio, 'MEDIO_TIEMPO');
      // Verificar que la diferencia es de 12 meses
      const diffMeses = (fin.getFullYear() - inicio.getFullYear()) * 12
        + (fin.getMonth() - inicio.getMonth());
      expect(diffMeses).toBe(12);
    });

    it('debe lanzar error con jornada invalida', () => {
      expect(() => {
        calcularFechaProyectadaFin(new Date(), 'JORNADA_FALSA');
      }).toThrow('Jornada no valida');
    });
  });

  describe('calcularHorasRequeridas', () => {
    it('ambas jornadas requieren 880 horas', () => {
      expect(calcularHorasRequeridas('TIEMPO_COMPLETO')).toBe(880);
      expect(calcularHorasRequeridas('MEDIO_TIEMPO')).toBe(880);
    });
  });

  describe('calcularHorasPorSemana', () => {
    it('Tiempo Completo: 40 horas/semana (8h * 5d)', () => {
      expect(calcularHorasPorSemana('TIEMPO_COMPLETO')).toBe(40);
    });

    it('Medio Tiempo: 20 horas/semana (4h * 5d)', () => {
      expect(calcularHorasPorSemana('MEDIO_TIEMPO')).toBe(20);
    });
  });

  describe('calcularProgreso', () => {
    it('0 horas completadas = 0%', () => {
      const p = calcularProgreso(0, 880);
      expect(p.porcentaje).toBe(0);
      expect(p.horasFaltantes).toBe(880);
      expect(p.completado).toBe(false);
    });

    it('440 horas = 50%', () => {
      const p = calcularProgreso(440, 880);
      expect(p.porcentaje).toBe(50);
      expect(p.horasFaltantes).toBe(440);
      expect(p.completado).toBe(false);
    });

    it('880 horas = 100% y completado', () => {
      const p = calcularProgreso(880, 880);
      expect(p.porcentaje).toBe(100);
      expect(p.horasFaltantes).toBe(0);
      expect(p.completado).toBe(true);
    });

    it('mas de 880 horas no supera 100%', () => {
      const p = calcularProgreso(1000, 880);
      expect(p.porcentaje).toBe(100);
      expect(p.completado).toBe(true);
    });
  });

  describe('verificarRitmo', () => {
    it('con inicio hoy y 0 horas debe estar AL_DIA', () => {
      const hoy = new Date();
      const ritmo = verificarRitmo(hoy, 'TIEMPO_COMPLETO', 0);
      expect(ritmo.estado).toBe('AL_DIA');
      expect(ritmo.diasTranscurridos).toBe(0);
    });

    it('con inicio hace 30 dias y 0 horas debe estar ATRASADO', () => {
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);
      const ritmo = verificarRitmo(hace30dias, 'TIEMPO_COMPLETO', 0);
      expect(ritmo.estado).toBe('ATRASADO');
      expect(ritmo.diferencia).toBeLessThan(-20);
    });
  });

  describe('generarResumenCronograma', () => {
    it('sin configurar retorna { configurado: false }', () => {
      const stage = { cronogramaConfigurado: false, jornada: null };
      const resumen = generarResumenCronograma(stage);
      expect(resumen.configurado).toBe(false);
    });

    it('configurado sin fechaInicio retorna sin ritmo', () => {
      const stage = {
        cronogramaConfigurado: true,
        jornada: 'TIEMPO_COMPLETO',
        horasCompletadas: 100,
        horasRequeridas: 880,
        fechaInicio: null,
        fechaProyectadaFin: new Date('2026-07-15'),
      };
      const resumen = generarResumenCronograma(stage);
      expect(resumen.configurado).toBe(true);
      expect(resumen.jornada).toBe('TIEMPO_COMPLETO');
      expect(resumen.horasPorSemana).toBe(40);
      expect(resumen.ritmo).toBeUndefined();
    });

    it('configurado con fechaInicio retorna ritmo', () => {
      const stage = {
        cronogramaConfigurado: true,
        jornada: 'MEDIO_TIEMPO',
        horasCompletadas: 50,
        horasRequeridas: 880,
        fechaInicio: new Date(),
        fechaProyectadaFin: new Date('2027-01-15'),
      };
      const resumen = generarResumenCronograma(stage);
      expect(resumen.configurado).toBe(true);
      expect(resumen.ritmo).toBeDefined();
      expect(resumen.horasPorSemana).toBe(20);
    });
  });
});

// --- 4. Google Drive Service (modo desarrollo) ---
import driveService from '../src/modules/documents-dev2/drive.service.js';

describe('Google Drive Service - Modo Desarrollo', () => {
  it('crearCarpeta devuelve objeto con id, name, webViewLink', async () => {
    const carpeta = await driveService.crearCarpeta('TEST_FOLDER', 'parent123');
    expect(carpeta).toHaveProperty('id');
    expect(carpeta).toHaveProperty('name', 'TEST_FOLDER');
    expect(carpeta).toHaveProperty('webViewLink');
    expect(carpeta.id).toContain('dev_');
  });

  it('subirArchivo devuelve objeto con viewUrl', async () => {
    const archivo = await driveService.subirArchivo(
      Buffer.from('test content'),
      'test.pdf',
      'application/pdf',
      'folder123'
    );
    expect(archivo).toHaveProperty('id');
    expect(archivo).toHaveProperty('name', 'test.pdf');
    expect(archivo).toHaveProperty('webViewLink');
    expect(archivo.id).toContain('dev_file_');
  });

  it('crearEstructuraCarpetas crea INSTRUCTOR > FICHA > APRENDIZ > BITACORAS + DOCUMENTOS', async () => {
    const result = await driveService.crearEstructuraCarpetas({
      instructorNombre: 'Juan Perez',
      fichaNumero: '2345678',
      aprendizDocumento: '1234567890',
      aprendizNombre: 'Santiago Cisneros',
    });

    expect(result).toHaveProperty('instructor');
    expect(result).toHaveProperty('ficha');
    expect(result).toHaveProperty('aprendiz');
    expect(result).toHaveProperty('bitacoras');
    expect(result).toHaveProperty('documentos');

    // Verificar nombres de carpetas
    expect(result.instructor.name).toBe('INSTRUCTOR_Juan_Perez');
    expect(result.ficha.name).toBe('FICHA_2345678');
    expect(result.aprendiz.name).toBe('1234567890_Santiago_Cisneros');
    expect(result.bitacoras.name).toBe('BITACORAS');
    expect(result.documentos.name).toBe('DOCUMENTOS');
  });

  it('subirDocumentoEP retorna viewUrl y driveFileId', async () => {
    const result = await driveService.subirDocumentoEP(
      Buffer.from('pdf fake content'),
      'rut.pdf',
      'folder123'
    );
    expect(result).toHaveProperty('driveFileId');
    expect(result).toHaveProperty('viewUrl');
    expect(result).toHaveProperty('downloadUrl');
    expect(result).toHaveProperty('fileName', 'rut.pdf');
  });
});

// --- 5. Radicado Generator ---
// (Requiere MongoDB - test basico de formato)
describe('Radicado - Formato esperado', () => {
  it('formato debe ser REP-YYYY-NNN', () => {
    const regex = /^REP-\d{4}-\d{3}$/;
    expect(regex.test('REP-2026-001')).toBe(true);
    expect(regex.test('REP-2026-123')).toBe(true);
    expect(regex.test('REP2026001')).toBe(false);
    expect(regex.test('RAD-2026-001')).toBe(false);
  });
});
