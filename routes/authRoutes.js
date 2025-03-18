const express = require('express');
const passport = require('../config/passport');
const router = express.Router();
const pool = require('../config/db');
const { getFormattedDate } = require('../helpers/utils');

// Iniciar autenticación con Google
router.get('/google', (req, res, next) => {
  console.log(`${getFormattedDate()} - Iniciando autenticación con Google...`);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Callback de autenticación de Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    if (!req.user) {
      console.log(`${getFormattedDate()} - No se ha autenticado, redirigiendo...`);
      return res.redirect('/');
    }

    // Elimina sesiones previas antes de continuar
    await removePreviousSessions(req.user.id);

    // Redirigir según el tipo de usuario
    if (req.user.tipo === 'admin') {
      console.log(`${getFormattedDate()} - Redirigiendo al área de admin...`);
      res.redirect('/users');
    } else {
      console.log(`${getFormattedDate()} - Redirigiendo al inicio...`);
      res.redirect('/');
    }
  }
);

// Cerrar sesión
router.get('/logout', (req, res) => {
  if (!req.user) {
    console.log(`${getFormattedDate()} - Intento de cerrar sesión sin usuario autenticado`);
    return res.status(400).json({ message: "No hay una sesión activa" });
  }

  console.log(`${getFormattedDate()} - Cerrando sesión...`);
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

      res.clearCookie('connect.sid'); // Asegura que la cookie de sesión se elimine
      console.warn(`${getFormattedDate()} - Sesión cerrada exitosamente`);
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });
});

async function removePreviousSessions(userId) {
  try {
    console.log(`${getFormattedDate()} - Eliminando sesiones previas para el usuario ${userId}...`);
    await pool.query(
      "DELETE FROM sessions WHERE sess::jsonb->'passport'->>'user' = $1",
      [userId]
    );
    console.log(`${getFormattedDate()} - ✅ Sesiones previas eliminadas para el usuario ${userId}`);
  } catch (err) {
    console.error(`${getFormattedDate()} - ❌ Error eliminando sesiones previas:`, err);
  }
}

module.exports = router;
