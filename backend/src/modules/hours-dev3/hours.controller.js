// hours.controller.js   🟡 DEV 3 | Contabilidad de horas
// =============================================
// Controladores para el registro de horas diarias.
// =============================================

const service = require('./hours.service');

/**
 * POST /api/hours
 */
const registrar = async (req, res) => {
  try {
    const data = await service.registrar({
      ...req.body,
      apprenticeId: req.user._id,
    });
    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/hours
 */
const getAll = async (req, res) => {
  try {
    const filtros = {
      stageId: req.query.stageId,
      apprenticeId: req.query.apprenticeId,
      isAdditionalHour: req.query.isAdditionalHour,
    };
    
    if (req.user.role === 'APRENDIZ') {
      filtros.apprenticeId = req.user._id;
    }

    const data = await service.getAll(filtros);
    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/hours/resumen/:stageId
 */
const getResumen = async (req, res) => {
  try {
    const data = await service.getResumen(req.params.stageId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const data = await service.actualizarEstado(req.params.id, req.body);

    try {
      const { registrarAuditoria } = require('../../core/utils/audit');
      await registrarAuditoria({
        usuarioId: req.user._id,
        accion: 'ACTUALIZAR_ESTADO_HORA',
        entidad: 'Hour',
        entidadId: req.params.id,
        detalle: `El instructor ${req.user.name || 'N/A'} actualizó el estado del registro de horas a: ejecutado=${req.body.ejecutado !== undefined ? req.body.ejecutado : 'sin cambio'}, cobrado=${req.body.cobrado !== undefined ? req.body.cobrado : 'sin cambio'}, pendiente=${req.body.pendiente !== undefined ? req.body.pendiente : 'sin cambio'}.`,
        ip: req.ip
      });
    } catch (auditErr) {
      console.error('Error registrando auditoría en contabilidad de horas:', auditErr.message);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/hours/historico-pagos (RF-INS-17)
 */
const getHistoricoPagos = async (req, res) => {
  try {
    const data = await service.obtenerHistoricoPagos({
      userId: req.user._id,
      userRole: req.user.role,
      filtroInstructorId: req.query.instructorId
    });
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/hours/reporte-mensual (RF-INS-24)
 */
const descargarReporteMensual = async (req, res) => {
  try {
    const hoy = new Date();
    const mes = req.query.mes ? parseInt(req.query.mes, 10) : (hoy.getMonth() + 1);
    const anio = req.query.anio ? parseInt(req.query.anio, 10) : hoy.getFullYear();

    const pdfBuffer = await service.generarPdfReporteMensual(mes, anio);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Reporte_Horas_${anio}_${mes}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registrar,
  getAll,
  getResumen,
  actualizarEstado,
  getHistoricoPagos,
  descargarReporteMensual,
};