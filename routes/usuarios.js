const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Importa la conexión a PostgreSQL

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta de prueba
router.get('/ping', (req, res) => {
  res.json({ message: 'Participantes funcionando 🚀' });
});

module.exports = router;
