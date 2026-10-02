import { calculateMonthlyStats } from './expenseAnalytics';
import { Expense } from '../types/expense';

const mockExpenses: Expense[] = [
  { id: '1', date: '2026-10-01', currency: 'TRY', source: 'manual', items: [{ id: '1i', description: 'Test', amountMinor: 10000, categoryId: 'cat_food' }], createdAt: '', updatedAt: '' },
  { id: '2', date: '2026-10-05', currency: 'TRY', source: 'receipt', items: [
    { id: '2a', description: 'Süt', amountMinor: 6000, categoryId: 'cat_food' },
    { id: '2b', description: 'Deterjan', amountMinor: 14000, categoryId: 'cat_cleaning' },
    { id: '2c', description: 'Şampuan', amountMinor: 10000, categoryId: 'cat_personal_care' },
  ], createdAt: '', updatedAt: '' },
  { id: '3', date: '2026-09-30', currency: 'TRY', source: 'manual', items: [{ id: '3i', description: 'Başka ay', amountMinor: 50000, categoryId: 'cat_food' }], createdAt: '', updatedAt: '' }
];

const stats = calculateMonthlyStats(mockExpenses, '2026-10');
if (stats.total !== 40000) throw new Error('Total mismatch');
const amounts = Object.fromEntries(stats.summaries.map(summary => [summary.categoryId, summary.amountMinor]));
if (amounts.cat_food !== 16000 || amounts.cat_cleaning !== 14000 || amounts.cat_personal_care !== 10000) {
  throw new Error('Category breakdown mismatch');
}
console.log('Test passed');
