// productive-stages.service.js   🔵 DEV 2 | Etapas Productivas
const ProductiveStage = require("./ProductiveStage.model");

/**
 * Listar todas las etapas productivas con datos de aprendiz y empresa
 */
const getAll = async () => {
  return await ProductiveStage.find()
    .populate("aprendiz", "name email documento")
    .populate("empresa", "razonSocial nit")
    .sort({ createdAt: -1 });
};

module.exports = { getAll };
