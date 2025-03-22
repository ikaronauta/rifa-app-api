const express = require('express');
const pool = require('../config/db');
const { esAdmin, isAuthenticated } = require('../middlewares/authMiddleware');
const { getFormattedDate } = require('../helpers/utils');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

const router = express.Router();

// Ruta protegida: ver todos los usuarios (solo admin)
router.get('/', esAdmin, async (req, res) => {
    try {
        if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Consultando usuarios...`);
        const result = await pool.query('SELECT * FROM usuarios');
        res.status(200).json({
            success: true,
            message: "Se recuperaron los datos correctamente.",
            data: result.rows,
            error: null
        });
    } catch (err) {
        console.error(`${getFormattedDate()} - Error al consultar los usuarios - error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Error al consultar los usuarios.",
            data: [],
            error: err.message
        });
    }
});

// Ruta para ver el perfil del usuario autenticado
router.get('/perfil', isAuthenticated, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Perfil.",
        data: [req.user],
        error: null
    });
});

module.exports = router;
