const express = require('express');
const passport = require('../config/passport');

const router = express.Router();

// Iniciar autenticación con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de autenticación de Google
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user.tipo === 'admin') {
            res.redirect('/users');  // Admins van a /users
        } else {
            res.redirect('/');  // Usuarios normales van a /
        }
    }
);

// Cerrar sesión
router.get('/logout', (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: "No hay una sesión activa" });
    }

    req.logout((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({ message: "Error al cerrar sesión" });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error("Error al destruir la sesión:", err);
                return res.status(500).json({ message: "Error al cerrar sesión" });
            }

            res.clearCookie('connect.sid'); // Asegura que la cookie de sesión se elimine
            res.json({ message: "Sesión cerrada exitosamente" });
        });
    });
});


module.exports = router;
