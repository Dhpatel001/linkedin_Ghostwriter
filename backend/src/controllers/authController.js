const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * GET /api/auth/linkedin/callback
 * Exchange LinkedIn auth code for access token → upsert user → issue JWT
 */
const linkedinCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ success: false, error: 'Missing auth code', code: 'BAD_REQUEST' });

    // Decode the state payload (intent + tier) encoded during OAuth initiation
    let intent = null;
    let tier = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        intent = decoded.intent || null;
        tier = decoded.tier || null;
      } catch (_) {
        // Malformed state — ignore, fall back to default redirect
      }
    }

    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    });
    const { access_token, expires_in } = tokenRes.data;

    // Fetch LinkedIn profile
    const [profileRes, emailRes] = await Promise.all([
      axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    const linkedinId = profileRes.data.id;
    const name = `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`;
    const email = emailRes.data.elements[0]['handle~'].emailAddress;

    // Upsert user
    const user = await User.findOneAndUpdate(
      { linkedinId },
      {
        $set: {
          name,
          email,
          linkedinAccessToken: access_token,
          linkedinTokenExpiry: new Date(Date.now() + expires_in * 1000),
          lastActiveAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    // After setting the JWT cookie: redirect based on intent
    if (intent === 'subscribe') {
      const billingUrl = new URL(`${process.env.FRONTEND_URL}/billing`);
      if (tier) billingUrl.searchParams.set('tier', tier);
      return res.redirect(billingUrl.toString());
    }

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
};

module.exports = { linkedinCallback, getMe, logout };
