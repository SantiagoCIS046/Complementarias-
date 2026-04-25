// =============================================
// enums.js - Enumeraciones globales del sistema
// =============================================

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  APRENDIZ: 'APRENDIZ',
  EMPRESA: 'EMPRESA',
});

// --- Máquina de estados de la EP (7 estados) ---
// Flujo: SOLICITUD → REGISTRO → VALIDACION → APROBADO → EN_CURSO → FINALIZADO → CERTIFICADO
//                                           ↘ RECHAZADO (puede volver a REGISTRO)
const ESTADO_EP = Object.freeze({
  SOLICITUD:  'SOLICITUD',   // 1. El aprendiz inicia la solicitud
  REGISTRO:   'REGISTRO',    // 2. El aprendiz completa el registro con datos de empresa
  VALIDACION: 'VALIDACION',  // 3. El instructor/admin valida los documentos
  APROBADO:   'APROBADO',    // 4. La EP fue aprobada
  RECHAZADO:  'RECHAZADO',   // 4b. La EP fue rechazada (puede volver a REGISTRO)
  EN_CURSO:   'EN_CURSO',    // 5. La etapa productiva está en progreso
  FINALIZADO: 'FINALIZADO',  // 6. La etapa productiva terminó
  CERTIFICADO:'CERTIFICADO', // 7. Se emitió el certificado final
});

// Transiciones válidas de la máquina de estados
const TRANSICIONES_EP = Object.freeze({
  SOLICITUD:  ['REGISTRO'],
  REGISTRO:   ['VALIDACION'],
  VALIDACION: ['APROBADO', 'RECHAZADO'],
  APROBADO:   ['EN_CURSO'],
  RECHAZADO:  ['REGISTRO'],     // Permite corrección y re-envío
  EN_CURSO:   ['FINALIZADO'],
  FINALIZADO: ['CERTIFICADO'],
  CERTIFICADO: [],               // Estado terminal
});

const TIPO_FORMACION = Object.freeze({
  PRESENCIAL: 'PRESENCIAL',
  VIRTUAL:    'VIRTUAL',
  REMOTA:     'REMOTA',
});

const MODALIDAD_EP = Object.freeze({
  CONTRATO_APRENDIZAJE:   'CONTRATO_APRENDIZAJE',
  PASANTIA:               'PASANTIA',
  PROYECTO_PRODUCTIVO:    'PROYECTO_PRODUCTIVO',
  MONITORIA:              'MONITORIA',
  VINCULACION_LABORAL:    'VINCULACION_LABORAL',
});

// --- Jornada del aprendiz (Motor de Cronogramas - Modulo 2) ---
const JORNADA = Object.freeze({
  TIEMPO_COMPLETO: 'TIEMPO_COMPLETO',  // 8 horas/dia, 5 dias/semana
  MEDIO_TIEMPO:   'MEDIO_TIEMPO',      // 4 horas/dia, 5 dias/semana
});

// --- Constantes de la calculadora de cronogramas ---
// Regla SENA: La EP requiere un total de horas segun la jornada.
const CRONOGRAMA_CONFIG = Object.freeze({
  HORAS_TOTALES_EP:       880,   // Total de horas requeridas para completar la EP
  HORAS_DIA_COMPLETO:     8,     // Horas por dia en tiempo completo
  HORAS_DIA_MEDIO:        4,     // Horas por dia en medio tiempo
  DIAS_LABORALES_SEMANA:  5,     // Dias laborales por semana
  MESES_TIEMPO_COMPLETO:  6,     // Duracion estandar en meses (tiempo completo)
  MESES_MEDIO_TIEMPO:     12,    // Duracion estandar en meses (medio tiempo)
});

const TIPO_DOCUMENTO = Object.freeze({
  RUT:              'RUT',
  CAMARA_COMERCIO:  'CAMARA_COMERCIO',
  CARTA_APRENDIZ:   'CARTA_APRENDIZ',
  ACTA_INICIO:      'ACTA_INICIO',
  EVALUACION_FINAL: 'EVALUACION_FINAL',
  CERTIFICADO_EP:   'CERTIFICADO_EP',
});

// Documentos obligatorios para registrar la EP
const DOCUMENTOS_REGISTRO_OBLIGATORIOS = Object.freeze([
  'RUT',
  'CAMARA_COMERCIO',
]);

// Documentos finales obligatorios para certificar la EP (3 archivos)
const DOCUMENTOS_CERTIFICACION_OBLIGATORIOS = Object.freeze([
  'ACTA_INICIO',
  'EVALUACION_FINAL',
  'CERTIFICADO_EP',
]);

const ESTADO_DOCUMENTO = Object.freeze({
  PENDIENTE:  'PENDIENTE',
  APROBADO:   'APROBADO',
  RECHAZADO:  'RECHAZADO',
});

const TIPO_NOVEDAD = Object.freeze({
  INCAPACIDAD: 'INCAPACIDAD',
  CALAMIDAD: 'CALAMIDAD',
  PERMISO: 'PERMISO',
  OTRO: 'OTRO',
});

// Mantener ESTADO_ETAPA como alias de compatibilidad con otros devs
const ESTADO_ETAPA = ESTADO_EP;

module.exports = {
  ROLES,
  ESTADO_EP,
  ESTADO_ETAPA,
  TRANSICIONES_EP,
  TIPO_FORMACION,
  MODALIDAD_EP,
  JORNADA,
  CRONOGRAMA_CONFIG,
  TIPO_DOCUMENTO,
  DOCUMENTOS_REGISTRO_OBLIGATORIOS,
  DOCUMENTOS_CERTIFICACION_OBLIGATORIOS,
  ESTADO_DOCUMENTO,
  TIPO_NOVEDAD,
};
