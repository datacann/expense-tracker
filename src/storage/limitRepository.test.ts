import { createLimitRepository } from './limitRepository';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
export const testPromise = (async () => {
  const values = new Map<string, string>();
  const storage = { getItem: async (key: string) => values.get(key) ?? null, setItem: async (key: string, value: string) => { values.set(key, value); } };
  const repository = createLimitRepository(storage as any);
  await repository.setLimit('2026-10', 1_000_000);
  await repository.setLimit('2026-11', 750_000);
  assert(await repository.getLimit('2026-10') === 1_000_000, 'Ekim limiti korunmadı');
  assert(await repository.getLimit('2026-11') === 750_000, 'Ay izolasyonu bozuk');
  await repository.setLimit('2026-10', 1_200_000);
  assert(await repository.getLimit('2026-10') === 1_200_000, 'Limit güncellenmedi');
  await repository.removeLimit('2026-10');
  assert(await repository.getLimit('2026-10') === null && await repository.getLimit('2026-11') === 750_000, 'Limit kaldırma başka ayı etkiledi');
  let failed = false;
  try { await repository.setLimit('2026-12', 0); } catch { failed = true; }
  assert(failed, 'Sıfır limit reddedilmedi');

  const failing = createLimitRepository({ getItem: async () => null, setItem: async () => { throw new Error('storage'); } } as any);
  failed = false;
  try { await failing.setLimit('2026-10', 100); } catch { failed = true; }
  assert(failed, 'Depolama hatası yutuldu');
})();
