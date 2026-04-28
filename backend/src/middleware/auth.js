const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT from the Authorization header (Bearer token).
 * Attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided', code: 'UNAUTHORIZED' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
  }
};

module.exports = { authenticate };
