const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  profileImageUrl: { type: String, default: null },
  headline:        { type: String, default: null },

  // LinkedIn OAuth — token has select:false so it NEVER appears in API responses
  linkedinId:          { type: String, unique: true, sparse: true },
  linkedinAccessToken: { type: String, select: false },
  linkedinTokenExpiry: { type: Date },

  // Subscription
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'cancelled', 'expired', 'none'],
    default: 'none',
  },
  subscriptionTier: {
    type: String,
    enum: ['starter', 'pro', 'scale', 'global', null],
    default: null,
  },
  razorpaySubscriptionId: { type: String, default: null },
  razorpayCustomerId:     { type: String, default: null },
  trialStartedAt:         { type: Date, default: null },
  trialEndsAt:            { type: Date, default: null },
  lastPaymentAt:          { type: Date, default: null },

  // User preferences
  settings: {
    autoGenerate:       { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    postsPerWeek:       { type: Number, default: 3, min: 1, max: 5 },
    timezone:           { type: String, default: 'Asia/Kolkata' },
  },

  onboardingCompleted: { type: Boolean, default: false },
  createdAt:           { type: Date, default: Date.now },
  lastActiveAt:        { type: Date, default: Date.now },
});

// Indexes — email and linkedinId are already indexed via unique:true above
UserSchema.index({ razorpaySubscriptionId: 1 });
UserSchema.index({ subscriptionStatus: 1 });

// Used by the weekly cron job to fetch eligible users in one query
UserSchema.statics.getActiveForCron = function () {
  return this.find({
    subscriptionStatus: { $in: ['active', 'trial'] },
    onboardingCompleted: true,
    'settings.autoGenerate': true,
  })
    .lean()
    .maxTimeMS(10000);
};

module.exports = mongoose.model('User', UserSchema);
