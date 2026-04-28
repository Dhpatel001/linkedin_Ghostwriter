const Post = require('../models/Post');

/** GET /api/posts — list user's posts (paginated) */
const getPosts = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ userId: req.user.id }).sort({ generatedAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ success: true, data: posts, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/posts — create a draft post */
const createPost = async (req, res, next) => {
  try {
    const { content, topic, tone } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'content is required', code: 'VALIDATION_ERROR' });

    const post = await Post.create({ userId: req.user.id, content, topic: topic || 'general', status: 'pending' });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/posts/:id — update a post */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
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

/** POST /api/posts/:id/publish — publish to LinkedIn */
const publishPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found', code: 'NOT_FOUND' });

    // TODO: call LinkedIn Share API with user's access token
    post.status   = 'posted';
    post.postedAt = new Date();
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, createPost, updatePost, deletePost, publishPost };
