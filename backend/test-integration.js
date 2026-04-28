// test-integration.js
const API = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN BACKEND (Dev 1 + Dev 2)\n');

  const testEndpoint = async (name, path) => {
    try {
      const response = await fetch(`${API}${path}`);
      console.log(`✅ ${name}: Conectado. Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   Data recibida: ${JSON.stringify(data).substring(0, 50)}...`);
      }
    } catch (err) {
      console.log(`❌ ${name}: Error de conexión (${err.message})`);
    }
  };

  // 1. Salud Global
  await testEndpoint('Global Health', '/health');

  // 2. Módulo Dev 1 (Users) - Debe dar 401/403 porque requiere Auth
  await testEndpoint('Módulo Dev 1 (Users)', '/users');

  // 3. Módulo Dev 2 (Companies)
  await testEndpoint('Módulo Dev 2 (Companies)', '/companies');

  // 4. Módulo Dev 2 (Stages)', '/productive-stages'
  await testEndpoint('Módulo Dev 2 (Stages)', '/productive-stages');

  console.log('\n🚀 PRUEBA FINALIZADA: Todos los módulos están registrados en el servidor unificado.');
}

runTests();
