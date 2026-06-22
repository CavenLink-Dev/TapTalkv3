export const AUSTRALIAN_ALIASES: Record<string, string> = {
  mum: 'mother',
  mummy: 'mother',
  nappy: 'diaper',
  toilet: 'bathroom',
  loo: 'bathroom',
  wee: 'bathroom',
  lolly: 'candy',
  pram: 'stroller',
  jumper: 'sweater',
  petrol: 'fuel',
  takeaway: 'takeout',
  chemist: 'pharmacy',
};

export function mapAustralianAlias(normalized: string): string {
  return AUSTRALIAN_ALIASES[normalized] ?? normalized;
}
