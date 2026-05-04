// check-user.js - Verifica el usuario actual en la DB
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../src/modules/users-dev1/user.model');

  const users = await User.find({});
  console.log('👥 Usuarios en DB:', JSON.stringify(users.map(u => ({ 
    email: u.email, 
    role: u.role, 
    _id: u._id,
    status: u.status
  })), null, 2));

  await mongoose.disconnect();
}

test();
