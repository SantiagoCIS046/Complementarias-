async function testLogin(email, password) {
  try {
    console.log(`🔑 Intentando loguear: ${email} / ${password}...`);
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error(`❌ Falló Login para ${email}:`, loginData);
        return;
    }

    console.log(`✅ Login Exitoso para ${email}! Rol: ${loginData.data.usuario.role}`);
  } catch (err) {
    console.error(`❌ ERROR para ${email}:`, err.message);
  }
}

async function run() {
  // Esperar un momento para asegurar que el server responda (debería estar corriendo según ADDITIONAL_METADATA)
  await testLogin('santiagocisneros046@gmail.com', 'sena2024');
  await testLogin('martin@gmail.com', 'sena2024');
  await testLogin('mancilla@gmail.com', 'sena2024');
}

run();
