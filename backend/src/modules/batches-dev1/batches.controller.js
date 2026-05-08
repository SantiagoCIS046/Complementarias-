const batchesService = require('./batches.service');

const getAll = async (req, res) => {
  try {
    const fichas = await batchesService.getAll(req.query);
    res.json({ success: true, data: fichas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const ficha = await batchesService.getById(req.params.id);
    res.json({ success: true, data: ficha });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const asignarInstructor = async (req, res) => {
  try {
    const { instructor_id } = req.body;
    if (!instructor_id) {
      return res.status(400).json({ success: false, message: 'El ID del instructor es obligatorio' });
    }
    const updated = await batchesService.asignarInstructor(req.params.id, instructor_id);
    res.json({ success: true, data: updated, message: 'Instructor asignado correctamente' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getAprendices = async (req, res) => {
  try {
    const aprendices = await batchesService.getAprendices(req.params.id);
    res.json({ success: true, data: aprendices });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const nueva = await batchesService.crear(req.body);
    res.status(201).json({ success: true, data: nueva });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  asignarInstructor,
  getAprendices,
  crear
};
