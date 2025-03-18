const pool = require('../config/db');
const { getFormattedDate } = require('../helpers/utils');

// Función para eliminar sesiones previas
async function removePreviousSessions(userId) {
  await pool.query(
    'DELETE FROM sessions WHERE sess::jsonb->>\'passport\' IS NOT NULL AND sess::jsonb->\'passport\'->>\'user\' = $1',
    [userId]
  );
}

const esAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.tipo !== 'admin') {
    console.warn(`${getFormattedDate()} - Acceso denegado`);
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    console.warn(`${getFormattedDate()} - No autenticado`);
    return res.status(401).json({ message: 'No autenticado' });
  }
  next();
};

module.exports = { esAdmin, isAuthenticated, removePreviousSessions };
