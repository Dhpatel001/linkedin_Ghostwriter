const axios = require('axios');
const { analyzeVoiceProfileArtifacts } = require('./voiceService');

function uniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((s) => String(s || '').trim()).filter(Boolean))];
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function collectLongStrings(value, bucket = []) {
  if (bucket.length >= 40 || value == null) return bucket;

  if (typeof value === 'string') {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length >= 20) {
      bucket.push(normalized);
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectLongStrings(item, bucket);
      if (bucket.length >= 40) break;
    }
    return bucket;
  }

  if (typeof value === 'object') {
    for (const item of Object.values(value)) {
      collectLongStrings(item, bucket);
      if (bucket.length >= 40) break;
    }
  }

  return bucket;
}

function extractApiPostTexts(posts) {
  if (!Array.isArray(posts)) return [];

  const allStrings = posts.flatMap((post) => collectLongStrings(post, []));
  return uniqueStrings(allStrings).slice(0, 30);
}

function buildFallbackVoiceProfile(topics = []) {
  const topicBuckets = uniqueStrings(topics).slice(0, 10);
  const toneTags = topicBuckets.length ? ['professional', 'observational'] : ['professional'];

  return {
    voiceDescription:
      'Professional LinkedIn writer with a clear, observation-led style. Add sample posts or screenshots to personalize this profile further.',
    toneTags,
    openingStyle: 'observation',
    sentenceLength: 'medium',
    usesEmoji: false,
    usesBulletPoints: false,
    signaturePatterns: ['clear observational openings', 'direct takeaways'],
    avoidPatterns: ['generic filler', 'corporate jargon', 'hashtags'],
    topicBuckets,
  };
}

async function fetchLinkedInUserInfo(accessToken) {
  if (!accessToken) return null;
  const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data || null;
}

/**
 * Attempts to fetch recent posts.
 * NOTE: LinkedIn access varies by product approvals/scopes.
 * If forbidden/not available, return null and continue with uploads.
 */
async function fetchLinkedInRecentPosts(accessToken) {
  if (!accessToken) return null;
  try {
    // This endpoint may not be available for all apps; keep it best-effort.
    // If it fails, we fall back to user uploads/samples.
    const res = await axios.get('https://api.linkedin.com/v2/ugcPosts', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: 'authors',
        // We don't know author URN here without extra calls; keep this disabled.
        // Implementations can be expanded later when correct permissions are enabled.
        count: 10,
      },
    });
    return Array.isArray(res.data?.elements) ? res.data.elements : [];
  } catch {
    return null;
  }
}

function computeReadabilitySignals(posts) {
  const texts = posts.map((p) => String(p || '').trim()).filter(Boolean);
  const totalChars = texts.reduce((t, s) => t + s.length, 0);
  const avgChars = texts.length ? Math.round(totalChars / texts.length) : 0;
  const avgParagraphs = texts.length
    ? Math.round(texts.reduce((t, s) => t + s.split(/\n{2,}/).filter(Boolean).length, 0) / texts.length)
    : 0;
  const usesHashtags = texts.some((t) => /(^|\s)#\w+/.test(t));
  const usesQuestions = texts.some((t) => /\?\s*$|\?/m.test(t));
  return { avgChars, avgParagraphs, usesHashtags, usesQuestions };
}

function buildRecommendations(voiceProfile, readability) {
  const recs = [];
  if (readability.avgParagraphs <= 3) recs.push('Add more white-space: split body into 4–6 short paragraphs.');
  if (!readability.usesQuestions) recs.push('End with a direct question CTA to increase comments.');
  if (readability.avgChars > 1800) recs.push('Reduce length: aim for 120–220 words for consistent skim-reads.');
  if (voiceProfile?.usesBulletPoints) recs.push('Keep lists to 3–5 bullets max. One idea per bullet.');
  recs.push('Include 1 concrete detail per post (metric, mistake, decision, or process).');
  recs.push('Use a sharper hook: tension, contrarian view, or specific curiosity gap.');
  return recs.slice(0, 8);
}

async function generateLinkedInReport({
  accessToken,
  uploadedTextPosts = [],
  uploadedImages = [],
  topics = [],
}) {
  const hasLinkedInToken = Boolean(accessToken);

  const userInfo = hasLinkedInToken ? await fetchLinkedInUserInfo(accessToken).catch(() => null) : null;
  const apiPosts = hasLinkedInToken ? await fetchLinkedInRecentPosts(accessToken) : null;
  const apiTextPosts = extractApiPostTexts(apiPosts);
  const analysisTextPosts = uploadedTextPosts.length ? uploadedTextPosts : apiTextPosts;

  const source =
    apiPosts && apiPosts.length
      ? (uploadedTextPosts.length || uploadedImages.length ? 'hybrid' : 'linkedin_api')
      : (uploadedTextPosts.length || uploadedImages.length)
      ? 'uploads'
      : 'hybrid';

  const voiceProfile = analysisTextPosts.length || uploadedImages.length
    ? await analyzeVoiceProfileArtifacts(analysisTextPosts, topics, uploadedImages)
    : buildFallbackVoiceProfile(topics);
  const readability = computeReadabilitySignals(analysisTextPosts);

  const report = {
    generatedAt: new Date().toISOString(),
    profile: userInfo
      ? {
          name: userInfo.name || null,
          email: userInfo.email || null,
          picture: userInfo.picture || null,
          sub: userInfo.sub || null,
        }
      : null,
    inputs: {
      uploadedPostCount: uploadedTextPosts.length,
      uploadedScreenshotCount: uploadedImages.length,
      apiPostCount: Array.isArray(apiPosts) ? apiPosts.length : 0,
      analyzedPostCount: analysisTextPosts.length,
      topics: uniqueStrings(topics).slice(0, 12),
    },
    voice: {
      voiceDescription: voiceProfile.voiceDescription,
      toneTags: voiceProfile.toneTags,
      openingStyle: voiceProfile.openingStyle,
      sentenceLength: voiceProfile.sentenceLength,
      usesEmoji: voiceProfile.usesEmoji,
      usesBulletPoints: voiceProfile.usesBulletPoints,
      signaturePatterns: voiceProfile.signaturePatterns,
      avoidPatterns: voiceProfile.avoidPatterns,
    },
    contentAudit: {
      readability,
      strengths: [
        ...(voiceProfile.toneTags?.length ? [`Tone: ${voiceProfile.toneTags.join(', ')}`] : []),
        `Opening style: ${voiceProfile.openingStyle}`,
        voiceProfile.usesBulletPoints ? 'Uses structured lists effectively' : 'Uses paragraph flow (no heavy bullet reliance)',
      ].filter(Boolean),
      improvements: buildRecommendations(voiceProfile, readability),
    },
    growthAudit: {
      note:
        'Growth audit is best when we have timestamps + impressions/likes/comments per post. Upload a CSV or add performance numbers in the app for deeper insights.',
      quickWins: [
        'Pick 3 core topics and repeat them weekly for 4 weeks.',
        'Publish on consistent days (e.g., Tue/Thu/Sat) to train audience expectations.',
        'Track impressions and comments for at least 10 posts to learn what patterns work.',
      ],
      metrics: {
        avgImpressions: safeNumber(null),
        avgComments: safeNumber(null),
        postingCadencePerWeek: safeNumber(null),
      },
    },
    nextActions: [
      'Upload 10–30 of your best posts (or screenshots) to make this report more accurate.',
      'Add performance numbers to posted posts inside the app to unlock topic-level insights.',
      'Use the “Polish” button before approving to enforce scannable formatting.',
    ],
  };

  return {
    source,
    hasLinkedInToken,
    userInfo,
    report,
  };
}

module.exports = { generateLinkedInReport };
