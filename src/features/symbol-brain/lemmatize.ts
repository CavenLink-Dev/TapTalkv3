const IRREGULAR: Record<string, string> = {
  ate: 'eat',
  eaten: 'eat',
  went: 'go',
  gone: 'go',
  ran: 'run',
  children: 'child',
  people: 'person',
  mums: 'mum',
  dads: 'dad',
};

export function lemmatize(token: string): string {
  const lower = token.toLowerCase();
  if (IRREGULAR[lower]) return IRREGULAR[lower];
  if (lower.endsWith('ies') && lower.length > 4) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith('ing') && lower.length > 5) return lower.slice(0, -3);
  if (lower.endsWith('ed') && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith('s') && lower.length > 3) return lower.slice(0, -1);
  return lower;
}

export function lemmatizePhrase(input: string): string {
  return input.split(' ').map(lemmatize).join(' ');
}
