// users.controller.js 🟢 DEV 1 | Control CRUD de Usuarios
const service = require('./users.service');
const { registrarAuditoria } = require('../../core/utils/audit');

/**
 * GET /api/users — Listar todos los usuarios con paginación y filtros
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAllUsers(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/users/:id — Obtener un usuario
 */
const getById = async (req, res) => {
  try {
    const user = await service.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * PUT /api/users/:id — Actualizar un usuario
 */
const update = async (req, res) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);

    await registrarAuditoria({
      usuarioId: req.user.id,
      accion: 'UPDATE_USER',
      detalle: `Actualizado usuario ${user.email}: ${JSON.stringify(req.body)}`,
      ip: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/users/:id — Eliminar un usuario
 */
const remove = async (req, res) => {
  try {
    const result = await service.deleteUser(req.params.id);

    await registrarAuditoria({
      usuarioId: req.user.id,
      accion: 'DELETE_USER',
      detalle: `Eliminado usuario ID: ${req.params.id}`,
      ip: req.ip
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/users/import — Importación masiva desde Excel
 */
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Por favor sube un archivo Excel (.xlsx)' });
    }

    const results = await service.importarDesdeExcel(req.file.buffer);

    await registrarAuditoria({
      usuarioId: req.user.id,
      accion: 'IMPORT_USERS_EXCEL',
      detalle: `Importación masiva: ${results.creados} creados, ${results.errores.length} errores.`,
      ip: req.ip
    });

    res.json({
      message: 'Proceso de importación finalizado',
      data: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, update, remove, importUsers };