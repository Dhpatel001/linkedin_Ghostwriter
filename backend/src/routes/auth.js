const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  linkedinCallback,
  getMe,
  logout,
} = require('../controllers/authController');

// LinkedIn OAuth redirect (step 1 — redirect user to LinkedIn)
router.get('/linkedin', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINKEDIN_CLIENT_ID,
    redirect_uri:  process.env.LINKEDIN_REDIRECT_URI,
    scope:         'r_liteprofile r_emailaddress w_member_social',
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
