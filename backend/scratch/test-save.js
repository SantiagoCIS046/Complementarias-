const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../src/modules/users-dev1/user.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // 1. Fetch user WITH password, increment login attempts, save.
    // This simulates the failed login attempt save
    let userWithPass = await User.findOne({ email: 'elena@gmail.com' }).select('+password');
    const oldHashWithPass = userWithPass.password;
    console.log('Original Elena Hash (with pass):', oldHashWithPass);
    console.log('isModified password before modification:', userWithPass.isModified('password'));
    
    // Simulate updating something else
    userWithPass.loginAttempts = (userWithPass.loginAttempts || 0) + 1;
    console.log('isModified password after other field modification:', userWithPass.isModified('password'));
    
    await userWithPass.save();
    
    let reloadedUser = await User.findOne({ email: 'elena@gmail.com' }).select('+password');
    console.log('Elena Hash after save (with pass):', reloadedUser.password);
    console.log('Is it the same?:', oldHashWithPass === reloadedUser.password);
    
    // Reset Elena attempts
    reloadedUser.loginAttempts = 0;
    await reloadedUser.save();

    // 2. Fetch user WITHOUT password, modify something else, save.
    // This simulates a normal save (e.g. forgotPassword token save)
    let userWithoutPass = await User.findOne({ email: 'dpalacio@soy.sena.edu.co' });
    console.log('dpalacio password value (should be undefined):', userWithoutPass.password);
    console.log('isModified password (no pass select):', userWithoutPass.isModified('password'));
    
    userWithoutPass.lastRegistrationReminderSent = new Date();
    console.log('isModified password after other field mod:', userWithoutPass.isModified('password'));
    
    await userWithoutPass.save();
    
    let reloadedUser2 = await User.findOne({ email: 'dpalacio@soy.sena.edu.co' }).select('+password');
    console.log('dpalacio Hash after save:', reloadedUser2.password);
    
    const matchesSena = await bcrypt.compare('sena2024', reloadedUser2.password);
    console.log('dpalacio still matches sena2024?:', matchesSena);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
