// elegibility.js   🔵 DEV 2 | Lógica de Elegibilidad
// =============================================
// Valida si un aprendiz está dentro del plazo legal
// para registrar su Etapa Productiva.
//
// Regla SENA:
// El aprendiz debe registrar su EP dentro de los primeros
// 30 días calendario después de finalizar su etapa lectiva.
// =============================================

const ProductiveStage = require('./productive-stage.model');

// Plazo máximo en días para registrar la EP después de la etapa lectiva
const PLAZO_MAXIMO_DIAS = 30;

/**
 * Verifica si un aprendiz es elegible para registrar su EP.
 * @param {Object} aprendiz - Objeto del usuario aprendiz
 * @param {Date}   aprendiz.fechaFinLectiva - Fecha de fin de etapa lectiva
 * @returns {Object} { elegible: boolean, mensaje: string, diasRestantes?: number }
 */
const verificarElegibilidad = async (aprendiz) => {
  // 1. Verificar que el aprendiz tenga rol correcto
  if (aprendiz.role !== 'APRENDIZ') {
    return {
      elegible: false,
      mensaje: 'Solo los usuarios con rol APRENDIZ pueden registrar una Etapa Productiva.',
    };
  }

  // 2. Verificar que no tenga ya una EP activa
  const epActiva = await ProductiveStage.findOne({
    apprenticeId: aprendiz._id,
    estado: { $nin: ['FINALIZADO', 'CERTIFICADO', 'RECHAZADO'] },
  });

  if (epActiva) {
    return {
      elegible: false,
      mensaje: `Ya tienes una Etapa Productiva en estado "${epActiva.estado}". No puedes registrar otra.`,
      epExistente: epActiva.radicado || epActiva._id,
    };
  }

  // 3. Verificar plazo legal (si hay fecha de fin de etapa lectiva)
  if (aprendiz.fechaFinLectiva) {
    const fechaFinLectiva = new Date(aprendiz.fechaFinLectiva);
    const hoy = new Date();
    const diffMs = hoy - fechaFinLectiva;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return {
        elegible: false,
        mensaje: 'Tu etapa lectiva aún no ha finalizado. No puedes registrar la EP todavía.',
        diasParaInicio: Math.abs(diffDias),
      };
    }

    if (diffDias > PLAZO_MAXIMO_DIAS) {
      return {
        elegible: false,
        mensaje: `Han pasado ${diffDias} días desde la finalización de tu etapa lectiva. ` +
                 `El plazo máximo es de ${PLAZO_MAXIMO_DIAS} días. Contacta a coordinación.`,
        diasExcedidos: diffDias - PLAZO_MAXIMO_DIAS,
      };
    }

    return {
      elegible: true,
      mensaje: `Eres elegible para registrar tu EP. Te quedan ${PLAZO_MAXIMO_DIAS - diffDias} días.`,
      diasRestantes: PLAZO_MAXIMO_DIAS - diffDias,
    };
  }

  // Si no tiene fechaFinLectiva configurada, permitir (el admin debe validar)
  return {
    elegible: true,
    mensaje: 'No se encontró fecha de finalización de etapa lectiva. Se permite el registro bajo revisión del instructor.',
  };
};

module.exports = {
  verificarElegibilidad,
  PLAZO_MAXIMO_DIAS,
};
