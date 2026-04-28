const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  generateFromVoice,
  getVoiceProfile,
  saveVoiceProfile,
} = require('../controllers/voiceController');

router.post('/generate',  authenticate, generateFromVoice);
router.get('/profile',    authenticate, getVoiceProfile);
router.post('/profile',   authenticate, saveVoiceProfile);

module.exports = router;
