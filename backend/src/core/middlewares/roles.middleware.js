// =============================================
// roles.middleware.js - Verificación de Roles
// =============================================

/**
 * Middleware de autorización por roles.
 * Uso: router.get('/ruta', verifyToken, checkRole(['ADMIN', 'INSTRUCTOR']), handler)
 * @param {string[]} allowedRoles - Arreglo de roles permitidos
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere uno de los roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};

module.exports = { checkRole };
