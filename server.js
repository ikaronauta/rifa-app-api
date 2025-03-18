require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');
const { getFormattedDate } = require('./helpers/utils');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:5173', // Reemplázalo con la URL de tu frontend
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión con PostgreSQL
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'un_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true si usas HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // Expira en 1 día
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Ruta de inicio
app.get('/', async (req, res) => {
  try {
    console.log(`${getFormattedDate()} - Consultando boletas`);
    const result = await pool.query('SELECT * FROM boletas');
    res.json(result.rows);
  } catch (err) {
    console.warn(`${getFormattedDate()} - Error al obtener las boletas`);
    res.status(500).json({ error: 'Error al obtener las boletas' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`${getFormattedDate()} - Servidor corriendo en http://localhost:${port}`);
});
