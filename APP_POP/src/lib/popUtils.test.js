import { describe, expect, it } from 'vitest';
import { normalizeKeywords, normalizePositiveOrder, sanitizeSearchTerm } from './popUtils';

describe('popUtils', () => {
  it('joins keyword arrays into a comma-separated string', () => {
    expect(normalizeKeywords(['amv', 'desengate', 'buzina'])).toBe('amv, desengate, buzina');
  });

  it('returns keyword strings as-is', () => {
    expect(normalizeKeywords('amv, buzina')).toBe('amv, buzina');
  });

  it('sanitizes unsupported search characters and extra spaces', () => {
    expect(sanitizeSearchTerm('  AMV,(teste)% buzina  ')).toBe('AMV teste buzina');
  });

  it('normalizes valid positive orders', () => {
    expect(normalizePositiveOrder(3)).toBe(3);
    expect(normalizePositiveOrder('5')).toBe(5);
  });

  it('falls back to 1 for invalid orders', () => {
    expect(normalizePositiveOrder(0)).toBe(1);
    expect(normalizePositiveOrder(-4)).toBe(1);
    expect(normalizePositiveOrder('foo')).toBe(1);
    expect(normalizePositiveOrder(2.5)).toBe(1);
  });
});
