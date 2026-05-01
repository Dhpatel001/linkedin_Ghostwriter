const VoiceProfile = require('../models/VoiceProfile');
const { analyzeVoiceProfile, analyzeVoiceProfileArtifacts, generatePostFromVoiceProfile } = require('../services/voiceService');

/** POST /api/voice/generate -> generate a LinkedIn post from voice notes / topic */
const generateFromVoice = async (req, res, next) => {
  try {
    const { topic, tone, length = 'medium', keywords = [] } = req.body;
    if (!topic) return res.status(400).json({ success: false, error: 'topic is required', code: 'VALIDATION_ERROR' });

    const profile = await VoiceProfile.findOne({ userId: req.user.id }).lean();
    const content = await generatePostFromVoiceProfile({ topic, tone, length, keywords, profile });

    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/voice/profile */
const getVoiceProfile = async (req, res, next) => {
  try {
    const profile = await VoiceProfile.findOne({ userId: req.user.id }).lean();
    res.json({ success: true, data: profile || null });
  } catch (err) {
    next(err);
  }
};

/** POST /api/voice/analyze */
const analyzeProfile = async (req, res, next) => {
  try {
    const samplePosts = Array.isArray(req.body.samplePosts) ? req.body.samplePosts : [];
    const topics = Array.isArray(req.body.topics) ? req.body.topics : [];
    const analysis = await analyzeVoiceProfile(samplePosts, topics);

    const existingProfile = await VoiceProfile.findOne({ userId: req.user.id });

    if (existingProfile) {
      existingProfile.voiceDescription = analysis.voiceDescription;
      existingProfile.toneTags = analysis.toneTags;
      existingProfile.openingStyle = analysis.openingStyle;
      existingProfile.sentenceLength = analysis.sentenceLength;
      existingProfile.avgWordCount = Math.max(50, analysis.avgWordCount ?? 180);
      existingProfile.usesEmoji = analysis.usesEmoji;
      existingProfile.usesBulletPoints = analysis.usesBulletPoints;
      existingProfile.signaturePatterns = analysis.signaturePatterns;
      existingProfile.avoidPatterns = analysis.avoidPatterns;
      existingProfile.samplePosts = analysis.samplePosts;
      existingProfile.topicBuckets = analysis.topicBuckets;
      existingProfile.analysisVersion = (existingProfile.analysisVersion || 1) + 1;
      await existingProfile.save();

      return res.json({ success: true, data: existingProfile });
    }

    const profile = await VoiceProfile.create({
      userId: req.user.id,
      ...analysis,
    });

    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/** POST /api/voice/analyze-artifacts (text + screenshots) */
const analyzeProfileArtifacts = async (req, res, next) => {
  try {
    const samplePosts = Array.isArray(req.body.samplePosts) ? req.body.samplePosts : [];
    const topics = Array.isArray(req.body.topics) ? req.body.topics : [];
    const images = Array.isArray(req.body.images) ? req.body.images : [];

    const analysis = await analyzeVoiceProfileArtifacts(samplePosts, topics, images);

    const existingProfile = await VoiceProfile.findOne({ userId: req.user.id });

    if (existingProfile) {
      existingProfile.voiceDescription = analysis.voiceDescription;
      existingProfile.toneTags = analysis.toneTags;
      existingProfile.openingStyle = analysis.openingStyle;
      existingProfile.sentenceLength = analysis.sentenceLength;
      existingProfile.avgWordCount = Math.max(50, analysis.avgWordCount ?? 180);
      existingProfile.usesEmoji = analysis.usesEmoji;
      existingProfile.usesBulletPoints = analysis.usesBulletPoints;
      existingProfile.signaturePatterns = analysis.signaturePatterns;
      existingProfile.avoidPatterns = analysis.avoidPatterns;
      existingProfile.samplePosts = analysis.samplePosts;
      existingProfile.topicBuckets = analysis.topicBuckets;
      existingProfile.analysisVersion = (existingProfile.analysisVersion || 1) + 1;
      await existingProfile.save();

      return res.json({ success: true, data: existingProfile });
    }

    const profile = await VoiceProfile.create({
      userId: req.user.id,
      ...analysis,
    });

    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/** POST /api/voice/profile */
const saveVoiceProfile = async (req, res, next) => {
  try {
    const payload = {
      voiceDescription: req.body.voiceDescription || req.body.description || null,
      toneTags: Array.isArray(req.body.toneTags)
        ? req.body.toneTags
        : (typeof req.body.tone === 'string' ? [req.body.tone] : []),
      openingStyle: req.body.openingStyle,
      sentenceLength: req.body.sentenceLength,
      avgWordCount: req.body.avgWordCount != null ? Math.max(50, Number(req.body.avgWordCount) || 50) : undefined,
      usesEmoji: req.body.usesEmoji,
      usesBulletPoints: req.body.usesBulletPoints,
      signaturePatterns: req.body.signaturePatterns,
      avoidPatterns: req.body.avoidPatterns,
      topicBuckets: req.body.topicBuckets,
      samplePosts: req.body.samplePosts || req.body.examples,
      lastUpdated: new Date(),
    };

    const profile = await VoiceProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/voice/topics */
const updateTopics = async (req, res, next) => {
  try {
    const topics = [...new Set((Array.isArray(req.body.topics) ? req.body.topics : []).map((topic) => String(topic).trim()).filter(Boolean))].slice(0, 10);
    if (!topics.length) {
      return res.status(400).json({ success: false, error: 'At least one topic is required', code: 'VALIDATION_ERROR' });
    }

    const profile = await VoiceProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { topicBuckets: topics, lastUpdated: new Date() } },
      { new: true }
    );

    if (!profile) return res.status(404).json({ success: false, error: 'Voice profile not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/voice/regenerate */
const regenerateProfile = async (req, res, next) => {
  try {
    const profile = await VoiceProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ success: false, error: 'Voice profile not found', code: 'NOT_FOUND' });
    if (!profile.samplePosts?.length) {
      return res.status(400).json({
        success: false,
        error: 'No stored sample posts found for this user',
        code: 'VALIDATION_ERROR',
      });
    }

    const analysis = await analyzeVoiceProfile(profile.samplePosts, profile.topicBuckets || []);
    profile.voiceDescription = analysis.voiceDescription;
    profile.toneTags = analysis.toneTags;
    profile.openingStyle = analysis.openingStyle;
    profile.sentenceLength = analysis.sentenceLength;
    profile.avgWordCount = Math.max(50, analysis.avgWordCount ?? 180);
    profile.usesEmoji = analysis.usesEmoji;
    profile.usesBulletPoints = analysis.usesBulletPoints;
    profile.signaturePatterns = analysis.signaturePatterns;
    profile.avoidPatterns = analysis.avoidPatterns;
    profile.topicBuckets = analysis.topicBuckets;
    profile.analysisVersion = (profile.analysisVersion || 1) + 1;
    await profile.save();

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateFromVoice,
  getVoiceProfile,
  analyzeProfile,
  analyzeProfileArtifacts,
  saveVoiceProfile,
  updateTopics,
  regenerateProfile,
};
