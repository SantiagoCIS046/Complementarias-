// radicadoGenerator.js   🔵 DEV 2 | Generador de Radicados
// =============================================
// Genera números de radicado únicos para las EPs.
// Formato: REP-{AÑO}-{CONSECUTIVO_3_DIGITOS}
// Ejemplo: REP-2026-001, REP-2026-002, etc.
//
// NOTA: Esta función está en el módulo de Dev 2 porque el
// Dev 1 (generarRadicado) aún no la ha implementado.
// Cuando esté lista, se reemplaza por la función del core.
// =============================================

const ProductiveStage = require('./productive-stage.model');

/**
 * Genera un radicado único con formato REP-YYYY-NNN.
 * Busca el último consecutivo del año actual y lo incrementa.
 * @returns {Promise<string>} - El radicado generado (ej: REP-2026-001)
 */
const generarRadicado = async () => {
  const anio = new Date().getFullYear();
  const prefijo = `REP-${anio}-`;

  // Buscar la última EP con radicado de este año
  const ultimaEP = await ProductiveStage.findOne({
    radicado: { $regex: `^${prefijo}` },
  })
    .sort({ radicado: -1 })
    .select('radicado')
    .lean();

  let consecutivo = 1;

  if (ultimaEP && ultimaEP.radicado) {
    // Extraer el número del último radicado: REP-2026-005 → 5
    const partes = ultimaEP.radicado.split('-');
    const ultimoNumero = parseInt(partes[2], 10);
    consecutivo = ultimoNumero + 1;
  }

  // Formatear con ceros a la izquierda (3 dígitos)
  const radicado = `${prefijo}${String(consecutivo).padStart(3, '0')}`;
  return radicado;
};

module.exports = { generarRadicado };
