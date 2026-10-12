import { Expense } from '../types/expense';
import {
  appendExpenseItemDraft,
  ExpenseItemDraft,
  removeExpenseItemDraft,
  saveExpenseEdits,
  updateExpenseItemDraft,
} from './expenseEditFlow';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const original: Expense = {
  id: 'expense-1',
  merchant: 'Market X',
  isSample: true,
  date: '2026-10-02',
  currency: 'TRY',
  source: 'receipt',
  items: [
    { id: 'item-1', description: 'Süt', amountMinor: 6000, categoryId: 'cat_food' },
    { id: 'item-2', description: 'Deterjan', amountMinor: 14000, categoryId: 'cat_cleaning' },
    { id: 'item-3', description: 'Şampuan', amountMinor: 10000, categoryId: 'cat_personal_care' },
  ],
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
};

const makeDraft = (expense: Expense): ExpenseItemDraft[] => expense.items.map((item) => ({ ...item }));

const testSecondItemEdit = async () => {
  const draft = updateExpenseItemDraft(makeDraft(original), 1, { amountMinor: 16000 });
  let stored: Expense | null = null;
  const result = await saveExpenseEdits(original, draft, original.date, {
    updateExpense: async (_id, expense) => { stored = expense; },
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  assert(result.status === 'saved', 'Geçerli çok kalemli düzenleme kaydedilmedi');
  if (result.status !== 'saved') return;
  assert(stored !== null, 'Güncellenmiş Expense depolamaya gönderilmedi');
  assert(result.expense.items.length === 3, 'Düzenleme sırasında ürün kayboldu');
  assert(result.expense.items.reduce((sum, item) => sum + item.amountMinor, 0) === 32000, 'Toplam 320 TL olmadı');
  assert(result.expense.items[1].amountMinor === 16000, 'İkinci ürün 160 TL olmadı');
  assert(result.expense.items[0].description === 'Süt' && result.expense.items[2].description === 'Şampuan', 'Diğer ürünler bozuldu');
  assert(result.expense.id === original.id, 'Expense ID değişti');
  assert(result.expense.source === original.source, 'source değişti');
  assert(result.expense.isSample === original.isSample, 'isSample değişti');
  assert(result.expense.createdAt === original.createdAt, 'createdAt değişti');
};

const testAllFieldsAndRows = () => {
  const initial = makeDraft(original);
  const edited = updateExpenseItemDraft(initial, 0, {
    description: 'Laktozsuz süt',
    amountMinor: 7000,
    categoryId: 'cat_shopping',
  });
  assert(edited[0].description === 'Laktozsuz süt', 'Açıklama düzenlenmedi');
  assert(edited[0].amountMinor === 7000, 'Tutar düzenlenmedi');
  assert(edited[0].categoryId === 'cat_shopping', 'Kategori düzenlenmedi');
  assert(edited[1] === initial[1] && edited[2] === initial[2], 'Bir satır düzenlenirken diğer satırlar değişti');

  const added = appendExpenseItemDraft(edited, 'item-4');
  assert(added.length === 4 && added.slice(0, 3).every((item, index) => item === edited[index]), 'Satır ekleme mevcut ürünleri bozdu');
  const removed = removeExpenseItemDraft(added, 1);
  assert(removed.length === 3, 'Satır silme başarısız');
  assert(removed.map((item) => item.id).join(',') === 'item-1,item-3,item-4', 'Yanlış satır silindi veya diğer satırlar bozuldu');
  assert(JSON.stringify(original.items) === JSON.stringify(makeDraft(original)), 'Taslak değişikliği orijinal kaydı etkiledi');
};

const testInvalidDrafts = async () => {
  const invalidDrafts: ExpenseItemDraft[][] = [
    updateExpenseItemDraft(makeDraft(original), 0, { description: ' ' }),
    updateExpenseItemDraft(makeDraft(original), 0, { amountMinor: 0 }),
    updateExpenseItemDraft(makeDraft(original), 0, { categoryId: null }),
    [],
  ];
  let updateCalls = 0;

  for (const draft of invalidDrafts) {
    const result = await saveExpenseEdits(original, draft, original.date, {
      updateExpense: async () => { updateCalls += 1; },
      now: () => new Date('2026-10-02T12:00:00.000Z'),
    });
    assert(result.status === 'invalid', 'Geçersiz düzenleme kabul edildi');
  }
  assert(updateCalls === 0, 'Geçersiz form depolamaya gönderildi');
};

const testStorageFailureKeepsState = async () => {
  const draft = updateExpenseItemDraft(makeDraft(original), 1, { amountMinor: 16000 });
  const originalBefore = JSON.stringify(original);
  const draftBefore = JSON.stringify(draft);
  const result = await saveExpenseEdits(original, draft, original.date, {
    updateExpense: async () => { throw new Error('storage failed'); },
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  assert(result.status === 'storage-error', 'Depolama hatası bildirilmedi');
  assert(JSON.stringify(original) === originalBefore, 'Depolama hatasında orijinal kayıt değişti');
  assert(JSON.stringify(draft) === draftBefore, 'Depolama hatasında düzenleme taslağı değişti');
};

const testManualSingleItem = async () => {
  const manual: Expense = {
    ...original,
    id: 'manual-1',
    source: 'manual',
    isSample: undefined,
    items: [original.items[0]],
  };
  const draft = updateExpenseItemDraft(makeDraft(manual), 0, {
    description: 'Manuel süt',
    amountMinor: 7500,
    categoryId: 'cat_food',
  });
  const result = await saveExpenseEdits(manual, draft, '2026-10-03', {
    updateExpense: async () => undefined,
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  assert(result.status === 'saved', 'Tek kalemli manuel düzenleme başarısız');
  if (result.status !== 'saved') return;
  assert(result.expense.items.length === 1 && result.expense.items[0].amountMinor === 7500, 'Manuel ürün güncellenmedi');
  assert(result.expense.date === '2026-10-03', 'Manuel tarih güncellenmedi');
  assert(result.expense.source === 'manual', 'Manuel source değişti');
};

const testNotesUpdate = async () => {
  const draft = makeDraft(original);
  let stored: Expense | null = null;
  const result = await saveExpenseEdits(original, draft, original.date, {
    updateExpense: async (_id, expense) => { stored = expense; },
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  }, 'Yeni not');

  assert(result.status === 'saved', 'Notlu düzenleme başarısız');
  if (result.status !== 'saved') return;
  assert(result.expense.notes === 'Yeni not', 'Not kaydedilmedi');
};

const testMerchantUpdateAndMetadata = async () => {
  const manual: Expense = { ...original, id: 'manual-merchant', source: 'manual', items: [original.items[0]] };
  const preserved = await saveExpenseEdits(manual, makeDraft(manual), manual.date, {
    updateExpense: async () => undefined,
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  }, manual.notes, 'Yeni İşletme');
  assert(preserved.status === 'saved', 'İşletme düzenlemesi kaydedilmedi');
  if (preserved.status !== 'saved') return;
  assert(preserved.expense.merchant === 'Yeni İşletme', 'İşletme taşınmadı');
  assert(preserved.expense.items.length === 1 && preserved.expense.items[0].id === manual.items[0].id, 'Ürün metadata bozuldu');
  assert(preserved.expense.id === manual.id && preserved.expense.createdAt === manual.createdAt, 'Expense metadata bozuldu');

  const cleared = await saveExpenseEdits(preserved.expense, makeDraft(preserved.expense), preserved.expense.date, {
    updateExpense: async () => undefined,
    now: () => new Date('2026-10-02T13:00:00.000Z'),
  }, preserved.expense.notes, '   ');
  assert(cleared.status === 'saved' && cleared.expense.merchant === undefined, 'İşletme temizlenemedi');
};

const run = async () => {
  await testSecondItemEdit();
  testAllFieldsAndRows();
  await testInvalidDrafts();
  await testStorageFailureKeepsState();
  await testManualSingleItem();
  await testNotesUpdate();
  await testMerchantUpdateAndMetadata();
  console.log('Expense edit flow tests passed');
};

run().catch((error) => { console.error(error); process.exit(1); });
