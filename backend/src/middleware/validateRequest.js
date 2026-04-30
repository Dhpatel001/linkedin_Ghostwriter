const { validationResult } = require('express-validator');
const { sendApiError } = require('../utils/apiError');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return sendApiError(
    res,
    400,
    'Request validation failed',
    'VALIDATION_ERROR',
    errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      location: err.location,
      value: err.value,
    }))
  );
}

module.exports = { validateRequest };
