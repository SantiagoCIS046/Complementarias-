// auth.middleware.js 🛡️ DEV 1 | Guardianes de Roles (RBAC)
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Verifica que el usuario tenga un token válido
 */
const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Guardamos id y role en el request
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token no válido o expirado' });
    }
  }

  return res.status(401).json({ message: 'No hay token, acceso denegado' });
};

/**
 * Restringe el acceso por roles específicos
 * Uso: authorize('ADMIN', 'INSTRUCTOR')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `El rol ${req.user.role} no tiene permiso para acceder a esta ruta` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorize };
