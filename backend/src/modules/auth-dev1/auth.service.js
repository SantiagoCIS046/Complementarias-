// auth.service.js   🟢 DEV 1 | Autenticacion y seguridad
// =============================================
// Lógica de negocio para registro y login.
// Usa JWT para generar tokens de sesión.
// =============================================

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../users-dev1/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../core/config/env');
const { sendEmail } = require('../../core/utils/mailer');
const onedriveService = require('../documents-dev2/onedrive.service');
const driveService = require('../documents-dev2/drive.service');

/**
 * Registrar un nuevo usuario.
 */
const registrar = async ({ name, email, password, role, documento, telefono, ficha, programa, fechaFinLectiva, instructorAsignado, instructorTecnico, instructorProyecto, tipoProyecto, modalidades, tipoInstructor }) => {
  // Verificar que no exista el email
  const existe = await User.findOne({ email });
  if (existe) {
    throw new Error('Ya existe un usuario registrado con el email: ' + email);
  }

  // RF-ADM-15 Verificación de estado activo para instructores asignados
  const instructorFields = { instructorAsignado, instructorTecnico, instructorProyecto };
  for (const [fieldName, instId] of Object.entries(instructorFields)) {
    if (instId) {
      const inst = await User.findById(instId);
      if (!inst) {
        throw new Error(`El instructor asignado en ${fieldName} no existe.`);
      }
      if (inst.role !== 'INSTRUCTOR') {
        throw new Error(`El usuario asignado en ${fieldName} debe tener el rol de INSTRUCTOR.`);
      }
      if (inst.activo === false || inst.status === 'INACTIVO') {
        throw new Error(`El instructor asignado en ${fieldName} (${inst.name}) debe estar en estado activo.`);
      }
    }
  }

  const usuario = await User.create({
    name,
    email,
    password,
    role: role || 'APRENDIZ',
    documento,
    telefono,
    ficha,
    programa,
    fechaFinLectiva: fechaFinLectiva || null,
    instructorAsignado: instructorAsignado || null,
    instructorTecnico: instructorTecnico || null,
    instructorProyecto: instructorProyecto || null,
    tipoProyecto: tipoProyecto || null,
    modalidades: modalidades || [],
    tipoInstructor: (role === 'INSTRUCTOR') ? (tipoInstructor || null) : null,
  });

  // Si es un instructor, crear su carpeta de almacenamiento en OneDrive y Google Drive
  if (usuario.role === 'INSTRUCTOR') {
    try {
      const nombreInstructor = 'INSTRUCTOR_' + usuario.name.replace(/\s+/g, '_');
      
      // Crear en OneDrive
      try {
        const onedriveCarpeta = await onedriveService.crearCarpeta(nombreInstructor);
        usuario.onedriveFolderId = onedriveCarpeta.id;
      } catch (odErr) {
        console.error('[ONEDRIVE REGISTRATION ERROR]', odErr.message || odErr);
      }

      // Crear en Google Drive
      try {
        const driveCarpeta = await driveService.crearCarpeta(nombreInstructor);
        usuario.driveFolderId = driveCarpeta.id;
      } catch (drErr) {
        console.error('[DRIVE REGISTRATION ERROR]', drErr.message || drErr);
      }

      if (usuario.onedriveFolderId || usuario.driveFolderId) {
        await usuario.save();
      }
    } catch (err) {
      console.error('[STORAGE FOLDER CREATION ERROR]', err.message || err);
    }
  }

  // Generar token
  const token = generarToken(usuario);

  return {
    usuario: {
      _id:   usuario._id,
      name:  usuario.name,
      email: usuario.email,
      role:  usuario.role,
      tipoInstructor: usuario.tipoInstructor || null,
      fotoPerfil: usuario.fotoPerfil || null,
    },
    token,
  };
};

/**
 * Login de usuario.
 */
const login = async ({ email, password }) => {
  // Buscar usuario (incluyendo el campo password que tiene select: false)
  const usuario = await User.findOne({ email }).select('+password');
  if (!usuario) {
    throw new Error('Credenciales inválidas.');
  }

  // Verificar si la cuenta está bloqueada
  if (usuario.isLocked) {
    const minutosRestantes = Math.ceil((usuario.lockUntil - Date.now()) / 1000 / 60);
    throw new Error(`Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${minutosRestantes} minuto(s).`);
  }

  // Verificar contraseña
  const passwordValido = await usuario.comparePassword(password);
  if (!passwordValido) {
    // Incrementar intentos fallidos
    usuario.loginAttempts = (usuario.loginAttempts || 0) + 1;
    if (usuario.loginAttempts >= 3) {
      usuario.lockUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos
      await usuario.save();
      throw new Error('Cuenta bloqueada temporalmente por 2 minutos tras 3 intentos fallidos.');
    }
    await usuario.save();
    throw new Error('Credenciales inválidas.');
  }

  // Resetear intentos en login exitoso
  usuario.loginAttempts = 0;
  usuario.lockUntil = null;
  await usuario.save();

  // Verificar que esté activo
  if (usuario.status === 'INACTIVO') {
    throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
  }

  // Generar token
  const token = generarToken(usuario);

  return {
    usuario: {
      _id:          usuario._id,
      name:         usuario.name,
      email:        usuario.email,
      role:         usuario.role,
      tipoInstructor: usuario.tipoInstructor || null,
      isFirstLogin: usuario.isFirstLogin,
      fotoPerfil: usuario.fotoPerfil || null,
    },
    token,
  };
};

/**
 * Obtener perfil del usuario autenticado.
 */
const getPerfil = async (userId) => {
  const usuario = await User.findById(userId);
  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }
  return usuario;
};

/**
 * Generar JWT.
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      _id:            usuario._id,
      name:           usuario.name,
      email:          usuario.email,
      role:           usuario.role,
      tipoInstructor: usuario.tipoInstructor || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Solicitar restablecimiento de contraseña.
 * Genera un token temporal y envía email al usuario.
 */
const forgotPassword = async ({ email }) => {
  const usuario = await User.findOne({ email });
  if (!usuario) {
    // Respondemos igual aunque no exista por seguridad (no revelar si el email existe)
    return { message: 'Si ese correo existe, recibirás un enlace para restablecer tu contraseña.' };
  }

  // Generar token aleatorio de 32 bytes
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora

  // Guardar token hasheado en la BD
  usuario.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex');
  usuario.resetPasswordExpires = expiry;
  await usuario.save({ validateBeforeSave: false });

  // Enviar email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to:      usuario.email,
    subject: 'Restablecer contraseña — RepFora',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#39A900">🔒 Restablecer contraseña</h2>
        <p>Hola <strong>${usuario.name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en RepFora.</p>
        <p>Haz clic en el botón para continuar. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#39A900;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Restablecer contraseña
        </a>
        <p style="color:#666;font-size:12px;">Si no solicitaste esto, ignora este correo.</p>
        <hr/>
        <p style="color:#999;font-size:11px;">RepFora · SENA</p>
      </div>
    `,
  });

  return { message: 'Si ese correo existe, recibirás un enlace para restablecer tu contraseña.' };
};

/**
 * Restablecer contraseña con el token del email.
 */
const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw new Error('Token y nueva contraseña son requeridos.');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]\{\};':",.\/<>?]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error('La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.');
  }

  // Hashear el token recibido para comparar con el de la BD
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const usuario = await User.findOne({
    resetPasswordToken:   tokenHash,
    resetPasswordExpires: { $gt: Date.now() }, // No expirado
  });

  if (!usuario) {
    throw new Error('El enlace de restablecimiento no es válido o ha expirado.');
  }

  // Actualizar contraseña y limpiar el token
  usuario.password             = newPassword;
  usuario.isFirstLogin         = false; // Ya no es primer ingreso tras restablecer
  usuario.resetPasswordToken   = null;
  usuario.resetPasswordExpires = null;
  await usuario.save();

  return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
};

/**
 * Cambiar la contraseña del usuario autenticado.
 */
const changePassword = async (userId, newPassword) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]\{\};':",.\/<>?]).{8,}$/;
  if (!newPassword || !passwordRegex.test(newPassword)) {
    throw new Error('La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.');
  }

  const usuario = await User.findById(userId);
  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }

  usuario.password = newPassword;
  usuario.isFirstLogin = false; // Se marca como falso al cambiar la clave
  await usuario.save();

  return { message: 'Contraseña actualizada exitosamente.' };
};

module.exports = {
  registrar,
  login,
  getPerfil,
  forgotPassword,
  resetPassword,
  changePassword,
};