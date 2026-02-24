const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Test = require('../models/Test');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         (new mongoose.Types.ObjectId(id)).toString() === id;
};

// PHQ-9 Questions (for reference)
const PHQ9_QUESTIONS = [
  'Poco interés o placer en hacer cosas',
  'Se ha sentido desanimado(a), deprimido(a) o sin esperanzas',
  'Ha tenido dificultad para quedarse o mantenerse dormido(a), o ha dormido demasiado',
  'Se ha sentido cansado(a) o con poca energía',
  'Ha tenido poco apetito o ha comido en exceso',
  'Se ha sentido mal consigo mismo(a), o ha sentido que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia',
  'Ha tenido dificultad para concentrarse en cosas como leer el periódico o ver televisión',
  'Se ha movido o hablado tan lento que otras personas podrían haberlo notado, o lo contrario, estaba tan inquieto(a) que se movía de un lado a otro',
  'Pensamientos de que sería mejor estar muerto(a) o de lastimarse de alguna manera'
];

// GAD-7 Questions (for reference)
const GAD7_QUESTIONS = [
  'Se ha sentido nervioso(a), ansioso(a) o con los nervios de punta',
  'No ha podido dejar de preocuparse o no ha podido controlar la preocupación',
  'Se ha preocupado demasiado por diferentes cosas',
  'Ha tenido dificultad para relajarse',
  'Se ha sentido tan inquieto(a) que le es difícil permanecer sentado(a)',
  'Se ha sentido fácilmente molesto(a) o irritable',
  'Ha sentido miedo como si algo terrible fuera a pasar'
];

// Create a new test
router.post('/', verifyToken, async (req, res) => {
  try {
    const { pacienteId, tipoTest, respuestas, observaciones, fecha } = req.body;

    // Validate pacienteId
    if (!pacienteId) {
      return res.status(400).json({ message: 'El ID del paciente es requerido' });
    }

    // Validate pacienteId is a valid ObjectId (or allow any string for testing)
    // Comment out strict validation for now to allow any string ID
    // if (!isValidObjectId(pacienteId)) {
    //   return res.status(400).json({ message: 'El ID del paciente no es válido' });
    // }

    // Validate test type
    if (!tipoTest) {
      return res.status(400).json({ message: 'El tipo de test es requerido' });
    }
    
    const tipoTestUpper = tipoTest.toUpperCase();
    if (!['PHQ9', 'GAD7'].includes(tipoTestUpper)) {
      return res.status(400).json({ message: 'Tipo de test inválido. Debe ser PHQ9 o GAD7' });
    }

    // Validate responses count
    const expectedCount = tipoTestUpper === 'PHQ9' ? 9 : 7;
    if (!respuestas || !Array.isArray(respuestas) || respuestas.length !== expectedCount) {
      return res.status(400).json({ 
        message: `El test ${tipoTestUpper} requiere exactamente ${expectedCount} respuestas` 
      });
    }

    // Validate each response is between 0-3
    for (let i = 0; i < respuestas.length; i++) {
      if (typeof respuestas[i] !== 'number' || respuestas[i] < 0 || respuestas[i] > 3) {
        return res.status(400).json({ 
          message: `La respuesta ${i + 1} debe ser un número entre 0 y 3` 
        });
      }
    }

    // Calculate total score
    const puntajeTotal = respuestas.reduce((sum, r) => sum + r, 0);

    // Calculate risk level based on test type
    let nivelRiesgo, alertaSuicida;
    if (tipoTestUpper === 'PHQ9') {
      // For PHQ-9, question 9 (index 8) is critical for suicidal ideation
      const respuesta9 = respuestas[8];
      // Critical rule: if question 9 answer is > 0, risk level is 'Alto' and suicidal alert
      if (respuesta9 > 0) {
        nivelRiesgo = 'Alto';
        alertaSuicida = true;
      } else if (puntajeTotal >= 0 && puntajeTotal <= 4) {
        nivelRiesgo = 'Bajo';
        alertaSuicida = false;
      } else if (puntajeTotal >= 5 && puntajeTotal <= 14) {
        nivelRiesgo = 'Medio';
        alertaSuicida = false;
      } else {
        nivelRiesgo = 'Alto';
        alertaSuicida = false;
      }
    } else {
      // GAD-7 scoring
      if (puntajeTotal >= 0 && puntajeTotal <= 4) {
        nivelRiesgo = 'Bajo';
        alertaSuicida = false;
      } else if (puntajeTotal >= 5 && puntajeTotal <= 9) {
        nivelRiesgo = 'Medio';
        alertaSuicida = false;
      } else {
        nivelRiesgo = 'Alto';
        alertaSuicida = false;
      }
    }

    // Create test record
    const nuevoTest = new Test({
      pacienteId,
      tipoTest: tipoTestUpper,
      respuestas,
      puntajeTotal,
      nivelRiesgo,
      alertaSuicida,
      observaciones: observaciones || '',
      createdBy: req.userId,
      fecha: fecha ? new Date(fecha) : new Date()
    });

    await nuevoTest.save();

    res.status(201).json({
      message: 'Test guardado exitosamente',
      test: nuevoTest,
      alerta: alertaSuicida ? '⚠️ ALERTA: El paciente reportó ideación suicida. Se requiere atención inmediata.' : null
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Error al guardar el test', error: error.message });
  }
});

// Get all tests for the current professional
router.get('/', verifyToken, async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.userId })
      .populate('pacienteId', 'name email')
      .sort({ fecha: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los tests', error: error.message });
  }
});

// Get tests by patient ID
router.get('/paciente/:pacienteId', verifyToken, async (req, res) => {
  try {
    const tests = await Test.find({ 
      pacienteId: req.params.pacienteId,
      createdBy: req.userId 
    })
      .populate('pacienteId', 'name email')
      .sort({ fecha: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los tests del paciente', error: error.message });
  }
});

// Get tests by patient ID and test type
router.get('/paciente/:pacienteId/tipo/:tipoTest', verifyToken, async (req, res) => {
  try {
    const { pacienteId, tipoTest } = req.params;
    const tipoTestUpper = tipoTest.toUpperCase();
    
    if (!['PHQ9', 'GAD7'].includes(tipoTestUpper)) {
      return res.status(400).json({ message: 'Tipo de test inválido' });
    }

    const tests = await Test.find({ 
      pacienteId,
      tipoTest: tipoTestUpper,
      createdBy: req.userId 
    })
      .populate('pacienteId', 'name email')
      .sort({ fecha: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los tests', error: error.message });
  }
});

// Get tests with alerts (suicidal ideation)
router.get('/alertas', verifyToken, async (req, res) => {
  try {
    const tests = await Test.find({ 
      createdBy: req.userId,
      alertaSuicida: true 
    })
      .populate('pacienteId', 'name email')
      .sort({ fecha: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las alertas', error: error.message });
  }
});

// Get a single test by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findOne({ 
      _id: req.params.id, 
      createdBy: req.userId 
    }).populate('pacienteId', 'name email');
    
    if (!test) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el test', error: error.message });
  }
});

// Update a test
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { respuestas, observaciones } = req.body;
    
    const test = await Test.findOne({ 
      _id: req.params.id, 
      createdBy: req.userId 
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }

    // If responses are provided, recalculate everything
    if (respuestas) {
      const expectedCount = test.tipoTest === 'PHQ9' ? 9 : 7;
      if (respuestas.length !== expectedCount) {
        return res.status(400).json({ 
          message: `El test ${test.tipoTest} requiere exactamente ${expectedCount} respuestas` 
        });
      }

      test.respuestas = respuestas;
      test.puntajeTotal = Test.calcularPuntajeTotal(respuestas);

      if (test.tipoTest === 'PHQ9') {
        const resultado = Test.calcularNivelRiesgoPHQ9(test.puntajeTotal, respuestas[8]);
        test.nivelRiesgo = resultado.nivelRiesgo;
        test.alertaSuicida = resultado.alertaSuicida;
      } else {
        const resultado = Test.calcularNivelRiesgoGAD7(test.puntajeTotal);
        test.nivelRiesgo = resultado.nivelRiesgo;
        test.alertaSuicida = resultado.alertaSuicida;
      }
    }

    if (observaciones !== undefined) {
      test.observaciones = observaciones;
    }

    await test.save();

    res.json({
      message: 'Test actualizado exitosamente',
      test,
      alerta: test.alertaSuicida ? '⚠️ ALERTA: El paciente reportó ideación suicida. Se requiere atención inmediata.' : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el test', error: error.message });
  }
});

// Delete a test
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.userId 
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test no encontrado' });
    }
    
    res.json({ message: 'Test eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el test', error: error.message });
  }
});

// Get test statistics for a patient
router.get('/estadisticas/:pacienteId', verifyToken, async (req, res) => {
  try {
    const tests = await Test.find({ 
      pacienteId: req.params.pacienteId,
      createdBy: req.userId 
    }).sort({ fecha: 1 });

    if (tests.length === 0) {
      return res.json({
        totalTests: 0,
        phq9: { count: 0, avgScore: 0, trend: [] },
        gad7: { count: 0, avgScore: 0, trend: [] }
      });
    }

    const phq9Tests = tests.filter(t => t.tipoTest === 'PHQ9');
    const gad7Tests = tests.filter(t => t.tipoTest === 'GAD7');

    const phq9Avg = phq9Tests.length > 0 
      ? phq9Tests.reduce((sum, t) => sum + t.puntajeTotal, 0) / phq9Tests.length 
      : 0;
    
    const gad7Avg = gad7Tests.length > 0 
      ? gad7Tests.reduce((sum, t) => sum + t.puntajeTotal, 0) / gad7Tests.length 
      : 0;

    // Format trend data for charts
    const phq9Trend = phq9Tests.map(t => ({
      fecha: t.fecha,
      puntaje: t.puntajeTotal,
      nivelRiesgo: t.nivelRiesgo
    }));

    const gad7Trend = gad7Tests.map(t => ({
      fecha: t.fecha,
      puntaje: t.puntajeTotal,
      nivelRiesgo: t.nivelRiesgo
    }));

    res.json({
      totalTests: tests.length,
      phq9: {
        count: phq9Tests.length,
        avgScore: Math.round(phq9Avg * 10) / 10,
        trend: phq9Trend
      },
      gad7: {
        count: gad7Tests.length,
        avgScore: Math.round(gad7Avg * 10) / 10,
        trend: gad7Trend
      },
      alertas: tests.filter(t => t.alertaSuicida).length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Get questions for a test type
router.get('/preguntas/:tipoTest', (req, res) => {
  const tipoTestUpper = req.params.tipoTest.toUpperCase();
  
  if (tipoTestUpper === 'PHQ9') {
    res.json({ 
      tipoTest: 'PHQ9',
      preguntas: PHQ9_QUESTIONS,
      opciones: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    });
  } else if (tipoTestUpper === 'GAD7') {
    res.json({ 
      tipoTest: 'GAD7',
      preguntas: GAD7_QUESTIONS,
      opciones: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    });
  } else {
    res.status(400).json({ message: 'Tipo de test inválido' });
  }
});

module.exports = router;
