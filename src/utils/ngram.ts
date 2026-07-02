/**
 * Lightweight local n-gram model for next-word prediction.
 * Builds bigram counts from spoken sentences and predicts the next word
 * based on the last word in the message strip.
 */

export function updateNgramModel(
  model: Record<string, Record<string, number>>,
  words: string[]
): Record<string, Record<string, number>> {
  if (words.length < 2) return model;
  const newModel: Record<string, Record<string, number>> = {};
  for (const [key, inner] of Object.entries(model)) {
    newModel[key] = { ...inner };
  }
  for (let i = 0; i < words.length - 1; i++) {
    const current = words[i];
    const next = words[i + 1];
    if (!current || !next) continue;
    if (!newModel[current]) {
      newModel[current] = {};
    }
    newModel[current][next] = (newModel[current][next] ?? 0) + 1;
  }
  return newModel;
}

export function predictNextWords(
  lastWord: string,
  model: Record<string, Record<string, number>>,
  limit = 3
): string[] {
  const candidates = model[lastWord];
  if (!candidates) return [];
  return Object.entries(candidates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}
