const Anthropic      = require('@anthropic-ai/sdk');
const VoiceProfile   = require('../models/VoiceProfile');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** POST /api/voice/generate — generate a LinkedIn post from voice notes / topic */
const generateFromVoice = async (req, res, next) => {
  try {
    const { topic, tone, length = 'medium', keywords = [] } = req.body;
    if (!topic) return res.status(400).json({ success: false, error: 'topic is required', code: 'VALIDATION_ERROR' });

    const profile = await VoiceProfile.findOne({ user: req.user.id }).lean();

    const systemPrompt = profile
      ? `You are a LinkedIn ghostwriter. Write in the voice described: ${profile.description}`
      : `You are an expert LinkedIn ghostwriter who creates engaging, professional posts.`;

    const userPrompt = `Write a ${length} LinkedIn post about: "${topic}".
Tone: ${tone || 'professional and engaging'}.
${keywords.length ? `Include these keywords naturally: ${keywords.join(', ')}.` : ''}
Format it with line breaks for readability. Do NOT add hashtags unless asked.`;

    const message = await anthropic.messages.create({
      model:      'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0].text;
    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/voice/profile */
const getVoiceProfile = async (req, res, next) => {
  try {
    const profile = await VoiceProfile.findOne({ user: req.user.id }).lean();
    res.json({ success: true, data: profile || null });
  } catch (err) {
    next(err);
  }
};

/** POST /api/voice/profile */
const saveVoiceProfile = async (req, res, next) => {
  try {
    const { description, examples, tone } = req.body;
    const profile = await VoiceProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { description, examples, tone, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateFromVoice, getVoiceProfile, saveVoiceProfile };
