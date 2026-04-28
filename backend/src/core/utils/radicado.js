// radicado.js 🟢 DEV 1 | Generador de Radicados Secuenciales
const SystemConfig = require('../modules/system-config-dev1/SystemConfig.model');

/**
 * Genera el siguiente número de radicado consecutivo
 * EJ: REP-001 -> REP-002
 */
const generarSiguienteRadicado = async () => {
  try {
    // 1. Buscar o crear la configuración
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }

    // 2. Incrementar contador
    config.lastRadicadoNum += 1;
    await config.save();

    // 3. Formatear (EJ: REP- + 000 + 1)
    const numFormateado = config.lastRadicadoNum.toString().padStart(3, '0');
    return `${config.radicadoPrefix}${numFormateado}`;
  } catch (error) {
    console.error('❌ Error generando radicado:', error);
    return null;
  }
};

module.exports = { generarSiguienteRadicado };
