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

  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Registrando usuario....`);
    const userExists = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - El usuario ya está registrado`);
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10); // Encriptar la contraseña antes de guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, celular, tipo, auth_provider) VALUES ($1, $2, $3, $4, 'usuario', 'local') RETURNING *",
      [nombre, email, hashedPassword, celular]
    );

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Usuario registrado con éxito`);
    res.json({ message: "Usuario registrado con éxito", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post('/login', async (req, res, next) => {
  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Iniciando sesión....`);

  await removePreviousSessions(req.user.id);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(`${getFormattedDate()} - Error en el servidor`, err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: "Error al iniciar sesión" });

      console.error(`${getFormattedDate()} - Inicio de sesión exitoso`, err);
      res.json({ message: 'Inicio de sesión exitoso', user });
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  if (!req.user) {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No hay una sesión activa`);
    return res.status(400).json({ message: "No hay una sesión activa" });
  }

  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Cerrando sesión...`);

  req.logout((err) => {
    if (err) {
      console.error(`${getFormattedDate()} - Error al cerrar sesión:`, err);
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error(`${getFormattedDate()} - Error al destruir la sesión:`, err);
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }

      res.clearCookie('connect.sid');
      if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Sesión cerrada exitosamente`);
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });
});

module.exports = router;
