// auth.controller.js   🟢 DEV 1 | Seguridad con Auditoría de IP
const service = require('./auth.service');
const { sendEmail } = require('../../core/utils/mailer');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress; // Captura IP
    const result = await service.login(email, password, ip);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const token = await service.generateResetToken(email, ip);
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #39a900; padding: 20px; text-align: center;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/SENA_logo.svg/1200px-SENA_logo.svg.png" width="60" style="filter: brightness(0) invert(1);">
        </div>
        <div style="padding: 30px;">
          <h2>Restablecer Contraseña</h2>
          <p>Has solicitado cambiar tu clave en RepFora.</p>
          <div style="text-align: center; margin: 30px;">
            <a href="${resetUrl}" style="background: #39a900; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Cambiar Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Este enlace expira en 15 minutos.</p>
        </div>
      </div>
    `;

    await sendEmail({ to: email, subject: '🔐 Recuperación de Clave - RepFora', html });
    res.json({ message: 'Si el correo existe, recibirás un enlace' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const result = await service.resetPassword(token, password, ip);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const result = await service.updatePassword(req.user.id, password, req.ip);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { login, forgotPassword, resetPassword, changePassword };