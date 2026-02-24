const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.Mixed,  // Allow both ObjectId and string
    required: true
  },
  tipoTest: {
    type: String,
    required: true,
    enum: ['PHQ9', 'GAD7'],
    uppercase: true
  },
  respuestas: [{
    type: Number,
    required: true,
    min: 0,
    max: 3
  }],
  puntajeTotal: {
    type: Number,
    required: true,
    min: 0
  },
  nivelRiesgo: {
    type: String,
    required: true,
    enum: ['Bajo', 'Medio', 'Alto'],
    uppercase: false
  },
  alertaSuicida: {
    type: Boolean,
    default: false
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
  fecha: {
    type: Date,
    default: Date.now
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
testSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before findOneAndUpdate
testSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Static method to calculate risk level for PHQ-9
testSchema.statics.calcularNivelRiesgoPHQ9 = function(puntajeTotal, respuesta9) {
  // Critical rule: if question 9 answer is > 0, risk level is 'Alto' and suicidal alert
  if (respuesta9 > 0) {
    return {
      nivelRiesgo: 'Alto',
      alertaSuicida: true
    };
  }
  
  // Standard PHQ-9 scoring
  if (puntajeTotal >= 0 && puntajeTotal <= 4) {
    return { nivelRiesgo: 'Bajo', alertaSuicida: false };
  } else if (puntajeTotal >= 5 && puntajeTotal <= 14) {
    return { nivelRiesgo: 'Medio', alertaSuicida: false };
  } else {
    return { nivelRiesgo: 'Alto', alertaSuicida: false };
  }
};

// Static method to calculate risk level for GAD-7
testSchema.statics.calcularNivelRiesgoGAD7 = function(puntajeTotal) {
  if (puntajeTotal >= 0 && puntajeTotal <= 4) {
    return { nivelRiesgo: 'Bajo', alertaSuicida: false };
  } else if (puntajeTotal >= 5 && puntajeTotal <= 9) {
    return { nivelRiesgo: 'Medio', alertaSuicida: false };
  } else {
    return { nivelRiesgo: 'Alto', alertaSuicida: false };
  }
};

// Static method to calculate total score
testSchema.statics.calcularPuntajeTotal = function(respuestas) {
  return respuestas.reduce((sum, respuesta) => sum + respuesta, 0);
};

module.exports = mongoose.model('Test', testSchema);
