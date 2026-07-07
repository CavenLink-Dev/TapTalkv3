import { predictNext, predictorCoverage } from '../corePredictor';

describe('corePredictor', () => {
  it('returns starter set when prev is empty', () => {
    const s = predictNext(undefined, 4);
    expect(s).toHaveLength(4);
    expect(s).toContain('i');
  });

  it('predicts after a known key', () => {
    expect(predictNext('i', 4)).toEqual(expect.arrayContaining(['want', 'need']));
  });

  it('is case + punctuation insensitive', () => {
    expect(predictNext('I,', 3)).toEqual(predictNext('i', 3));
  });

  it('falls back to starter for unknown keys', () => {
    expect(predictNext('galaxy', 3)).toEqual(predictNext(undefined, 3));
  });

  it('coverage is non-zero', () => {
    expect(predictorCoverage()).toBeGreaterThan(10);
  });
});
