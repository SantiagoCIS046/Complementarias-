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

  // 1.5 Verificar estado de la matrícula (vigencia del aprendiz)
  if (aprendiz.activo === false || (aprendiz.status !== undefined && aprendiz.status !== 'ACTIVO' && aprendiz.status !== 'ELEGIBLE')) {
    return {
      elegible: false,
      mensaje: `Tu matrícula en el sistema no está vigente (Estado: ${aprendiz.status || 'INACTIVO'}). Para formalizar la EP, tu matrícula debe estar activa y vigente.`,
    };
  }

  // 1.6 Verificar tiempos vigentes y estado de la ficha
  if (aprendiz.ficha) {
    const Batch = require('../batches-dev1/batch.model');
    const fichaDoc = await Batch.findOne({ codigo_ficha: aprendiz.ficha });
    if (!fichaDoc) {
      return {
        elegible: false,
        mensaje: `No se encontró la Ficha de formación #${aprendiz.ficha} en el sistema.`,
      };
    }

    if (fichaDoc.estado !== 'ACTIVA') {
      return {
        elegible: false,
        mensaje: `La Ficha #${aprendiz.ficha} se encuentra en estado "${fichaDoc.estado}". Debe estar ACTIVA para registrar tu EP.`,
      };
    }

    const hoy = new Date();
    if (hoy < new Date(fichaDoc.fecha_inicio_ep)) {
      return {
        elegible: false,
        mensaje: `La Etapa Productiva programada para la Ficha #${aprendiz.ficha} inicia el ${fichaDoc.fecha_inicio_ep.toISOString().split('T')[0]}. Aún no es válida para el registro.`,
      };
    }

    if (hoy > new Date(fichaDoc.fecha_fin_ep)) {
      return {
        elegible: false,
        mensaje: `El plazo de vigencia de la Ficha #${aprendiz.ficha} expiró el ${fichaDoc.fecha_fin_ep.toISOString().split('T')[0]}.`,
      };
    }
  } else {
    return {
      elegible: false,
      mensaje: 'El aprendiz no está asignado a ninguna Ficha en el sistema. Registro denegado.',
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

    // Límite de transición normativa: 5 de Noviembre de 2024 (Acuerdo 009 de 2024)
    const fechaLimiteNuevaNorma = new Date('2024-11-05T00:00:00');
    const esPostNoviembre2024 = fechaFinLectiva >= fechaLimiteNuevaNorma;
    const plazoMaximoDias = esPostNoviembre2024 ? 30 : 730; // 30 días para post-nov 2024, 2 años (730 días) para pre-nov 2024

    if (diffDias > plazoMaximoDias) {
      const normaLabel = esPostNoviembre2024 ? 'Nueva norma (Post Noviembre 2024: 30 días)' : 'Norma anterior (Pre Noviembre 2024: 2 años / 730 días)';
      return {
        elegible: false,
        mensaje: `Han pasado ${diffDias} días desde la finalización de tu etapa lectiva. ` +
                 `Bajo la reglamentación aplicable (${normaLabel}), el plazo máximo es de ${esPostNoviembre2024 ? '30 días' : '2 años (730 días)'}. Contacta a coordinación.`,
        diasExcedidos: diffDias - plazoMaximoDias,
      };
    }

    return {
      elegible: true,
      mensaje: `Eres elegible para registrar tu EP. Te quedan ${plazoMaximoDias - diffDias} días de plazo reglamentario.`,
      diasRestantes: plazoMaximoDias - diffDias,
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
};
