import { Expense } from '../types/expense';
import { createExpenseRepository, ExpenseStorage } from './expenseRepository';
import { ExpenseMutationStore } from './expenseMutationStore';

const makeExpense = (id: string, amountMinor = 1000): Expense => ({
  id, date: '2026-10-05', currency: 'TRY', source: 'manual',
  items: [{ id: `${id}-item`, description: id, amountMinor, categoryId: 'cat_other' }],
  createdAt: '2026-10-05T10:00:00.000Z', updatedAt: '2026-10-05T10:00:00.000Z',
});

const createMemoryStorage = () => {
  let value: string | null = null;
  let failNextWrite = false;
  const storage: ExpenseStorage = {
    getItem: async () => value,
    setItem: async (_key, next) => {
      await Promise.resolve();
      if (failNextWrite) {
        failNextWrite = false;
        throw new Error('write failed');
      }
      value = next;
    },
  };
  return { storage, failNext: () => { failNextWrite = true; } };
};

const assertIds = (expenses: Expense[], expected: string, message: string) => {
  const actual = expenses.map((expense) => expense.id).sort().join(',');
  if (actual !== expected) throw new Error(`${message}: ${actual}`);
};

const run = async () => {
  const memory = createMemoryStorage();
  const repository = createExpenseRepository(memory.storage);
  const store = new ExpenseMutationStore(repository);
  await store.load();

  await Promise.all([store.add(makeExpense('a')), store.add(makeExpense('b'))]);
  assertIds(await createExpenseRepository(memory.storage).getAll(), 'a,b', 'Yakın eklemeler kayıt kaybetti');

  await Promise.all([
    store.add(makeExpense('c')),
    store.update('a', makeExpense('a', 2500)),
  ]);
  const addAndUpdate = await createExpenseRepository(memory.storage).getAll();
  assertIds(addAndUpdate, 'a,b,c', 'Ekleme ve güncelleme birbirini kaybetti');
  if (addAndUpdate.find((expense) => expense.id === 'a')?.items[0].amountMinor !== 2500) {
    throw new Error('Güncelleme kalıcı depoya yazılmadı');
  }

  await Promise.all([store.delete('b'), store.add(makeExpense('d'))]);
  assertIds(await createExpenseRepository(memory.storage).getAll(), 'a,c,d', 'Silinen kayıt eski state ile geri geldi');

  memory.failNext();
  let failed = false;
  try { await store.add(makeExpense('failed')); } catch { failed = true; }
  if (!failed) throw new Error('Başarısız yazma hata vermedi');
  await store.add(makeExpense('retry'));
  assertIds(await createExpenseRepository(memory.storage).getAll(), 'a,c,d,retry', 'Başarısız yazma sonrası yeniden deneme çalışmadı');

  await store.add(makeExpense('receipt-draft'));
  await store.add(makeExpense('receipt-draft'));
  const finalReload = await createExpenseRepository(memory.storage).getAll();
  if (finalReload.filter((expense) => expense.id === 'receipt-draft').length !== 1) {
    throw new Error('Fiş taslak kimliği mükerrer kaydı engellemedi');
  }
  console.log('Expense mutation store tests passed');
};

run().catch((error) => { console.error(error); process.exit(1); });
