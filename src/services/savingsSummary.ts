import { Expense } from '../types/expense';
import { calculateMonthlyStats } from '../utils/expenseAnalytics';

export const buildSavingsSummary = (expenses: Expense[], month: string, limitMinor: number | null) => {
  const monthExpenses = expenses.filter((expense) => expense.date.startsWith(month));
  const stats = calculateMonthlyStats(expenses, month);
  return {
    month,
    totalMinor: stats.total,
    recordCount: monthExpenses.length,
    limitMinor,
    historyComplete: false,
    categories: stats.summaries.map(({ categoryId, amountMinor }) => ({ categoryId, amountMinor })),
  };
};

export const savingsSnapshotKey = (summary: ReturnType<typeof buildSavingsSummary>) => JSON.stringify(summary);
