const usersService = require('./users.service');

/**
 * Endpoint para importar aprendices masivamente
 */
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se subió ningún archivo' });
    }

    const results = await usersService.bulkImport(req.file.buffer);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Obtener sugerencias de reemplazo para un instructor
 */
const getSuggestions = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const suggestions = await usersService.suggestReplacement(instructorId);
    
    res.status(200).json({
      status: 'success',
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Ejecutar reasignación de aprendices
 */
const reassign = async (req, res) => {
  try {
    const { oldInstructorId, newInstructorId } = req.body;
    
    if (!oldInstructorId || !newInstructorId) {
      return res.status(400).json({ status: 'error', message: 'Se requieren ambos IDs de instructor' });
    }

    const result = await usersService.reassignApprentices(oldInstructorId, newInstructorId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Reasignación completada con éxito',
      details: result
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  importUsers,
  getSuggestions,
  reassign
};
