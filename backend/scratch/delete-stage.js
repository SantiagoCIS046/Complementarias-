const mongoose = require('mongoose');
const User = require('../src/modules/users-dev1/user.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const connectDB = require('../src/core/config/db');

const deleteStage = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'mancilla@gmail.com' });
  if (user) {
    const res = await ProductiveStage.deleteMany({ apprenticeId: user._id });
    console.log(`DELETED ${res.deletedCount} STAGES FOR USER:`, user.email);
    const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
    const resBit = await Bitacora.deleteMany({ apprenticeId: user._id });
    console.log(`DELETED ${resBit.deletedCount} BITACORAS FOR USER:`, user.email);
  } else {
    console.log('User not found.');
  }
  process.exit(0);
};

deleteStage();
