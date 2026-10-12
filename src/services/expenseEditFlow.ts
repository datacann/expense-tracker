import { Expense, ExpenseItem } from '../types/expense';
import { validateReceiptDraft } from '../utils/validateReceiptDraft';

export interface ExpenseItemDraft {
  id: string;
  description: string;
  amountMinor: number | null;
  categoryId: string | null;
}

export type ExpenseEditResult =
  | { status: 'saved'; expense: Expense }
  | { status: 'invalid'; message: string }
  | { status: 'storage-error'; message: string };

interface ExpenseEditDependencies {
  updateExpense: (id: string, expense: Expense) => Promise<void>;
  now: () => Date;
}

export const updateExpenseItemDraft = (
  items: ExpenseItemDraft[],
  index: number,
  patch: Partial<Omit<ExpenseItemDraft, 'id'>>,
): ExpenseItemDraft[] => items.map((item, itemIndex) => (
  itemIndex === index ? { ...item, ...patch } : item
));

export const appendExpenseItemDraft = (
  items: ExpenseItemDraft[],
  id: string,
): ExpenseItemDraft[] => [
  ...items,
  { id, description: '', amountMinor: null, categoryId: 'cat_other' },
];

export const removeExpenseItemDraft = (
  items: ExpenseItemDraft[],
  index: number,
): ExpenseItemDraft[] => items.filter((_, itemIndex) => itemIndex !== index);

export const saveExpenseEdits = async (
  original: Expense,
  draftItems: ExpenseItemDraft[],
  date: string,
  dependencies: ExpenseEditDependencies,
  notes?: string,
  merchant: string | undefined = original.merchant,
): Promise<ExpenseEditResult> => {
  const receiptItems = draftItems.map((item) => ({
    rawText: item.description,
    description: item.description,
    amountMinor: item.amountMinor,
    categoryId: item.categoryId,
  }));
  const draftTotal = draftItems.reduce((sum, item) => sum + (item.amountMinor ?? 0), 0);
  const validation = validateReceiptDraft(receiptItems, draftTotal);

  if (!validation.isValid) {
    return {
      status: 'invalid',
      message: 'En az bir ürün olmalı; her üründe açıklama, pozitif tutar ve kategori bulunmalı.',
    };
  }

  const items: ExpenseItem[] = draftItems.map((item) => ({
    id: item.id,
    description: item.description.trim(),
    amountMinor: item.amountMinor!,
    categoryId: item.categoryId!,
  }));
  const updated: Expense = {
    ...original,
    date,
    items,
    merchant: merchant?.trim() || undefined,
    notes: notes?.trim() || undefined,
    updatedAt: dependencies.now().toISOString(),
  };

  try {
    await dependencies.updateExpense(original.id, updated);
  } catch {
    return {
      status: 'storage-error',
      message: 'Değişiklikler kaydedilemedi. Düzenleme taslağınız korunuyor; tekrar deneyebilirsiniz.',
    };
  }

  return { status: 'saved', expense: updated };
};
