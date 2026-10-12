import { parseReceiptAnalysisResponse } from './parseReceiptAnalysisResponse';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const assertThrows = (fn: () => void, expectedMessagePart?: string) => {
  let threw = false;
  try {
    fn();
  } catch (e: any) {
    threw = true;
    if (expectedMessagePart && !e.message.includes(expectedMessagePart)) {
      throw new Error(`Beklenen hata mesajı "${expectedMessagePart}" içermiyor. Gelen: "${e.message}"`);
    }
  }
  if (!threw) throw new Error('Hata fırlatılması bekleniyordu ancak fonksiyon başarılı oldu.');
};

// 1. Geçerli Veri
const testValid = () => {
  const data = {
    schemaVersion: 1,
    requestId: 'req_123',
    analysis: {
      merchant: 'Market X',
      date: '2026-10-04',
      currency: 'TRY',
      totalMinor: 1000,
      items: [{ rawText: 'Süt 1L', description: 'Süt', amountMinor: 1000, categoryId: 'cat_food' }],
      warnings: [],
      isSample: true, // test that isSample is forced to false
    }
  };
  const parsed = parseReceiptAnalysisResponse(data);
  assert(parsed.merchant === 'Market X', 'Merchant uyumsuz');
  assert(parsed.date === '2026-10-04', 'Date uyumsuz');
  assert(parsed.currency === 'TRY', 'Currency uyumsuz');
  assert(parsed.totalMinor === 1000, 'TotalMinor uyumsuz');
  assert(parsed.items.length === 1, 'Items boyutu hatalı');
  assert(parsed.items[0].description === 'Süt', 'Item description hatalı');
  assert(parsed.items[0].amountMinor === 1000, 'Item amountMinor hatalı');
  assert(parsed.items[0].categoryId === 'cat_food', 'Item categoryId hatalı');
  assert(parsed.isSample === false, 'isSample false olmalı');
  console.log('✓ testValid geçti');
};

// 2. Null/Eksik Alanlar (Sözleşmeye uygun eksik veri)
const testNullFields = () => {
  const data = {
    schemaVersion: 1,
    requestId: 'req_null_01',
    analysis: {
      merchant: null,
      date: null,
      currency: null,
      totalMinor: null,
      items: [{ rawText: '', description: '', amountMinor: null, categoryId: null }],
      warnings: []
    }
  };
  const parsed = parseReceiptAnalysisResponse(data);
  assert(parsed.merchant === null, 'Merchant null olmalı');
  assert(parsed.date === null, 'Date null olmalı');
  assert(parsed.totalMinor === null, 'TotalMinor null olmalı');
  assert(parsed.items[0].amountMinor === null, 'Item amountMinor null olmalı; sıfıra çevrilmemeli');
  assert(parsed.items[0].categoryId === null, 'Item categoryId null olmalı');
  console.log('✓ testNullFields geçti');
};

// 3. Yanlış Tipler / Bozuk Yapı
const testInvalidTypes = () => {
  assertThrows(() => parseReceiptAnalysisResponse(null), 'Geçersiz cevap');
  assertThrows(() => parseReceiptAnalysisResponse({ schemaVersion: 2 }), 'Geçersiz veya desteklenmeyen schemaVersion');
  assertThrows(() => parseReceiptAnalysisResponse({ schemaVersion: 1, requestId: 123 }), 'Geçersiz veya eksik requestId');
  assertThrows(() => parseReceiptAnalysisResponse({ schemaVersion: 1, requestId: 'r1', analysis: null }), 'Geçersiz veya eksik analysis');
  assertThrows(() => parseReceiptAnalysisResponse({ schemaVersion: 1, requestId: 'r1', analysis: { merchant: 123 } }), 'Geçersiz merchant veri tipi');
  assertThrows(() => parseReceiptAnalysisResponse({ schemaVersion: 1, requestId: 'r1', analysis: { items: 'not-an-array' } }), 'Geçersiz items');
  console.log('✓ testInvalidTypes geçti');
};

// 4. Ondalıklı Para ve Negatif Tutar
const testFractionalAndNegativeMoney = () => {
  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: {
      totalMinor: 10.5,
      items: []
    }
  }), 'Geçersiz totalMinor');

  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: {
      totalMinor: -500,
      items: []
    }
  }), 'Geçersiz totalMinor');

  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: {
      totalMinor: 100,
      items: [{ rawText: '', description: 'A', amountMinor: 20.9, categoryId: 'cat_food' }]
    }
  }), 'geçersiz amountMinor');

  console.log('✓ testFractionalAndNegativeMoney geçti');
};

// 5. Güvenli Sayı Sınırını Aşan Tutar (MAX_SAFE_INTEGER)
const testUnsafeIntegers = () => {
  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: {
      totalMinor: Number.MAX_SAFE_INTEGER + 100,
      items: []
    }
  }), 'Geçersiz totalMinor');

  console.log('✓ testUnsafeIntegers geçti');
};

// 6. Bilinmeyen Kategori (null'a dönüştürülmeli ve uyarı eklenmeli)
const testUnknownCategory = () => {
  const data = {
    schemaVersion: 1,
    requestId: 'r1',
    analysis: {
      items: [{ rawText: 'Ürün', description: 'Ürün', amountMinor: 100, categoryId: 'cat_unknown_fake' }]
    }
  };
  const parsed = parseReceiptAnalysisResponse(data);
  assert(parsed.items[0].categoryId === null, 'Bilinmeyen kategori null yapılmalı');
  assert(parsed.warnings.length > 0, 'Bilinmeyen kategori için uyarı eklenmeli');
  console.log('✓ testUnknownCategory geçti');
};

// 7. Geçersiz Tarih (Format ve Takvim)
const testInvalidCalendarDate = () => {
  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: { date: '2026-02-30', items: [] } // Şubat 30 olamaz
  }), 'Geçersiz takvim tarihi biçimi');

  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: { date: '04-10-2026', items: [] } // Yanlış format
  }), 'Geçersiz takvim tarihi biçimi');

  assertThrows(() => parseReceiptAnalysisResponse({
    schemaVersion: 1,
    requestId: 'r1',
    analysis: { date: '2026-13-01', items: [] } // Ay 13 olamaz
  }), 'Geçersiz takvim tarihi biçimi');

  console.log('✓ testInvalidCalendarDate geçti');
};

const testCurrency = () => {
  const base = {
    schemaVersion: 1,
    requestId: 'r1',
    analysis: { items: [] }
  };
  
  // TRY ve null/undefined geçerli
  parseReceiptAnalysisResponse({ ...base, analysis: { ...base.analysis, currency: 'TRY' } });
  parseReceiptAnalysisResponse({ ...base, analysis: { ...base.analysis, currency: null } });
  
  // USD/EUR geçersiz
  assertThrows(() => parseReceiptAnalysisResponse({ ...base, analysis: { ...base.analysis, currency: 'EUR' } }), 'Desteklenmeyen para birimi');
  
  console.log('✓ testCurrency geçti');
};

export const runAll = () => {
  testValid();
  testNullFields();
  testInvalidTypes();
  testFractionalAndNegativeMoney();
  testUnsafeIntegers();
  testUnknownCategory();
  testInvalidCalendarDate();
  testCurrency();
  console.log('Tüm parseReceiptAnalysisResponse testleri başarıyla tamamlandı.');
};

runAll();