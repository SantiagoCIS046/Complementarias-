const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('./modules/users-dev1/user.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'santiagocisneros046@gmail.com' });
    console.log('USER FROM DB:', JSON.stringify(user, null, 2));
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
check();
