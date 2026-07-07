jest.mock('expo-file-system/legacy', () => {
  const store = new Map<string, string>();
  return {
    documentDirectory: 'file:///docs/',
    getInfoAsync: jest.fn(async (uri: string) => ({
      exists: store.has(uri),
      size: store.get(uri)?.length ?? 0,
    })),
    readAsStringAsync: jest.fn(async (uri: string) => store.get(uri) ?? ''),
    writeAsStringAsync: jest.fn(async (uri: string, data: string) => {
      store.set(uri, data);
    }),
    moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      const v = store.get(from);
      if (v !== undefined) { store.set(to, v); store.delete(from); }
    }),
    deleteAsync: jest.fn(async (uri: string) => { store.delete(uri); }),
    __store: store,
  };
});

import { saveBuffer, loadBuffer, clearBuffer } from '../persistMessageBuffer';

describe('persistMessageBuffer', () => {
  beforeEach(async () => { await clearBuffer(); });

  it('round-trips a fresh buffer', async () => {
    await saveBuffer(['i', 'want', 'more']);
    const got = await loadBuffer();
    expect(got?.words).toEqual(['i', 'want', 'more']);
  });

  it('returns null when nothing saved', async () => {
    expect(await loadBuffer()).toBeNull();
  });

  it('rejects a stale (>5min) buffer', async () => {
    const realNow = Date.now;
    Date.now = () => 1_000_000_000;
    await saveBuffer(['old']);
    Date.now = () => 1_000_000_000 + 6 * 60 * 1000;
    expect(await loadBuffer()).toBeNull();
    Date.now = realNow;
  });
});
