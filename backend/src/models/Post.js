const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:       { type: String, required: true },
  editedContent: { type: String, default: null },
  topic:         { type: String, required: true, trim: true },
  hook:          { type: String, default: null },  // auto-extracted from first line

  status: {
    type: String,
    enum: ['pending', 'approved', 'discarded', 'posted'],
    default: 'pending',
  },

  voiceScore:         { type: Number, min: 1, max: 10, default: null },
  voiceScoreFeedback: { type: String, default: null },

  generatedAt: { type: Date, default: Date.now },
  approvedAt:  { type: Date, default: null },
  postedAt:    { type: Date, default: null },

  // Used to prevent duplicate topic generation in same week
  weekNumber: { type: Number },
  year:       { type: Number },

  performance: {
    impressions: { type: Number, default: null },
    likes:       { type: Number, default: null },
    comments:    { type: Number, default: null },
    shares:      { type: Number, default: null },
  },
});

// Core query indexes — every frequent query pattern covered
PostSchema.index({ userId: 1, status: 1 });
PostSchema.index({ userId: 1, generatedAt: -1 });
PostSchema.index({ userId: 1, weekNumber: 1, year: 1 });

// Auto-extract hook (first line) whenever content is set
PostSchema.pre('save', function (next) {
  if (this.isModified('content') || this.isNew) {
    this.hook = this.content.split('\n')[0].trim().slice(0, 280);
  }
  next();
});

// Returns last N topics used — cron uses this to avoid repeating topics
PostSchema.statics.getRecentTopics = function (userId, limit = 6) {
  return this.find({ userId })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .select('topic')
    .lean()
    .maxTimeMS(5000);
};

// Aggregation: which topics drive the most impressions — used in analytics
PostSchema.statics.getTopicPerformance = function (userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'posted',
        'performance.impressions': { $ne: null },
      },
    },
    {
      $group: {
        _id: '$topic',
        avgImpressions: { $avg: '$performance.impressions' },
        avgLikes:       { $avg: '$performance.likes' },
        count:          { $sum: 1 },
      },
    },
    { $sort: { avgImpressions: -1 } },
  ]);
};

module.exports = mongoose.model('Post', PostSchema);
