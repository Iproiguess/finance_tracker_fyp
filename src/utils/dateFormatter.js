/**
 * Format date string from yyyy-mm-dd to dd/mm/yyyy
 * @param {string} dateString - Date in yyyy-mm-dd format
 * @returns {string} - Date in dd/mm/yyyy format
 */
export const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Format date string from dd/mm/yyyy to yyyy-mm-dd
 * @param {string} dateString - Date in dd/mm/yyyy format
 * @returns {string} - Date in yyyy-mm-dd format
 */
export const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};
