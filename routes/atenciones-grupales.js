const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AtencionesGrupales = require('../models/AtencionesGrupales');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
      { ...req.body, updatedAt: new Date() },
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
    
    // Delete associated images from filesystem
    if (atencion.imagenes && atencion.imagenes.length > 0) {
      atencion.imagenes.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    
    res.json({ message: 'Atención grupal eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la atención grupal', error: error.message });
  }
});

// Upload images to an existing atención grupal
router.post('/:id/upload-images', verifyToken, upload.array('imagenes', 5), async (req, res) => {
  try {
    const atencion = await AtencionesGrupales.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!atencion) {
      return res.status(404).json({ message: 'Atención grupal no encontrada' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han subido imágenes' });
    }

    // Generate relative paths for the uploaded files
    const imagePaths = req.files.map(file => `uploads/${file.filename}`);
    
    // Add new images to existing ones
    atencion.imagenes = [...(atencion.imagenes || []), ...imagePaths];
    await atencion.save();

    res.json({
      message: 'Imágenes subidas exitosamente',
      imagenes: imagePaths,
      atencion
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir las imágenes', error: error.message });
  }
});

// Delete a specific image from an atención grupal
router.delete('/:id/images/:imageIndex', verifyToken, async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const atencion = await AtencionesGrupales.findOne({ _id: id, createdBy: req.userId });
    
    if (!atencion) {
      return res.status(404).json({ message: 'Atención grupal no encontrada' });
    }

    const index = parseInt(imageIndex);
    if (isNaN(index) || index < 0 || index >= atencion.imagenes.length) {
      return res.status(400).json({ message: 'Índice de imagen inválido' });
    }

    // Delete file from filesystem
    const imagePath = atencion.imagenes[index];
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove from array
    atencion.imagenes.splice(index, 1);
    await atencion.save();

    res.json({ message: 'Imagen eliminada exitosamente', atencion });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la imagen', error: error.message });
  }
});

module.exports = router;