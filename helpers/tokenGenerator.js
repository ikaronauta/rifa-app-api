const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // Token seguro de 64 caracteres
}

module.exports = { generateToken };
