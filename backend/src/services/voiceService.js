/**
 * voiceService.js - LinkedIn post generation with structured frameworks
 * HOOK -> BODY -> LESSON -> CTA
 */

const Anthropic = require("@anthropic-ai/sdk");
const { buildCreatorPromptHints, enhanceLinkedInPost } = require("./postEnhancementService");

let _client = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function uniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((s) => String(s || "").trim()).filter(Boolean))];
}

function normalizePosts(posts) {
  if (!Array.isArray(posts)) return [];
  return posts
    .map((p) => (typeof p === "object" && p !== null ? String(p.content || p.text || "") : String(p || "")))
    .map((p) => p.trim())
    .filter((p) => p.length >= 20);
}

function splitSentences(text) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
}

function stripCodeFences(text) {
  return text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
}

// 7 proven LinkedIn hook formats
const HOOK_FRAMEWORKS = {
  question: [
    (t) => `Why does everyone talk about ${t} -- but almost nobody actually does it right?`,
    (t) => `Here is the uncomfortable truth about ${t} that no one wants to say out loud:`,
    (t) => `What separates people who succeed at ${t} from those who just read about it?`,
  ],
  "bold-claim": [
    (t) => `${t} is one of the most misunderstood skills in business. Here is why:`,
    (t) => `Stop overcomplicating ${t}. It is actually much simpler than you think.`,
    (t) => `Most advice on ${t} is completely backwards. I learned this the hard way.`,
  ],
  story: [
    (t) => `3 years ago, I made a massive mistake with ${t}.\n\nHere is what I wish someone had told me:`,
    (t) => `I spent 6 months studying ${t} before I realized I was asking the wrong questions.`,
    (t) => `The moment that changed how I think about ${t}:`,
  ],
  stat: [
    (t) => `80% of people who struggle with ${t} are making the same mistake.\n\nI was one of them.`,
    (t) => `Most people spend 90% of their energy on the wrong part of ${t}.`,
    (t) => `One insight about ${t} that took me years to figure out:`,
  ],
  observation: [
    (t) => `Here is something I keep noticing about ${t}:`,
    (t) => `The best people I know at ${t} all have one thing in common.`,
    (t) => `Something worth paying attention to when it comes to ${t}:`,
  ],
};

function pickHook(topic, openingStyle) {
  const frameworks = HOOK_FRAMEWORKS[openingStyle] || HOOK_FRAMEWORKS.observation;
  const fn = frameworks[Math.floor(Math.random() * frameworks.length)];
  return fn(topic);
}

const CTA_PATTERNS = [
  (t) => `What is your take on ${t}? Drop it in the comments.`,
  (t) => `If this resonated, repost it. Someone in your network needs to read this.`,
  (t) => `What would you add? I would love to hear how you think about ${t}.`,
  () => `If this was useful, save it. You will want to come back to it.`,
  (t) => `Tag someone who needs to hear this about ${t}.`,
  () => `Follow me for more honest takes on what actually works.`,
];

function pickCTA(topic) {
  const fn = CTA_PATTERNS[Math.floor(Math.random() * CTA_PATTERNS.length)];
  return fn(topic);
}

const TOPIC_PLAYBOOKS = [
  {
    test: /(trust|user|users|customer|customers|client|clients|feedback|retention|community)/i,
    observations: [
      "Trust usually grows after the small moments most teams ignore.",
      "People rarely trust your product because of a feature list alone.",
      "Early users pay attention to how quickly you close the loop, not how polished your slide deck looks.",
    ],
    examples: [
      "Reply quickly, show rough work early, and tell users exactly what changed because of their input.",
      "The fastest way to lose trust is to ask for feedback and then disappear for two weeks.",
      "A simple follow-up like 'we shipped the thing you asked for' creates more goodwill than another launch thread.",
    ],
    lessons: [
      "Clarity and follow-through beat clever positioning every time.",
      "People stay when they feel heard, not when they feel marketed to.",
      "Trust compounds when users can see your decision-making in public.",
    ],
    ctas: [
      "What is one thing your best users consistently respond well to?",
      "What has helped you earn trust faster with early users?",
    ],
  },
  {
    test: /(distribution|growth|marketing|audience|content|brand|reach|pipeline)/i,
    observations: [
      "Distribution is usually the bottleneck long before the product is.",
      "More features do not fix a weak distribution engine.",
      "Teams often treat distribution like a launch task instead of a daily operating system.",
    ],
    examples: [
      "A sharp point of view, consistent proof, and tight feedback loops usually outperform another month of feature polish.",
      "The companies that win keep repeating one message in ten places instead of inventing ten new messages once.",
      "You do not need more noise. You need one clear promise that the market can repeat for you.",
    ],
    lessons: [
      "Attention is earned through repetition and relevance, not novelty alone.",
      "If people cannot explain your value in one sentence, more features will not save you.",
      "The best distribution systems make your product easier to remember than to ignore.",
    ],
    ctas: [
      "Where does your current distribution engine break first?",
      "What changed more for you recently: the product or the distribution?",
    ],
  },
  {
    test: /(product|feature|launch|roadmap|ux|onboarding|activation)/i,
    observations: [
      "Most product teams ship volume when the market is asking for clarity.",
      "A launch rarely fails because the team moved too slowly. It fails because the value was still blurry.",
      "Users do not experience your roadmap. They experience their first five minutes.",
    ],
    examples: [
      "The biggest unlock is often removing one confusing step, one bloated feature, or one vague promise.",
      "A cleaner onboarding path usually beats another week of polish on a feature nobody reaches.",
      "When people understand the problem you solve quickly, activation gets easier without extra persuasion.",
    ],
    lessons: [
      "Better product writing and tighter positioning often create more lift than extra complexity.",
      "Simplicity is not a design choice. It is a growth choice.",
      "The strongest launches make the next step obvious and the payoff immediate.",
    ],
    ctas: [
      "What part of your product feels obvious to your team but confusing to users?",
      "What have you removed lately that made the product better?",
    ],
  },
  {
    test: /(founder|startup|saas|business|execution|discipline|habits|systems|ops|operation)/i,
    observations: [
      "Execution usually improves when the system gets simpler, not when motivation gets louder.",
      "Founders lose momentum when everything feels urgent at the same time.",
      "The hard part is rarely knowing what to do. It is protecting time for the few things that matter.",
    ],
    examples: [
      "A smaller weekly priority list, fewer standing meetings, and one visible scoreboard can change a team's pace fast.",
      "The fastest operators I know remove friction before they add effort.",
      "Momentum comes from repeated boring wins, not occasional heroic sprints.",
    ],
    lessons: [
      "Good systems lower the cost of doing the right thing consistently.",
      "Focus is often subtraction in disguise.",
      "Discipline becomes easier when the environment does more of the work.",
    ],
    ctas: [
      "What system has made execution easier for you lately?",
      "What is one thing you removed recently that improved focus?",
    ],
  },
  {
    test: /(sales|pricing|revenue|deal|buyer|buyers|closing)/i,
    observations: [
      "Most sales friction shows up before the call, not during it.",
      "Pricing confusion is often a positioning problem wearing a finance hat.",
      "Buyers move faster when the risk feels clear and the payoff feels concrete.",
    ],
    examples: [
      "A better discovery question or a sharper offer page can create more lift than another follow-up sequence.",
      "The strongest conversations make the cost of inaction obvious without sounding theatrical.",
      "When the buying path is clean, the team spends less time forcing urgency and more time proving value.",
    ],
    lessons: [
      "Sales usually gets easier when the message gets simpler.",
      "Good pricing communicates confidence before you say a word.",
      "The best offers reduce confusion first and negotiation second.",
    ],
    ctas: [
      "What part of your sales process creates the most friction today?",
      "What made your last strong buyer say yes?",
    ],
  },
];

function pickOne(items, fallback = "") {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items[Math.floor(Math.random() * items.length)] || fallback;
}

function buildTopicPlaybook(topic, keywords = []) {
  const combined = `${topic} ${keywords.join(" ")}`.trim();
  const matched = TOPIC_PLAYBOOKS.find((entry) => entry.test.test(combined));

  if (matched) {
    return {
      observation: pickOne(matched.observations),
      example: pickOne(matched.examples),
      lesson: pickOne(matched.lessons),
      cta: pickOne(matched.ctas),
    };
  }

  return {
    observation: `Most people treat ${topic} like an information problem when it is usually an execution problem.`,
    example: `The real shift happens when you narrow the scope, get closer to the feedback loop, and repeat what is already working.`,
    lesson: `The teams that get better at ${topic} usually simplify first and optimize second.`,
    cta: pickCTA(topic),
  };
}

function trimToSentence(text, maxLength = 220) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}.`;
}

function finalizeHeuristicPost(parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildSystemPrompt(profile) {
  const hasBullets = profile && profile.usesBulletPoints;
  const hasEmoji = profile && profile.usesEmoji;
  const sentenceLen = (profile && profile.sentenceLength) || "medium";

  const formatRules = [
    "- Short paragraphs ONLY: maximum 2-3 lines each. One blank line between paragraphs.",
    "- NEVER write a wall of text. Every paragraph must breathe and have white space.",
    sentenceLen === "short"
      ? "- Short, punchy sentences. 8-12 words max."
      : sentenceLen === "long"
      ? "- Flowing, thoughtful sentences. Build ideas deliberately."
      : "- Mix short and medium sentences. Vary rhythm deliberately.",
    hasBullets
      ? "- Use bullet points or numbered lists when listing items. Max 4-5 items."
      : "- Do NOT use bullet points or lists. Write in flowing paragraphs only.",
    hasEmoji
      ? "- Use 1-3 emojis strategically. Only at the start of a line or end of a key statement. Never mid-sentence."
      : "- Do NOT use any emojis.",
    "- Do NOT use hashtags.",
    "- Do NOT use bold/italic markdown.",
    "- Do NOT start with 'I think' or 'I believe'. Be declarative.",
    "- The hook (first 1-3 lines) must make someone STOP scrolling.",
    "- End with a question or CTA that invites engagement.",
  ].join("\n");

  const voiceContext = profile
    ? [
        "VOICE PROFILE (match this exactly):",
        "- Description: " + (profile.voiceDescription || "Professional and direct."),
        "- Tone: " + ((profile.toneTags || []).join(", ") || "professional, clear"),
        "- Opening style: " + (profile.openingStyle || "observation"),
        "- Patterns to USE: " + ((profile.signaturePatterns || []).join(", ") || "none"),
        "- Patterns to AVOID: " + ((profile.avoidPatterns || []).join(", ") || "none"),
      ].join("\n")
    : "Write in a direct, professional LinkedIn voice. No fluff.";

  return [
    "You are an elite LinkedIn content strategist who has helped 100+ creators build audiences of 10,000-500,000 followers.",
    "",
    "Your posts follow this exact STRUCTURE:",
    "1. HOOK (lines 1-3): Scroll-stopping opener. Creates curiosity, tension, or a bold claim.",
    "2. BODY: The actual insight, story, or lesson. Specific. Real. Not generic.",
    "3. LESSON: One clear takeaway the reader will remember.",
    "4. CTA: One question or invitation that drives comments or saves.",
    "",
    voiceContext,
    "",
    "FORMATTING RULES (non-negotiable):",
    formatRules,
    "",
    "QUALITY BAR:",
    "- Use at least one concrete operational detail, believable scenario, or first-hand observation.",
    "- Avoid filler, platitudes, and generic business-advice phrasing.",
    "- Make the takeaway feel earned, not motivational for the sake of it.",
    "",
    "TOP CREATOR STYLE REFERENCE (distilled principles from high-performing LinkedIn creators):",
    buildCreatorPromptHints(),
    "",
    "OUTPUT: Return ONLY the post text. No labels. No markers. No markdown fences.",
  ].join("\n");
}

async function generateWithAnthropic({ topic, profile, tone, length, keywords, hook }) {
  const client = getAnthropicClient();
  if (!client) return null;

  const wordTarget = { short: 80, medium: 160, long: 260 }[length] || 160;

  const userPrompt = [
    `Write a LinkedIn post about: "${topic}"`,
    `Target: ~${wordTarget} words (no more than ${wordTarget + 40}).`,
    hook ? `START with this exact hook line (then continue naturally):\n"${hook}"` : "",
    tone ? `Tone override: ${tone}` : "",
    keywords.length ? `Weave in naturally (do not force): ${keywords.join(", ")}` : "",
    "",
    "Make the BODY section specific. Use a concrete example, a believable operational detail, or an actual scenario.",
    "The post must feel like a real person sharing a genuine insight, NOT like AI-generated content.",
    "Avoid generic phrases like 'In today's fast-paced world' or 'It is important to remember'.",
    "Do not use empty motivational lines. Every paragraph should add a fresh idea.",
  ].filter(Boolean).join("\n");

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1200,
    system: buildSystemPrompt(profile),
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content.map((part) => ("text" in part ? part.text : "")).join("\n").trim();
}

function generateWithHeuristics({ topic, profile, length, keywords }) {
  const hook = pickHook(topic, (profile && profile.openingStyle) || "observation");
  const usesBullets = profile && profile.usesBulletPoints;
  const playbook = buildTopicPlaybook(topic, keywords);
  const cta = playbook.cta || pickCTA(topic);
  const sentenceLength = (profile && profile.sentenceLength) || "medium";
  const wantsLongerPost = length === "long";
  const wantsShortPost = length === "short";
  const keywordDetail = keywords.length
    ? `The signal to watch is ${keywords.slice(0, 2).join(" and ")}.`
    : null;

  if (usesBullets) {
    const bulletLines = [
      playbook.observation,
      "What actually earns better results:",
      `- ${trimToSentence(playbook.example, 95)}`,
      `- ${trimToSentence(playbook.lesson, 95)}`,
      `- ${trimToSentence(keywordDetail || `Keep the next move around ${topic} painfully clear.`, 95)}`,
    ];

    if (wantsLongerPost) {
      bulletLines.push(`- ${trimToSentence(`Review what is already getting traction before you add more moving parts.`, 95)}`);
    }

    return finalizeHeuristicPost([
      hook,
      bulletLines.join("\n"),
      wantsShortPost
        ? "Simple usually scales better than busy."
        : trimToSentence(`The advantage usually goes to the person who can make ${topic} easier to act on, not just easier to talk about.`),
      cta,
    ]);
  }

  const parts = [
    hook,
    `${playbook.observation} ${playbook.example}`,
    wantsShortPost
      ? playbook.lesson
      : `${playbook.lesson}${keywordDetail ? ` ${keywordDetail}` : ""}`,
  ];

  if (wantsLongerPost) {
    parts.push(
      trimToSentence(
        `This is usually where momentum shows up: fewer moving parts, faster feedback, and more repetition around what already resonates.`,
        220
      )
    );
  }

  parts.push(cta);
  return finalizeHeuristicPost(parts);
}

async function generatePostFromVoiceProfile({ topic, profile, tone, length = "medium", keywords = [] }) {
  if (!topic || !String(topic).trim()) {
    const err = new Error("topic is required");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const cleanTopic = String(topic).trim();
  const cleanKeywords = uniqueStrings(keywords);
  const hook = pickHook(cleanTopic, (profile && profile.openingStyle) || "observation");

  try {
    const aiPost = await generateWithAnthropic({ topic: cleanTopic, profile, tone, length, keywords: cleanKeywords, hook });
    if (aiPost) return enhanceLinkedInPost(aiPost);
  } catch (_) {}

  return enhanceLinkedInPost(
    generateWithHeuristics({ topic: cleanTopic, profile, tone, length, keywords: cleanKeywords })
  );
}

// ============================================================
// VOICE PROFILE ANALYSIS
// ============================================================

function detectOpeningStyle(posts) {
  const patterns = {
    question: /^(what|why|how|when|where|who|have you|do you|did you|can you|could|would|should|is it|are you)/i,
    "bold-claim": /(stop|never|always|wrong|mistake|fail|unpopular|controversial|truth|lie|myth|most people)/i,
    story: /^(I |last (year|month|week)|back in|when I|the day|a few|one day|recently|years ago)/i,
    stat: /(\d+%|\d+ (people|out of|percent|times)|most |almost all)/i,
  };

  const scores = { question: 0, "bold-claim": 0, story: 0, stat: 0, observation: 0 };
  for (const post of posts) {
    const firstLine = post.split("\n")[0].trim();
    for (const [style, regex] of Object.entries(patterns)) {
      if (regex.test(firstLine)) scores[style] += 2;
    }
    scores.observation += 0.5;
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function detectSentenceLength(avgWords) {
  if (avgWords <= 12) return "short";
  if (avgWords >= 22) return "long";
  return "medium";
}

function inferToneTags({ avgWordCount, avgSentenceWords, usesEmoji, usesBulletPoints, postCount }) {
  const tags = [];
  if (avgWordCount < 100) tags.push("concise");
  if (avgSentenceWords < 12) tags.push("punchy");
  if (avgSentenceWords >= 20) tags.push("thoughtful");
  if (usesEmoji) tags.push("approachable");
  if (usesBulletPoints) tags.push("structured");
  if (!usesEmoji && !usesBulletPoints) tags.push("professional");
  if (avgWordCount > 200) tags.push("detailed");
  return uniqueStrings(tags).slice(0, 4);
}

function buildVoiceDescription({ toneTags, sentenceLength, avgWordCount, usesEmoji, usesBulletPoints, openingStyle }) {
  const parts = [
    toneTags.join(", ") + " writer",
    sentenceLength === "short" ? "who favors short, direct sentences" : sentenceLength === "long" ? "who writes in flowing, detailed sentences" : "with balanced sentence rhythm",
    openingStyle === "question" ? "that opens with thought-provoking questions" : openingStyle === "story" ? "who leads with personal stories" : openingStyle === "bold-claim" ? "who makes bold, direct claims upfront" : openingStyle === "stat" ? "who leads with data and observations" : "who opens with clear observations",
    usesEmoji ? "and uses emoji to add warmth" : "",
    usesBulletPoints ? "and structures ideas with bullet points" : "",
  ].filter(Boolean);

  return parts.join(", ") + ".";
}

function inferSignaturePatterns({ openingStyle, sentenceLength, usesEmoji, usesBulletPoints, avgWordCount }) {
  const patterns = [];
  if (openingStyle === "question") patterns.push("opens with a question");
  if (openingStyle === "story") patterns.push("leads with a personal story");
  if (openingStyle === "bold-claim") patterns.push("starts with a bold statement");
  if (sentenceLength === "short") patterns.push("one idea per line");
  if (usesBulletPoints) patterns.push("uses bullet lists for key points");
  if (usesEmoji) patterns.push("strategic emoji use");
  if (avgWordCount < 120) patterns.push("short, punchy posts");
  if (avgWordCount > 220) patterns.push("in-depth, detailed posts");
  return patterns;
}

function inferAvoidPatterns({ usesEmoji, usesBulletPoints, sentenceLength }) {
  const avoid = [];
  if (!usesEmoji) avoid.push("emoji");
  if (!usesBulletPoints) avoid.push("bullet point lists");
  if (sentenceLength === "short") avoid.push("long run-on sentences");
  if (sentenceLength === "long") avoid.push("abrupt one-word lines");
  avoid.push("hashtags", "generic phrases without specifics", "corporate jargon");
  return avoid;
}

function normalizeAnalysisResult(parsed, samplePosts, topics) {
  const validOpeningStyles = ["question", "bold-claim", "story", "stat", "observation"];
  const validSentenceLengths = ["short", "medium", "long"];

  return {
    voiceDescription: String(parsed.voiceDescription || "").slice(0, 500) || "Clear, professional LinkedIn writer.",
    toneTags: Array.isArray(parsed.toneTags) ? parsed.toneTags.map(String).slice(0, 6) : ["professional"],
    openingStyle: validOpeningStyles.includes(parsed.openingStyle) ? parsed.openingStyle : "observation",
    sentenceLength: validSentenceLengths.includes(parsed.sentenceLength) ? parsed.sentenceLength : "medium",
    avgWordCount: Math.max(50, Math.min(1000, Number(parsed.avgWordCount) || 180)),
    usesEmoji: Boolean(parsed.usesEmoji),
    usesBulletPoints: Boolean(parsed.usesBulletPoints),
    signaturePatterns: Array.isArray(parsed.signaturePatterns) ? parsed.signaturePatterns.map(String).slice(0, 6) : [],
    avoidPatterns: Array.isArray(parsed.avoidPatterns) ? parsed.avoidPatterns.map(String).slice(0, 6) : [],
    topicBuckets: uniqueStrings(topics).slice(0, 10),
    samplePosts,
  };
}

async function analyzeWithAnthropic(samplePosts, topics) {
  const client = getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
    system: `You analyze LinkedIn writing styles. Return a single JSON object with exactly these keys:
{
  "voiceDescription": "2-3 sentence description of their unique LinkedIn voice",
  "toneTags": ["array", "of", "4-6", "tone", "descriptors"],
  "openingStyle": "one of: question | bold-claim | story | stat | observation",
  "sentenceLength": "one of: short | medium | long",
  "avgWordCount": number,
  "usesEmoji": boolean,
  "usesBulletPoints": boolean,
  "signaturePatterns": ["patterns they consistently use"],
  "avoidPatterns": ["things they never do"]
}
Return ONLY the JSON. No markdown, no explanation.`,
    messages: [
      {
        role: "user",
        content: [
          "Analyze the LinkedIn writing voice from these sample posts.",
          "Topics they write about: " + uniqueStrings(topics).join(", "),
          "",
          "Sample posts:",
          samplePosts.map((post, i) => `Post ${i + 1}:\n${post}`).join("\n\n---\n\n"),
        ].join("\n"),
      },
    ],
  });

  const rawText = response.content.map((part) => ("text" in part ? part.text : "")).join("\n").trim();
  const parsed = JSON.parse(stripCodeFences(rawText));
  return normalizeAnalysisResult(parsed, samplePosts, topics);
}

function analyzeWithHeuristics(samplePosts, topics) {
  const fullText = samplePosts.join("\n\n");
  const allWords = fullText.split(/\s+/).filter(Boolean);
  const sentences = splitSentences(fullText);
  const avgWordCount = Math.round(allWords.length / samplePosts.length) || 180;
  const avgSentenceWords =
    Math.round(sentences.reduce((t, s) => t + s.split(/\s+/).filter(Boolean).length, 0) / Math.max(sentences.length, 1)) || 16;
  const usesEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(fullText);
  const usesBulletPoints = /(^|\n)\s*([-*\u2022]|\d+\.)\s+/m.test(fullText);
  const openingStyle = detectOpeningStyle(samplePosts);
  const sentenceLength = detectSentenceLength(avgSentenceWords);
  const toneTags = inferToneTags({ avgWordCount, avgSentenceWords, usesEmoji, usesBulletPoints, postCount: samplePosts.length });

  return {
    voiceDescription: buildVoiceDescription({ toneTags, sentenceLength, avgWordCount, usesEmoji, usesBulletPoints, openingStyle }),
    toneTags,
    openingStyle,
    sentenceLength,
    avgWordCount: Math.max(50, avgWordCount),
    usesEmoji,
    usesBulletPoints,
    signaturePatterns: inferSignaturePatterns({ openingStyle, sentenceLength, usesEmoji, usesBulletPoints, avgWordCount }),
    avoidPatterns: inferAvoidPatterns({ usesEmoji, usesBulletPoints, sentenceLength }),
    topicBuckets: uniqueStrings(topics).slice(0, 10),
    samplePosts,
  };
}

async function analyzeWithAnthropicArtifacts(samplePosts, topics, images) {
  const client = getAnthropicClient();
  if (!client) return null;

  const safeImages = Array.isArray(images) ? images.slice(0, 8) : [];
  const imageBlocks = safeImages
    .filter((img) => img && typeof img === 'object')
    .map((img, idx) => {
      const media_type = String(img.mediaType || '').toLowerCase();
      const data = String(img.data || '');
      if (!data || !media_type.startsWith('image/')) return null;
      return {
        type: 'image',
        source: { type: 'base64', media_type, data },
      };
    })
    .filter(Boolean);

  const introText = [
    "You will receive LinkedIn writing samples in TWO forms:",
    "1) plain text posts (below)",
    "2) screenshots of LinkedIn posts (images) — extract the text accurately from the images before analyzing.",
    "",
    "Goal: Build a stable voice profile (tone + structure) that matches how the author actually writes.",
    "",
    "Topics they write about: " + uniqueStrings(topics).join(", "),
    "",
    "Text sample posts:",
    samplePosts.map((post, i) => `Post ${i + 1}:\n${post}`).join("\n\n---\n\n"),
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 900,
    system: `You analyze LinkedIn writing styles. Return a single JSON object with exactly these keys:
{
  "voiceDescription": "2-3 sentence description of their unique LinkedIn voice",
  "toneTags": ["array", "of", "4-6", "tone", "descriptors"],
  "openingStyle": "one of: question | bold-claim | story | stat | observation",
  "sentenceLength": "one of: short | medium | long",
  "avgWordCount": number,
  "usesEmoji": boolean,
  "usesBulletPoints": boolean,
  "signaturePatterns": ["patterns they consistently use"],
  "avoidPatterns": ["things they never do"]
}
Return ONLY the JSON. No markdown, no explanation.`,
    messages: [
      {
        role: "user",
        content: [
          { type: 'text', text: introText },
          ...imageBlocks,
        ],
      },
    ],
  });

  const rawText = response.content.map((part) => ("text" in part ? part.text : "")).join("\n").trim();
  const parsed = JSON.parse(stripCodeFences(rawText));
  return normalizeAnalysisResult(parsed, samplePosts, topics);
}

async function analyzeVoiceProfile(samplePosts, topics = []) {
  const posts = normalizePosts(samplePosts);
  const cleanedTopics = uniqueStrings(topics).slice(0, 10);

  if (posts.length < 3) {
    const err = new Error("Please provide at least 3 sample posts.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  try {
    const aiResult = await analyzeWithAnthropic(posts, cleanedTopics);
    if (aiResult) return aiResult;
  } catch (_) {}

  return analyzeWithHeuristics(posts, cleanedTopics);
}

async function analyzeVoiceProfileArtifacts(samplePosts, topics = [], images = []) {
  const posts = normalizePosts(samplePosts);
  const cleanedTopics = uniqueStrings(topics).slice(0, 10);

  if (posts.length < 1 && (!Array.isArray(images) || images.length < 1)) {
    const err = new Error("Please provide at least 1 sample post or 1 screenshot.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Screenshots require Anthropic vision; if key missing, fail with actionable message.
  if ((!process.env.ANTHROPIC_API_KEY) && Array.isArray(images) && images.length) {
    const err = new Error("Image analysis requires ANTHROPIC_API_KEY. Upload text posts instead, or configure the API key.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  try {
    const aiResult = await analyzeWithAnthropicArtifacts(posts, cleanedTopics, images);
    if (aiResult) return aiResult;
  } catch (_) {}

  // Fallback cannot OCR images; use heuristic on text only.
  if (posts.length < 3) {
    const err = new Error("Please provide at least 3 text sample posts when AI analysis is unavailable.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return analyzeWithHeuristics(posts, cleanedTopics);
}

module.exports = { analyzeVoiceProfile, analyzeVoiceProfileArtifacts, generatePostFromVoiceProfile, normalizePosts };
