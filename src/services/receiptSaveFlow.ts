import { Expense } from '../types/expense';
import { ReceiptAnalysis } from '../types/receipt';
import { validateReceiptDraft } from '../utils/validateReceiptDraft';
import { isValidCalendarDate } from '../utils/localDate';

export type ReceiptSaveResult =
  | { status: 'saved'; expense: Expense }
  | { status: 'invalid'; message: string }
  | { status: 'storage-error'; message: string };

interface ReceiptSaveDependencies {
  addExpense: (expense: Expense) => Promise<void>;
  navigateToExpense: (expenseId: string) => void;
  cleanupReceiptFile: (uri: string | undefined | null) => Promise<void>;
  createId: () => string;
  now: () => Date;
}

export const saveReceiptAnalysis = async (
  analysis: ReceiptAnalysis,
  dependencies: ReceiptSaveDependencies,
  receiptUri?: string,
  expenseId?: string,
  missingTotalConfirmed = false,
): Promise<ReceiptSaveResult> => {
  const validation = validateReceiptDraft(
    analysis.items,
    analysis.totalMinor,
    missingTotalConfirmed,
  );
  if (!validation.isValid) {
    return {
      status: 'invalid',
      message: validation.diff > 0
        ? `Ürün toplamı ile fiş toplamı arasında ${(validation.diff / 100).toFixed(2)} TL fark var.`
        : 'Fişte boş açıklama, geçersiz tutar veya seçilmemiş kategori var.',
    };
  }

  if (!analysis.date || !isValidCalendarDate(analysis.date)) {
    return { status: 'invalid', message: 'Geçerli bir fiş tarihi girin (YYYY-AA-GG).' };
  }

  const now = dependencies.now().toISOString();
  const expense: Expense = {
    id: expenseId || dependencies.createId(),
    merchant: analysis.merchant ?? undefined,
    isSample: analysis.isSample,
    date: analysis.date,
    currency: analysis.currency,
    source: 'receipt',
    items: analysis.items.map((item) => ({
      id: dependencies.createId(),
      description: item.description.trim(),
      amountMinor: item.amountMinor!,
      categoryId: item.categoryId!,
    })),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await dependencies.addExpense(expense);
  } catch {
    return { status: 'storage-error', message: 'Fiş kaydedilemedi. Taslağınız korunuyor; tekrar deneyebilirsiniz.' };
  }

  try {
    await dependencies.cleanupReceiptFile(receiptUri);
  } catch (e) {
    console.error('Fotoğraf temizleme hatası (kayıt başarılı):', e);
  }

  dependencies.navigateToExpense(expense.id);
  return { status: 'saved', expense };
};
