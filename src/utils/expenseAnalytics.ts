import { Expense } from '../types/expense';
import { CATEGORIES } from '../constants/categories';

export interface CategorySummary {
  categoryId: string;
  name: string;
  amountMinor: number;
}

export const calculateMonthlyStats = (expenses: Expense[], yearMonth: string) => {
  const filtered = expenses.filter(e => e.date.startsWith(yearMonth));
  
  const total = filtered.reduce((sum, e) => 
    sum + e.items.reduce((iSum, i) => iSum + i.amountMinor, 0), 0
  );

  const byCategory: Record<string, number> = {};
  filtered.forEach(e => {
    e.items.forEach(i => {
      byCategory[i.categoryId] = (byCategory[i.categoryId] || 0) + i.amountMinor;
    });
  });

  const summaries: CategorySummary[] = Object.entries(byCategory).map(([categoryId, amount]) => ({
    categoryId,
    name: Object.values(CATEGORIES)[Object.keys(CATEGORIES).indexOf(categoryId.replace('cat_', '').toUpperCase())] || 'Diğer',
    amountMinor: amount,
  }));

  return { total, summaries };
};
