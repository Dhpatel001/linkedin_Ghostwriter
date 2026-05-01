const User = require('../models/User');
const LinkedInReport = require('../models/LinkedInReport');
const { generateLinkedInReport } = require('../services/linkedinReportService');

async function getLatestReport(req, res, next) {
  try {
    const latest = await LinkedInReport.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: latest || null });
  } catch (err) {
    next(err);
  }
}

async function createReport(req, res, next) {
  try {
    const samplePosts = Array.isArray(req.body.samplePosts) ? req.body.samplePosts : [];
    const topics = Array.isArray(req.body.topics) ? req.body.topics : [];
    const images = Array.isArray(req.body.images) ? req.body.images : [];

    const user = await User.findById(req.user.id).select('+linkedinAccessToken');
    const accessToken = user?.linkedinAccessToken || null;

    const { source, hasLinkedInToken, report } = await generateLinkedInReport({
      accessToken,
      uploadedTextPosts: samplePosts,
      uploadedImages: images,
      topics,
    });

    const saved = await LinkedInReport.create({
      userId: req.user.id,
      source,
      inputMeta: {
        postCount: samplePosts.length,
        screenshotCount: images.length,
        hasLinkedInToken,
      },
      report,
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLatestReport, createReport };

