// =============================================
// verify-all.js - Script de verificación completa DEV 3
// Uso: node backend/verify-all.js
// =============================================

const { execSync, spawn } = require('child_process');
const http   = require('http');
const path   = require('path');

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const BACKEND = __dirname; // el script vive en /backend/verify-all.js
let errorsFound = 0;

const ok  = (msg) => console.log(`  ${GREEN}✅ ${msg}${RESET}`);
const err = (msg) => { console.log(`  ${RED}❌ ${msg}${RESET}`); errorsFound++; };
const warn = (msg) => console.log(`  ${YELLOW}⚠️  ${msg}${RESET}`);
const section = (title) => console.log(`\n${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n${BOLD}  ${title}${RESET}`);

// ── 1. VERIFICACIÓN DE SINTAXIS ──────────────────────────────────────────────
const checkSyntax = () => {
  section('1/4  VERIFICACIÓN DE SINTAXIS');

  const files = [
    // Core
    'src/app.js',
    'src/server.js',
    'src/core/config/db.js',
    'src/core/config/env.js',
    'src/core/middlewares/auth.middleware.js',
    'src/core/middlewares/roles.middleware.js',
    'src/core/utils/logger.js',
    'src/core/utils/configHelper.js',
    'src/core/utils/jwt.js',
    'src/core/jobs/alert.job.js',
    // DEV 3 - Bitacoras
    'src/modules/bitacoras-dev3/bitacoras.routes.js',
    'src/modules/bitacoras-dev3/bitacoras.controller.js',
    'src/modules/bitacoras-dev3/bitacoras.service.js',
    'src/modules/bitacoras-dev3/models/bitacora.model.js',
    'src/modules/bitacoras-dev3/models/audit-log.model.js',
    // DEV 3 - Trackings
    'src/modules/trackings-dev3/trackings.routes.js',
    'src/modules/trackings-dev3/trackings.controller.js',
    'src/modules/trackings-dev3/trackings.service.js',
    'src/modules/trackings-dev3/models/tracking.model.js',
    // DEV 3 - Hours & Novelties
    'src/modules/hours-dev3/hours.routes.js',
    'src/modules/novelties-dev3/novelties.routes.js',
    // DEV 1 (referencia)
    'src/modules/auth-dev1/auth.routes.js',
    'src/modules/users-dev1/users.routes.js',
    'src/modules/notifications-service/notifications.routes.js',
  ];

  let syntaxErrors = 0;
  for (const file of files) {
    const fullPath = path.join(BACKEND, file);
    try {
      execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      ok(file);
    } catch (e) {
      err(`SINTAXIS ERROR: ${file}\n     ${e.stderr?.toString().trim()}`);
      syntaxErrors++;
    }
  }
  if (syntaxErrors === 0) ok(`Todos los archivos (${files.length}) tienen sintaxis válida`);
};

// ── 2. VERIFICACIÓN DE .ENV ──────────────────────────────────────────────────
const checkEnv = () => {
  section('2/4  VERIFICACIÓN DE .ENV');
  const fs = require('fs');
  const envPath = path.join(BACKEND, '.env');

  if (!fs.existsSync(envPath)) {
    err('.env no encontrado en /backend');
    return;
  }
  ok('.env existe');

  const content = fs.readFileSync(envPath, 'utf8');
  const required = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'FRONTEND_URL'];
  for (const key of required) {
    if (content.includes(`${key}=`) && !content.includes(`${key}=\n`) && !content.includes(`${key}=\r`)) {
      const line = content.split('\n').find(l => l.startsWith(`${key}=`));
      const val = line?.split('=')[1]?.trim();
      if (val && val.length > 0) {
        ok(`${key} → ${key === 'JWT_SECRET' ? val.substring(0,8) + '...' : val.substring(0, 40) + (val.length > 40 ? '...' : '')}`);
      } else {
        warn(`${key} está definido pero vacío`);
      }
    } else {
      err(`${key} no está definido en .env`);
    }
  }
};

// ── 3. ARRANQUE DEL SERVIDOR + PRUEBA DE CONEXIÓN ────────────────────────────
const checkEndpoint = (path) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ status: res.statusCode, ok: true });
    });
    req.on('error', (e) => resolve({ status: null, ok: false, error: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: null, ok: false, error: 'TIMEOUT' }); });
  });
};

const checkServer = () => {
  return new Promise((resolve) => {
    section('3/4  ARRANQUE DEL SERVIDOR');

    const serverPath = path.join(BACKEND, 'src', 'server.js');
    const server = spawn('node', [serverPath], {
      cwd: BACKEND,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let started = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(`  ${BLUE}[server]${RESET} ${data.toString().trim()}\n`);
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        output += msg;
        process.stdout.write(`  ${RED}[server-err]${RESET} ${msg}\n`);
      }
    });

    // Esperar hasta que el servidor esté listo
    const pollReady = setInterval(async () => {
      if (output.includes('Servidor corriendo')) {
        clearInterval(pollReady);
        started = true;

        if (output.includes('CONEXIÓN EXITOSA')) {
          ok('Servidor arrancó correctamente');
          ok('Conectado a MongoDB Atlas');
        } else if (output.includes('ERROR DE CONEXIÓN')) {
          err('Error de conexión a MongoDB');
        }

        // Dar 500ms extra al servidor para registrar rutas
        await new Promise(r => setTimeout(r, 500));
        resolve({ server, started: true });
      }
    }, 200);

    // Timeout si no arranca en 15 segundos
    setTimeout(() => {
      clearInterval(pollReady);
      if (!started) {
        err('El servidor no arrancó en 15 segundos');
        server.kill();
        resolve({ server, started: false });
      }
    }, 15000);
  });
};

const checkEndpoints = async () => {
  section('4/4  PRUEBA DE ENDPOINTS');

  const endpoints = [
    { name: 'GET /api/health          ', path: '/api/health',       expected: 200, label: '200 OK' },
    { name: 'GET /api/bitacoras       ', path: '/api/bitacoras',    expected: 401, label: '401 sin token ✓' },
    { name: 'GET /api/trackings       ', path: '/api/trackings',    expected: 401, label: '401 sin token ✓' },
    { name: 'GET /api/hours           ', path: '/api/hours',        expected: 401, label: '401 sin token ✓' },
    { name: 'GET /api/novelties       ', path: '/api/novelties',    expected: 401, label: '401 sin token ✓' },
    { name: 'GET /api/users           ', path: '/api/users',        expected: 401, label: '401 sin token ✓' },
    { name: 'GET /api/notifications   ', path: '/api/notifications', expected: 401, label: '401 sin token ✓' },
  ];

  let passed = 0;
  for (const test of endpoints) {
    const result = await checkEndpoint(test.path);
    if (!result.ok) {
      err(`${test.name} → Error de conexión: ${result.error}`);
    } else if (result.status === test.expected) {
      ok(`${test.name} → ${result.status} ${test.label}`);
      passed++;
    } else {
      err(`${test.name} → Status ${result.status} (esperado: ${test.expected})`);
    }
  }
  return passed;
};

// ── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${BLUE}${BOLD}╔══════════════════════════════════════════════╗`);
  console.log(`║   RepFora - Verificación Completa DEV 3      ║`);
  console.log(`╚══════════════════════════════════════════════╝${RESET}`);

  // Paso 1: Sintaxis
  checkSyntax();

  // Paso 2: .env
  checkEnv();

  // Paso 3 + 4: Servidor + Endpoints
  const { server, started } = await checkServer();

  let endpointsPassed = 0;
  if (started) {
    endpointsPassed = await checkEndpoints();
    server.kill();
  }

  // ── REPORTE FINAL ──────────────────────────────────────────────────────────
  section('REPORTE FINAL');

  if (errorsFound === 0) {
    console.log(`\n  ${GREEN}${BOLD}🎉 VERIFICACIÓN COMPLETA EXITOSA`);
    console.log(`  ✅ Sin errores de sintaxis`);
    console.log(`  ✅ .env correctamente configurado`);
    console.log(`  ✅ Servidor arranca y conecta a MongoDB Atlas`);
    console.log(`  ✅ ${endpointsPassed}/7 endpoints respondiendo correctamente${RESET}`);
    console.log(`\n  ${BLUE}Para arrancar en desarrollo: ${BOLD}npm run dev${RESET} (dentro de /backend)\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${RED}${BOLD}⚠️  Se encontraron ${errorsFound} error(es).`);
    console.log(`  Revisa los puntos marcados con ❌ arriba.${RESET}\n`);
    process.exit(1);
  }
})();
