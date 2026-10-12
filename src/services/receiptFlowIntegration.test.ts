import assert from 'assert';
import { parseReceiptAnalysisResponse } from './parseReceiptAnalysisResponse';
import { validateReceiptDraft } from '../utils/receiptValidation';
import { CATEGORY_IDS } from '../constants/categories';
import { Expense } from '../types/expense';
import { calculateMonthlyStats } from '../utils/expenseAnalytics';

/**
 * Bu test bir UI veya Gerçek AI uçtan uca testi DEĞİLDİR.
 * Kontrollü sahte HTTP cevabı ile başlayan parser -> doğrulama -> kayıt -> izole depolama -> kategori toplamları akışını test eder.
 */
export const runReceiptFlowIntegrationTest = () => {
  console.log('--- Bütünleşik Fiş Akış Testi Başlatılıyor ---');

  // 1. Kontrollü HTTP API Cevabı (60 TL, 140 TL, 100 TL -> Toplam 300 TL / 30000 minor)
  const mockApiResponse = {
    schemaVersion: 1,
    requestId: 'req-integration-test-1',
    analysis: {
      merchant: 'Test Market',
      date: '2026-10-05',
      currency: 'TRY',
      totalMinor: 30000,
      warnings: [],
      items: [
        { rawText: 'Süt 1L', description: 'Süt', amountMinor: 6000, categoryId: CATEGORY_IDS.FOOD },
        { rawText: 'Deterjan', description: 'Deterjan', amountMinor: 14000, categoryId: CATEGORY_IDS.SHOPPING },
        { rawText: 'Otobüs Kartı Dolumu', description: 'Ulaşım', amountMinor: 10000, categoryId: CATEGORY_IDS.TRANSPORT },
      ],
    },
  };

  // 2. Gerçek Parser Adımı
  const parsedAnalysis = parseReceiptAnalysisResponse(mockApiResponse);
  assert.strictEqual(parsedAnalysis.merchant, 'Test Market');
  assert.strictEqual(parsedAnalysis.totalMinor, 30000);
  assert.strictEqual(parsedAnalysis.items.length, 3);
  console.log('✓ 1. Gerçek parser çıktısı doğrulandı');

  // 3. Gerçek Taslak Doğrulama Adımı
  const draftToValidate = {
    merchant: parsedAnalysis.merchant,
    date: parsedAnalysis.date,
    totalMinor: parsedAnalysis.totalMinor,
    items: parsedAnalysis.items.map((i) => ({
      description: i.description,
      amountMinor: i.amountMinor,
      categoryId: i.categoryId,
    })),
  };
  const validationResult = validateReceiptDraft(draftToValidate, false);
  assert.strictEqual(validationResult.valid, true, 'Taslak geçerli olmalı');
  console.log('✓ 2. Taslak doğrulama (validation) başarılı');

  // 4. İzole Bellek İçi Depolama Simülasyonu (AsyncStorage'a dokunulmaz)
  const isolatedDatabase: Expense[] = [];
  const createdExpense: Expense = {
    id: 'exp-test-1',
    merchant: parsedAnalysis.merchant ?? undefined,
    date: parsedAnalysis.date!,
    notes: 'Entegrasyon testi notu',
    source: 'receipt',
    receiptDraftId: 'draft-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: parsedAnalysis.items.map((item, index) => ({
      id: `item-${index}`,
      description: item.description,
      amountMinor: item.amountMinor!,
      categoryId: item.categoryId!,
    })),
  };
  isolatedDatabase.push(createdExpense);
  console.log('✓ 3. İzole depoya 3 kalemli tek Expense kaydı yapıldı');

  // 5. Yeniden Yükleme ve Kategori Toplamlarına Yansıma Kontrolü
  const loadedExpenses = isolatedDatabase.filter((e) => e.date.startsWith('2026-10'));
  assert.strictEqual(loadedExpenses.length, 1);
  const expense = loadedExpenses[0];

  const totalCalculated = expense.items.reduce((sum, item) => sum + item.amountMinor, 0);
  assert.strictEqual(totalCalculated, 30000, 'Toplam 300 TL (30000 kuruş) olmalı');

  // Kategori istatistikleri fonksiyonu
  const monthlyStats = calculateMonthlyStats(loadedExpenses, '2026-10');
  assert.strictEqual(monthlyStats.total, 30000, 'Aylık toplam 300 TL olmalı');

  const foodSummary = monthlyStats.summaries.find((s) => s.categoryId === CATEGORY_IDS.FOOD);
  const shoppingSummary = monthlyStats.summaries.find((s) => s.categoryId === CATEGORY_IDS.SHOPPING);
  const transportSummary = monthlyStats.summaries.find((s) => s.categoryId === CATEGORY_IDS.TRANSPORT);

  assert.strictEqual(foodSummary?.amountMinor, 6000, 'Gıda kategorisi 60 TL olmalı');
  assert.strictEqual(shoppingSummary?.amountMinor, 14000, 'Alışveriş kategorisi 140 TL olmalı');
  assert.strictEqual(transportSummary?.amountMinor, 10000, 'Ulaşım kategorisi 100 TL olmalı');
  console.log('✓ 4. Kategori dağılımları ve toplamları (60 TL, 140 TL, 100 TL -> 300 TL) başarıyla doğrulandı');

  console.log('✓ Bütünleşik Fiş Akış Testi Başarıyla Tamamlandı.');
};

runReceiptFlowIntegrationTest();
