const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createSubscription,
  getStatus,
  cancelSubscription,
  handleWebhook,
} = require('../controllers/billingController');

// Razorpay webhook -> raw body needed (already configured in server.js)
router.post('/webhook', handleWebhook);

router.post('/create-subscription', authenticate, createSubscription);
router.get('/status', authenticate, getStatus);
router.post('/subscribe', authenticate, createSubscription);
router.get('/subscription', authenticate, getStatus);
router.post('/cancel', authenticate, cancelSubscription);

module.exports = router;
