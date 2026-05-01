const mongoose = require('mongoose');

const VoiceProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // one profile per user, always
  },

  // Core voice data extracted by Claude
  voiceDescription:  { type: String, default: null },
  toneTags:          [{ type: String, trim: true }],
  openingStyle: {
    type: String,
    enum: ['question', 'bold-claim', 'story', 'stat', 'observation'],
    default: 'bold-claim',
  },
  sentenceLength: {
    type: String,
    enum: ['short', 'medium', 'long'],
    default: 'medium',
  },
  avgWordCount:     { type: Number, default: 180, min: 0, max: 1000 },
  usesEmoji:        { type: Boolean, default: false },
  usesBulletPoints: { type: Boolean, default: false },

  // Patterns Claude extracts — feed back into generation prompt
  signaturePatterns: [{ type: String }],
  avoidPatterns:     [{ type: String }],

  // Stored so user can re-analyze without re-pasting
  samplePosts:  [{ type: String, trim: true }],
  topicBuckets: [{ type: String, trim: true, maxlength: 100 }],

  // Running average from user voice score ratings
  avgVoiceScore:   { type: Number, default: null, min: 1, max: 10 },
  totalPostsRated: { type: Number, default: 0 },

  // Increments each time user re-analyzes — useful for debugging regressions
  analysisVersion: { type: Number, default: 1 },
  lastUpdated:     { type: Date, default: Date.now },
});

// Auto-update lastUpdated on every save
VoiceProfileSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

// Scoped read helper — always use this instead of raw findOne
VoiceProfileSchema.statics.findByUser = function (userId) {
  return this.findOne({ userId }).lean().maxTimeMS(10000);
};

// Called after user rates an approved post — updates running average
VoiceProfileSchema.methods.updateVoiceScore = function (newScore) {
  const total = (this.avgVoiceScore || 0) * this.totalPostsRated + newScore;
  this.totalPostsRated += 1;
  this.avgVoiceScore = parseFloat((total / this.totalPostsRated).toFixed(2));
  return this.save();
};

module.exports = mongoose.model('VoiceProfile', VoiceProfileSchema);
