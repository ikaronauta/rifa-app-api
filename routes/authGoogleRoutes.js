const express = require('express');
const passport = require('../config/passport');
const router = express.Router();
const pool = require('../config/db');
const { getFormattedDate } = require('../helpers/utils');
const { removePreviousSessions } = require('../middlewares/authMiddleware');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

router.get('/', (req, res, next) => {
  if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Iniciando autenticación con Google...`);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/callback',
  passport.authenticate('google', { failureRedirect: '/login-error' }),
  async (req, res) => {
    if (!req.user) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No se ha autenticado, redirigiendo...`);
      return res.redirect('/');
    }

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Usuario autenticado con éxito`);
    if (req.user) {
      await removePreviousSessions(req.user.id);
    }

    if (req.user.tipo === 'admin') {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Redirigiendo al área de admin...`);
      res.redirect('/users');
    } else {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Redirigiendo al inicio...`);
      res.redirect('/');
    }
  }
);

router.get('/logout', (req, res) => {
  if (!req.user) {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No hay una sesión activa`);
    return res.status(400).json({
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
        message: "Error al cerrar sesión",
        data: [],
        error: err.message
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error(`${getFormattedDate()} - Error al destruir la sesión:`, err);
        return res.status(500).json({
          success: true,
          message: "Error al destruir sesión",
          data: [],
          error: err.message
        });
      }

      res.clearCookie('connect.sid');
      if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Sesión cerrada exitosamente`);
      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente",
        data: [],
        error: null
      });
    });
  });
});

module.exports = router;
