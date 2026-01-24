const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Obtener perfil del usuario
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      message: 'Perfil obtenido exitosamente'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;

