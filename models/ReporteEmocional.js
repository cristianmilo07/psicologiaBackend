const mongoose = require('mongoose');

const reporteEmocionalSchema = new mongoose.Schema({
  // Datos generales
  nombreEstudiante: {
    type: String,
    required: true,
    trim: true
  },
  edadGrado: {
    type: String,
    trim: true
  },
  fechaReporte: {
    type: Date,
    required: true
  },
  psicologaResponsable: {
    type: String,
    required: true,
    trim: true
  },
  periodoEvaluado: {
    type: String,
    trim: true
  },

  // Estado emocional general
  estadoEmocionalPredominante: {
    type: String,
    enum: ['', 'Estable', 'Variable', 'Inestable']
  },
  regulacionEmocional: {
    type: String,
    enum: ['', 'Adecuada', 'En proceso', 'Requiere apoyo']
  },
  relacionesSociales: {
    type: String,
    enum: ['', 'Positivas', 'Dificultades leves', 'Dificultades marcadas']
  },
  adaptacionEscolar: {
    type: String,
    enum: ['', 'Buena', 'Media', 'Baja']
  },

  // Observaciones psicológicas
  observacionesPsicologicas: {
    type: String
  },

  // Recomendaciones generales
  recomendacionesGenerales: {
    type: String
  },

  // Evaluación emocional
  emocionesFrecuentes: {
    type: String
  },
  nivelAutoestima: {
    type: String,
    enum: ['', 'Alto', 'Medio', 'Bajo']
  },
  manejoEstresFrustracion: {
    type: String,
    enum: ['', 'Adecuado', 'En desarrollo', 'Requiere intervención']
  },

  // Contexto familiar y social
  apoyoFamiliar: {
    type: String,
    enum: ['', 'Alto', 'Medio', 'Bajo']
  },
  cambiosRecientes: {
    type: String
  },
  relacionAutoridad: {
    type: String,
    enum: ['', 'Positiva', 'Neutral', 'Dificultades']
  },

  // Contexto académico
  atencionConcentracion: {
    type: String,
    enum: ['', 'Buena', 'Media', 'Baja']
  },
  motivacionEscolar: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  conductaAula: {
    type: String,
    enum: ['', 'Adecuada', 'Requiere atención', 'Problemática']
  },

  // Conclusión psicológica
  conclusionPsicologica: {
    type: String
  },

  // Seguimiento personalizado
  frecuenciaSesiones: {
    type: String,
    enum: ['', 'Semanal', 'Quincenal', 'Mensual']
  },
  observacionAula: {
    type: String,
    enum: ['', 'Sí', 'No']
  },
  objetivosSeguimiento: {
    type: String
  },
  estrategiasAplicadas: {
    type: String
  },
  evolucion: {
    type: String
  },

  // Recursos y estrategias
  recursosEstudiante: {
    type: String
  },
  recursosDocentes: {
    type: String
  },
  recursosFamilia: {
    type: String
  },
  fraseCierre: {
    type: String
  },

  // Estado Emocional Actual
  alegria: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  tristeza: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  ansiedad: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  enojo: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  miedo: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  observacionBreve: {
    type: String
  },

  // Regulación Emocional
  regulacionEmocionalNueva: {
    type: String,
    enum: ['', 'Adecuada', 'En proceso', 'Requiere apoyo']
  },
  descripcionRegulacion: {
    type: String
  },

  // Habilidades Sociales
  relacionPares: {
    type: String,
    enum: ['', 'Buena', 'Regular', 'Dificultad']
  },
  relacionDocentes: {
    type: String,
    enum: ['', 'Buena', 'Regular', 'Dificultad']
  },
  comentarioHabilidades: {
    type: String
  },

  // Comportamiento en el Entorno Escolar
  atencionClase: {
    type: String,
    enum: ['', 'Alta', 'Media', 'Baja']
  },
  cumplimientoNormas: {
    type: String,
    enum: ['', 'Sí', 'Parcial', 'No']
  },
  manejoFrustracion: {
    type: String,
    enum: ['', 'Adecuado', 'En proceso', 'Dificultad']
  },

  // Fortalezas Emocionales
  fortalezas: {
    type: String
  },
  ejemploFortalezas: {
    type: String
  },

  // Dificultades Identificadas
  dificultades: {
    type: String
  },
  ejemploDificultades: {
    type: String
  },

  // Nivel de Riesgo Emocional
  nivelRiesgo: {
    type: String,
    enum: ['', 'Bajo', 'Medio', 'Alto']
  },
  notaProfesional: {
    type: String
  },

  // Recomendaciones
  recomendacionesEstudiante: {
    type: String
  },
  recomendacionesColegio: {
    type: String
  },
  recomendacionesFamilia: {
    type: String
  },

  // Seguimiento
  seguimiento: {
    type: String,
    enum: ['', 'No requerido', 'Seguimiento mensual', 'Seguimiento quincenal']
  },
  observacionSeguimiento: {
    type: String
  },

  // Firma profesional
  firmaProfesional: {
    type: String
  },
  registroProfesional: {
    type: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reporteEmocionalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ReporteEmocional', reporteEmocionalSchema);