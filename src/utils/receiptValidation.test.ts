import { validateReceiptDraft } from './validateReceiptDraft';

const test = () => {
  const items = [
    { rawText: 'Süt', description: 'Süt', amountMinor: 6000, categoryId: 'cat_food' },
    { rawText: 'Deterjan', description: 'Deterjan', amountMinor: 14000, categoryId: 'cat_cleaning' },
    { rawText: 'Şampuan', description: 'Şampuan', amountMinor: 10000, categoryId: 'cat_personal_care' },
  ];
  const { isValid, diff } = validateReceiptDraft(items, 30000);
  if (!isValid || diff !== 0) throw new Error('Validasyon başarısız');

  const changedItems = items.map((item, index) =>
    index === 0 ? { ...item, amountMinor: 8000 } : item
  );
  const mismatch = validateReceiptDraft(changedItems, 30000);
  if (mismatch.isValid || mismatch.calculatedTotal !== 32000 || mismatch.diff !== 2000) {
    throw new Error('Toplam farkı doğrulaması başarısız');
  }

  const corrected = validateReceiptDraft(changedItems, 32000);
  if (!corrected.isValid || corrected.diff !== 0) {
    throw new Error('Düzeltilmiş toplam doğrulaması başarısız');
  }

  if (validateReceiptDraft(items, null).isValid) {
    throw new Error('Eksik toplam açık onay olmadan geçerli sayıldı');
  }
  if (!validateReceiptDraft(items, null, true).isValid) {
    throw new Error('Eksik toplam açık onayla kabul edilmedi');
  }

  const invalidItems = [
    { ...items[0], description: ' ' },
    { ...items[1], amountMinor: 0 },
    { ...items[2], categoryId: null },
  ];
  if (validateReceiptDraft(invalidItems, 14000).isValid) {
    throw new Error('Geçersiz ürün satırları kabul edildi');
  }

  if (validateReceiptDraft([], 0).isValid) {
    throw new Error('Sıfır ürün kabul edildi');
  }
  console.log('Test başarılı');
};

test();
