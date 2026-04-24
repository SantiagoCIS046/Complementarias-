// User.model.js  🟢 DEV 1 | Modelo de Usuario (Mongoose)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name:     { type: String, trim: true },
    role:     { type: String, enum: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ', 'EMPRESA'], default: 'APRENDIZ' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
