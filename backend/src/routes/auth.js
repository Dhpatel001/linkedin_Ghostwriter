const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  linkedinCallback,
  getMe,
  logout,
} = require('../controllers/authController');

// LinkedIn OAuth redirect (step 1 — redirect user to LinkedIn)
router.get('/linkedin', (req, res) => {
  // Encode optional intent/tier into the OAuth state param so they
  // survive the round-trip through LinkedIn and back to our callback.
  const statePayload = {
    intent: req.query.intent || null,
    tier:   req.query.tier   || null,
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINKEDIN_CLIENT_ID,
    redirect_uri:  process.env.LINKEDIN_REDIRECT_URI,
    scope:         'r_liteprofile r_emailaddress w_member_social',
    state,
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// LinkedIn OAuth callback (step 2 — exchange code for token)
router.get('/linkedin/callback', linkedinCallback);

// Current user info
router.get('/me', authenticate, getMe);

// Logout — clears cookie
router.post('/logout', authenticate, logout);

module.exports = router;
