const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ReporteEmocional = require('../models/ReporteEmocional');

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

// Crear nuevo reporte emocional
router.post('/', verifyToken, async (req, res) => {
  try {
    const reporteData = {
      ...req.body,
      createdBy: req.userId
    };

    const nuevoReporte = new ReporteEmocional(reporteData);
    await nuevoReporte.save();

    res.status(201).json({
      message: 'Reporte emocional creado exitosamente',
      reporte: nuevoReporte
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el reporte emocional', error: error.message });
  }
});

// Obtener todos los reportes emocionales del usuario
router.get('/', verifyToken, async (req, res) => {
  try {
    const reportes = await ReporteEmocional.find({ createdBy: req.userId }).sort({ createdAt: -1 });
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los reportes emocionales', error: error.message });
  }
});

// Obtener un reporte emocional por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const reporte = await ReporteEmocional.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte emocional no encontrado' });
    }
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el reporte emocional', error: error.message });
  }
});

// Actualizar reporte emocional
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const reporte = await ReporteEmocional.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true }
    );
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte emocional no encontrado' });
    }
    res.json({
      message: 'Reporte emocional actualizado exitosamente',
      reporte
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el reporte emocional', error: error.message });
  }
});

// Eliminar reporte emocional
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const reporte = await ReporteEmocional.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte emocional no encontrado' });
    }
    res.json({ message: 'Reporte emocional eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el reporte emocional', error: error.message });
  }
});

module.exports = router;