const jwt = require('jsonwebtoken');
const { sendApiError } = require('../utils/apiError');

/**
 * Verifies the JWT from either the Authorization header or the auth cookie.
 * Attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  const headerToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  const cookieToken = req.cookies?.voicepost_token || req.cookies?.token || null;
  const token = headerToken || cookieToken;

  if (!token) {
    return sendApiError(res, 401, 'No token provided', 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendApiError(res, 401, 'Invalid or expired token', 'TOKEN_INVALID');
  }
};

module.exports = { authenticate };
