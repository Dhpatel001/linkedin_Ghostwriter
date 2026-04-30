const Anthropic = require('@anthropic-ai/sdk');

const OPENING_STYLES = ['question', 'bold-claim', 'story', 'stat', 'observation'];
const SENTENCE_LENGTHS = ['short', 'medium', 'long'];

let anthropicClient = null;

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return anthropicClient;
}

function stripCodeFences(value = '') {
  return String(value)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean))];
}

function normalizePosts(samplePosts) {
  return uniqueStrings(samplePosts).filter((post) => post.length > 20);
}

function splitSentences(text) {
  return String(text)
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function getFirstLine(text) {
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) || '';
}

function detectOpeningStyle(posts) {
  const hook = getFirstLine(posts[0]);

  if (!hook) return 'observation';
  if (hook.includes('?')) return 'question';
  if (/^\d|%|\b(data|stat|number)\b/i.test(hook)) return 'stat';
  if (/^(i|we)\b/i.test(hook)) return 'story';
  if (/^(stop|most|the|why|your|you)\b/i.test(hook) || /!$/.test(hook)) return 'bold-claim';

  return 'observation';
}

function detectSentenceLength(avgSentenceWords) {
  if (avgSentenceWords <= 12) return 'short';
  if (avgSentenceWords >= 22) return 'long';
  return 'medium';
}

function inferToneTags({ avgWordCount, avgSentenceWords, usesEmoji, usesBulletPoints, postCount }) {
  const tags = [];

  if (avgSentenceWords <= 12) tags.push('punchy');
  else if (avgSentenceWords >= 22) tags.push('thoughtful');
  else tags.push('conversational');

  if (avgWordCount <= 120) tags.push('concise');
  else if (avgWordCount >= 220) tags.push('detailed');
  else tags.push('clear');

  if (usesEmoji) tags.push('warm');
  if (usesBulletPoints) tags.push('practical');
  if (postCount >= 5) tags.push('consistent');

  tags.push('professional');

  return uniqueStrings(tags).slice(0, 4);
}

function buildVoiceDescription({ toneTags, sentenceLength, avgWordCount, usesEmoji, usesBulletPoints, openingStyle }) {
  const toneSummary = toneTags.slice(0, 2).join(' and ') || 'clear and conversational';
  const extras = [];

  extras.push(`${sentenceLength} sentences`);
  extras.push(`about ${avgWordCount} words on average`);

  if (usesEmoji) extras.push('light emoji use');
  if (usesBulletPoints) extras.push('occasional bullet points');

  return `A ${toneSummary} LinkedIn voice that usually opens with a ${openingStyle} and uses ${extras.join(', ')}.`;
}

function inferSignaturePatterns({ openingStyle, sentenceLength, usesEmoji, usesBulletPoints, avgWordCount }) {
  const patterns = [
    `Opens with a ${openingStyle.replace('-', ' ')}`,
    sentenceLength === 'short' ? 'Uses tight, easy-to-scan sentences' : `Leans on ${sentenceLength} sentences`,
    avgWordCount >= 220 ? 'Expands ideas with more context before landing the point' : 'Gets to the point quickly',
  ];

  if (usesEmoji) patterns.push('Uses emojis sparingly to soften the tone');
  if (usesBulletPoints) patterns.push('Breaks down takeaways into list-style points');

  return uniqueStrings(patterns).slice(0, 5);
}

function inferAvoidPatterns({ usesEmoji, usesBulletPoints, sentenceLength }) {
  const patterns = ['Avoid generic corporate filler', 'Avoid sounding like a template'];

  if (!usesEmoji) patterns.push('Avoid forced emojis');
  if (!usesBulletPoints) patterns.push('Avoid turning every post into a list');
  if (sentenceLength === 'short') patterns.push('Avoid long blocks of text');

  return uniqueStrings(patterns).slice(0, 4);
}

function normalizeAnalysisResult(result, samplePosts, topics) {
  return {
    voiceDescription: String(result.voiceDescription || '').trim(),
    toneTags: uniqueStrings(result.toneTags).slice(0, 6),
    openingStyle: OPENING_STYLES.includes(result.openingStyle) ? result.openingStyle : 'observation',
    sentenceLength: SENTENCE_LENGTHS.includes(result.sentenceLength) ? result.sentenceLength : 'medium',
    avgWordCount: clampNumber(result.avgWordCount, 50, 1000, 180),
    usesEmoji: Boolean(result.usesEmoji),
    usesBulletPoints: Boolean(result.usesBulletPoints),
    signaturePatterns: uniqueStrings(result.signaturePatterns).slice(0, 6),
    avoidPatterns: uniqueStrings(result.avoidPatterns).slice(0, 6),
    topicBuckets: uniqueStrings(topics.length ? topics : result.topicBuckets).slice(0, 10),
    samplePosts,
  };
}

async function analyzeWithAnthropic(samplePosts, topics) {
  const client = getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 900,
    system: 'You analyze writing style for a LinkedIn ghostwriting SaaS. Return valid JSON only.',
    messages: [
      {
        role: 'user',
        content: [
          'Analyze these LinkedIn writing samples and return JSON with the keys:',
          'voiceDescription, toneTags, openingStyle, sentenceLength, avgWordCount, usesEmoji, usesBulletPoints, signaturePatterns, avoidPatterns, topicBuckets.',
          `openingStyle must be one of: ${OPENING_STYLES.join(', ')}.`,
          `sentenceLength must be one of: ${SENTENCE_LENGTHS.join(', ')}.`,
          `Topic hints: ${topics.join(', ') || 'none provided'}.`,
          'Sample posts:',
          samplePosts.map((post, index) => `Post ${index + 1}:\n${post}`).join('\n\n'),
        ].join('\n\n'),
      },
    ],
  });

  const rawText = response.content.map((part) => ('text' in part ? part.text : '')).join('\n').trim();
  const parsed = JSON.parse(stripCodeFences(rawText));

  return normalizeAnalysisResult(parsed, samplePosts, topics);
}

function analyzeWithHeuristics(samplePosts, topics) {
  const fullText = samplePosts.join('\n\n');
  const allWords = fullText.split(/\s+/).filter(Boolean);
  const sentences = splitSentences(fullText);
  const avgWordCount = Math.round(allWords.length / samplePosts.length) || 180;
  const avgSentenceWords = Math.round(
    sentences.reduce((total, sentence) => total + sentence.split(/\s+/).filter(Boolean).length, 0) / Math.max(sentences.length, 1)
  ) || 16;
  const usesEmoji = /[\p{Extended_Pictographic}]/u.test(fullText);
  const usesBulletPoints = /(^|\n)\s*([-*•]|\d+\.)\s+/m.test(fullText);
  const openingStyle = detectOpeningStyle(samplePosts);
  const sentenceLength = detectSentenceLength(avgSentenceWords);
  const toneTags = inferToneTags({
    avgWordCount,
    avgSentenceWords,
    usesEmoji,
    usesBulletPoints,
    postCount: samplePosts.length,
  });

  return {
    voiceDescription: buildVoiceDescription({
      toneTags,
      sentenceLength,
      avgWordCount,
      usesEmoji,
      usesBulletPoints,
      openingStyle,
    }),
    toneTags,
    openingStyle,
    sentenceLength,
    avgWordCount,
    usesEmoji,
    usesBulletPoints,
    signaturePatterns: inferSignaturePatterns({
      openingStyle,
      sentenceLength,
      usesEmoji,
      usesBulletPoints,
      avgWordCount,
    }),
    avoidPatterns: inferAvoidPatterns({ usesEmoji, usesBulletPoints, sentenceLength }),
    topicBuckets: uniqueStrings(topics).slice(0, 10),
    samplePosts,
  };
}

async function analyzeVoiceProfile(samplePosts, topics = []) {
  const posts = normalizePosts(samplePosts);
  const cleanedTopics = uniqueStrings(topics).slice(0, 10);

  if (posts.length < 3) {
    const error = new Error('Please provide at least 3 sample posts.');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  try {
    const aiResult = await analyzeWithAnthropic(posts, cleanedTopics);
    if (aiResult) return aiResult;
  } catch (_) {
    // Fall back to deterministic analysis if Anthropic is unavailable.
  }

  return analyzeWithHeuristics(posts, cleanedTopics);
}

function pickTargetWords(length, profile) {
  const avgWordCount = profile?.avgWordCount || 180;
  if (length === 'short') return Math.min(avgWordCount, 120);
  if (length === 'long') return Math.max(avgWordCount + 60, 260);
  return avgWordCount;
}

function buildHook(topic, openingStyle) {
  switch (openingStyle) {
    case 'question':
      return `What does ${topic} actually look like when you are in the middle of it?`;
    case 'story':
      return `A recent lesson on ${topic} changed how I think about the work.`;
    case 'stat':
      return `Most people underestimate how much ${topic} shapes the final outcome.`;
    case 'bold-claim':
      return `${topic} is usually simpler than we make it.`;
    default:
      return `One thing I have noticed about ${topic}:`;
  }
}

function buildClosing(topic, profile) {
  if (profile?.sentenceLength === 'short') {
    return `That is the standard I try to keep when I think about ${topic}.`;
  }

  return `That is the lens I keep coming back to whenever ${topic} comes up.`;
}

function trimToWordTarget(text, targetWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= targetWords) return text.trim();

  return words
    .slice(0, targetWords)
    .join(' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

async function generateWithAnthropic({ topic, profile, tone, length, keywords }) {
  const client = getAnthropicClient();
  if (!client) return null;

  const voiceSummary = profile
    ? [
        `Voice description: ${profile.voiceDescription || 'Professional and engaging.'}`,
        `Tone tags: ${(profile.toneTags || []).join(', ') || 'professional'}`,
        `Opening style: ${profile.openingStyle || 'observation'}`,
        `Sentence length: ${profile.sentenceLength || 'medium'}`,
        `Average word count: ${profile.avgWordCount || 180}`,
        `Uses emoji: ${profile.usesEmoji ? 'yes' : 'no'}`,
        `Uses bullet points: ${profile.usesBulletPoints ? 'yes' : 'no'}`,
        `Signature patterns: ${(profile.signaturePatterns || []).join(', ') || 'none'}`,
        `Avoid patterns: ${(profile.avoidPatterns || []).join(', ') || 'none'}`,
      ].join('\n')
    : 'Write in a professional, conversational LinkedIn voice.';

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    system: 'You write high-quality LinkedIn posts. Return only the post text, with no labels or markdown fences.',
    messages: [
      {
        role: 'user',
        content: [
          `Write a ${length} LinkedIn post about "${topic}".`,
          voiceSummary,
          `Requested tone override: ${tone || 'none'}.`,
          `Keywords to include naturally: ${keywords.length ? keywords.join(', ') : 'none'}.`,
          'Use line breaks for readability and do not add hashtags unless explicitly asked.',
        ].join('\n\n'),
      },
    ],
  });

  return response.content.map((part) => ('text' in part ? part.text : '')).join('\n').trim();
}

function generateWithHeuristics({ topic, profile, tone, length, keywords }) {
  const targetWords = pickTargetWords(length, profile);
  const hook = buildHook(topic, profile?.openingStyle || 'observation');
  const voiceTags = (profile?.toneTags || []).slice(0, 2).join(' and ') || tone || 'clear and conversational';
  const keywordText = keywords.length ? ` I also keep coming back to ${keywords.join(', ')} when I unpack it.` : '';

  const paragraphOne = `${hook}\n\nThe deeper I get into it, the more I think the real advantage is not sounding smarter about ${topic}, but getting clearer about what actually moves the work forward.${keywordText}`;

  let paragraphTwo = `For me, the useful version of ${topic} is practical.\nIt means making the next decision obvious.\nIt means staying close to the customer, the constraint, and the tradeoff in front of you.`;

  if (profile?.usesBulletPoints) {
    paragraphTwo = [
      `The practical version of ${topic} usually comes down to three things:`,
      '- clarity on the real bottleneck',
      '- consistency in how you show up',
      '- a bias toward simple, repeatable execution',
    ].join('\n');
  }

  let paragraphThree = `${buildClosing(topic, profile)}\n\nThat is usually where the momentum starts.`;

  if (voiceTags) {
    paragraphThree = `${buildClosing(topic, profile)}\n\nI try to keep the tone ${voiceTags} without overcomplicating the point.`;
  }

  if (profile?.usesEmoji) {
    paragraphThree += ' :)';
  }

  return trimToWordTarget([paragraphOne, paragraphTwo, paragraphThree].join('\n\n'), targetWords);
}

async function generatePostFromVoiceProfile({ topic, profile, tone, length = 'medium', keywords = [] }) {
  if (!topic || !String(topic).trim()) {
    const error = new Error('topic is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  try {
    const aiPost = await generateWithAnthropic({
      topic: String(topic).trim(),
      profile,
      tone,
      length,
      keywords: uniqueStrings(keywords),
    });

    if (aiPost) return aiPost;
  } catch (_) {
    // Fall back to deterministic generation if Anthropic is unavailable.
  }

  return generateWithHeuristics({
    topic: String(topic).trim(),
    profile,
    tone,
    length,
    keywords: uniqueStrings(keywords),
  });
}

module.exports = {
  analyzeVoiceProfile,
  generatePostFromVoiceProfile,
  normalizePosts,
};
