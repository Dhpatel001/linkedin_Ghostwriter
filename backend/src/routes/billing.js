const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { buildRateLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');
const {
  createSubscription,
  getStatus,
  cancelSubscription,
  handleWebhook,
} = require('../controllers/billingController');

const billingMutationRateLimit = buildRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many billing requests. Please try again soon.',
});
const webhookRateLimit = buildRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.headers['x-razorpay-signature'] || req.ip,
  message: 'Webhook rate limit reached',
});

// Razorpay webhook -> raw body needed (already configured in server.js)
router.post('/webhook', webhookRateLimit, handleWebhook);

router.post(
  '/create-subscription',
  authenticate,
  billingMutationRateLimit,
  [body('tier').isIn(['starter', 'pro', 'scale', 'global']), validateRequest],
  createSubscription
);
router.get('/status', authenticate, getStatus);
router.post(
  '/subscribe',
  authenticate,
  billingMutationRateLimit,
  [body('tier').isIn(['starter', 'pro', 'scale', 'global']), validateRequest],
  createSubscription
);
router.get('/subscription', authenticate, getStatus);
router.post('/cancel', authenticate, billingMutationRateLimit, cancelSubscription);

module.exports = router;
