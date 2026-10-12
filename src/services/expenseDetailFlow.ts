import { Expense } from '../types/expense';

export type ExpenseDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; expense: Expense };

export const resolveExpenseDetailState = (
  state: { expenses: Expense[]; loading: boolean; error: string | null },
  id: string | undefined,
): ExpenseDetailState => {
  if (state.loading) return { status: 'loading' };
  if (state.error) return { status: 'error', message: state.error };
  const expense = state.expenses.find((entry) => entry.id === id);
  return expense ? { status: 'ready', expense } : { status: 'not-found' };
};

export type ExpenseDeleteResult =
  | { status: 'cancelled' }
  | { status: 'deleted' }
  | { status: 'storage-error'; message: string };

export const deleteExpenseFromDetail = async (
  confirmed: boolean,
  expenseId: string,
  dependencies: { deleteExpense(id: string): Promise<void>; navigateBack(): void },
): Promise<ExpenseDeleteResult> => {
  if (!confirmed) return { status: 'cancelled' };
  try {
    await dependencies.deleteExpense(expenseId);
  } catch {
    return { status: 'storage-error', message: 'Harcama silinemedi. Kayıt korunuyor; tekrar deneyebilirsiniz.' };
  }
  dependencies.navigateBack();
  return { status: 'deleted' };
};
