const mongoose = require('mongoose');

const LinkedInReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: {
      type: String,
      enum: ['linkedin_api', 'uploads', 'hybrid'],
      default: 'hybrid',
    },
    inputMeta: {
      postCount: { type: Number, default: 0 },
      screenshotCount: { type: Number, default: 0 },
      hasLinkedInToken: { type: Boolean, default: false },
    },
    report: { type: Object, required: true },
  },
  { timestamps: true }
);

LinkedInReportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LinkedInReport', LinkedInReportSchema);
