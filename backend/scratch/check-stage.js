const mongoose = require('mongoose');
const User = require('../src/modules/users-dev1/user.model');
const Company = require('../src/modules/companies-dev2/company.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const connectDB = require('../src/core/config/db');

const checkStage = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'mancilla@gmail.com' });
  if (user) {
    const stage = await ProductiveStage.findOne({ apprenticeId: user._id })
      .populate('companyId')
      .lean();
    console.log('--- PRODUCTIVE STAGE ---');
    console.log(JSON.stringify(stage, null, 2));
  } else {
    console.log('User not found.');
  }
  process.exit(0);
};

checkStage();
