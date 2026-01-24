const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AtencionesGrupales = require('../models/AtencionesGrupales');

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

// Crear nueva atención grupal
router.post('/', verifyToken, async (req, res) => {
  try {
    const atencionData = {
      ...req.body,
      createdBy: req.userId
    };

    const nuevaAtencion = new AtencionesGrupales(atencionData);
    await nuevaAtencion.save();

    res.status(201).json({
      message: 'Atención grupal creada exitosamente',
      atencion: nuevaAtencion
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la atención grupal', error: error.message });
  }
});

// Obtener todas las atenciones grupales del usuario
router.get('/', verifyToken, async (req, res) => {
  try {
    const atenciones = await AtencionesGrupales.find({ createdBy: req.userId }).sort({ fecha: -1 });
    res.json(atenciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las atenciones grupales', error: error.message });
  }
});

// Obtener atenciones grupales por mes y año
router.get('/mes/:mes/:anio', verifyToken, async (req, res) => {
  try {
    const { mes, anio } = req.params;
    const startDate = new Date(anio, mes - 1, 1);
    const endDate = new Date(anio, mes, 1);

    const atenciones = await AtencionesGrupales.find({
      createdBy: req.userId,
      fecha: { $gte: startDate, $lt: endDate }
    }).sort({ fecha: 1 });

    res.json(atenciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las atenciones grupales del mes', error: error.message });
  }
});

// Obtener una atención grupal por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const atencion = await AtencionesGrupales.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!atencion) {
      return res.status(404).json({ message: 'Atención grupal no encontrada' });
    }
    res.json(atencion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la atención grupal', error: error.message });
  }
});

// Actualizar atención grupal
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const atencion = await AtencionesGrupales.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true }
    );
    if (!atencion) {
      return res.status(404).json({ message: 'Atención grupal no encontrada' });
    }
    res.json({
      message: 'Atención grupal actualizada exitosamente',
      atencion
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la atención grupal', error: error.message });
  }
});

// Eliminar atención grupal
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const atencion = await AtencionesGrupales.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!atencion) {
      return res.status(404).json({ message: 'Atención grupal no encontrada' });
    }
    res.json({ message: 'Atención grupal eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la atención grupal', error: error.message });
  }
});

module.exports = router;