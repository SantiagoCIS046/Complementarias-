// =============================================
// auth.middleware.js - Verificación de JWT
// =============================================
const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para proteger rutas privadas
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Adjuntar id, role, email al request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = { protect };
