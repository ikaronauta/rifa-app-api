require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');
const { getFormattedDate } = require('./helpers/utils');

const userRoutes = require('./routes/userRoutes');
const authLocalRoutes = require('./routes/authLocalRoutes');
const authGoogleRoutes = require('./routes/authGoogleRoutes');

const app = express();
const port = process.env.PORT || 3000;
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";


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
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true si usas HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // Expira en 1 día
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/auth/local', authLocalRoutes);
app.use('/auth/google', authGoogleRoutes);
app.use('/users', userRoutes);

// Ruta de inicio
app.get('/', async (req, res) => {
  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Consultando boletas`);
    const result = await pool.query('SELECT * FROM boletas');
    res.status(200).json({
      success: true,
      message: "Boletas",
      data: result.rows,
      error: null
    });
  } catch (err) {
    console.error(`${getFormattedDate()} - Error al obtener las boletas`);
    res.status(500).json({
      success: false,
      message: "Error al obtener las boletas",
      data: [],
      error: null
    }); //
  }
});

app.get('/login-error', (req, res) => {
  res.status(401).json({
    success: false,
    message: "Hubo un error en la autenticación. Intenta de nuevo.",
    data: [],
    error: null
  });
});

app.post('/payu-confirmation', (req, res) => {
  console.log('Notificación de PayU recibida:', req.body);
  res.sendStatus(200);
});

app.get('/payu-confirmation', (req, res) => {
  console.log('Notificación de PayU recibida con GET:', req.query);
  res.status(200).json({ success: true, message: "Recibido con GET", data: req.query });
});

app.get('/get-boletas', async (req, res) => {
  debugger;
  const boletas = [];
  const { cant: cantString } = req.query;
  const cant = cantString ? parseInt(cantString) : 1;
  const queryGetBoletas = 'SELECT * FROM seleccionar_boleta()';

  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Consultando boletas...`);

  try {
    for (let i = 0; i < cant; i++) {
      const { rows } = await pool.query(queryGetBoletas);
      const boleta = rows[0];

      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Boleta seleccionada: ${boleta.numero}`);

      boletas.push(boleta);
    }

    return res.status(200).json({
      success: true,
      message: "Boleta consultada con exito.",
      data: boletas,
      error: null
    });

  } catch (err) {
    console.error('Error al consultar las boletas:', err);
    res.status(500).json({
      success: false,
      message: "Error al consultar las boletas",
      data: [],
      error: err.message
    });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`${getFormattedDate()} - Servidor corriendo en http://localhost:${port}`);
});
