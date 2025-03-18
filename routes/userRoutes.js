const express = require('express');
const pool = require('../config/db');
const { esAdmin, isAuthenticated } = require('../middlewares/authMiddleware');

const router = express.Router();

// Ruta protegida: ver todos los usuarios (solo admin)
router.get('/', esAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para ver el perfil del usuario autenticado
router.get('/perfil', isAuthenticated, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
