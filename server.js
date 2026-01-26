const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const historiasRoutes = require('./routes/historias');
const reportesEmocionalesRoutes = require('./routes/reportes-emocionales');
const atencionesGrupalesRoutes = require('./routes/atenciones-grupales');
const citasRoutes = require('./routes/citas');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kidspsicologo';

console.log('Intentando conectar a MongoDB...');
console.log('URI (ocultando contraseña):', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Conectado exitosamente a MongoDB');
  try {
    const existingUser = await User.findOne({ email: 'admin@kidspsicologo.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const defaultUser = new User({
        email: 'admin@kidspsicologo.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin'
      });
      await defaultUser.save();
      console.log('✅ Usuario administrador por defecto creado');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }
  } catch (error) {
    console.error('❌ Error creando usuario por defecto:', error);
  }
})
.catch(err => {
  console.error('❌ Error de conexión a MongoDB:', err.message);
  console.error('Detalles completos:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/historias', historiasRoutes);
app.use('/api/reportes-emocionales', reportesEmocionalesRoutes);
app.use('/api/atenciones-grupales', atencionesGrupalesRoutes);
app.use('/api/citas', citasRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// For Vercel deployment
module.exports = app;

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}