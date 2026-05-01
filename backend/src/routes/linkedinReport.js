const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');
const { validateRequest } = require('../middleware/validateRequest');
const { buildRateLimiter } = require('../middleware/rateLimiter');
const { getLatestReport, createReport } = require('../controllers/linkedinReportController');

const reportRateLimit = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Report generation limit reached. Please try again later.',
});

router.get('/report', authenticate, checkSubscription, getLatestReport);
router.post(
  '/report',
  authenticate,
  checkSubscription,
  reportRateLimit,
  [
    body('samplePosts').optional().isArray({ max: 80 }),
    body('topics').optional().isArray({ max: 20 }),
    body('images').optional().isArray({ max: 8 }),
    validateRequest,
  ],
  createReport
);

module.exports = router;

