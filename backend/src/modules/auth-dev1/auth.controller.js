const authService = require('./auth.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'El correo y la contraseña son obligatorios'
      });
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const { user, token } = await authService.login(email, password, metadata);

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      data: { user, token }
    });

  } catch (error) {
    // Manejo de errores específicos para enviar mensajes claros
    let status = 401;
    let message = 'Credenciales inválidas';

    if (error.message === 'CUENTA_BLOQUEADA') {
      message = 'Tu cuenta ha sido bloqueada tras 5 intentos fallidos. Contacta al administrador.';
    } else if (error.message === 'CORREO_NO_REGISTRADO') {
      message = 'El correo electrónico no se encuentra registrado.';
    }

    res.status(status).json({ message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Obtenido del token por el middleware 'protect'

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'La contraseña actual y la nueva son obligatorias'
      });
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      message: result.message
    });

  } catch (error) {
    let status = 400;
    let message = error.message;

    if (error.message === 'CONTRASENA_ACTUAL_INCORRECTA') {
      message = 'La contraseña actual no es correcta.';
      status = 401;
    }

    res.status(status).json({ message });
  }
};

module.exports = {
  login,
  changePassword
};
