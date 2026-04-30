const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { sendApiError } = require('../utils/apiError');

const PLAN_MAP = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  pro: process.env.RAZORPAY_PLAN_PRO,
  scale: process.env.RAZORPAY_PLAN_SCALE,
  global: process.env.RAZORPAY_PLAN_GLOBAL,
};

let razorpayClient = null;

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayClient;
}

async function syncSubscriptionState(user) {
  if (!user) return user;

  if (user.subscriptionStatus === 'trial' && user.trialEndsAt && user.trialEndsAt.getTime() < Date.now()) {
    user.subscriptionStatus = 'expired';
    await user.save();
  }

  return user;
}

function buildBillingPayload(user) {
  return {
    status: user.subscriptionStatus,
    tier: user.subscriptionTier,
    trialEndsAt: user.trialEndsAt,
    nextRenewalAt: null,
    portalUrl: null,
  };
}

/** POST /api/billing/create-subscription */
const createSubscription = async (req, res, next) => {
  try {
    const { tier } = req.body;
    if (!Object.prototype.hasOwnProperty.call(PLAN_MAP, tier)) {
      return sendApiError(res, 400, 'Invalid subscription tier', 'VALIDATION_ERROR');
    }

    const user = await User.findById(req.user.id);
    if (!user) return sendApiError(res, 404, 'User not found', 'NOT_FOUND');

    const planId = PLAN_MAP[tier];
    const razorpay = getRazorpayClient();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (razorpay && planId) {
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: String(user._id),
          tier,
        },
      });

      user.razorpaySubscriptionId = subscription.id;
      user.subscriptionTier = tier;
      await user.save();

      const checkoutUrl = subscription.short_url || subscription.auth_link || subscription.hosted_url || null;
      if (!checkoutUrl) {
        return sendApiError(res, 502, 'Razorpay did not return a checkout URL', 'BILLING_PROVIDER_ERROR');
      }

      return res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          checkoutUrl,
        },
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return sendApiError(
        res,
        503,
        'Billing is not configured yet. Add Razorpay credentials to enable checkout.',
        'BILLING_NOT_CONFIGURED'
      );
    }

    user.subscriptionTier = tier;
    user.subscriptionStatus = 'active';
    user.lastPaymentAt = new Date();
    await user.save();

    return res.json({
      success: true,
      data: {
        checkoutUrl: `${frontendUrl}/dashboard?billing=dev`,
        mode: 'development',
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/billing/status */
const getStatus = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return sendApiError(res, 404, 'User not found', 'NOT_FOUND');

    user = await syncSubscriptionState(user);
    res.json({ success: true, data: buildBillingPayload(user) });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/cancel */
const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendApiError(res, 404, 'User not found', 'NOT_FOUND');

    const razorpay = getRazorpayClient();

    if (!user.razorpaySubscriptionId && user.subscriptionStatus !== 'active') {
      return sendApiError(res, 400, 'No active subscription', 'NO_SUBSCRIPTION');
    }

    if (razorpay && user.razorpaySubscriptionId) {
      await razorpay.subscriptions.cancel(user.razorpaySubscriptionId);
    }

    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.json({ success: true, data: buildBillingPayload(user) });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/webhook -> Razorpay webhook (raw body) */
const handleWebhook = async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return sendApiError(res, 503, 'Webhook secret is not configured', 'WEBHOOK_NOT_CONFIGURED');
    }

    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    if (!signature || !body || !Buffer.isBuffer(body)) {
      return sendApiError(res, 400, 'Malformed webhook request', 'WEBHOOK_INVALID_REQUEST');
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      return sendApiError(res, 400, 'Invalid webhook signature', 'WEBHOOK_INVALID_SIGNATURE');
    }

    let event = null;
    try {
      event = JSON.parse(body.toString('utf8'));
    } catch (_) {
      return sendApiError(res, 400, 'Invalid webhook payload', 'WEBHOOK_INVALID_PAYLOAD');
    }
    const { event: eventName, payload } = event;
    if (!eventName || !payload) {
      return sendApiError(res, 400, 'Webhook payload is missing required fields', 'WEBHOOK_INVALID_PAYLOAD');
    }

    if (eventName === 'subscription.activated') {
      const subEntity = payload.subscription.entity;
      const subId = subEntity.id;
      const tier = subEntity.notes?.tier || null;  // tier was stored in notes at creation
      await User.findOneAndUpdate(
        { razorpaySubscriptionId: subId },
        {
          subscriptionStatus: 'active',
          lastPaymentAt: new Date(),
          ...(tier ? { subscriptionTier: tier } : {}),
        }
      );
    }

    if (eventName === 'subscription.cancelled' || eventName === 'subscription.expired') {
      const subId = payload.subscription.entity.id;
      await User.findOneAndUpdate(
        { razorpaySubscriptionId: subId },
        {
          subscriptionStatus: eventName === 'subscription.cancelled' ? 'cancelled' : 'expired',
          subscriptionTier: null,  // revoke plan access on cancel/expire
        }
      );
    }

    res.json({ success: true, data: { received: true } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSubscription, getStatus, cancelSubscription, handleWebhook };
