const bcrypt = require('bcryptjs');

async function test() {
  try {
    const hash = await bcrypt.hash('sena2024', 10);
    console.log('Comparing with undefined...');
    await bcrypt.compare(undefined, hash);
  } catch (err) {
    console.error('Caught error for undefined:', err.message);
  }

  try {
    const hash = await bcrypt.hash('sena2024', 10);
    console.log('Comparing with null...');
    await bcrypt.compare(null, hash);
  } catch (err) {
    console.error('Caught error for null:', err.message);
  }
}

test();
