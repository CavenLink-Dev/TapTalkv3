jest.mock('expo-file-system/legacy', () => {
  const store = new Map<string, { data: string; size: number }>();
  return {
    documentDirectory: 'file:///docs/',
    getInfoAsync: jest.fn(async (uri: string, opts?: { size?: boolean }) => {
      const rec = store.get(uri);
      if (!rec) return { exists: false } as { exists: boolean; size?: number };
      return opts?.size ? { exists: true, size: rec.size } : { exists: true };
    }),
    readAsStringAsync: jest.fn(async (uri: string) => store.get(uri)?.data ?? ''),
    writeAsStringAsync: jest.fn(async (uri: string, data: string) => {
      store.set(uri, { data, size: data.length });
    }),
    moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      const v = store.get(from);
      if (v) { store.set(to, v); store.delete(from); }
    }),
    deleteAsync: jest.fn(async (uri: string) => { store.delete(uri); }),
    makeDirectoryAsync: jest.fn(async () => undefined),
    __store: store,
  };
});

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { PNG: 'png' },
  manipulateAsync: jest.fn(async () => ({ uri: 'file:///docs/re-encoded.png' })),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'sha256' },
  digestStringAsync: jest.fn(async () => 'deadbeef01234567abc'),
}));

import { sanitizeImage, SanitizeImageError } from '../sanitizeImage';
// Re-import the mocked module so we can seed its store.
const fs = jest.requireMock('expo-file-system/legacy') as { __store: Map<string, { data: string; size: number }> };

describe('sanitizeImage', () => {
  beforeEach(() => { fs.__store.clear(); });

  it('rejects a file over 8MB', async () => {
    fs.__store.set('file:///huge.jpg', { data: 'x', size: 10 * 1024 * 1024 });
    await expect(sanitizeImage('file:///huge.jpg')).rejects.toBeInstanceOf(SanitizeImageError);
  });

  it('rejects a missing file', async () => {
    await expect(sanitizeImage('file:///nope.jpg')).rejects.toBeInstanceOf(SanitizeImageError);
  });

  it('resizes, hashes, and lands in the sandbox custom-symbols folder', async () => {
    fs.__store.set('file:///docs/small.jpg', { data: 'ok', size: 1024 });
    // Pre-write the re-encoded output so the mocked moveAsync has something to move.
    fs.__store.set('file:///docs/re-encoded.png', { data: 're-encoded', size: 512 });
    const out = await sanitizeImage('file:///docs/small.jpg');
    expect(out.startsWith('file:///docs/custom-symbols/')).toBe(true);
    expect(out.endsWith('.png')).toBe(true);
    // Hash-prefixed filename → 16 hex chars.
    expect(out).toMatch(/custom-symbols\/[a-f0-9]{16}\.png$/);
  });

  it('is idempotent — a second sanitize of the same content dedupes', async () => {
    fs.__store.set('file:///docs/a.jpg', { data: 'ok', size: 1024 });
    fs.__store.set('file:///docs/re-encoded.png', { data: 're-encoded', size: 512 });
    const first = await sanitizeImage('file:///docs/a.jpg');

    fs.__store.set('file:///docs/b.jpg', { data: 'ok', size: 1024 });
    fs.__store.set('file:///docs/re-encoded.png', { data: 're-encoded', size: 512 });
    const second = await sanitizeImage('file:///docs/b.jpg');
    expect(second).toBe(first);
  });
});
