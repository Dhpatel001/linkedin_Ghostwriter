const { sendApiError } = require('../utils/apiError');

const DEFAULT_MESSAGE = 'Too many requests. Please try again later.';
const DEFAULT_CODE = 'RATE_LIMITED';

function buildRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  keyGenerator,
  message = DEFAULT_MESSAGE,
  code = DEFAULT_CODE,
} = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key =
      (typeof keyGenerator === 'function' && keyGenerator(req)) ||
      req.user?.id ||
      req.ip ||
      'global';

    const current = hits.get(key);
    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.set('Retry-After', String(Math.max(retryAfterSeconds, 1)));
      return sendApiError(res, 429, message, code);
    }

    current.count += 1;
    return next();
  };
}

module.exports = { buildRateLimiter };
