// =============================================
// test-integration.js
// Script de pruebas de integración para DEV 3
// Uso: node backend/test-integration.js
// =============================================

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[36m';
const RESET  = '\x1b[0m';

/**
 * Realiza una petición HTTP GET y retorna el status code
 */
const checkEndpoint = (path) => {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      resolve({ status: res.statusCode, ok: true });
    });
    req.on('error', (err) => {
      resolve({ status: null, ok: false, error: err.message });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: null, ok: false, error: 'TIMEOUT' });
    });
  });
};

/**
 * Evalúa si el resultado es el esperado e imprime el reporte
 */
const evaluarResultado = (name, result, expectedStatus) => {
  if (!result.ok) {
    console.log(`${RED}❌ ${name}${RESET} → Error de conexión: ${result.error}`);
    console.log(`   ${YELLOW}⚠️  Verifica que el servidor esté corriendo en ${BASE_URL}${RESET}`);
    return false;
  }

  if (result.status === expectedStatus) {
    console.log(`${GREEN}✅ ${name}${RESET} → Conectado. Status: ${result.status}`);
    return true;
  } else {
    console.log(`${RED}⚠️  ${name}${RESET} → Status inesperado: ${result.status} (esperado: ${expectedStatus})`);
    return false;
  }
};

/**
 * Ejecuta todas las pruebas
 */
const runTests = async () => {
  console.log(`\n${BLUE}================================================`);
  console.log(`  RepFora - Pruebas de Integración DEV 3`);
  console.log(`  ${BASE_URL}`);
  console.log(`================================================${RESET}\n`);

  const tests = [
    // ── Salud general ────────────────────────────────
    { name: 'GET /api/health          [General]', path: '/api/health',    expected: 200 },

    // ── Módulos DEV 3 (sin token → 401) ─────────────
    { name: 'GET /api/bitacoras       [DEV3]',    path: '/api/bitacoras', expected: 401 },
    { name: 'GET /api/trackings       [DEV3]',    path: '/api/trackings', expected: 401 },
    { name: 'GET /api/hours           [DEV3]',    path: '/api/hours',     expected: 401 },
    { name: 'GET /api/novelties       [DEV3]',    path: '/api/novelties', expected: 401 },

    // ── Módulos DEV 1 (referencia) ───────────────────
    { name: 'GET /api/auth            [DEV1]',    path: '/api/auth',       expected: 404 },
    { name: 'GET /api/users           [DEV1]',    path: '/api/users',      expected: 401 },
    { name: 'GET /api/notifications   [DEV1]',    path: '/api/notifications', expected: 401 },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await checkEndpoint(test.path);
    const ok = evaluarResultado(test.name, result, test.expected);
    if (ok) passed++; else failed++;
  }

  console.log(`\n${BLUE}================================================`);
  console.log(`  Resultados: ${GREEN}${passed} OK${BLUE} | ${failed > 0 ? RED : GREEN}${failed} FALLIDOS${BLUE}`);
  console.log(`================================================${RESET}\n`);

  if (failed > 0) {
    console.log(`${YELLOW}⚠️  Acciones recomendadas:`);
    console.log(`   1. Asegúrate de que el servidor esté corriendo: npm run dev`);
    console.log(`   2. Verifica que el .env tenga MONGO_URI y JWT_SECRET correctos`);
    console.log(`   3. Revisa los logs del servidor para errores de arranque${RESET}\n`);
    process.exit(1);
  }

  process.exit(0);
};

runTests();
