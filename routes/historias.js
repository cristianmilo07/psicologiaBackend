const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const HistoriaClinica = require('../models/HistoriaClinica');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y archivos PDF'));
    }
  }
});

// Crear nueva historia clínica
router.post('/', verifyToken, upload.array('archivos'), async (req, res) => {
  try {
    const archivos = req.files ? req.files.map(file => ({
      nombre: file.originalname,
      ruta: file.path,
      tipo: file.mimetype,
      tamano: file.size
    })) : [];

    const historiaData = {
      ...req.body,
      sesiones: req.body.sesiones ? JSON.parse(req.body.sesiones) : [],
      archivos: archivos,
      createdBy: req.userId
    };

    const nuevaHistoria = new HistoriaClinica(historiaData);
    await nuevaHistoria.save();

    res.status(201).json({
      message: 'Historia clínica creada exitosamente',
      historia: nuevaHistoria
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la historia clínica', error: error.message });
  }
});

// Obtener todas las historias clínicas del usuario
router.get('/', verifyToken, async (req, res) => {
  try {
    const historias = await HistoriaClinica.find({ createdBy: req.userId }).sort({ createdAt: -1 });
    res.json(historias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las historias clínicas', error: error.message });
  }
});

// Obtener una historia clínica por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const historia = await HistoriaClinica.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!historia) {
      return res.status(404).json({ message: 'Historia clínica no encontrada' });
    }
    res.json(historia);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la historia clínica', error: error.message });
  }
});

// Actualizar historia clínica
router.put('/:id', verifyToken, upload.array('archivos'), async (req, res) => {
  try {
    const archivos = req.files ? req.files.map(file => ({
      nombre: file.originalname,
      ruta: file.path,
      tipo: file.mimetype,
      tamano: file.size
    })) : [];

    const existingArchivos = req.body.existingArchivos ? JSON.parse(req.body.existingArchivos) : [];

    const updateData = {
      ...req.body,
      sesiones: req.body.sesiones ? JSON.parse(req.body.sesiones) : [],
      archivos: [...existingArchivos, ...archivos]
    };

    const historia = await HistoriaClinica.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      updateData,
      { new: true }
    );
    if (!historia) {
      return res.status(404).json({ message: 'Historia clínica no encontrada' });
    }
    res.json({
      message: 'Historia clínica actualizada exitosamente',
      historia
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la historia clínica', error: error.message });
  }
});

// Eliminar historia clínica
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const historia = await HistoriaClinica.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!historia) {
      return res.status(404).json({ message: 'Historia clínica no encontrada' });
    }
    res.json({ message: 'Historia clínica eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la historia clínica', error: error.message });
  }
});

module.exports = router;
