function sendApiError(res, status, error, code = 'ERROR', details) {
  const payload = {
    success: false,
    error,
    code,
  };

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(status).json(payload);
}

module.exports = { sendApiError };
