import { sampleReceipt } from '../fixtures/sampleReceipt';
import { ReceiptAnalysis } from '../types/receipt';
import { saveReceiptAnalysis } from './receiptSaveFlow';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const createIdFactory = () => {
  let value = 0;
  return () => `id-${++value}`;
};

const testValidReceipt = async () => {
  const persisted: unknown[] = [];
  let navigatedTo: string | null = null;
  let completeStorage!: () => void;
  const storageGate = new Promise<void>((resolve) => { completeStorage = resolve; });

  const savePromise = saveReceiptAnalysis(sampleReceipt, {
    addExpense: async (expense) => {
      persisted.push(expense);
      await storageGate;
    },
    navigateToExpense: (id) => { navigatedTo = id; },
    cleanupReceiptFile: async () => { /* no-op */ },
    createId: createIdFactory(),
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  await Promise.resolve();
  assert(navigatedTo === null, 'Depolama tamamlanmadan detay ekranına gidildi');
  completeStorage();

  const result = await savePromise;
  assert(result.status === 'saved', 'Geçerli fiş kaydedilmedi');
  assert(persisted.length === 1, 'Fiş tek Expense olarak gönderilmedi');
  if (result.status !== 'saved') return;

  assert(result.expense.source === 'receipt', 'Fiş kaynağı receipt değil');
  assert(result.expense.isSample === true, 'Örnek kayıt TEST işaretini kaybetti');
  assert(result.expense.items.length === 3, 'Üç ürün ayrı ExpenseItem olarak korunmadı');
  assert(result.expense.items.reduce((sum, item) => sum + item.amountMinor, 0) === 30000, 'Toplam 300 TL değil');
  assert(result.expense.items[0].amountMinor === 6000 && result.expense.items[0].categoryId === 'cat_food', 'Süt verisi korunmadı');
  assert(result.expense.items[1].amountMinor === 14000 && result.expense.items[1].categoryId === 'cat_cleaning', 'Deterjan verisi korunmadı');
  assert(result.expense.items[2].amountMinor === 10000 && result.expense.items[2].categoryId === 'cat_personal_care', 'Şampuan verisi korunmadı');
  assert(navigatedTo === result.expense.id, 'Kayıt sonrasında doğru detaya gidilmedi');
};

const testInvalidReceipt = async () => {
  let storageCalls = 0;
  let navigationCalls = 0;
  const invalid: ReceiptAnalysis = {
    ...sampleReceipt,
    items: sampleReceipt.items.map((item, index) => index === 0 ? { ...item, amountMinor: 8000 } : item),
  };

  const result = await saveReceiptAnalysis(invalid, {
    addExpense: async () => { storageCalls += 1; },
    navigateToExpense: () => { navigationCalls += 1; },
    cleanupReceiptFile: async () => { /* no-op */ },
    createId: createIdFactory(),
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  assert(result.status === 'invalid', 'Geçersiz fiş reddedilmedi');
  assert(storageCalls === 0, 'Geçersiz fiş depolamaya gönderildi');
  assert(navigationCalls === 0, 'Geçersiz fişte başarı navigasyonu yapıldı');
};

const testStorageFailure = async () => {
  let navigationCalls = 0;
  const originalDraft = JSON.stringify(sampleReceipt);

  const result = await saveReceiptAnalysis(sampleReceipt, {
    addExpense: async () => { throw new Error('storage failed'); },
    navigateToExpense: () => { navigationCalls += 1; },
    cleanupReceiptFile: async () => { /* no-op */ },
    createId: createIdFactory(),
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  });

  assert(result.status === 'storage-error', 'Depolama hatası bildirilmedi');
  assert(navigationCalls === 0, 'Depolama hatasında başarı navigasyonu yapıldı');
  assert(JSON.stringify(sampleReceipt) === originalDraft, 'Depolama hatasında taslak değiştirildi');
};

const testMissingTotalConfirmation = async () => {
  const withoutTotal: ReceiptAnalysis = { ...sampleReceipt, totalMinor: null };
  let storageCalls = 0;
  const dependencies = {
    addExpense: async () => { storageCalls += 1; },
    navigateToExpense: () => undefined,
    cleanupReceiptFile: async () => undefined,
    createId: createIdFactory(),
    now: () => new Date('2026-10-02T12:00:00.000Z'),
  };

  const rejected = await saveReceiptAnalysis(withoutTotal, dependencies);
  assert(rejected.status === 'invalid' && storageCalls === 0, 'Eksik toplam onaysız kaydedildi');
  const confirmed = await saveReceiptAnalysis(withoutTotal, dependencies, undefined, undefined, true);
  assert(confirmed.status === 'saved' && storageCalls === 1, 'Eksik toplam açık onayla kaydedilmedi');
};

const testInvalidDateDoesNotReachStorage = async () => {
  let storageCalls = 0;
  const result = await saveReceiptAnalysis({ ...sampleReceipt, date: '2026-02-30' }, {
    addExpense: async () => { storageCalls += 1; },
    navigateToExpense: () => undefined,
    cleanupReceiptFile: async () => undefined,
    createId: createIdFactory(),
    now: () => new Date(),
  });
  assert(result.status === 'invalid' && storageCalls === 0, 'Geçersiz tarih depolamaya ulaştı');
};

  const testCleanupOnSuccess = async () => {
    let cleanedUri: string | null = null;
    const uri = 'cache://receipt-123.jpg';

    await saveReceiptAnalysis(sampleReceipt, {
      addExpense: async () => {},
      navigateToExpense: () => {},
      cleanupReceiptFile: async (u) => { cleanedUri = u || null; },
      createId: createIdFactory(),
      now: () => new Date(),
    }, uri);

    assert(cleanedUri === uri, 'Başarılı kayıt sonrası dosya temizlenmedi');
  };

  const testNoCleanupOnError = async () => {
    let cleaned = false;
    await saveReceiptAnalysis(sampleReceipt, {
      addExpense: async () => { throw new Error(); },
      navigateToExpense: () => {},
      cleanupReceiptFile: async () => { cleaned = true; },
      createId: createIdFactory(),
      now: () => new Date(),
    }, 'cache://uri.jpg');

    assert(cleaned === false, 'Hata durumunda dosya temizlendi');
  };

  const testCleanupFailureDoesNotAffectSuccess = async () => {
    let cleaned = false;
    const result = await saveReceiptAnalysis(sampleReceipt, {
      addExpense: async () => {},
      navigateToExpense: () => {},
      cleanupReceiptFile: async () => { throw new Error('Cleanup failed'); },
      createId: createIdFactory(),
      now: () => new Date(),
    }, 'cache://uri.jpg');

    assert(result.status === 'saved', 'Temizlik hatası başarılı kaydı engelledi');
  };

  const run = async () => {
    await testValidReceipt();
    await testInvalidReceipt();
    await testStorageFailure();
    await testMissingTotalConfirmation();
    await testInvalidDateDoesNotReachStorage();
    await testCleanupOnSuccess();
    await testNoCleanupOnError();
    await testCleanupFailureDoesNotAffectSuccess();
    console.log('Receipt save flow tests passed');
  };

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
