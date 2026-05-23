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
const driveService = require('../documents-dev2/storage.service');

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
    
    if (apprentices.length > 0) {
      const apprenticeIds = apprentices.map(a => a._id);
      query.apprenticeId = { $in: apprenticeIds };
    } else {
      // MODO TEST: Si el instructor no tiene asignados, mostramos todos para que pueda probar la interfaz
      console.log('💡 Instructor sin aprendices asignados. Mostrando todos para pruebas.');
    }
  }

  const stages = await ProductiveStage.find(query)
    .populate({
      path: 'apprenticeId',
      select: 'name email role documento instructorAsignado instructorTecnico instructorProyecto tipoProyecto',
      populate: [
        { path: 'instructorAsignado', select: 'name email telefono' },
        { path: 'instructorTecnico', select: 'name email telefono' },
        { path: 'instructorProyecto', select: 'name email telefono' }
      ]
    })
    .populate('companyId', 'razonSocial nit')
    .populate('seguimientos')
    .sort({ createdAt: -1 });

  // Inyectar resumen de cronograma (ritmo/estado) para cada EP
  const stagesWithSummary = stages.map(stage => {
    const stageObj = stage.toObject();
    stageObj.cronograma = generarResumenCronograma(stage);
    return stageObj;
  });

  return stagesWithSummary;
};

/**
 * Obtener una EP por su ID, con documentos asociados.
 */
const getById = async (id) => {
  const stage = await ProductiveStage.findById(id)
    .populate({
      path: 'apprenticeId',
      select: 'name email role documento instructorAsignado instructorTecnico instructorProyecto tipoProyecto',
      populate: [
        { path: 'instructorAsignado', select: 'name email telefono' },
        { path: 'instructorTecnico', select: 'name email telefono' },
        { path: 'instructorProyecto', select: 'name email telefono' }
      ]
    })
    .populate('companyId', 'razonSocial nit jefeInmediato')
    .populate('historialEstados.realizadoPor', 'name email')
    .populate('seguimientos');

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
    .populate({
      path: 'apprenticeId',
      select: 'name email documento instructorAsignado',
      populate: {
        path: 'instructorAsignado',
        select: 'name email onedriveFolderId driveFolderId'
      }
    });
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const stageActualizada = await ejecutarTransicion(stage, nuevoEstado, userId, motivo);
  const historial = stageActualizada.historialEstados;
  const estadoAnterior = historial.length >= 2 ? historial[historial.length - 2].estadoNuevo : 'N/A';

  // --- Hook post-transicion: enviar correo de aprobacion (RF-APR-06) ---
  if (nuevoEstado === ESTADO_EP.APROBADO) {
    await enviarCorreoAprobacion(stageActualizada);
  }

  // --- Hook post-transicion: crear carpetas en Drive/OneDrive al APROBAR ---
  let driveInfo = null;
  if (nuevoEstado === ESTADO_EP.APROBADO) {
    try {
      const aprendiz = stage.apprenticeId;
      const instructor = aprendiz.instructorAsignado;
      const provider = await driveService.getActiveProvider();

      let instructorNombre = 'Instructor';
      let instructorFolderId = null;

      if (instructor) {
        instructorNombre = instructor.name;
        instructorFolderId = provider === 'ONEDRIVE' ? instructor.onedriveFolderId : instructor.driveFolderId;
      }

      const carpetas = await driveService.crearEstructuraCarpetas({
        instructorNombre,
        instructorFolderId,
        fichaNumero: stage.radicado || stageId,
        aprendizDocumento: aprendiz.documento || aprendiz._id.toString(),
        aprendizNombre: aprendiz.name || 'Aprendiz',
      });

      // Si el instructor existe pero no tenía ID de carpeta guardado, lo actualizamos ahora
      if (instructor && !instructorFolderId && carpetas.instructor && carpetas.instructor.id) {
        const User = require('../users-dev1/user.model');
        if (provider === 'ONEDRIVE') {
          await User.findByIdAndUpdate(instructor._id, { onedriveFolderId: carpetas.instructor.id });
        } else {
          await User.findByIdAndUpdate(instructor._id, { driveFolderId: carpetas.instructor.id });
        }
      }

      // Guardar IDs de carpetas en la EP
      stageActualizada.driveFolders = {
        aprendiz:   carpetas.aprendiz.id,
        bitacoras:  carpetas.bitacoras.id,
        documentos: carpetas.documentos.id,
      };
      await stageActualizada.save();

      driveInfo = {
        mensaje: `Carpetas de ${provider === 'ONEDRIVE' ? 'OneDrive' : 'Google Drive'} creadas exitosamente.`,
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
        mensaje: 'La EP fue aprobada pero hubo un error al crear carpetas en Drive/OneDrive: ' + driveError.message,
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
  const horasRequeridas = await calcularHorasRequeridas(jornada, stage.modalidad);

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

  // --- Hook post-transicion: enviar correo de aprobacion (RF-APR-06) ---
  if (nuevoEstado === ESTADO_EP.APROBADO) {
    await enviarCorreoAprobacion(stageActualizada);
  }

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

  // RF-ADM-19 Validación de certificación
  // 1. Validar que no existan solicitudes de seguimientos extraordinarios pendientes
  const Tracking = require('../trackings-dev3/tracking.model');
  const pendingExtraordinary = await Tracking.findOne({
    stageId: stage._id,
    esExtraordinario: true,
    estadoExtraordinario: 'PENDIENTE'
  });
  if (pendingExtraordinary) {
    throw new Error('No se puede certificar. Existen solicitudes de seguimientos extraordinarios pendientes de evaluación.');
  }

  // 2. Validar visitas de seguimiento obligatorias (mínimo 3 visitas realizadas)
  const completedVisitsCount = await Tracking.countDocuments({
    stageId: stage._id,
    estadoVisita: 'REALIZADO',
    $or: [
      { esExtraordinario: { $ne: true } },
      { esExtraordinario: true, estadoExtraordinario: 'APROBADO' }
    ]
  });
  if (completedVisitsCount < 3) {
    throw new Error(`No se puede certificar. Se requieren al menos 3 visitas de seguimiento realizadas (actual: ${completedVisitsCount}).`);
  }

  // 3. Validar bitácoras aprobadas según la jornada (12 para TIEMPO_COMPLETO, 24 para MEDIO_TIEMPO)
  const Bitacora = require('../bitacoras-dev3/bitacora.model');
  const approvedBitacorasCount = await Bitacora.countDocuments({
    stageId: stage._id,
    estado: 'APROBADA'
  });
  const reqBitacoras = stage.jornada === 'MEDIO_TIEMPO' ? 24 : 12;
  if (approvedBitacorasCount < reqBitacoras) {
    throw new Error(`No se puede certificar. Se requieren al menos ${reqBitacoras} bitácoras aprobadas para la jornada ${stage.jornada === 'MEDIO_TIEMPO' ? 'Medio Tiempo' : 'Tiempo Completo'} (actual: ${approvedBitacorasCount}).`);
  }

  // 4. Validar totalidad de horas registradas
  if ((stage.horasCompletadas || 0) < (stage.horasRequeridas || 880)) {
    throw new Error(`No se puede certificar. El aprendiz no ha completado las horas requeridas (${stage.horasCompletadas || 0} de ${stage.horasRequeridas || 880} hrs).`);
  }

  // Obtener todos los documentos de esta EP
  const documentos = await Document.find({ stageId });

  const TODOS_CERTIFICACION = [...DOCUMENTOS_CERTIFICACION_OBLIGATORIOS, 'SOPORTES_FINALES'];

  // Verificar que los documentos finales esten subidos
  const tiposSubidos = documentos.map((d) => d.tipoDocumento);
  const faltantes = TODOS_CERTIFICACION.filter(
    (tipo) => !tiposSubidos.includes(tipo)
  );

  if (faltantes.length > 0) {
    throw new Error(
      'No se puede certificar. Faltan los siguientes documentos finales obligatorios: ' +
      faltantes.join(', ') + '.'
    );
  }

  // Verificar que los documentos esten APROBADOS
  const docsCertificacion = documentos.filter(
    (d) => TODOS_CERTIFICACION.includes(d.tipoDocumento)
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

  // Archivado de documentación (RF-ADM-20)
  if (stageActualizada.driveFolders && stageActualizada.driveFolders.aprendiz) {
    try {
      const storageService = require('../documents-dev2/storage.service');
      const archiveFolder = await storageService.obtenerOCrearCarpeta('ARCHIVADOS');
      await storageService.moverCarpeta(stageActualizada.driveFolders.aprendiz, archiveFolder.id);
      stageActualizada.archivado = true;
      await stageActualizada.save();
    } catch (err) {
      console.error('⚠️ [ARCHIVADO] Error al archivar la carpeta del aprendiz:', err.message);
      // No propagamos el error para no invalidar el flujo principal si hay un error en Drive/OneDrive
    }
  }

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
 * Muestra cuales de los documentos finales estan subidos y su estado,
 * junto con la validacion de todos los requisitos de cierre.
 */
const getEstadoCertificacion = async (stageId) => {
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const documentos = await Document.find({ stageId });
  const TODOS_CERTIFICACION = [...DOCUMENTOS_CERTIFICACION_OBLIGATORIOS, 'SOPORTES_FINALES'];

  // Verificar cada documento de certificacion
  const estadoDocumentos = TODOS_CERTIFICACION.map((tipo) => {
    const doc = documentos.find((d) => d.tipoDocumento === tipo);
    return {
      tipoDocumento: tipo,
      subido: !!doc,
      estado: doc ? doc.estado : 'NO_SUBIDO',
      url: doc ? doc.url : null,
      nombreArchivo: doc ? doc.nombreArchivo : null,
      observaciones: doc ? doc.observaciones : '',
    };
  });

  const todosSubidos = estadoDocumentos.every((d) => d.subido);
  const todosAprobados = estadoDocumentos.every((d) => d.estado === 'APROBADO');

  // Validaciones académicas para checklist
  const Tracking = require('../trackings-dev3/tracking.model');
  const pendingExtraordinaryCount = await Tracking.countDocuments({
    stageId: stage._id,
    esExtraordinario: true,
    estadoExtraordinario: 'PENDIENTE'
  });

  const completedVisitsCount = await Tracking.countDocuments({
    stageId: stage._id,
    estadoVisita: 'REALIZADO',
    $or: [
      { esExtraordinario: { $ne: true } },
      { esExtraordinario: true, estadoExtraordinario: 'APROBADO' }
    ]
  });

  const Bitacora = require('../bitacoras-dev3/bitacora.model');
  const approvedBitacorasCount = await Bitacora.countDocuments({
    stageId: stage._id,
    estado: 'APROBADA'
  });

  const reqBitacoras = stage.jornada === 'MEDIO_TIEMPO' ? 24 : 12;

  const horasCompletadas = stage.horasCompletadas || 0;
  const horasRequeridas = stage.horasRequeridas || 880;

  const cumpleVisitas = completedVisitsCount >= 3;
  const cumpleBitacoras = approvedBitacorasCount >= reqBitacoras;
  const cumpleHoras = horasCompletadas >= horasRequeridas;
  const cumpleExtraordinarias = pendingExtraordinaryCount === 0;
  const cumpleDocumentos = todosSubidos && todosAprobados;

  const listoCertificar = cumpleVisitas && cumpleBitacoras && cumpleHoras && cumpleExtraordinarias && cumpleDocumentos && stage.estado === 'FINALIZADO';

  return {
    estadoEP: stage.estado,
    radicado: stage.radicado,
    archivado: stage.archivado || false,
    listoCertificar,
    documentos: estadoDocumentos,
    resumen: {
      subidos: estadoDocumentos.filter((d) => d.subido).length,
      aprobados: estadoDocumentos.filter((d) => d.estado === 'APROBADO').length,
      total: TODOS_CERTIFICACION.length,
    },
    checklist: {
      visitas: {
        completadas: completedVisitsCount,
        requeridas: 3,
        cumple: cumpleVisitas
      },
      bitacoras: {
        aprobadas: approvedBitacorasCount,
        requeridas: reqBitacoras,
        cumple: cumpleBitacoras
      },
      horas: {
        completadas: horasCompletadas,
        requeridas: horasRequeridas,
        cumple: cumpleHoras
      },
      extraordinarias: {
        pendientes: pendingExtraordinaryCount,
        cumple: cumpleExtraordinarias
      },
      documentosFinales: {
        aprobados: estadoDocumentos.filter((d) => d.estado === 'APROBADO').length,
        total: TODOS_CERTIFICACION.length,
        cumple: cumpleDocumentos
      }
    }
  };
};


/**
 * RF-ADM-21 Generación de reportes estadísticos.
 * Filtra EPs por año, modalidad, empresa, instructor y rango de horas.
 * Devuelve totales, promedios y desglose por modalidad.
 *
 * @param {Object} filtros
 * @param {number} filtros.year          - Año de creación de la EP
 * @param {string} filtros.modalidad     - Modalidad de EP
 * @param {string} filtros.companyId     - ID de empresa
 * @param {string} filtros.instructorId  - ID de instructor de seguimiento
 * @param {number} filtros.minHoras      - Mínimo de horas completadas
 * @param {number} filtros.maxHoras      - Máximo de horas completadas
 */
const getReportStats = async (filtros = {}) => {
  const User = require('../users-dev1/user.model');

  // ── Construir query de MongoDB ───────────────────────
  const query = {};

  // Filtro por año (basado en createdAt)
  if (filtros.year) {
    const yearNum = parseInt(filtros.year, 10);
    query.createdAt = {
      $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
      $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
    };
  }

  // Filtro por modalidad
  if (filtros.modalidad) {
    query.modalidad = filtros.modalidad;
  }

  // Filtro por empresa
  if (filtros.companyId) {
    query.companyId = filtros.companyId;
  }

  // Filtro por instructor (buscar aprendices asignados a ese instructor)
  if (filtros.instructorId) {
    const apprentices = await User.find({
      instructorAsignado: filtros.instructorId,
      role: 'APRENDIZ'
    }).select('_id');
    query.apprenticeId = { $in: apprentices.map(a => a._id) };
  }

  // Filtro por rango de horas
  if (filtros.minHoras !== undefined || filtros.maxHoras !== undefined) {
    query.horasCompletadas = {};
    if (filtros.minHoras !== undefined) query.horasCompletadas.$gte = Number(filtros.minHoras);
    if (filtros.maxHoras !== undefined) query.horasCompletadas.$lte = Number(filtros.maxHoras);
  }

  // ── Ejecutar consulta ────────────────────────────────
  const stages = await ProductiveStage.find(query)
    .populate('apprenticeId', 'name documento instructorAsignado')
    .populate('companyId', 'razonSocial nit')
    .lean();

  // ── Calcular estadísticas ────────────────────────────
  const totalEPs = stages.length;
  const totalHoras = stages.reduce((acc, s) => acc + (s.horasCompletadas || 0), 0);
  const promedioHoras = totalEPs > 0 ? Math.round(totalHoras / totalEPs) : 0;

  // Conteo por estado
  const porEstado = stages.reduce((acc, s) => {
    acc[s.estado] = (acc[s.estado] || 0) + 1;
    return acc;
  }, {});

  // Conteo por modalidad
  const porModalidad = stages.reduce((acc, s) => {
    acc[s.modalidad] = (acc[s.modalidad] || 0) + 1;
    return acc;
  }, {});

  // EPs certificadas/archivadas
  const certificadas = stages.filter(s => s.estado === 'CERTIFICADO').length;
  const archivadas = stages.filter(s => s.archivado === true).length;

  // Listado simplificado de EPs para la tabla de resultados
  const lista = stages.map(s => ({
    _id: s._id,
    radicado: s.radicado,
    modalidad: s.modalidad,
    estado: s.estado,
    horasCompletadas: s.horasCompletadas || 0,
    horasRequeridas: s.horasRequeridas || 0,
    fechaInicio: s.fechaInicio,
    archivado: s.archivado || false,
    aprendiz: s.apprenticeId ? { nombre: s.apprenticeId.name, documento: s.apprenticeId.documento } : null,
    empresa: s.companyId ? { razonSocial: s.companyId.razonSocial, nit: s.companyId.nit } : null,
  }));

  return {
    resumen: {
      totalEPs,
      totalHoras,
      promedioHoras,
      certificadas,
      archivadas,
    },
    porEstado,
    porModalidad,
    lista,
    filtrosAplicados: filtros,
  };
};

const enviarCorreoAprobacion = async (stage) => {
  try {
    const User = require('../users-dev1/user.model');
    // Cargar aprendiz e instructor
    const apprentice = await User.findById(stage.apprenticeId).populate('instructorAsignado', 'name email telefono');
    if (!apprentice) return;

    const instructor = apprentice.instructorAsignado;
    const instructorName = instructor ? instructor.name : 'Por asignar';
    const instructorEmail = instructor ? instructor.email : 'N/A';
    const instructorPhone = instructor ? instructor.telefono || 'N/A' : 'N/A';

    const { sendEmail } = require('../../core/utils/mailer');
    await sendEmail({
      to: apprentice.email,
      subject: '🎉 ¡Tu Registro de Etapa Productiva ha sido APROBADO!',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 1.2rem;">🎉 ¡Etapa Productiva Aprobada!</h1>
            <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Estimado(a) aprendiz <strong>${apprentice.name}</strong>,
            </p>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Nos complace informarte que tu registro de Etapa Productiva (Radicado: <strong>${stage.radicado}</strong>) ha sido <strong>APROBADO</strong> con éxito.
            </p>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Se ha asignado al siguiente instructor para realizar tu seguimiento y bitácoras:
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #1b5e20; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Instructor:</strong> ${instructorName}</p>
              <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Correo:</strong> ${instructorEmail}</p>
              <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Teléfono:</strong> ${instructorPhone}</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #1b5e20;">📋 Recomendaciones Clave:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #475569; line-height: 1.6;">
                <li>Completa y sube tus bitácoras de manera quincenal (los días 15 y 30 de cada mes).</li>
                <li>Mantén contacto activo con tu instructor asignado.</li>
                <li>Informa de inmediato cualquier novedad o cambio de tu situación laboral.</li>
              </ul>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
              Este correo fue generado automáticamente por el sistema REPFORA.<br>
              No responda a este mensaje.
            </p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Error enviando correo de aprobacion:', err.message);
  }
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
  getReportStats,
};
