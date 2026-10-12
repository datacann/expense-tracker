import { Expense } from '../types/expense';
import { CATEGORIES } from '../constants/categories';

export interface CategorySummary {
  categoryId: string;
  name: string;
  amountMinor: number;
}

export interface CategoryDetailItem {
  expenseId: string;
  itemId: string;
  description: string;
  amountMinor: number;
  date: string;
  merchant?: string;
}

export const getCategoryDetails = (expenses: Expense[], yearMonth: string, categoryId: string): CategoryDetailItem[] => {
  const details: CategoryDetailItem[] = [];
  expenses.filter(e => e.date.startsWith(yearMonth)).forEach(e => {
    e.items.filter(i => i.categoryId === categoryId).forEach(i => {
      details.push({
        expenseId: e.id,
        itemId: i.id,
        description: i.description,
        amountMinor: i.amountMinor,
        date: e.date,
        merchant: e.merchant,
      });
    });
  });
  return details;
};

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

export const getPreviousMonth = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};
