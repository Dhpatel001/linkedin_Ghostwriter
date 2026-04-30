const Post = require('../models/Post');
const VoiceProfile = require('../models/VoiceProfile');
const { generatePostFromVoiceProfile } = require('../services/voiceService');

const VALID_STATUSES = ['pending', 'approved', 'discarded', 'posted'];

function getPostHook(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 280) || '';
}

function getIsoWeekData(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

  return { weekNumber, year: utcDate.getUTCFullYear() };
}

function coercePerformanceValue(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** GET /api/posts -> list user's posts */
const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;
    const filters = { userId: req.user.id };

    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ success: false, error: 'Invalid post status', code: 'VALIDATION_ERROR' });
      }
      filters.status = req.query.status;
    }

    const effectiveLimit = (!req.query.limit && !req.query.page) ? 100 : limit;

    const [posts, total] = await Promise.all([
      Post.find(filters).sort({ generatedAt: -1 }).skip(skip).limit(effectiveLimit).lean(),
      Post.countDocuments(filters),
    ]);

    res.json({ success: true, data: posts, meta: { total, page, limit: effectiveLimit } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/posts -> create a manual draft post */
const createPost = async (req, res, next) => {
  try {
    const { content, topic } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'content is required', code: 'VALIDATION_ERROR' });
    }

    const post = await Post.create({
      userId: req.user.id,
      content,
      topic: topic || 'general',
      hook: getPostHook(content),
      status: 'pending',
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** POST /api/posts/generate -> generate and save a new pending post */
const generatePost = async (req, res, next) => {
  try {
    const { topic, tone, length, keywords } = req.body;
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ success: false, error: 'topic is required', code: 'VALIDATION_ERROR' });
    }

    const profile = await VoiceProfile.findOne({ userId: req.user.id }).lean();
    const content = await generatePostFromVoiceProfile({
      topic: String(topic).trim(),
      profile,
      tone,
      length,
      keywords,
    });

    const now = new Date();
    const { weekNumber, year } = getIsoWeekData(now);

    const post = await Post.create({
      userId: req.user.id,
      topic: String(topic).trim(),
      content,
      hook: getPostHook(content),
      status: 'pending',
      generatedAt: now,
      weekNumber,
      year,
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id -> generic update */
const updatePost = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.content === 'string' && updates.content.trim()) {
      updates.content = updates.content.trim();
      updates.hook = getPostHook(updates.content);
    }

    if (typeof updates.editedContent === 'string') {
      updates.editedContent = updates.editedContent.trim();
      if (updates.editedContent) {
        updates.hook = getPostHook(updates.editedContent);
      }
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/posts/:id */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id/approve */
const approvePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });

    const voiceScore = req.body.voiceScore == null ? null : Number(req.body.voiceScore);
    if (voiceScore != null && (!Number.isFinite(voiceScore) || voiceScore < 1 || voiceScore > 10)) {
      return res.status(400).json({ success: false, error: 'voiceScore must be between 1 and 10', code: 'VALIDATION_ERROR' });
    }

    post.status = 'approved';
    post.approvedAt = new Date();
    if (voiceScore != null) {
      post.voiceScore = voiceScore;
    }
    await post.save();

    if (voiceScore != null) {
      const profile = await VoiceProfile.findOne({ userId: req.user.id });
      if (profile) {
        await profile.updateVoiceScore(voiceScore);
      }
    }

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id/discard */
const discardPost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: 'discarded' } },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id/edit */
const editPost = async (req, res, next) => {
  try {
    const editedContent = String(req.body.editedContent || '').trim();
    if (!editedContent) {
      return res.status(400).json({ success: false, error: 'editedContent is required', code: 'VALIDATION_ERROR' });
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { editedContent, hook: getPostHook(editedContent) } },
      { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id/posted */
const markPosted = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: 'posted', postedAt: new Date() } },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id/performance */
const savePerformance = async (req, res, next) => {
  try {
    const performance = {
      impressions: coercePerformanceValue(req.body.impressions),
      likes: coercePerformanceValue(req.body.likes),
      comments: coercePerformanceValue(req.body.comments),
      shares: coercePerformanceValue(req.body.shares),
    };

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { performance } },
      { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** POST /api/posts/:id/publish -> alias used by older clients */
const publishPost = async (req, res, next) => markPosted(req, res, next);

module.exports = {
  getPosts,
  createPost,
  generatePost,
  updatePost,
  deletePost,
  approvePost,
  discardPost,
  editPost,
  markPosted,
  savePerformance,
  publishPost,
};
