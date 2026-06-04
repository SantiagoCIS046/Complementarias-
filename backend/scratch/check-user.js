const mongoose = require('mongoose');
const User = require('../src/modules/users-dev1/user.model');
const connectDB = require('../src/core/config/db');

const unlock = async () => {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: 'mancilla@gmail.com' },
    { loginAttempts: 0, lockUntil: null },
    { new: true }
  );
  console.log('UNLOCKED USER IN DB:', user);
  process.exit(0);
};

unlock();
