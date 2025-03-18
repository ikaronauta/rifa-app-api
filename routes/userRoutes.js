const express = require('express');
const pool = require('../config/db');
const { esAdmin, isAuthenticated } = require('../middlewares/authMiddleware');
const { getFormattedDate } = require('../helpers/utils');

const router = express.Router();

// Ruta protegida: ver todos los usuarios (solo admin)
router.get('/', esAdmin, async (req, res) => {
    try {
        console.log(`${getFormattedDate()} - Consultando usuarios...`);
        const result = await pool.query('SELECT * FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        console.error(`${getFormattedDate()} - Error al consultar los usuarios - error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para ver el perfil del usuario autenticado
router.get('/perfil', isAuthenticated, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
