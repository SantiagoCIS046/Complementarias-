// =============================================
// Tests: Verificacion de integridad de todos los modulos
// Verifica que los imports no estan rotos y que los
// exports son consistentes.
// =============================================

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

// --- Archivos que DEBEN existir ---
describe('Estructura del proyecto - Archivos criticos', () => {
  const archivosCore = [
    'src/app.js',
    'src/server.js',
    'src/core/config/db.js',
    'src/core/config/env.js',
    'src/core/utils/enums.js',
    'src/core/middlewares/auth.middleware.js',
    'src/core/middlewares/roles.middleware.js',
  ];

  archivosCore.forEach((archivo) => {
    it(`debe existir ${archivo}`, () => {
      expect(existsSync(resolve(ROOT, archivo))).toBe(true);
    });
  });
});

describe('Estructura DEV 2 - Archivos de modulos', () => {
  const archivosDev2 = [
    'src/modules/productive-stages-dev2/productive-stage.model.js',
    'src/modules/productive-stages-dev2/productive-stages.service.js',
    'src/modules/productive-stages-dev2/productive-stages.controller.js',
    'src/modules/productive-stages-dev2/productive-stages.routes.js',
    'src/modules/productive-stages-dev2/stateMachine.js',
    'src/modules/productive-stages-dev2/elegibility.js',
    'src/modules/productive-stages-dev2/radicadoGenerator.js',
    'src/modules/productive-stages-dev2/scheduleCalculator.js',
    'src/modules/companies-dev2/company.model.js',
    'src/modules/companies-dev2/companies.service.js',
    'src/modules/companies-dev2/companies.controller.js',
    'src/modules/companies-dev2/companies.routes.js',
    'src/modules/documents-dev2/document.model.js',
    'src/modules/documents-dev2/documents.service.js',
    'src/modules/documents-dev2/documents.controller.js',
    'src/modules/documents-dev2/documents.routes.js',
    'src/modules/documents-dev2/drive.service.js',
  ];

  archivosDev2.forEach((archivo) => {
    it(`debe existir ${archivo}`, () => {
      expect(existsSync(resolve(ROOT, archivo))).toBe(true);
    });
  });
});

// --- Verificacion de imports/exports de DEV 2 ---
describe('DEV 2 - Imports/Exports de logica pura (sin MongoDB)', () => {
  it('enums exporta todas las constantes necesarias', () => {
    const e = require('../src/core/utils/enums');
    expect(e).toHaveProperty('ROLES');
    expect(e).toHaveProperty('ESTADO_EP');
    expect(e).toHaveProperty('ESTADO_ETAPA');
    expect(e).toHaveProperty('TRANSICIONES_EP');
    expect(e).toHaveProperty('TIPO_FORMACION');
    expect(e).toHaveProperty('MODALIDAD_EP');
    expect(e).toHaveProperty('JORNADA');
    expect(e).toHaveProperty('CRONOGRAMA_CONFIG');
    expect(e).toHaveProperty('TIPO_DOCUMENTO');
    expect(e).toHaveProperty('DOCUMENTOS_REGISTRO_OBLIGATORIOS');
    expect(e).toHaveProperty('DOCUMENTOS_CERTIFICACION_OBLIGATORIOS');
    expect(e).toHaveProperty('ESTADO_DOCUMENTO');
    expect(e).toHaveProperty('TIPO_NOVEDAD');
  });

  it('stateMachine exporta funciones correctas', () => {
    const sm = require('../src/modules/productive-stages-dev2/stateMachine');
    expect(typeof sm.esTransicionValida).toBe('function');
    expect(typeof sm.obtenerTransicionesDisponibles).toBe('function');
    expect(typeof sm.ejecutarTransicion).toBe('function');
  });

  it('scheduleCalculator exporta funciones correctas', () => {
    const sc = require('../src/modules/productive-stages-dev2/scheduleCalculator');
    expect(typeof sc.calcularFechaProyectadaFin).toBe('function');
    expect(typeof sc.calcularHorasRequeridas).toBe('function');
    expect(typeof sc.calcularHorasPorSemana).toBe('function');
    expect(typeof sc.calcularProgreso).toBe('function');
    expect(typeof sc.verificarRitmo).toBe('function');
    expect(typeof sc.generarResumenCronograma).toBe('function');
  });

  it('drive.service exporta funciones correctas', () => {
    const ds = require('../src/modules/documents-dev2/drive.service');
    expect(typeof ds.getDriveClient).toBe('function');
    expect(typeof ds.crearCarpeta).toBe('function');
    expect(typeof ds.subirArchivo).toBe('function');
    expect(typeof ds.crearEstructuraCarpetas).toBe('function');
    expect(typeof ds.subirDocumentoEP).toBe('function');
  });

  it('auth.middleware exporta verifyToken', () => {
    const am = require('../src/core/middlewares/auth.middleware');
    expect(typeof am.verifyToken).toBe('function');
  });

  it('roles.middleware exporta checkRole', () => {
    const rm = require('../src/core/middlewares/roles.middleware');
    expect(typeof rm.checkRole).toBe('function');
  });
});

// --- Verificacion de DEV 1 ---
describe('DEV 1 - Verificacion de modulos', () => {
  it('auth.service.js usa prisma en vez de mongoose (BUG)', () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      resolve(ROOT, 'src/modules/auth-dev1/auth.service.js'), 'utf8'
    );
    // ALERTA: El Dev 1 importa prisma pero db.js exporta connectDB (mongoose)
    const usaPrisma = content.includes("require('../../core/config/db')");
    expect(usaPrisma).toBe(true);
    // Esto ROMPE en runtime porque db.js no exporta un cliente prisma
  });

  it('users.service.js usa prisma en vez de mongoose (BUG)', () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      resolve(ROOT, 'src/modules/users-dev1/users.service.js'), 'utf8'
    );
    const usaPrisma = content.includes("require('../../core/config/db')");
    expect(usaPrisma).toBe(true);
  });

  it('system-config.service.js usa prisma en vez de mongoose (BUG)', () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      resolve(ROOT, 'src/modules/system-config-dev1/system-config.service.js'), 'utf8'
    );
    const usaPrisma = content.includes("require('../../core/config/db')");
    expect(usaPrisma).toBe(true);
  });

  it('NOTA: auth.routes.js tiene todas las rutas comentadas (no funcional)', () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      resolve(ROOT, 'src/modules/auth-dev1/auth.routes.js'), 'utf8'
    );
    // La ruta esta comentada
    expect(content.includes('// router.get')).toBe(true);
    // No hay ninguna ruta activa
    expect(content.includes("router.post")).toBe(false);
  });
});

// --- Verificacion de DEV 3 ---
describe('DEV 3 - Verificacion de modulos', () => {
  const modulosDev3 = [
    { name: 'bitacoras', path: 'src/modules/bitacoras-dev3/bitacoras.service.js' },
    { name: 'trackings', path: 'src/modules/trackings-dev3/trackings.service.js' },
    { name: 'hours', path: 'src/modules/hours-dev3/hours.service.js' },
    { name: 'novelties', path: 'src/modules/novelties-dev3/novelties.service.js' },
  ];

  modulosDev3.forEach(({ name, path: filePath }) => {
    it(`${name}.service.js usa prisma en vez de mongoose (BUG)`, () => {
      const fs = require('fs');
      const content = fs.readFileSync(resolve(ROOT, filePath), 'utf8');
      const usaPrisma = content.includes("require('../../core/config/db')");
      expect(usaPrisma).toBe(true);
    });
  });

  modulosDev3.forEach(({ name }) => {
    it(`${name}.routes.js tiene todas las rutas comentadas (no funcional)`, () => {
      const fs = require('fs');
      const routesFile = `src/modules/${name}-dev3/${name}.routes.js`;
      const content = fs.readFileSync(resolve(ROOT, routesFile), 'utf8');
      expect(content.includes('// router.get')).toBe(true);
    });
  });
});

// --- Verificacion de app.js (router mounting) ---
describe('app.js - Montaje de rutas', () => {
  it('debe montar todas las rutas de los 3 devs', () => {
    const fs = require('fs');
    const content = fs.readFileSync(resolve(ROOT, 'src/app.js'), 'utf8');

    // DEV 1
    expect(content).toContain('/api/auth');
    expect(content).toContain('/api/users');
    expect(content).toContain('/api/system-config');

    // DEV 2
    expect(content).toContain('/api/productive-stages');
    expect(content).toContain('/api/companies');
    expect(content).toContain('/api/documents');

    // DEV 3
    expect(content).toContain('/api/bitacoras');
    expect(content).toContain('/api/trackings');
    expect(content).toContain('/api/hours');
    expect(content).toContain('/api/novelties');
  });

  it('debe tener ruta de health check', () => {
    const fs = require('fs');
    const content = fs.readFileSync(resolve(ROOT, 'src/app.js'), 'utf8');
    expect(content).toContain('/api/health');
  });
});
