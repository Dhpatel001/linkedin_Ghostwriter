const User = require('../models/User');
const { sendApiError } = require('../utils/apiError');

const ALLOWED_STATUSES = new Set(['active', 'trial']);
const PLAN_ORDER = ['starter', 'pro', 'scale', 'global'];

async function checkSubscription(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendApiError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const user = await User.findById(userId).select(
      '_id subscriptionStatus trialEndsAt subscriptionTier'
    );
    if (!user) {
      return sendApiError(res, 404, 'User not found', 'NOT_FOUND');
    }

    if (user.subscriptionStatus === 'trial' && user.trialEndsAt && user.trialEndsAt.getTime() <= Date.now()) {
      user.subscriptionStatus = 'expired';
      await user.save();
    }

    if (!ALLOWED_STATUSES.has(user.subscriptionStatus)) {
      return sendApiError(
        res,
        403,
        'An active subscription is required to use this feature',
        'SUBSCRIPTION_REQUIRED'
      );
    }

    req.subscription = {
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

function requirePlan(minTier) {
  const requiredIndex = PLAN_ORDER.indexOf(minTier);
  return (req, res, next) => {
    const currentTier = req.subscription?.tier;
    const currentIndex = PLAN_ORDER.indexOf(currentTier);

    if (requiredIndex === -1) return next();
    if (currentIndex >= requiredIndex) return next();

    return sendApiError(
      res,
      403,
      `This feature requires at least the ${minTier} plan`,
      'PLAN_RESTRICTED',
      { requiredPlan: minTier }
    );
  };
}

module.exports = { checkSubscription, requirePlan };
