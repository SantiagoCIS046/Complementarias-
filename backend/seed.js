// seed.js - DEV 1 | Agregando usuario de prueba personal
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/modules/users-dev1/user.model");
// const SystemConfig = require('./src/modules/system-config-dev1/SystemConfig.model');

async function main() {
  console.log("🌱 Limpiando y actualizando usuarios...");
  await mongoose.connect(process.env.MONGO_URI);

  // Limpiar usuarios existentes para evitar conflictos de duplicados
  await User.deleteMany({});

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 🛡️ DEV 1: USUARIOS DE ADMINISTRACIÓN (Seguridad y Gestión)
  const adminUsers = [
    {
      email: "santiago@repfora.com",
      documento: "1100976876",
      name: "Santiago Cisneros",
      role: "ADMIN",
    },
    {
      email: "santiagocisneros046@gmail.com",
      documento: "1100976877",
      name: "Santiago Personal",
      role: "ADMIN",
    },
  ];

  for (const u of adminUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      { ...u, password: hashedPassword, status: "ACTIVO", isFirstLogin: false },
      { upsert: true }
    );
  }

  // 🟢 DEV 2: USUARIOS APRENDICES (Flujo de Inicio y Documentos)
  const apprenticeUsers = [
    {
      email: "mancilla@gmail.com",
      documento: "99999999",
      name: "Aprendiz Mancilla",
      role: "APRENDIZ",
    },
    {
      email: "carlos@gmail.com",
      documento: "77777777",
      name: "Aprendiz Carlos",
      role: "APRENDIZ",
    },
  ];

  for (const u of apprenticeUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        ...u,
        password: await bcrypt.hash(
          u.name.split(" ")[1].toLowerCase() + "123",
          10
        ),
        status: "ACTIVO",
      },
      { upsert: true }
    );
  }

  // 🔵 DEV 3: USUARIOS INSTRUCTORES (Seguimiento y Bitácoras)
  const instructorUsers = [
    {
      email: "martin@gmail.com",
      documento: "88888888",
      name: "Instructor Martin",
      role: "INSTRUCTOR",
    },
    {
      email: "elena@gmail.com",
      documento: "66666666",
      name: "Instructora Eliana",
      role: "INSTRUCTOR",
    },
  ];

  for (const u of instructorUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        ...u,
        password: await bcrypt.hash(
          u.name.split(" ")[1].toLowerCase() + "123",
          10
        ),
        status: "ACTIVO",
      },
      { upsert: true }
    );
  }

  console.log("✅ Base de datos poblada con éxito");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
