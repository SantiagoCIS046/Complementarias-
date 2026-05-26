const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../src/modules/users-dev1/user.model');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    const users = await User.find({}).select('+password');
    for (const u of users) {
      console.log(`\nUser: ${u.email} (${u.role})`);
      console.log(`Current Hash: ${u.password}`);
      
      // Test direct sena2024
      const matchesSena = await bcrypt.compare('sena2024', u.password);
      console.log(`  Matches 'sena2024': ${matchesSena}`);

      // Test document
      if (u.documento) {
        const matchesDoc = await bcrypt.compare(u.documento, u.password);
        console.log(`  Matches documento (${u.documento}): ${matchesDoc}`);
      }

      // Test "undefined"
      const matchesUndefined = await bcrypt.compare('undefined', u.password);
      console.log(`  Matches 'undefined': ${matchesUndefined}`);

      // Test "null"
      const matchesNull = await bcrypt.compare('null', u.password);
      console.log(`  Matches 'null': ${matchesNull}`);

      // Test double hashing of 'sena2024'
      // Since bcrypt is salted, we can't easily double-hash without checking if the hash itself was hashed.
      // But we can check if the hash in DB matches the hash of a typical bcrypt hash pattern.
      // We can try to see if any string starting with $2a$10$ matches the hash.
      // Let's see if we can extract possible candidates or just test if we hash a bcrypt hash.
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
