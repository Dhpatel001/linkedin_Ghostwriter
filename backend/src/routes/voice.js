const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { buildRateLimiter } = require('../middleware/rateLimiter');
const { checkSubscription } = require('../middleware/checkSubscription');
const { validateRequest } = require('../middleware/validateRequest');
const {
  generateFromVoice,
  getVoiceProfile,
  analyzeProfile,
  analyzeProfileArtifacts,
  saveVoiceProfile,
  updateTopics,
  regenerateProfile,
} = require('../controllers/voiceController');

const voiceGenerationRateLimit = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Voice generation limit reached. Please try again later.',
});

router.get('/profile', authenticate, getVoiceProfile);
router.post(
  '/profile',
  authenticate,
  checkSubscription,
  [body('voiceDescription').optional().isString(), body('description').optional().isString(), validateRequest],
  saveVoiceProfile
);
router.post(
  '/generate',
  authenticate,
  checkSubscription,
  voiceGenerationRateLimit,
  [body('topic').isString().isLength({ min: 1, max: 120 }), body('keywords').optional().isArray({ max: 20 }), validateRequest],
  generateFromVoice
);
router.post(
  '/analyze',
  authenticate,
  checkSubscription,
  voiceGenerationRateLimit,
  [body('samplePosts').optional().isArray({ min: 1, max: 50 }), body('topics').optional().isArray({ max: 20 }), validateRequest],
  analyzeProfile
);
router.post(
  '/analyze-artifacts',
  authenticate,
  checkSubscription,
  voiceGenerationRateLimit,
  [
    body('samplePosts').optional().isArray({ max: 50 }),
    body('topics').optional().isArray({ max: 20 }),
    body('images').optional().isArray({ max: 8 }),
    validateRequest,
  ],
  analyzeProfileArtifacts
);
router.patch(
  '/topics',
  authenticate,
  checkSubscription,
  [body('topics').isArray({ min: 1, max: 10 }), validateRequest],
  updateTopics
);
router.patch('/regenerate', authenticate, checkSubscription, voiceGenerationRateLimit, regenerateProfile);

module.exports = router;
