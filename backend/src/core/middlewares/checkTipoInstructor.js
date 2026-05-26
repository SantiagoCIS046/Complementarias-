// =============================================
// checkTipoInstructor.js — RF-INS-26
// =============================================
// Middleware que restringe el acceso a rutas
// específicas según el tipoInstructor del usuario.
//
// Uso: router.post('/ruta', verifyToken, checkRole(['INSTRUCTOR']), checkTipoInstructor(['SEGUIMIENTO']), handler)
// =============================================

/**
 * Middleware de autorización por tipo de instructor.
 * @param {string[]} tiposPermitidos - Tipos permitidos: 'SEGUIMIENTO', 'TECNICO', 'PROYECTO'
 */
const checkTipoInstructor = (tiposPermitidos) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    // Admins pueden acceder a todo
    if (user.role === 'ADMIN') {
      return next();
    }

    // Si el usuario no es instructor, denegar
    if (user.role !== 'INSTRUCTOR') {
      return res.status(403).json({
        message: 'Acceso denegado. Solo los instructores pueden acceder a esta ruta.',
      });
    }

    // Si el instructor no tiene tipo definido, permitir por compatibilidad hacia atrás
    if (!user.tipoInstructor) {
      return next();
    }

    // Verificar si el tipo del instructor está en los permitidos
    if (!tiposPermitidos.includes(user.tipoInstructor)) {
      return res.status(403).json({
        message: `Acceso denegado. Esta acción solo puede ser realizada por instructores de tipo: [${tiposPermitidos.join(', ')}]. Tu tipo es: ${user.tipoInstructor}.`,
        tipoRequerido: tiposPermitidos,
        tipoActual: user.tipoInstructor,
      });
    }

    next();
  };
};

module.exports = { checkTipoInstructor };
