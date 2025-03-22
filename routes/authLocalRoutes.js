const express = require('express');
const passport = require('../config/passport');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { getFormattedDate } = require('../helpers/utils');
const { removePreviousSessions } = require('../middlewares/authMiddleware');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

router.post('/register', async (req, res) => {
  const { nombre, email, password, celular } = req.body;
  debugger;
  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Registrando usuario....`);
    const userExists = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - El usuario ya está registrado`);
      return res.status(409).json({
        success: false,
        message: "El usuario ya está registrado",
        data: [],
        error: null
      });
    }

    const salt = await bcrypt.genSalt(10); // Encriptar la contraseña antes de guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, celular, tipo, auth_provider) VALUES ($1, $2, $3, $4, 'usuario', 'local') RETURNING *",
      [nombre, email, hashedPassword, celular]
    );

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Usuario registrado con éxito`);
    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      data: [newUser.rows[0]],
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Hubo un error en la autenticación. Intenta de nuevo.",
      data: [],
      error: err.message
    });
  }
});

router.post('/login', async (req, res, next) => {
  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Iniciando sesión....`);

  //await removePreviousSessions(req.user.id);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(`${getFormattedDate()} - Error en el servidor`, err);
      return res.status(500).json({
        success: false,
        message: "Error en el servidor",
        data: [],
        error: err.message
      });
    }

    if (!user) return res.status(401).json({
      success: false,
      message: info.message || "Credenciales incorrectas",
      data: [],
      error: null
    });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({
        success: false,
        message: "Error al iniciar sesión",
        data: [],
        error: err.message
      });

      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Inicio de sesión exitoso`);
      res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: [{ user }],
        error: null
      });
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  if (!req.user) {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No hay una sesión activa`);
    return res.status(401).json({
      success: false,
      message: "No hay una sesión activa.",
      data: [],
      error: null
    });
  }

  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Cerrando sesión...`);

  req.logout((err) => {
    if (err) {
      console.error(`${getFormattedDate()} - Error al cerrar sesión:`, err);
      return res.status(500).json({
        success: false,
        message: "Error al cerrar sesión.",
        data: [],
        error: err.message
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error(`${getFormattedDate()} - Error al destruir la sesión:`, err);
        return res.status(500).json({
          success: false,
          message: "Error al destruir sesión.",
          data: [],
          error: err.message
        });
      }

      res.clearCookie('connect.sid');
      if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Sesión cerrada exitosamente`);
      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente.",
        data: [],
        error: null
      });
    });
  });
});

module.exports = router;
