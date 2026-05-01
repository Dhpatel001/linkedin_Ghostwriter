const CREATOR_PRINCIPLES = [
  'Open with a clear tension, contrarian view, or sharp question.',
  'Use short paragraphs and visual spacing to improve readability.',
  'Include one concrete detail, example, or operational insight.',
  'End with a specific CTA that invites comments.',
  'Avoid generic motivational filler and vague corporate jargon.',
];

const SECTION_ICONS = [
  '->',
  '=>',
  '*',
  '+',
];

function normalizeWhitespace(input) {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toPseudoBold(text) {
  const value = String(text || '').trim();
  return value ? `**${value}**` : value;
}

function pickIcon(index) {
  return SECTION_ICONS[index % SECTION_ICONS.length];
}

function enhanceLinkedInPost(rawPost, options = {}) {
  const content = normalizeWhitespace(rawPost);
  if (!content) return '';

  const lines = content.split('\n').map((line) => line.trimEnd());
  const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmpty >= 0) {
    lines[firstNonEmpty] = toPseudoBold(lines[firstNonEmpty].trim());
  }

  let sectionIndex = 0;
  const enhanced = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const isBullet = /^([-*•]|\d+\.)\s+/.test(trimmed);
    if (isBullet || trimmed.length < 28) return trimmed;

    if (/^(what|why|how|here|lesson|takeaway|cta|framework|example)[:]/i.test(trimmed)) {
      const icon = pickIcon(sectionIndex++);
      return `${icon} ${trimmed}`;
    }
    return trimmed;
  });

  if (options.addHashtagFooter) {
    enhanced.push('', '#linkedin #writing #personalbranding');
  }

  return normalizeWhitespace(enhanced.join('\n'));
}

function buildCreatorPromptHints() {
  return CREATOR_PRINCIPLES.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n');
}

module.exports = {
  CREATOR_PRINCIPLES,
  buildCreatorPromptHints,
  enhanceLinkedInPost,
};
