/**
 * Centralised error handler — must be the LAST middleware registered in server.js
 */
const { sendApiError } = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  // Log for debugging (omit stack in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  } else {
    console.error('[error]', err.message);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Internal Server Error';
  const code       = err.code    || 'INTERNAL_ERROR';

  return sendApiError(res, statusCode, message, code);
};

module.exports = { errorHandler };
