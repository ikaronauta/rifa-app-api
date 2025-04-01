require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');
const { getFormattedDate, getBoleta, updateStateById, updateStateByArrIds } = require('./helpers/utils');

const userRoutes = require('./routes/userRoutes');
const authLocalRoutes = require('./routes/authLocalRoutes');
const authGoogleRoutes = require('./routes/authGoogleRoutes');

const app = express();
const port = process.env.PORT || 3000;
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";


// Configuración de CORS
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Reemplázalo con la URL de tu frontend
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
  const boletas = [];

  for (let i = 0; i < 3; i++) {

    let boleta = await getBoleta();

    if (!boleta || !boleta.hasOwnProperty('id')) {
      console.error('Error al consultar las boletas:', boleta);
      return res.status(500).json({
        success: false,
        message: "Error al consultar las boletas",
        data: [],
        error: boleta.message
      });
    }

    boletas.push(boleta);
  }

  return res.status(200).json({
    success: true,
    message: "Boletas consultadas con exito.",
    data: boletas,
    error: null
  });
});

app.get('/add-boleta', async (req, res) => {
  let boleta = await getBoleta();

  if (!boleta || !boleta.hasOwnProperty('id')) {
    console.error('Error al consultar la boleta:', boleta);
    return res.status(500).json({
      success: false,
      message: "Error al consultar las boletas",
      data: [],
      error: boleta.message
    });
  }

  return res.status(200).json({
    success: true,
    message: "Boleta consultada con exito.",
    data: [boleta],
    error: null
  });
});

app.get('/remove-boleta-by-id/:id', async (req, res) => {
  const boletaId = req.params.id;  

  try {
    const result = await updateStateById(boletaId, 0);

    if (result == 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No se pudo cambiar el estado de la boleta con ID: ${boletaId}.`);
      return res.status(500).json({
        success: false,
        message: `No se pudo cambiar el estado de la boleta con ID: ${boletaId}.`,
        data: [],
        error: null
      });
    }
      
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Se cambio el estado de la boleta con ID: ${boletaId}.`);
    return res.status(200).json({
      success: true,
      message: `Se cambio el estado de la boleta con ID: ${boletaId}.`,
      data: [{idBoleta: boletaId}],
      error: null
    });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
      data: [],
      error: err.message
    });
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

app.post('/payu-confirmation', async (req, res) => {
  console.log('Notificación de PayU recibida:', req.body);
  let arrIds = req.body.description.split(',').map(str => str.trim());

  if(req.body.response_message_pol != 'APPROVED'){
    await updateStateByArrIds(arrIds, 0);
    res.sendStatus(500);
  }

  try {
    await updateStateByArrIds(arrIds, 2);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error: ', error);
    res.sendStatus(500);
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`${getFormattedDate()} - Servidor corriendo en http://localhost:${port}`);
});
