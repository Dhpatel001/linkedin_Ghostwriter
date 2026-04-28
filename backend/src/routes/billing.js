const router = require('express').Router();
const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createSubscription,
  getSubscription,
  cancelSubscription,
  handleWebhook,
} = require('../controllers/billingController');

// Razorpay webhook — raw body needed (already configured in server.js)
router.post('/webhook', handleWebhook);

router.post('/subscribe',  authenticate, createSubscription);
router.get('/subscription', authenticate, getSubscription);
router.post('/cancel',     authenticate, cancelSubscription);

module.exports = router;
