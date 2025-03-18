const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!profile.emails || profile.emails.length === 0) {
            return done(new Error('No se encontraron correos en el perfil de Google'), null);
        }

        const email = profile.emails[0].value;
        const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            const newUser = await pool.query(
                "INSERT INTO usuarios (nombre, email, auth_provider, tipo, celular) VALUES ($1, $2, 'google', 'usuario', '') RETURNING *",
                [profile.displayName, email]
            );
            return done(null, newUser.rows[0]);
        }

        return done(null, user.rows[0]);
    } catch (err) {
        console.error('Error en la autenticación:', err);
        return done(err, null);
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
