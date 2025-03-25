const express = require('express');
const passport = require('../config/passport');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { getFormattedDate } = require('../helpers/utils');
const { removePreviousSessions } = require('../middlewares/authMiddleware');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";
const transporter = require('../config/mailer');
const { generateToken } = require('../helpers/tokenGenerator');

router.post('/register', async (req, res) => {
  const { nombre, email, password, celular } = req.body;

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const emailToken = generateToken();

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, celular, tipo, auth_provider, email_verificado, email_token) VALUES ($1, $2, $3, $4, 'usuario', 'local', false, $5) RETURNING *",
      [nombre, email, hashedPassword, celular, emailToken]
    );

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Usuario guardado en la base de datos con éxito`);

    const verificationLink = `http://localhost:3000/auth/local/verify-email?token=${emailToken}`;

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Link de verificación: ${verificationLink}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verifica tu correo electrónico',
      html: `<p>Hola ${nombre},</p>
             <p>Gracias por registrarte. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
             <a href="${verificationLink}">Verificar correo</a>`,
    });

    res.status(201).json({
      success: true,
      message: "Registro exitoso. Revisa tu correo para confirmar tu cuenta.",
      data: [newUser.rows[0]],
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor.",
      data: [],
      error: err.message
    });
  }
});

router.post('/login', async (req, res, next) => {
  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Iniciando sesión....`);

  await removePreviousSessions(req.user.id);

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

    if (!user) {
      console.error(`${getFormattedDate()} - Credenciales incorrectas`);
      return res.status(401).json({
        success: false,
        message: info.message || "Credenciales incorrectas",
        data: [],
        error: null
      });
    }

    if (!user.email_verificado) {
      console.error(`${getFormattedDate()} - Correo no verificado`);
      return res.status(403).json({
        success: false,
        message: "Debes verificar tu correo electrónico antes de iniciar sesión.",
        data: [],
        error: null
      });
    }

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

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const userQuery = 'SELECT * FROM usuarios WHERE email_token = $1';
    const updateUserQuery = "UPDATE usuarios SET email_verificado = true, email_token = NULL WHERE email_token = $1";

    if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Consulta SQL: ${userQuery} Token recibido: ${token}`);
    const { rows } = await pool.query(userQuery, [token]);
    const user = rows[0];

    if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Consulta SQL: ${updateUserQuery} Token recibido: ${token}`);
    const result = await pool.query(updateUserQuery, [token]);

    if (result.rowCount == 0) {
      if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Token inválido o expirado.`);
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado.",
        data: [],
        error: null
      });
    }

    req.logIn(user, (err) => {
      debugger;
      if (err) {
        console.error('Error al iniciar sesión después de la verificación:', err);
        return res.status(500).json({
          success: false,
          message: "Correo verificado, pero error al iniciar sesión.",
          data: [],
          error: err.message
        });
      }

      if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Sesión iniciada después de la verificación.`);
      res.status(200).json({
        success: true,
        message: "Correo verificado y sesión iniciada.",
        data: [{ user }],
        error: null
      });
    });
  } catch (err) {
    console.error('Error al verificar el correo:', err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      data: [],
      error: err.message
    });
  }
});


module.exports = router;
