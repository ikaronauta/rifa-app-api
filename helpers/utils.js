const pool = require('../config/db');
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

  return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}]`;
}

async function getBoleta() {
  const queryGetBoletas = 'SELECT * FROM seleccionar_boleta()';

  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Consultando boleta...`);

    const { rows } = await pool.query(queryGetBoletas);
    const boleta = rows[0];

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Boleta seleccionada: ${boleta.numero}`);

    return boleta;
    
  } catch (err) {
    return {
      success: false,
      message: err.message,
      data: [],
      error: err
    };
  }
}

module.exports = { getFormattedDate, getBoleta };
