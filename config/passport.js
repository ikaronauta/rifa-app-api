const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";
const { getFormattedDate } = require('../helpers/utils');

//Usuario y contraseña
passport.use(new LocalStrategy({
  usernameField: "email",
  passwordField: "password"
}, async (email, password, done) => {
  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Consultando usuario con el email: ${email}...`);
    const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Usuario no encontrado.`);
      return done(null, false, { message: "Usuario no encontrado." });
    }

    const user = userResult.rows[0];

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Contraseña incorrecta.`);
      return done(null, false, { message: "Contraseña incorrecta" });
    }

    return done(null, user);
  } catch (err) {
    console.error(`${getFormattedDate()} - ${err.message}`);
    return done(err);
  }
}));

//GOOGLE (OAuth)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails || profile.emails.length === 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No se encontraron correos en el perfil de Google.`);
      return done(new Error('No se encontraron correos en el perfil de Google'), null);
    }

    const email = profile.emails[0].value;
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO usuarios (nombre, email, password, celular, tipo, auth_provider, email_verificado) VALUES ($1, $2, '', '', 'usuario', 'google', true) RETURNING *",
        [profile.displayName, email]
      );
      return done(null, newUser.rows[0]);
    }

    return done(null, user.rows[0]);
  } catch (err) {
    console.error('⚠️ Error en la autenticación:', err);
    return done(null, false, { message: "Error en la autenticación" });
  }
}));

passport.serializeUser((user, done) => {
  done(null, { id: user.id, tipo: user.tipo });
});

passport.deserializeUser(async (data, done) => {
  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE id = $1", [data.id]);
    done(null, user.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
