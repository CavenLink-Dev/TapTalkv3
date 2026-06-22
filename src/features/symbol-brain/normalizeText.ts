import { mapAustralianAlias } from './australianAliases';

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "i've": 'i have',
  "i'll": 'i will',
  "don't": 'do not',
  "can't": 'cannot',
  "won't": 'will not',
  "let's": 'let us',
};

export function normalizeText(input: string, options: { mapAliases?: boolean } = {}) {
  const expanded = input
    .toLowerCase()
    .split(/\s+/)
    .map(part => CONTRACTIONS[part] ?? part)
    .join(' ');

  const normalized = expanded
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!options.mapAliases) return normalized;
  return normalized
    .split(' ')
    .map(token => mapAustralianAlias(token))
    .join(' ');
}

export function tokenizeText(input: string): string[] {
  return normalizeText(input, { mapAliases: true })
    .split(' ')
    .map(token => token.trim())
    .filter(Boolean);
}
