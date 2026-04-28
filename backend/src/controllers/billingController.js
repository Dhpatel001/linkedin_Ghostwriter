const Razorpay = require('razorpay');
const crypto   = require('crypto');
const User     = require('../models/User');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_MAP = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  pro:     process.env.RAZORPAY_PLAN_PRO,
  scale:   process.env.RAZORPAY_PLAN_SCALE,
  global:  process.env.RAZORPAY_PLAN_GLOBAL,
};

/** POST /api/billing/subscribe */
const createSubscription = async (req, res, next) => {
  try {
    const { tier } = req.body;
    const planId = PLAN_MAP[tier];
    if (!planId) return res.status(400).json({ success: false, error: 'Invalid subscription tier', code: 'VALIDATION_ERROR' });

    const subscription = await razorpay.subscriptions.create({
      plan_id:        planId,
      total_count:    12,
      quantity:       1,
      customer_notify: 1,
    });

    await User.findByIdAndUpdate(req.user.id, {
      razorpaySubscriptionId: subscription.id,
      subscriptionTier:       tier,
      subscriptionStatus:     'active',
    });

    res.json({ success: true, data: { subscriptionId: subscription.id } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/billing/subscription */
const getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    res.json({
      success: true,
      data: {
        status: user.subscriptionStatus,
        tier:   user.subscriptionTier,
        endsAt: user.trialEndsAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/cancel */
const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({ success: false, error: 'No active subscription', code: 'NO_SUBSCRIPTION' });
    }

    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId);
    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/webhook — Razorpay webhook (raw body) */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body      = req.body; // raw buffer

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body.toString());
    const { event: eventName, payload } = event;

    if (eventName === 'subscription.activated') {
      const subId = payload.subscription.entity.id;
      await User.findOneAndUpdate({ razorpaySubscriptionId: subId }, { subscriptionStatus: 'active' });
    }

    if (eventName === 'subscription.cancelled' || eventName === 'subscription.expired') {
      const subId = payload.subscription.entity.id;
      await User.findOneAndUpdate(
        { razorpaySubscriptionId: subId },
        { subscriptionStatus: eventName === 'subscription.cancelled' ? 'cancelled' : 'expired' }
      );
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSubscription, getSubscription, cancelSubscription, handleWebhook };
