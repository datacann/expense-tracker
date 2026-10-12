import { Expense } from '../types/expense';
import { createSubmissionLock } from './submissionLock';
import { deleteExpenseFromDetail, resolveExpenseDetailState } from './expenseDetailFlow';

const expense: Expense = {
  id: 'expense-1', merchant: 'TEST Market', date: '2026-10-05', currency: 'TRY', source: 'manual',
  items: [{ id: 'item-1', description: 'TEST Ürün', amountMinor: 1000, categoryId: 'cat_other' }],
  notes: 'Not', createdAt: '2026-10-05T10:00:00.000Z', updatedAt: '2026-10-05T10:00:00.000Z',
};

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

const run = async () => {
  assert(resolveExpenseDetailState({ expenses: [], loading: true, error: null }, 'expense-1').status === 'loading', 'Yükleme durumu ayrılmadı');
  assert(resolveExpenseDetailState({ expenses: [], loading: false, error: 'Okuma hatası' }, 'expense-1').status === 'error', 'Yükleme hatası ayrılmadı');
  assert(resolveExpenseDetailState({ expenses: [], loading: false, error: null }, 'expense-1').status === 'not-found', 'Bulunamadı durumu yanlış');
  assert(resolveExpenseDetailState({ expenses: [expense], loading: false, error: null }, 'expense-1').status === 'ready', 'Hazır kayıt bulunamadı');

  let deleteCalls = 0;
  let navigationCalls = 0;
  const cancelled = await deleteExpenseFromDetail(false, expense.id, {
    deleteExpense: async () => { deleteCalls += 1; }, navigateBack: () => { navigationCalls += 1; },
  });
  assert(cancelled.status === 'cancelled' && deleteCalls === 0 && navigationCalls === 0, 'İptal veriyi değiştirdi');

  const failed = await deleteExpenseFromDetail(true, expense.id, {
    deleteExpense: async () => { deleteCalls += 1; throw new Error('storage'); },
    navigateBack: () => { navigationCalls += 1; },
  });
  assert(failed.status === 'storage-error' && navigationCalls === 0, 'Başarısız silme navigasyon yaptı');

  const lock = createSubmissionLock();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const first = lock.run(() => deleteExpenseFromDetail(true, expense.id, {
    deleteExpense: async () => { deleteCalls += 1; await gate; }, navigateBack: () => { navigationCalls += 1; },
  }));
  const duplicate = await lock.run(() => deleteExpenseFromDetail(true, expense.id, {
    deleteExpense: async () => { deleteCalls += 1; }, navigateBack: () => { navigationCalls += 1; },
  }));
  assert(!duplicate.started, 'Silme sürerken ikinci silme başladı');
  release();
  const success = await first;
  assert(success.started && success.value.status === 'deleted' && navigationCalls === 1, 'Başarılı silme tamamlanmadı');
  console.log('Expense detail flow tests passed');
};

run().catch((error) => { console.error(error); process.exit(1); });
