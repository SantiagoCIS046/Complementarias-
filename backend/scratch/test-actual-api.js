async function testLogin(email, password) {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const status = res.status;
    const body = await res.json();
    console.log(`[TEST] ${email} / ${password} -> Status: ${status}`, body);
  } catch (err) {
    console.error(`[TEST ERROR] ${email} ->`, err.message);
  }
}

async function run() {
  console.log('--- TESTING CORRECT CREDENTIALS ---');
  await testLogin('santiagocisneros046@gmail.com', 'sena2024');

  console.log('--- TESTING INCORRECT CREDENTIALS ---');
  await testLogin('santiagocisneros046@gmail.com', 'wrongpassword');

  console.log('--- TESTING EMPTY PASSWORD ---');
  await testLogin('santiagocisneros046@gmail.com', '');
  
  console.log('--- TESTING MISSING PASSWORD FIELD ---');
  await testLogin('santiagocisneros046@gmail.com', undefined);
}

run();
