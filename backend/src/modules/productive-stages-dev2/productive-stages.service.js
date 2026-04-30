// productive-stages.service.js   DEV 2 | Etapas Productivas
// =============================================
// Logica de negocio para el registro y gestion
// de Etapas Productivas.
// =============================================

const ProductiveStage = require('./productive-stage.model');
const Company          = require('../companies-dev2/company.model');
const Document         = require('../documents-dev2/document.model');
const { generarRadicado }          = require('./radicadoGenerator');
const { verificarElegibilidad }    = require('./elegibility');
const { ejecutarTransicion, obtenerTransicionesDisponibles } = require('./stateMachine');
const {
  calcularFechaProyectadaFin,
  calcularHorasRequeridas,
  generarResumenCronograma,
} = require('./scheduleCalculator');
const { DOCUMENTOS_REGISTRO_OBLIGATORIOS, DOCUMENTOS_CERTIFICACION_OBLIGATORIOS, ESTADO_EP, JORNADA } = require('../../core/utils/enums');
const driveService = require('../documents-dev2/drive.service');

/**
 * Registrar una nueva Etapa Productiva.
 * 1. Verifica elegibilidad del aprendiz
 * 2. Verifica que la empresa existe
 * 3. Crea el snapshot de la empresa
 * 4. Genera el radicado
 * 5. Verifica documentos obligatorios (RUT, Camara de Comercio)
 * 6. Crea la EP en estado SOLICITUD y la transiciona a REGISTRO
 */
const registrar = async ({ aprendiz, companyId, tipoFormacion, modalidad, documentos, observaciones }) => {
  // 1. Verificar elegibilidad
  const elegibilidad = await verificarElegibilidad(aprendiz);
  if (!elegibilidad.elegible) {
    throw new Error(elegibilidad.mensaje);
  }

  // 2. Verificar que la empresa existe
  const empresa = await Company.findById(companyId);
  if (!empresa) {
    throw new Error('La empresa especificada no existe en el sistema.');
  }

  // 3. Verificar documentos obligatorios
  if (!documentos || !Array.isArray(documentos)) {
    throw new Error('Debe adjuntar los documentos obligatorios: RUT y Camara de Comercio.');
  }

  const tiposDocumentosRecibidos = documentos.map((d) => d.tipoDocumento);
  const documentosFaltantes = DOCUMENTOS_REGISTRO_OBLIGATORIOS.filter(
    (tipo) => !tiposDocumentosRecibidos.includes(tipo)
  );

  if (documentosFaltantes.length > 0) {
    throw new Error(
      'Faltan los siguientes documentos obligatorios: ' + documentosFaltantes.join(', ') + '.'
    );
  }

  // 4. Crear snapshot de la empresa (denormalizacion)
  const companySnapshot = {
    nit:           empresa.nit,
    razonSocial:   empresa.razonSocial,
    direccion:     empresa.direccion,
    telefono:      empresa.telefono,
    emailContacto: empresa.emailContacto,
    jefeInmediato: empresa.jefeInmediato,
    telefonoJefe:  empresa.telefonoJefe,
    emailJefe:     empresa.emailJefe,
  };

  // 5. Generar radicado
  const radicado = await generarRadicado();

  // 6. Crear la EP
  const nuevaEP = await ProductiveStage.create({
    apprenticeId:  aprendiz._id,
    companyId:     empresa._id,
    companySnapshot,
    radicado,
    tipoFormacion,
    modalidad,
    estado:        ESTADO_EP.SOLICITUD,
    observaciones: observaciones || '',
    historialEstados: [
      {
        estadoAnterior: null,
        estadoNuevo:    ESTADO_EP.SOLICITUD,
        fecha:          new Date(),
        motivo:         'Registro inicial de la EP',
        realizadoPor:   aprendiz._id,
      },
    ],
  });

  // 7. Transicionar automaticamente a REGISTRO (ya tiene datos completos)
  await ejecutarTransicion(
    nuevaEP,
    ESTADO_EP.REGISTRO,
    aprendiz._id,
    'Datos de empresa y documentos adjuntados'
  );

  // 8. Guardar los documentos
  const docsCreados = [];
  for (const doc of documentos) {
    const nuevoDoc = await Document.create({
      stageId:        nuevaEP._id,
      tipoDocumento:  doc.tipoDocumento,
      nombreArchivo:  doc.nombreArchivo,
      url:            doc.url,
      subidoPor:      aprendiz._id,
    });
    docsCreados.push(nuevoDoc);
  }

  return {
    stage:     nuevaEP,
    documentos: docsCreados,
    radicado,
    mensaje:   'EP registrada exitosamente con radicado ' + radicado + '.',
  };
};

/**
 * Listar todas las EPs (con filtros opcionales).
 */
const getAll = async (filtros = {}) => {
  const query = {};

  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;
  if (filtros.estado)       query.estado = filtros.estado;
  if (filtros.companyId)    query.companyId = filtros.companyId;

  // Filtro por Instructor (Dev 2)
  if (filtros.instructorId) {
    const User = require('../users-dev1/user.model');
    const apprentices = await User.find({ 
      instructorAsignado: filtros.instructorId,
      role: 'APRENDIZ' 
    }).select('_id');
    
    const apprenticeIds = apprentices.map(a => a._id);
    query.apprenticeId = { $in: apprenticeIds };
  }

  const stages = await ProductiveStage.find(query)
    .populate('apprenticeId', 'name email role')
    .populate('companyId', 'razonSocial nit')
    .sort({ createdAt: -1 });

  return stages;
};

/**
 * Obtener una EP por su ID, con documentos asociados.
 */
const getById = async (id) => {
  const stage = await ProductiveStage.findById(id)
    .populate('apprenticeId', 'name email role')
    .populate('companyId', 'razonSocial nit jefeInmediato')
    .populate('historialEstados.realizadoPor', 'name email');

  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Traer documentos asociados
  const documentos = await Document.find({ stageId: id })
    .populate('subidoPor', 'name email')
    .populate('revisadoPor', 'name email');

  return {
    stage,
    documentos,
    cronograma: generarResumenCronograma(stage),
    transicionesDisponibles: obtenerTransicionesDisponibles(stage.estado),
  };
};

/**
 * Cambiar el estado de una EP (transicion de la maquina de estados).
 */
const transicionar = async (stageId, nuevoEstado, userId, motivo) => {
  const stage = await ProductiveStage.findById(stageId)
    .populate('apprenticeId', 'name email documento');
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const stageActualizada = await ejecutarTransicion(stage, nuevoEstado, userId, motivo);
  const historial = stageActualizada.historialEstados;
  const estadoAnterior = historial.length >= 2 ? historial[historial.length - 2].estadoNuevo : 'N/A';

  // --- Hook post-transicion: crear carpetas en Drive al APROBAR ---
  let driveInfo = null;
  if (nuevoEstado === ESTADO_EP.APROBADO) {
    try {
      const aprendiz = stage.apprenticeId;
      const carpetas = await driveService.crearEstructuraCarpetas({
        instructorNombre: 'Instructor', // TODO: obtener del usuario que aprueba
        fichaNumero: stage.radicado || stageId,
        aprendizDocumento: aprendiz.documento || aprendiz._id.toString(),
        aprendizNombre: aprendiz.name || 'Aprendiz',
      });

      // Guardar IDs de carpetas en la EP
      stageActualizada.driveFolders = {
        aprendiz:   carpetas.aprendiz.id,
        bitacoras:  carpetas.bitacoras.id,
        documentos: carpetas.documentos.id,
      };
      await stageActualizada.save();

      driveInfo = {
        mensaje: 'Carpetas de Google Drive creadas exitosamente.',
        carpetas: {
          aprendiz:   carpetas.aprendiz.webViewLink,
          bitacoras:  carpetas.bitacoras.webViewLink,
          documentos: carpetas.documentos.webViewLink,
        },
      };
    } catch (driveError) {
      // No bloquear la transicion si Drive falla
      console.error('[DRIVE ERROR] ' + driveError.message);
      driveInfo = {
        mensaje: 'La EP fue aprobada pero hubo un error al crear carpetas en Drive: ' + driveError.message,
      };
    }
  }

  return {
    stage:       stageActualizada,
    mensaje:     'Transicion exitosa: ' + estadoAnterior + ' -> ' + nuevoEstado + '.',
    transicionesDisponibles: obtenerTransicionesDisponibles(nuevoEstado),
    drive: driveInfo,
  };
};

/**
 * Verificar elegibilidad de un aprendiz.
 */
const checkElegibility = async (aprendiz) => {
  return await verificarElegibilidad(aprendiz);
};

/**
 * Configurar el cronograma de una EP.
 * Pregunta: Tiempo Completo o Medio Tiempo?
 * Calcula automaticamente la fecha proyectada de fin.
 */
const configurarCronograma = async (stageId, { jornada, fechaInicio }) => {
  // Validar jornada
  if (!Object.values(JORNADA).includes(jornada)) {
    throw new Error('Jornada no valida. Use: TIEMPO_COMPLETO o MEDIO_TIEMPO.');
  }

  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Solo se puede configurar si la EP esta APROBADO o EN_CURSO
  if (!['APROBADO', 'EN_CURSO'].includes(stage.estado)) {
    throw new Error(
      'El cronograma solo se puede configurar cuando la EP esta en estado APROBADO o EN_CURSO. ' +
      'Estado actual: ' + stage.estado
    );
  }

  // Fecha de inicio (usar la proporcionada o la actual)
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date();

  // Calcular fecha proyectada de fin
  const fechaProyectadaFin = calcularFechaProyectadaFin(inicio, jornada);

  // Calcular horas requeridas
  const horasRequeridas = calcularHorasRequeridas(jornada);

  // Actualizar la EP
  stage.jornada = jornada;
  stage.fechaInicio = inicio;
  stage.fechaProyectadaFin = fechaProyectadaFin;
  stage.horasRequeridas = horasRequeridas;
  stage.cronogramaConfigurado = true;

  await stage.save();

  const jornadaTexto = jornada === JORNADA.TIEMPO_COMPLETO
    ? 'Tiempo Completo (6 meses)'
    : 'Medio Tiempo (12 meses)';

  return {
    stage,
    cronograma: generarResumenCronograma(stage),
    mensaje: 'Cronograma configurado: ' + jornadaTexto + '. Fecha proyectada de fin: ' + fechaProyectadaFin.toISOString().split('T')[0] + '.',
  };
};

/**
 * Obtener resumen del cronograma de una EP.
 * Usado por el frontend para mostrar el timeline
 * y por el Dev 3 para verificar si va al dia.
 */
const getCronograma = async (stageId) => {
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  return generarResumenCronograma(stage);
};

// =============================================
// MODULO 4: Aprobaciones y Notificaciones (Semaforo)
// =============================================

/**
 * Enviar una EP a revision por el instructor.
 * Transiciona de REGISTRO -> VALIDACION.
 * El aprendiz usa esto cuando ya tiene todos sus documentos listos.
 */
const enviarARevision = async (stageId, userId) => {
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Verificar que la EP esta en REGISTRO
  if (stage.estado !== ESTADO_EP.REGISTRO) {
    throw new Error(
      'Solo se puede enviar a revision una EP en estado REGISTRO. Estado actual: ' + stage.estado
    );
  }

  // Verificar que los documentos obligatorios esten subidos
  const documentos = await Document.find({ stageId });
  const tiposSubidos = documentos.map((d) => d.tipoDocumento);
  const faltantes = DOCUMENTOS_REGISTRO_OBLIGATORIOS.filter(
    (tipo) => !tiposSubidos.includes(tipo)
  );

  if (faltantes.length > 0) {
    throw new Error(
      'No se puede enviar a revision. Faltan documentos obligatorios: ' + faltantes.join(', ') + '.'
    );
  }

  // Transicionar a VALIDACION (EN_REVISION)
  const stageActualizada = await ejecutarTransicion(
    stage,
    ESTADO_EP.VALIDACION,
    userId,
    'EP enviada a revision por el aprendiz'
  );

  return {
    stage: stageActualizada,
    estado: 'EN_REVISION',
    mensaje: 'La EP ha sido enviada a revision. El instructor evaluara tus documentos.',
    documentosSubidos: documentos.length,
  };
};

/**
 * Evaluar una EP (Endpoint del instructor).
 * PUT /api/productive-stages/evaluar/:id
 *
 * El instructor revisa las URLs de los documentos y decide:
 * - APROBADA: Todos los documentos estan correctos
 * - RECHAZADA: Falta algo o hay errores (comentario OBLIGATORIO)
 *
 * @param {string} stageId   - ID de la EP
 * @param {Object} evaluacion
 * @param {string} evaluacion.decision     - 'APROBADA' o 'RECHAZADA'
 * @param {string} evaluacion.comentario   - Retroalimentacion (obligatorio si RECHAZADA)
 * @param {Array}  evaluacion.documentosRevisados - [{docId, estado, observacion}]
 * @param {string} userId    - ID del instructor que evalua
 */
const evaluarEP = async (stageId, { decision, comentario, documentosRevisados }, userId) => {
  const stage = await ProductiveStage.findById(stageId)
    .populate('apprenticeId', 'name email documento');
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Solo se puede evaluar si esta en VALIDACION
  if (stage.estado !== ESTADO_EP.VALIDACION) {
    throw new Error(
      'Solo se pueden evaluar EPs en estado VALIDACION (EN_REVISION). Estado actual: ' + stage.estado
    );
  }

  // Validar decision
  if (!['APROBADA', 'RECHAZADA'].includes(decision)) {
    throw new Error('La decision debe ser "APROBADA" o "RECHAZADA".');
  }

  // Si es RECHAZADA, el comentario es OBLIGATORIO
  if (decision === 'RECHAZADA' && (!comentario || comentario.trim() === '')) {
    throw new Error(
      'Al rechazar una EP, el comentario de retroalimentacion es OBLIGATORIO. ' +
      'Debe indicar que documentos faltan o que errores hay.'
    );
  }

  // Revisar documentos individuales si se proporcionan
  if (documentosRevisados && Array.isArray(documentosRevisados)) {
    for (const docRevision of documentosRevisados) {
      const documento = await Document.findById(docRevision.docId);
      if (documento) {
        documento.estado = docRevision.estado || 'PENDIENTE';
        documento.observaciones = docRevision.observacion || '';
        documento.revisadoPor = userId;
        documento.fechaRevision = new Date();
        await documento.save();
      }
    }
  }

  // Determinar nuevo estado de la EP
  let nuevoEstado;
  let mensajeResultado;

  if (decision === 'APROBADA') {
    nuevoEstado = ESTADO_EP.APROBADO;
    mensajeResultado = 'La EP ha sido APROBADA. El aprendiz puede continuar con el proceso.';

    // Marcar todos los documentos como APROBADOS (si no se revisaron individualmente)
    if (!documentosRevisados || documentosRevisados.length === 0) {
      await Document.updateMany(
        { stageId, estado: 'PENDIENTE' },
        {
          estado: 'APROBADO',
          revisadoPor: userId,
          fechaRevision: new Date(),
        }
      );
    }
  } else {
    nuevoEstado = ESTADO_EP.RECHAZADO;
    mensajeResultado = 'La EP ha sido RECHAZADA. Motivo: ' + comentario;

    // Marcar documentos no aprobados como RECHAZADOS
    if (!documentosRevisados || documentosRevisados.length === 0) {
      await Document.updateMany(
        { stageId, estado: 'PENDIENTE' },
        {
          estado: 'RECHAZADO',
          revisadoPor: userId,
          fechaRevision: new Date(),
          observaciones: comentario,
        }
      );
    }
  }

  // Ejecutar transicion en la maquina de estados
  const stageActualizada = await ejecutarTransicion(
    stage,
    nuevoEstado,
    userId,
    comentario || 'Evaluacion completada: ' + decision
  );

  // Guardar el comentario en las observaciones de la EP
  if (comentario) {
    stageActualizada.observaciones = (stageActualizada.observaciones || '') +
      '\n[' + new Date().toISOString().split('T')[0] + ' - Evaluacion] ' + comentario;
    await stageActualizada.save();
  }

  // Obtener documentos actualizados
  const documentosFinales = await Document.find({ stageId })
    .populate('subidoPor', 'name email')
    .populate('revisadoPor', 'name email');

  // Resumen del semaforo
  const semaforo = {
    estado: decision,
    color: decision === 'APROBADA' ? 'VERDE' : 'ROJO',
    documentosAprobados: documentosFinales.filter((d) => d.estado === 'APROBADO').length,
    documentosRechazados: documentosFinales.filter((d) => d.estado === 'RECHAZADO').length,
    documentosPendientes: documentosFinales.filter((d) => d.estado === 'PENDIENTE').length,
    totalDocumentos: documentosFinales.length,
  };

  return {
    stage: stageActualizada,
    decision,
    comentario: comentario || '',
    semaforo,
    documentos: documentosFinales,
    mensaje: mensajeResultado,
    transicionesDisponibles: obtenerTransicionesDisponibles(nuevoEstado),
  };
};

/**
 * Obtener el estado de evaluacion (semaforo) de una EP.
 * Muestra cuantos documentos estan aprobados, rechazados o pendientes.
 */
const getSemaforo = async (stageId) => {
  const stage = await ProductiveStage.findById(stageId)
    .populate('apprenticeId', 'name email');
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const documentos = await Document.find({ stageId })
    .populate('subidoPor', 'name email')
    .populate('revisadoPor', 'name email');

  const aprobados = documentos.filter((d) => d.estado === 'APROBADO');
  const rechazados = documentos.filter((d) => d.estado === 'RECHAZADO');
  const pendientes = documentos.filter((d) => d.estado === 'PENDIENTE');

  // Determinar color del semaforo
  let color;
  let mensaje;
  if (pendientes.length === 0 && rechazados.length === 0 && aprobados.length > 0) {
    color = 'VERDE';
    mensaje = 'Todos los documentos estan aprobados.';
  } else if (rechazados.length > 0) {
    color = 'ROJO';
    mensaje = 'Hay ' + rechazados.length + ' documento(s) rechazado(s). Se requiere correccion.';
  } else if (pendientes.length > 0) {
    color = 'AMARILLO';
    mensaje = 'Hay ' + pendientes.length + ' documento(s) pendiente(s) de revision.';
  } else {
    color = 'GRIS';
    mensaje = 'No hay documentos registrados aun.';
  }

  return {
    estadoEP: stage.estado,
    semaforo: {
      color,
      mensaje,
      aprobados: aprobados.length,
      rechazados: rechazados.length,
      pendientes: pendientes.length,
      total: documentos.length,
    },
    documentos,
    radicado: stage.radicado,
    aprendiz: stage.apprenticeId,
  };
};

// =============================================
// PUNTO 4: Documentos de Certificacion
// =============================================

/**
 * Certificar una EP.
 * Valida que los 3 archivos finales obligatorios esten subidos y APROBADOS:
 * 1. ACTA_INICIO
 * 2. EVALUACION_FINAL
 * 3. CERTIFICADO_EP
 *
 * Solo se puede certificar si la EP esta en estado FINALIZADO.
 */
const certificarEP = async (stageId, userId) => {
  const stage = await ProductiveStage.findById(stageId)
    .populate('apprenticeId', 'name email');
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Solo se puede certificar desde FINALIZADO
  if (stage.estado !== ESTADO_EP.FINALIZADO) {
    throw new Error(
      'Solo se puede certificar una EP en estado FINALIZADO. Estado actual: ' + stage.estado
    );
  }

  // Obtener todos los documentos de esta EP
  const documentos = await Document.find({ stageId });

  // Verificar que los 3 documentos finales esten subidos
  const tiposSubidos = documentos.map((d) => d.tipoDocumento);
  const faltantes = DOCUMENTOS_CERTIFICACION_OBLIGATORIOS.filter(
    (tipo) => !tiposSubidos.includes(tipo)
  );

  if (faltantes.length > 0) {
    throw new Error(
      'No se puede certificar. Faltan los siguientes documentos finales obligatorios: ' +
      faltantes.join(', ') + '.'
    );
  }

  // Verificar que los 3 documentos esten APROBADOS
  const docsCertificacion = documentos.filter(
    (d) => DOCUMENTOS_CERTIFICACION_OBLIGATORIOS.includes(d.tipoDocumento)
  );
  const docsNoAprobados = docsCertificacion.filter((d) => d.estado !== 'APROBADO');

  if (docsNoAprobados.length > 0) {
    const detalles = docsNoAprobados.map(
      (d) => d.tipoDocumento + ' (' + d.estado + ')'
    );
    throw new Error(
      'No se puede certificar. Los siguientes documentos no estan aprobados: ' +
      detalles.join(', ') + '. Todos deben estar en estado APROBADO.'
    );
  }

  // Transicionar a CERTIFICADO
  const stageActualizada = await ejecutarTransicion(
    stage,
    ESTADO_EP.CERTIFICADO,
    userId,
    'Certificacion completada: todos los documentos finales aprobados'
  );

  return {
    stage: stageActualizada,
    mensaje: 'La EP ha sido CERTIFICADA exitosamente.',
    documentosCertificacion: docsCertificacion.map((d) => ({
      tipo: d.tipoDocumento,
      estado: d.estado,
      url: d.url,
    })),
    radicado: stage.radicado,
  };
};

/**
 * Obtener el estado de los documentos de certificacion de una EP.
 * Muestra cuales de los 3 documentos finales estan subidos y su estado.
 */
const getEstadoCertificacion = async (stageId) => {
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const documentos = await Document.find({ stageId });

  // Verificar cada documento de certificacion
  const estadoDocumentos = DOCUMENTOS_CERTIFICACION_OBLIGATORIOS.map((tipo) => {
    const doc = documentos.find((d) => d.tipoDocumento === tipo);
    return {
      tipoDocumento: tipo,
      subido: !!doc,
      estado: doc ? doc.estado : 'NO_SUBIDO',
      url: doc ? doc.url : null,
      nombreArchivo: doc ? doc.nombreArchivo : null,
    };
  });

  const todosSubidos = estadoDocumentos.every((d) => d.subido);
  const todosAprobados = estadoDocumentos.every((d) => d.estado === 'APROBADO');

  return {
    estadoEP: stage.estado,
    radicado: stage.radicado,
    listoCertificar: todosSubidos && todosAprobados && stage.estado === 'FINALIZADO',
    documentos: estadoDocumentos,
    resumen: {
      subidos: estadoDocumentos.filter((d) => d.subido).length,
      aprobados: estadoDocumentos.filter((d) => d.estado === 'APROBADO').length,
      total: DOCUMENTOS_CERTIFICACION_OBLIGATORIOS.length,
    },
  };
};

module.exports = {
  registrar,
  getAll,
  getById,
  transicionar,
  checkElegibility,
  configurarCronograma,
  getCronograma,
  enviarARevision,
  evaluarEP,
  getSemaforo,
  certificarEP,
  getEstadoCertificacion,
};
