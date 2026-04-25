// stateMachine.js   🔵 DEV 2 | Máquina de Estados de la EP
// =============================================
// Controla las transiciones válidas entre los 7 estados
// de una Etapa Productiva.
//
// Flujo principal:
// SOLICITUD → REGISTRO → VALIDACION → APROBADO → EN_CURSO → FINALIZADO → CERTIFICADO
//                                    ↘ RECHAZADO → REGISTRO (corrección)
// =============================================

const { TRANSICIONES_EP } = require('../../core/utils/enums');

/**
 * Verifica si una transición de estado es válida.
 * @param {string} estadoActual - Estado actual de la EP
 * @param {string} estadoNuevo  - Estado al que se quiere transicionar
 * @returns {boolean}
 */
const esTransicionValida = (estadoActual, estadoNuevo) => {
  const transicionesPermitidas = TRANSICIONES_EP[estadoActual];

  if (!transicionesPermitidas) {
    return false;
  }

  return transicionesPermitidas.includes(estadoNuevo);
};

/**
 * Obtiene las transiciones disponibles desde un estado dado.
 * @param {string} estadoActual - Estado actual de la EP
 * @returns {string[]} - Lista de estados a los que puede transicionar
 */
const obtenerTransicionesDisponibles = (estadoActual) => {
  return TRANSICIONES_EP[estadoActual] || [];
};

/**
 * Ejecuta una transición de estado sobre una EP.
 * Valida que la transición sea legal y registra en el historial.
 * @param {Object} stage    - Documento de ProductiveStage (mongoose)
 * @param {string} nuevoEstado - Estado destino
 * @param {string} userId   - ID del usuario que realiza la transición
 * @param {string} [motivo] - Motivo de la transición (opcional)
 * @throws {Error} Si la transición no es válida
 * @returns {Object} La EP actualizada
 */
const ejecutarTransicion = async (stage, nuevoEstado, userId, motivo = '') => {
  const estadoActual = stage.estado;

  if (!esTransicionValida(estadoActual, nuevoEstado)) {
    const permitidas = obtenerTransicionesDisponibles(estadoActual);
    throw new Error(
      `Transición inválida: "${estadoActual}" → "${nuevoEstado}". ` +
      `Transiciones permitidas desde "${estadoActual}": [${permitidas.join(', ')}].`
    );
  }

  // Registrar en el historial
  stage.historialEstados.push({
    estadoAnterior: estadoActual,
    estadoNuevo:    nuevoEstado,
    fecha:          new Date(),
    motivo,
    realizadoPor:   userId,
  });

  // Actualizar el estado
  stage.estado = nuevoEstado;

  // Si pasa a EN_CURSO, registrar fecha de inicio
  if (nuevoEstado === 'EN_CURSO' && !stage.fechaInicio) {
    stage.fechaInicio = new Date();
  }

  // Si pasa a FINALIZADO, registrar fecha de fin
  if (nuevoEstado === 'FINALIZADO' && !stage.fechaFin) {
    stage.fechaFin = new Date();
  }

  await stage.save();
  return stage;
};

module.exports = {
  esTransicionValida,
  obtenerTransicionesDisponibles,
  ejecutarTransicion,
};
