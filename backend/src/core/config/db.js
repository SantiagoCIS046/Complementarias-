// =============================================
// db.js - Conexión a la base de datos (Prisma)
// =============================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
