// =============================================
// enums.js - Enumeraciones globales del sistema
// =============================================

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  APRENDIZ: 'APRENDIZ',
  COORDINADOR: 'COORDINADOR',
});

const ESTADO_USUARIO = Object.freeze({
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  BLOQUEADO: 'BLOQUEADO',
});

const ESTADO_CONTRATO = Object.freeze({
  ACTIVO: 'ACTIVO',
  TERMINADO_CONTRATO: 'TERMINADO_CONTRATO',
});

const ESTADO_ETAPA = Object.freeze({
  POR_INICIAR: 'POR_INICIAR',
  EN_CURSO: 'EN_CURSO',
  TERMINADA: 'TERMINADA',
  CANCELADA: 'CANCELADA',
});

const TIPO_NOVEDAD = Object.freeze({
  INCAPACIDAD: 'INCAPACIDAD',
  CALAMIDAD: 'CALAMIDAD',
  PERMISO: 'PERMISO',
  OTRO: 'OTRO',
});

const ESTADO_DOCUMENTO = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
});

module.exports = { 
  ROLES, 
  ESTADO_USUARIO,
  ESTADO_CONTRATO,
  ESTADO_ETAPA, 
  TIPO_NOVEDAD, 
  ESTADO_DOCUMENTO 
};
