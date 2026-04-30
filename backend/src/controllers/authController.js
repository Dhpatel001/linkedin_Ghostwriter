const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendApiError } = require('../utils/apiError');

const TRIAL_LENGTH_DAYS = 7;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function getOAuthStateSecret() {
  return process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET;
}

function signOAuthStatePayload(payload) {
  const secret = getOAuthStateSecret();
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function createOAuthState(input = {}) {
  const payload = {
    intent: input.intent || null,
    tier: input.tier || null,
    next: getSafeNextPath(input.next),
    iat: Date.now(),
    exp: Date.now() + OAUTH_STATE_TTL_MS,
    nonce: crypto.randomBytes(12).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signOAuthStatePayload(encoded);
  if (!signature) return null;
  return `${encoded}.${signature}`;
}

function decodeOAuthState(state) {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    return { valid: false, reason: 'invalid_format' };
  }

  const [encoded, signature] = state.split('.');
  const expected = signOAuthStatePayload(encoded);
  if (!expected || !signature) {
    return { valid: false, reason: 'invalid_signature' };
  }

  const received = Buffer.from(signature, 'utf8');
  const computed = Buffer.from(expected, 'utf8');
  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return { valid: false, reason: 'state_expired' };
    }

    return {
      valid: true,
      data: {
        intent: decoded.intent || null,
        tier: decoded.tier || null,
        next: getSafeNextPath(decoded.next),
      },
    };
  } catch (_) {
    return { valid: false, reason: 'invalid_payload' };
  }
}

function getSafeNextPath(value) {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function getCookieOptions() {
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
}

async function syncSubscriptionState(user) {
  if (!user) return user;

  if (user.subscriptionStatus === 'trial' && user.trialEndsAt && user.trialEndsAt.getTime() < Date.now()) {
    user.subscriptionStatus = 'expired';
    await user.save();
  }

  return user;
}

async function ensureTrial(user) {
  if (!user) return user;

  if (user.subscriptionStatus === 'none' && !user.trialStartedAt && !user.lastPaymentAt) {
    user.subscriptionStatus = 'trial';
    user.trialStartedAt = new Date();
    user.trialEndsAt = new Date(Date.now() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000);
    await user.save();
  }

  return user;
}

/**
 * GET /api/auth/linkedin/callback
 * Exchange LinkedIn auth code for access token -> upsert user -> issue JWT
 */
const linkedinCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error === 'access_denied') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=linkedin_denied`);
    }

    if (!code) {
      return sendApiError(res, 400, 'Missing auth code', 'BAD_REQUEST');
    }

    let intent = null;
    let tier = null;
    let nextPath = null;

    if (state) {
      const parsedState = decodeOAuthState(state);
      if (!parsedState.valid) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
      }
      intent = parsedState.data.intent;
      tier = parsedState.data.tier;
      nextPath = parsedState.data.next;
    }

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

    // Use OIDC userinfo endpoint (replaces deprecated /v2/me + /v2/emailAddress)
    const userInfoRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const linkedinId = userInfoRes.data.sub;             // stable unique ID
    const name = userInfoRes.data.name;                  // full name
    const email = userInfoRes.data.email;                // email address
    const profileImageUrl = userInfoRes.data.picture || null; // profile picture URL

    let user = await User.findOneAndUpdate(
      { linkedinId },
      {
        $set: {
          name,
          email,
          profileImageUrl,
          linkedinAccessToken: access_token,
          linkedinTokenExpiry: new Date(Date.now() + expires_in * 1000),
          lastActiveAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          subscriptionStatus: 'trial',
          trialStartedAt: new Date(),
          trialEndsAt: new Date(Date.now() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    user = await ensureTrial(user);
    user = await syncSubscriptionState(user);

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('voicepost_token', token, getCookieOptions());

    const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    if (intent) callbackUrl.searchParams.set('intent', intent);
    if (tier) callbackUrl.searchParams.set('tier', tier);
    if (nextPath) callbackUrl.searchParams.set('next', nextPath);

    return res.redirect(callbackUrl.toString());
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return sendApiError(res, 404, 'User not found', 'NOT_FOUND');

    user = await syncSubscriptionState(user);
    res.json({ success: true, data: user.toObject() });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/me
 */
const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendApiError(res, 404, 'User not found', 'NOT_FOUND');

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    if (typeof req.body.onboardingCompleted === 'boolean') {
      user.onboardingCompleted = req.body.onboardingCompleted;
    }

    const settings = req.body.settings || {};

    if (typeof settings.onboardingCompleted === 'boolean') {
      user.onboardingCompleted = settings.onboardingCompleted;
    }

    if (typeof settings.autoGenerate === 'boolean') {
      user.settings.autoGenerate = settings.autoGenerate;
    }

    if (typeof settings.emailNotifications === 'boolean') {
      user.settings.emailNotifications = settings.emailNotifications;
    }

    if (typeof settings.timezone === 'string' && settings.timezone.trim()) {
      user.settings.timezone = settings.timezone.trim();
    }

    if (settings.postsPerWeek != null) {
      const postsPerWeek = Number(settings.postsPerWeek);
      if (!Number.isInteger(postsPerWeek) || postsPerWeek < 1 || postsPerWeek > 5) {
        return sendApiError(res, 400, 'postsPerWeek must be an integer between 1 and 5', 'VALIDATION_ERROR');
      }

      if (postsPerWeek === 5 && !['scale', 'global'].includes(user.subscriptionTier || '')) {
        return sendApiError(res, 400, '5 posts per week requires the Scale or Global plan', 'PLAN_RESTRICTED');
      }

      user.settings.postsPerWeek = postsPerWeek;
    }

    user.lastActiveAt = new Date();
    await user.save();

    res.json({ success: true, data: user.toObject() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  const cookieOptions = getCookieOptions();
  delete cookieOptions.maxAge;

  res.clearCookie('voicepost_token', cookieOptions);
  res.clearCookie('token', cookieOptions);
  res.json({ success: true, message: 'Logged out' });
};

module.exports = { linkedinCallback, getMe, updateMe, logout, createOAuthState };
