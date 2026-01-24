const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'user'
    });

    await newUser.save();

    // Generar token
    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido', valid: false });
  }
});

module.exports = router;

