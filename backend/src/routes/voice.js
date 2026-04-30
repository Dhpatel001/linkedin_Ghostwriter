const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  generateFromVoice,
  getVoiceProfile,
  analyzeProfile,
  saveVoiceProfile,
  updateTopics,
  regenerateProfile,
} = require('../controllers/voiceController');

router.post('/generate', authenticate, generateFromVoice);
router.get('/profile', authenticate, getVoiceProfile);
router.post('/profile', authenticate, saveVoiceProfile);
router.post('/analyze', authenticate, analyzeProfile);
router.patch('/topics', authenticate, updateTopics);
router.patch('/regenerate', authenticate, regenerateProfile);

module.exports = router;
