/**
 * imageService.js
 *
 * Generates premium LinkedIn post cards -- 4 design styles:
 *   quote    -- dark gradient + oversized quote extract
 *   tips     -- numbered list card (best for bullet-heavy posts)
 *   insight  -- split layout: big number + statement
 *   minimal  -- clean white card with brand accent
 *
 * Uses Claude to extract the KEY insight/quote from the post first,
 * then wraps it in a beautifully designed SVG card.
 * No external API required -- works immediately.
 */

const Anthropic = require("@anthropic-ai/sdk");

let _client = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapText(text, maxCharsPerLine) {
  const words = String(text || "").trim().split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function normalizeLine(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-*\u2022\d.]+/, "")
    .trim();
}

function isWeakLine(text) {
  const line = normalizeLine(text).toLowerCase();
  if (!line) return true;

  return [
    "what would you add",
    "drop it in the comments",
    "follow me for more",
    "save it",
    "tag someone",
    "that is the difference",
    "it is important to",
  ].some((snippet) => line.includes(snippet));
}

function scoreInsightLine(text, index) {
  const line = normalizeLine(text);
  if (!line || line.length < 25 || line.length > 150 || isWeakLine(line)) return -Infinity;

  let score = 0;
  if (index === 0) score += 6;
  if (line.includes(":")) score += 2;
  if (/\b(but|because|instead|before|after|without|until)\b/i.test(line)) score += 3;
  if (/\d/.test(line)) score += 3;
  if (/[?]/.test(line)) score += 2;
  if (/\b(always|never|most|best|worst|truth|mistake|wrong|simple|clarity|trust)\b/i.test(line)) score += 3;
  if (/^(stop overcomplicating|most advice on|here is something|one insight about)/i.test(line)) score -= 5;
  if (/^(distribution is|trust usually|people rarely|the best|the strongest|clarity)/i.test(line)) score += 4;
  score -= Math.abs(90 - line.length) / 20;
  return score;
}

// ============================================================
// AI EXTRACTION -- pull the key insight from the post
// ============================================================

async function extractPostInsight(content, topic) {
  const client = getAnthropicClient();
  if (!client) return extractWithHeuristics(content, topic);

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      system: `You extract the single most shareable insight from a LinkedIn post.
Return a JSON object with exactly these fields:
{
  "quote": "The most powerful 1-2 sentence insight from the post (max 120 chars)",
  "subtext": "A supporting detail or context (max 80 chars)",
  "keyNumber": "A specific number or stat from the post if present, otherwise null",
  "style": "One of: quote | tips | insight | minimal",
  "tips": ["tip 1", "tip 2", "tip 3"] or null (only if the post has a list)
}

Style selection rules:
- quote: Best for story-driven or philosophical posts
- tips: Best if post contains a list of 3-5 items
- insight: Best if post contains a key number, percentage, or time reference
- minimal: Best for short, punchy observational posts

Return ONLY the JSON. No markdown.`,
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\n\nPost:\n${String(content).slice(0, 1200)}`,
        },
      ],
    });

    const raw = response.content.map((p) => ("text" in p ? p.text : "")).join("").trim();
    const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      quote: String(parsed.quote || "").slice(0, 140),
      subtext: String(parsed.subtext || topic).slice(0, 100),
      keyNumber: parsed.keyNumber ? String(parsed.keyNumber).slice(0, 20) : null,
      style: ["quote", "tips", "insight", "minimal"].includes(parsed.style) ? parsed.style : "quote",
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4).map((t) => String(t).slice(0, 60)) : null,
    };
  } catch (_) {
    return extractWithHeuristics(content, topic);
  }
}

function extractWithHeuristics(content, topic) {
  const lines = String(content)
    .split("\n")
    .map(normalizeLine)
    .filter((l) => l.length > 20);
  const hasBullets = /(^|\n)\s*([-*\u2022]|\d+\.)\s+/m.test(content);
  const numberMatch = content.match(/(\d+(?:\.\d+)?%|\d+x|\d+\+|\d+ (years|months|weeks|days|hours))/i);
  const rankedLines = lines
    .map((line, index) => ({ line, score: scoreInsightLine(line, index) }))
    .sort((a, b) => b.score - a.score);

  const quote = rankedLines[0]?.line
    ? rankedLines[0].line.slice(0, 140)
    : lines[0]
    ? lines[0].slice(0, 120)
    : `Key insight about ${topic}`;

  const subtext = rankedLines.find((entry) => entry.line !== quote)?.line || topic;

  return {
    quote: quote.slice(0, 140),
    subtext: subtext.slice(0, 100),
    keyNumber: numberMatch ? numberMatch[0] : null,
    style: hasBullets ? "tips" : numberMatch ? "insight" : "quote",
    tips: hasBullets
      ? content.match(/(?:^|\n)\s*[-*\u2022\d.]+\s+(.+)/gm)
          ?.slice(0, 4)
          .map((t) => t.replace(/^[\s\-*\u2022\d.]+/, "").trim().slice(0, 55)) || null
      : null,
  };
}

// ============================================================
// SVG CARD GENERATORS -- 4 premium designs
// ============================================================

function buildQuoteCard(data, topic) {
  const { quote, subtext } = data;
  const quoteLines = wrapText(quote, 38);
  const subtextLines = wrapText(subtext, 50);

  const quoteStartY = 220 - ((quoteLines.length - 1) * 38) / 2;
  const quoteSvg = quoteLines
    .map((line, i) => `<text x="100" y="${quoteStartY + i * 52}" font-family="Georgia,serif" font-size="38" font-weight="700" fill="white" opacity="0.95">${escapeXml(line)}</text>`)
    .join("\n  ");

  const subtextStartY = quoteStartY + quoteLines.length * 52 + 30;
  const subtextSvg = subtextLines
    .map((line, i) => `<text x="100" y="${subtextStartY + i * 28}" font-family="Inter,system-ui,sans-serif" font-size="20" fill="rgba(255,255,255,0.6)">${escapeXml(line)}</text>`)
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F0C29"/>
      <stop offset="50%" stop-color="#1a1a3e"/>
      <stop offset="100%" stop-color="#24243e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0A66C2"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="1200" height="627" fill="url(#bg)"/>
  <circle cx="1050" cy="100" r="280" fill="rgba(10,102,194,0.06)"/>
  <circle cx="150" cy="520" r="200" fill="rgba(14,165,233,0.05)"/>
  <rect x="0" y="0" width="8" height="627" fill="url(#accent)"/>
  <text x="100" y="100" font-family="Inter,system-ui,sans-serif" font-size="72" fill="rgba(10,102,194,0.25)" font-weight="900">"</text>
  ${quoteSvg}
  ${subtextSvg}
  <rect x="100" y="565" width="180" height="3" rx="2" fill="url(#accent)" opacity="0.8"/>
  <text x="100" y="600" font-family="Inter,system-ui,sans-serif" font-size="16" fill="rgba(255,255,255,0.35)" letter-spacing="2">VOICEPOST</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function buildTipsCard(data, topic) {
  const { quote, tips, subtext } = data;
  const safeTips = (tips && tips.length > 0) ? tips.slice(0, 4) : [
    "Start with the fundamentals",
    "Build systems, not goals",
    "Review and iterate often",
    "Focus on compounding actions",
  ];

  const headerLines = wrapText(quote.slice(0, 80), 42);
  const tipsStartY = 180 + headerLines.length * 40;

  const tipsSvg = safeTips.map((tip, i) => `
  <rect x="80" y="${tipsStartY + i * 85}" width="1040" height="70" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <rect x="80" y="${tipsStartY + i * 85}" width="6" height="70" rx="3" fill="url(#accent${i % 2})" opacity="0.8"/>
  <text x="110" y="${tipsStartY + i * 85 + 24}" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(10,102,194,0.9)" font-weight="700" letter-spacing="1">0${i + 1}</text>
  <text x="150" y="${tipsStartY + i * 85 + 26}" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="600" fill="white">${escapeXml(tip)}</text>`).join("");

  const headerSvg = headerLines
    .map((line, i) => `<text x="80" y="${140 + i * 40}" font-family="Georgia,serif" font-size="30" font-weight="700" fill="white" opacity="0.92">${escapeXml(line)}</text>`)
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a1a"/>
      <stop offset="100%" stop-color="#0d1b2e"/>
    </linearGradient>
    <linearGradient id="accent0" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0A66C2"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <linearGradient id="accent1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="url(#bg)"/>
  <text x="80" y="80" font-family="Inter,system-ui,sans-serif" font-size="11" fill="rgba(10,102,194,0.7)" letter-spacing="3" font-weight="700">KEY TAKEAWAYS</text>
  ${headerSvg}
  ${tipsSvg}
  <text x="80" y="612" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.25)" letter-spacing="2">VOICEPOST AI</text>
  <text x="1120" y="612" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.25)" text-anchor="end">${escapeXml(subtext.slice(0, 30))}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function buildInsightCard(data, topic) {
  const { quote, keyNumber, subtext } = data;
  const displayNumber = keyNumber || "1";
  const quoteLines = wrapText(quote, 32);
  const subtextLines = wrapText(subtext, 45);

  const quoteY = 200;
  const quoteSvg = quoteLines
    .map((line, i) => `<text x="700" y="${quoteY + i * 50}" font-family="Georgia,serif" font-size="36" font-weight="600" fill="white" opacity="0.9">${escapeXml(line)}</text>`)
    .join("\n  ");

  const subtextY = quoteY + quoteLines.length * 50 + 24;
  const subtextSvg = subtextLines
    .map((line, i) => `<text x="700" y="${subtextY + i * 28}" font-family="Inter,system-ui,sans-serif" font-size="19" fill="rgba(255,255,255,0.5)">${escapeXml(line)}</text>`)
    .join("\n  ");

  const numSize = displayNumber.length > 4 ? 90 : displayNumber.length > 2 ? 110 : 140;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020818"/>
      <stop offset="100%" stop-color="#0c1a35"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A66C2"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <linearGradient id="numGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0A66C2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="url(#bg)"/>
  <rect x="0" y="0" width="580" height="627" fill="rgba(10,102,194,0.06)"/>
  <line x1="580" y1="60" x2="580" y2="567" stroke="rgba(10,102,194,0.2)" stroke-width="1"/>
  <circle cx="290" cy="313" r="200" fill="rgba(10,102,194,0.05)"/>
  <text x="290" y="${313 + numSize / 3}" font-family="Inter,system-ui,sans-serif" font-size="${numSize}" font-weight="900" fill="url(#numGrad)" text-anchor="middle" opacity="0.9">${escapeXml(displayNumber)}</text>
  <text x="290" y="520" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.3)" text-anchor="middle" letter-spacing="2">KEY INSIGHT</text>
  ${quoteSvg}
  ${subtextSvg}
  <rect x="700" y="565" width="120" height="2" rx="1" fill="url(#accent)" opacity="0.6"/>
  <text x="700" y="600" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.25)" letter-spacing="2">VOICEPOST</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function buildMinimalCard(data, topic) {
  const { quote, subtext } = data;
  const quoteLines = wrapText(quote, 40);
  const subtextLines = wrapText(subtext, 55);

  const totalH = quoteLines.length * 56 + subtextLines.length * 30 + 60;
  const startY = Math.max(160, 313 - totalH / 2);

  const quoteSvg = quoteLines
    .map((line, i) => `<text x="600" y="${startY + i * 56}" font-family="Georgia,serif" font-size="40" font-weight="700" fill="#0F172A" text-anchor="middle">${escapeXml(line)}</text>`)
    .join("\n  ");

  const subtextY = startY + quoteLines.length * 56 + 30;
  const subtextSvg = subtextLines
    .map((line, i) => `<text x="600" y="${subtextY + i * 30}" font-family="Inter,system-ui,sans-serif" font-size="22" fill="#64748B" text-anchor="middle">${escapeXml(line)}</text>`)
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0A66C2"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="#F8FAFC"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>
  <rect x="0" y="619" width="1200" height="8" fill="url(#accent)" opacity="0.2"/>
  <circle cx="100" cy="100" r="300" fill="rgba(10,102,194,0.03)"/>
  <circle cx="1100" cy="527" r="250" fill="rgba(14,165,233,0.03)"/>
  <text x="600" y="100" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#0A66C2" text-anchor="middle" letter-spacing="4" font-weight="700">VOICEPOST</text>
  ${quoteSvg}
  ${subtextSvg}
  <rect x="520" y="${subtextY + subtextLines.length * 30 + 20}" width="160" height="3" rx="2" fill="url(#accent)"/>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

const CARD_BUILDERS = {
  quote: buildQuoteCard,
  tips: buildTipsCard,
  insight: buildInsightCard,
  minimal: buildMinimalCard,
};

async function generateImageForPost(content, topic) {
  try {
    const insight = await extractPostInsight(content, topic);
    const builder = CARD_BUILDERS[insight.style] || buildQuoteCard;
    return builder(insight, topic);
  } catch (_) {
    const fallback = { quote: `Key insight about ${topic}`, subtext: topic, keyNumber: null, style: "minimal", tips: null };
    return buildMinimalCard(fallback, topic);
  }
}

module.exports = { generateImageForPost };
