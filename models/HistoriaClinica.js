const mongoose = require('mongoose');

const sesionSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['evaluacion', 'terapia', 'seguimiento', 'cierre']
  },
  notas: {
    type: String,
    required: true
  },
  objetivos: {
    type: String
  },
  progreso: {
    type: String
  }
});

const historiaClinicaSchema = new mongoose.Schema({
  nombrePaciente: {
    type: String,
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  genero: {
    type: String,
    enum: ['masculino', 'femenino', 'otro']
  },
  gradoPaciente: {
    type: String,
    trim: true
  },
  nivelRiesgo: {
    type: String,
    enum: ['', 'critico', 'alto', 'medio', 'bajo'],
    default: ''
  },
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  acompanamiento: {
    type: String,
    enum: ['', 'acompanamiento_padre', 'acompanante_estudiante']
  },
  descripcionAcompanamientoPadre: {
    type: String
  },
  descripcionAcompanamientoFamiliar: {
    type: String
  },
  sesionesAcompanamientoFamiliar: [{
    descripcion: {
      type: String
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  motivoConsulta: {
    type: String
  },
  sintomasActuales: {
    type: String
  },
  antecedentesMedicos: {
    type: String
  },
  diagnostico: {
    type: String
  },
  planTratamiento: {
    type: String
  },
  notas: {
    type: String
  },
  // Información familiar
  nombrePadre: {
    type: String,
    trim: true
  },
  nombreMadre: {
    type: String,
    trim: true
  },
  nombreAcudiente: {
    type: String,
    trim: true
  },
  tieneHermanosColegio: {
    type: String,
    enum: ['', 'si', 'no']
  },
  gradoHermano: {
    type: String,
    trim: true
  },
  parentescoAcudiente: {
    type: String,
    enum: ['', 'papa', 'mama', 'abuelos', 'tios', 'otros']
  },
  sesiones: [sesionSchema],
  archivos: [{
    nombre: String,
    ruta: String,
    tipo: String,
    tamano: Number
  }],
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
historiaClinicaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HistoriaClinica', historiaClinicaSchema);