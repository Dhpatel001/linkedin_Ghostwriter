const router = require('express').Router();
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { buildRateLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');
const {
  createOAuthState,
  linkedinCallback,
  getMe,
  updateMe,
  logout,
} = require('../controllers/authController');

const oauthRateLimit = buildRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many OAuth attempts. Please try again shortly.',
});

const updateMeValidation = [
  body('name').optional().isString().isLength({ min: 1, max: 120 }),
  body('onboardingCompleted').optional().isBoolean(),
  body('settings').optional().isObject(),
  body('settings.onboardingCompleted').optional().isBoolean(),
  body('settings.autoGenerate').optional().isBoolean(),
  body('settings.emailNotifications').optional().isBoolean(),
  body('settings.timezone').optional().isString().isLength({ min: 1, max: 100 }),
  body('settings.postsPerWeek').optional().isInt({ min: 1, max: 5 }),
  validateRequest,
];

// LinkedIn OAuth redirect (step 1 -> redirect user to LinkedIn)
router.get(
  '/linkedin',
  oauthRateLimit,
  [
    query('intent').optional().isIn(['subscribe']),
    query('tier').optional().isIn(['starter', 'pro', 'scale', 'global']),
    query('next').optional().isString().isLength({ max: 500 }),
    validateRequest,
  ],
  (req, res) => {
  const state = createOAuthState({
    intent: req.query.intent || null,
    tier: req.query.tier || null,
    next: typeof req.query.next === 'string' ? req.query.next : null,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: 'openid profile email w_member_social',
  });
  if (state) {
    params.set('state', state);
  }
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// LinkedIn OAuth callback (step 2 -> exchange code for token)
router.get('/linkedin/callback', oauthRateLimit, linkedinCallback);

// Current user info
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMeValidation, updateMe);

// Logout -> clears cookie
router.post('/logout', logout);

module.exports = router;
