// =============================================
// Tests: Verificacion de integridad de todos los modulos
// Verifica que los bugs de Prisma han sido corregidos
// y que las rutas estan activas.
// =============================================

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
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

describe('Estructura de modulos - Modelos de Mongoose', () => {
  const modelos = [
    'src/modules/users-dev1/user.model.js',
    'src/modules/system-config-dev1/system-config.model.js',
    'src/modules/companies-dev2/company.model.js',
    'src/modules/productive-stages-dev2/productive-stage.model.js',
    'src/modules/documents-dev2/document.model.js',
    'src/modules/bitacoras-dev3/bitacora.model.js',
    'src/modules/hours-dev3/hour.model.js',
    'src/modules/trackings-dev3/tracking.model.js',
    'src/modules/novelties-dev3/novelty.model.js',
  ];

  modelos.forEach((archivo) => {
    it(`debe existir el modelo ${archivo}`, () => {
      expect(existsSync(resolve(ROOT, archivo))).toBe(true);
    });
  });
});

// --- Verificacion de correccion de bugs (No mas Prisma) ---
describe('Verificacion de servicios - Uso de Mongoose (CERO PRISMA)', () => {
  const servicios = [
    'src/modules/auth-dev1/auth.service.js',
    'src/modules/users-dev1/users.service.js',
    'src/modules/system-config-dev1/system-config.service.js',
    'src/modules/bitacoras-dev3/bitacoras.service.js',
    'src/modules/trackings-dev3/trackings.service.js',
    'src/modules/hours-dev3/hours.service.js',
    'src/modules/novelties-dev3/novelties.service.js',
  ];

  servicios.forEach((filePath) => {
    it(`${filePath} debe usar Mongoose y NO Prisma`, () => {
      const content = readFileSync(resolve(ROOT, filePath), 'utf8');
      
      // No debe contener la importacion erronea de Prisma
      expect(content).not.toContain("const prisma = require('../../core/config/db')");
      
      // Debe contener importacion de algun modelo o mongoose
      const usaMongoose = content.includes("require('mongoose')") || 
                          content.includes(".model'") ||
                          content.includes("Model'");
      expect(usaMongoose).toBe(true);
    });
  });
});

// --- Verificacion de rutas activas ---
describe('Verificacion de rutas - Endpoints activos (SIN COMENTAR)', () => {
  const rutas = [
    'src/modules/auth-dev1/auth.routes.js',
    'src/modules/users-dev1/users.routes.js',
    'src/modules/bitacoras-dev3/bitacoras.routes.js',
    'src/modules/trackings-dev3/trackings.routes.js',
    'src/modules/hours-dev3/hours.routes.js',
    'src/modules/novelties-dev3/novelties.routes.js',
  ];

  rutas.forEach((filePath) => {
    it(`${filePath} debe tener rutas activas`, () => {
      const content = readFileSync(resolve(ROOT, filePath), 'utf8');
      
      // Debe tener al menos un router.post, router.get o router.patch activo
      const tieneRutasActivas = content.includes('router.get(') || 
                               content.includes('router.post(') || 
                               content.includes('router.patch(') ||
                               content.includes('router.put(') ||
                               content.includes('router.delete(');
      
      expect(tieneRutasActivas).toBe(true);
    });
  });
});

// --- Verificacion de app.js (router mounting) ---
describe('app.js - Montaje de rutas', () => {
  it('debe montar todas las rutas de los 3 devs', () => {
    const content = readFileSync(resolve(ROOT, 'src/app.js'), 'utf8');

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
    const content = readFileSync(resolve(ROOT, 'src/app.js'), 'utf8');
    expect(content).toContain('/api/health');
  });
});
