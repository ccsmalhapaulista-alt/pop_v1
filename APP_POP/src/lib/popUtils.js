export function normalizeKeywords(keywords) {
  return Array.isArray(keywords) ? keywords.join(', ') : keywords;
}

export function sanitizeSearchTerm(value = '') {
  return value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizePositiveOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
