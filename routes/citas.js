const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Cita = require('../models/Cita');

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Crear una nueva cita
// Crear una nueva cita
router.post('/', auth, async (req, res) => {
  try {
    const { date, time, description, type } = req.body;
    const userId = req.user.userId || req.user.id;

    const nuevaCita = new Cita({
      date,
      time,
      description,
      type,
      userId
    });

    await nuevaCita.save();
    res.status(201).json(nuevaCita);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la cita', error: error.message });
  }
});

// Obtener citas del usuario
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const citas = await Cita.find({ userId }).sort({ date: 1, time: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las citas', error: error.message });
  }
});

// Actualizar una cita
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, description, type } = req.body;
    const userId = req.user.userId || req.user.id;

    const cita = await Cita.findOneAndUpdate(
      { _id: id, userId },
      { date, time, description, type },
      { new: true }
    );

    if (!cita) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.json(cita);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la cita', error: error.message });
  }
});

// Eliminar una cita
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const cita = await Cita.findOneAndDelete({ _id: id, userId });

    if (!cita) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la cita', error: error.message });
  }
});

module.exports = router;