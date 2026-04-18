// =============================================
// roles.middleware.js - Verificación de Roles (Estandarizado)
// =============================================
const { ROLES } = require('../utils/enums');

/**
 * Middleware de autorización por roles.
 * Uso: router.get('/ruta', protect, checkRole(ROLES.ADMIN, ROLES.INSTRUCTOR), handler)
 * @param {...string} allowedRoles - Lista de roles permitidos (ADMIN, INSTRUCTOR, etc.)
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No autenticado. Por favor inicie sesión.' 
      });
    }

    // El rol del usuario decodificado del JWT debe estar en la lista permitida
    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`[Permiso Denegado] Usuario ${req.user.email} con rol ${req.user.role} intentó acceder a ruta para [${allowedRoles.join(', ')}]`);
      
      return res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para realizar esta acción.',
        required_roles: allowedRoles
      });
    }

    next();
  };
};

module.exports = { checkRole };
