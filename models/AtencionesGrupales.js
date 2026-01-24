const mongoose = require('mongoose');

const atencionGrupalSchema = new mongoose.Schema({
  grado: {
    type: String,
    required: true,
    enum: ['Preescolar', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Once']
  },
  fecha: {
    type: Date,
    required: true
  },
  tema: {
    type: String,
    required: true,
    trim: true
  },
  numeroParticipantes: {
    type: Number,
    required: true,
    min: 1
  },
  objetivos: {
    type: String,
    trim: true
  },
  actividades: {
    type: String,
    trim: true
  },
  observaciones: {
    type: String,
    trim: true
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
atencionGrupalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AtencionesGrupales', atencionGrupalSchema);