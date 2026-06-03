const mongoose = require('mongoose');
const User = require('../src/modules/users-dev1/user.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const connectDB = require('../src/core/config/db');

const checkDb = async () => {
  await connectDB();
  
  console.log('--- USERS (INSTRUCTORS) ---');
  const instructors = await User.find({ role: 'INSTRUCTOR' }).lean();
  instructors.forEach(i => {
    console.log(`ID: ${i._id}, Name: ${i.name}, Email: ${i.email}, Program: ${i.programa}, Type: ${i.tipoInstructor}`);
  });

  console.log('\n--- APRENDIZ (JUAN MANCILLA) ---');
  const apprentice = await User.findOne({ email: 'mancilla@gmail.com' }).lean();
  if (apprentice) {
    console.log(`ID: ${apprentice._id}, Name: ${apprentice.name}, Ficha: ${apprentice.ficha}`);
    console.log(`instructorAsignado: ${apprentice.instructorAsignado}`);
    console.log(`instructorTecnico: ${apprentice.instructorTecnico}`);
    console.log(`instructorProyecto: ${apprentice.instructorProyecto}`);
  } else {
    console.log('Apprentice Juan Mancilla not found.');
  }

  console.log('\n--- STAGES IN DATABASE ---');
  const stages = await ProductiveStage.find().lean();
  for (const s of stages) {
    const app = await User.findById(s.apprenticeId).lean();
    console.log(`Stage ID: ${s._id}`);
    console.log(`Apprentice: ${app ? app.name : 'Unknown'} (${app ? app.email : 'N/A'})`);
    console.log(`Ficha: ${s.ficha}`);
    console.log(`Estado: ${s.estado}`);
    console.log(`companySnapshot razonSocial: ${s.companySnapshot?.razonSocial}`);
  }

  process.exit(0);
};

checkDb();
