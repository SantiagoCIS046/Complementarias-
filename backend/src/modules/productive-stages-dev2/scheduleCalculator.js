// scheduleCalculator.js   DEV 2 | Motor de Cronogramas (Modulo 2)
// =============================================
// Calculadora de fechas para la Etapa Productiva.
//
// Regla de negocio:
// - Tiempo Completo (8h/dia): EP dura 6 meses
// - Medio Tiempo (4h/dia):   EP dura 12 meses
//
// La "Fecha Proyectada de Fin" es usada por el Dev 3
// para saber si el aprendiz va al dia o esta atrasado.
// =============================================

const { JORNADA, CRONOGRAMA_CONFIG } = require('../../core/utils/enums');

/**
 * Calcula la fecha proyectada de fin segun la jornada.
 * @param {Date}   fechaInicio - Fecha de inicio de la EP
 * @param {string} jornada     - TIEMPO_COMPLETO o MEDIO_TIEMPO
 * @returns {Date} Fecha proyectada de finalizacion
 */
const calcularFechaProyectadaFin = (fechaInicio, jornada) => {
  const inicio = new Date(fechaInicio);

  let meses;
  if (jornada === JORNADA.TIEMPO_COMPLETO) {
    meses = CRONOGRAMA_CONFIG.MESES_TIEMPO_COMPLETO; // 6 meses
  } else if (jornada === JORNADA.MEDIO_TIEMPO) {
    meses = CRONOGRAMA_CONFIG.MESES_MEDIO_TIEMPO;    // 12 meses
  } else {
    throw new Error('Jornada no valida. Use: TIEMPO_COMPLETO o MEDIO_TIEMPO.');
  }

  const fechaFin = new Date(inicio);
  fechaFin.setMonth(fechaFin.getMonth() + meses);

  return fechaFin;
};

/**
 * Calcula las horas requeridas segun la jornada.
 * @param {string} jornada - TIEMPO_COMPLETO o MEDIO_TIEMPO
 * @returns {number} Total de horas requeridas
 */
const calcularHorasRequeridas = (jornada) => {
  // Ambas jornadas requieren el mismo total de horas (880h),
  // solo cambia el tiempo para completarlas.
  return CRONOGRAMA_CONFIG.HORAS_TOTALES_EP;
};

/**
 * Calcula las horas por semana segun la jornada.
 * @param {string} jornada - TIEMPO_COMPLETO o MEDIO_TIEMPO
 * @returns {number} Horas por semana
 */
const calcularHorasPorSemana = (jornada) => {
  const horasDia = jornada === JORNADA.TIEMPO_COMPLETO
    ? CRONOGRAMA_CONFIG.HORAS_DIA_COMPLETO   // 8
    : CRONOGRAMA_CONFIG.HORAS_DIA_MEDIO;     // 4

  return horasDia * CRONOGRAMA_CONFIG.DIAS_LABORALES_SEMANA; // 40 o 20
};

/**
 * Calcula el progreso del aprendiz en porcentaje.
 * @param {number} horasCompletadas - Horas que el aprendiz ha completado
 * @param {number} horasRequeridas  - Total de horas requeridas
 * @returns {Object} { porcentaje, horasFaltantes, completado }
 */
const calcularProgreso = (horasCompletadas, horasRequeridas) => {
  const porcentaje = horasRequeridas > 0
    ? Math.min(100, Math.round((horasCompletadas / horasRequeridas) * 100))
    : 0;

  return {
    porcentaje,
    horasCompletadas,
    horasRequeridas,
    horasFaltantes: Math.max(0, horasRequeridas - horasCompletadas),
    completado: horasCompletadas >= horasRequeridas,
  };
};

/**
 * Verifica si el aprendiz va al dia, adelantado o atrasado.
 * Compara las horas completadas con las horas que deberia
 * llevar segun el tiempo transcurrido.
 * @param {Date}   fechaInicio       - Fecha de inicio de la EP
 * @param {string} jornada           - TIEMPO_COMPLETO o MEDIO_TIEMPO
 * @param {number} horasCompletadas  - Horas registradas
 * @returns {Object} { estado, horasEsperadas, diferencia, mensaje }
 */
const verificarRitmo = (fechaInicio, jornada, horasCompletadas) => {
  const inicio = new Date(fechaInicio);
  const hoy = new Date();

  // Dias transcurridos desde el inicio
  const diffMs = hoy - inicio;
  const diasTranscurridos = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Semanas transcurridas (solo dias laborales)
  const semanasTranscurridas = diasTranscurridos / 7;

  // Horas que deberia llevar
  const horasPorSemana = calcularHorasPorSemana(jornada);
  const horasEsperadas = Math.round(semanasTranscurridas * horasPorSemana);

  const diferencia = horasCompletadas - horasEsperadas;

  let estado;
  let mensaje;

  if (diferencia >= 0) {
    estado = 'AL_DIA';
    mensaje = 'El aprendiz va al dia o adelantado. Lleva ' + horasCompletadas + 'h de ' + horasEsperadas + 'h esperadas.';
  } else if (diferencia >= -20) {
    estado = 'LEVE_ATRASO';
    mensaje = 'El aprendiz tiene un leve atraso de ' + Math.abs(diferencia) + ' horas.';
  } else {
    estado = 'ATRASADO';
    mensaje = 'El aprendiz esta atrasado ' + Math.abs(diferencia) + ' horas respecto al cronograma.';
  }

  return {
    estado,
    diasTranscurridos,
    horasEsperadas,
    horasCompletadas,
    diferencia,
    horasPorSemana,
    mensaje,
  };
};

/**
 * Genera el resumen completo del cronograma de una EP.
 * Esta es la funcion principal que consolida toda la info
 * para el frontend y para el Dev 3.
 * @param {Object} stage - Documento de ProductiveStage
 * @returns {Object} Resumen del cronograma
 */
const generarResumenCronograma = (stage) => {
  if (!stage.cronogramaConfigurado || !stage.jornada) {
    return {
      configurado: false,
      mensaje: 'El cronograma aun no ha sido configurado. Seleccione la jornada.',
    };
  }

  const progreso = calcularProgreso(stage.horasCompletadas, stage.horasRequeridas);

  const resultado = {
    configurado: true,
    jornada: stage.jornada,
    horasPorSemana: calcularHorasPorSemana(stage.jornada),
    progreso,
    fechaInicio: stage.fechaInicio,
    fechaProyectadaFin: stage.fechaProyectadaFin,
  };

  // Si ya inicio, agregar info de ritmo
  if (stage.fechaInicio) {
    resultado.ritmo = verificarRitmo(
      stage.fechaInicio,
      stage.jornada,
      stage.horasCompletadas
    );
  }

  return resultado;
};

module.exports = {
  calcularFechaProyectadaFin,
  calcularHorasRequeridas,
  calcularHorasPorSemana,
  calcularProgreso,
  verificarRitmo,
  generarResumenCronograma,
};
