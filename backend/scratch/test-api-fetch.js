// test-api-fetch.js - Llama a la API real usando fetch (Node native)
async function test() {
  const email = 'martin@gmail.com'; 
  const password = 'martin123';

  try {
    console.log('🔑 Logueando como:', email);
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error('❌ Error Login:', loginData);
        return;
    }

    const token = loginData.data.token;
    console.log('✅ Token obtenido');

    console.log('📡 Llamando a /api/productive-stages...');
    const apiRes = await fetch('http://localhost:3000/api/productive-stages', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const apiData = await apiRes.json();
    if (!apiRes.ok) {
      console.error('❌ ERROR API (Status ' + apiRes.status + '):', apiData);
    } else {
      console.log('✅ Éxito!', apiData);
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  }
}

test();
