// =============================================
// dateHelper.js - Utilidades de fechas
// =============================================

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
const diffInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Retorna la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns {string}
 */
const today = () => new Date().toISOString().split('T')[0];

module.exports = { formatDate, diffInDays, today };
