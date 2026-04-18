const { logAction } = require('../utils/logger');

/**
 * Middleware maestro para capturar cualquier error en la aplicación.
 */
const globalErrorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Registro técnico detallado en consola
  console.error('--- ❌ ERROR DETECTADO ---');
  console.error(`Mensaje: ${err.message}`);
  console.error(`Ruta: ${req.originalUrl}`);
  console.error(`Stack: ${err.stack}`);
  console.error('---------------------------');

  // Registrar el fallo en la Bitácora de Auditoría si el usuario está autenticado
  try {
    await logAction({
      user: req.user ? req.user.id : null,
      action: 'SERVER_ERROR',
      module: 'SYSTEM',
      details: {
        message: err.message,
        path: req.originalUrl,
        stack: err.stack // Guardar stack para revisión técnica
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (logError) {
    console.error('Error al intentar registrar el fallo en bitácora:', logError.message);
  }

  // Enviar respuesta detallada al frontend (según solicitud del usuario)
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
    technical_details: {
      path: req.originalUrl,
      error_name: err.name,
      stack: err.stack, // En producción real esto se ocultaría, pero aquí se pide detalle
    }
  });
};

module.exports = globalErrorHandler;
