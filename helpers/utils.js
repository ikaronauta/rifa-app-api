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

async function changeStateBoletaByID(id) {
  const queryChangeStateBoletaByID = 'UPDATE boletas SET estado = 0 WHERE id = $1';

  try {
    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Cambiando estado boleta ID: ${id}`);

    const { rowCount } = await pool.query(queryChangeStateBoletaByID, [id]);

    if (parseInt(rowCount) == 0) {
      if (DEBUG_LOGS) console.log(`${getFormattedDate()} - No se pudo cambiar el estado de la boleta con ID: ${id}.`);
      return {
        success: false,
        message: `No se pudo cambiar el estado de la boleta con ID: ${id}.`,
        data: [],
        error: null
      };
    }

    if (DEBUG_LOGS) console.log(`${getFormattedDate()} - Se cambio el estado de la boleta con ID: ${id}.`);
    return {
      success: true,
      message: `Se cambio el estado de la boleta con ID: ${id}.`,
      data: [],
      error: null
    };

  } catch (err) {
    console.error('Error en el servidor:', err);
    return {
      success: false,
      message: "Error en el servidor",
      data: [],
      error: err.message
    };
  }
}

module.exports = { getFormattedDate, getBoleta, changeStateBoletaByID };
