const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const historiasRoutes = require('./routes/historias');
const reportesEmocionalesRoutes = require('./routes/reportes-emocionales');
const atencionesGrupalesRoutes = require('./routes/atenciones-grupales');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kidspsicologo';
mongoose.connect(mongoURI)
.then(async () => {
  console.log('Connected to MongoDB');
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
      console.log('Default admin user created');
    } else {
      console.log('Default admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding default user:', error);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// For Vercel deployment
module.exports = app;

// Local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
