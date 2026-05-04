// test-api.js - Llama a la API real con un token para ver el error
const axios = require('axios');

async function test() {
  const email = 'mancilla@gmail.com'; // Un aprendiz del seed
  const password = 'mancilla123';

  try {
    console.log('🔑 Logueando como:', email);
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password
    });

    const token = loginRes.data.data.token;
    console.log('✅ Token obtenido');

    console.log('📡 Llamando a /api/productive-stages...');
    const apiRes = await axios.get('http://localhost:3000/api/productive-stages', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Éxito!', apiRes.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ ERROR API (Status ' + err.response.status + '):', err.response.data);
    } else {
      console.error('❌ ERROR RED:', err.message);
    }
  }
}

test();
