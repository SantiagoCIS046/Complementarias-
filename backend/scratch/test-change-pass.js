const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../src/modules/users-dev1/user.model');
const authService = require('../src/modules/auth-dev1/auth.service');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Fetch Daniela Palacio
    const daniela = await User.findOne({ email: 'dpalacio@soy.sena.edu.co' });
    console.log('Original Daniela isFirstLogin:', daniela.isFirstLogin);

    // Call changePassword service just like the route does
    const newPass = 'Sena2024!';
    const result = await authService.changePassword(daniela._id, newPass);
    console.log('changePassword result:', result);

    // Reload Daniela and check password comparison
    const reloaded = await User.findById(daniela._id).select('+password');
    console.log('New Hash in DB:', reloaded.password);
    console.log('reloaded isFirstLogin:', reloaded.isFirstLogin);

    const matchesNew = await bcrypt.compare(newPass, reloaded.password);
    console.log(`Does it match '${newPass}'?:`, matchesNew);

    // Reset back to sena2024
    reloaded.password = 'sena2024';
    reloaded.isFirstLogin = true;
    await reloaded.save();
    console.log('Reset completed!');

    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
