import { tokenizeText } from '../symbol-brain/normalizeText';

const SAFE_FILLER = new Set([
  'am',
  'is',
  'are',
  'was',
  'were',
  'to',
  'the',
  'a',
  'an',
  'at',
  'for',
]);

const KEEP_ALWAYS = new Set([
  'i',
  'you',
  'we',
  'want',
  'need',
  'go',
  'come',
  'help',
  'feel',
  'sick',
  'toilet',
  'mum',
  'dad',
  'yes',
  'no',
  'stop',
]);

export function keepAACImportantWords(sentence: string): string[] {
  return tokenizeText(sentence).filter((token) => {
    if (KEEP_ALWAYS.has(token)) return true;
    if (SAFE_FILLER.has(token)) return false;
    return token.length > 1;
  });
}
