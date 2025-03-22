const pool = require('../config/db');
const { getFormattedDate } = require('../helpers/utils');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

// Función para eliminar sesiones previas
async function removePreviousSessions(userId) {
  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Eliminando sesiones previas para el usuario ${userId}...`);
    await pool.query(
      "DELETE FROM sessions WHERE sess::jsonb->'passport'->>'user' = $1",
      [userId]
    );
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - ✅ Sesiones previas eliminadas para el usuario ${userId}`);
  } catch (err) {
    if (DEBUG_LOGS) console.error(`${getFormattedDate()} - ❌ Error eliminando sesiones previas:`, err);
  }
}

const esAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.tipo !== 'admin') {
    if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - Acceso denegado`);
    return res.status(403).json({
      success: false,
      message: "Acceso denegado.",
      data: [],
      error: null
    });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    if (DEBUG_LOGS) console.warn(`${getFormattedDate()} - No autenticado`);
    return res.status(401).json({
      success: false,
      message: "No autenticado.",
      data: [],
      error: null
    });
  }
  next();
};

module.exports = { esAdmin, isAuthenticated, removePreviousSessions };
