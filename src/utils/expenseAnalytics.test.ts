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

const scenario: Expense[] = [
  { id: 'coffee', date: '2026-10-01', currency: 'TRY', source: 'manual', items: [{ id: 'c', description: 'Kahve', amountMinor: 12000, categoryId: 'cat_dining' }], createdAt: '', updatedAt: '' },
  { id: 'market', date: '2026-10-05', currency: 'TRY', source: 'manual', items: [{ id: 'm', description: 'Market', amountMinor: 35050, categoryId: 'cat_food' }], createdAt: '', updatedAt: '' },
  { id: 'bus', date: '2026-10-10', currency: 'TRY', source: 'manual', items: [{ id: 'b', description: 'Otobüs', amountMinor: 3000, categoryId: 'cat_transport' }], createdAt: '', updatedAt: '' },
  { id: 'previous', date: '2026-09-30', currency: 'TRY', source: 'manual', items: [{ id: 'p', description: 'Alışveriş', amountMinor: 20000, categoryId: 'cat_shopping' }], createdAt: '', updatedAt: '' },
];
if (calculateMonthlyStats(scenario, '2026-10').total !== 50050) throw new Error('Selected month total mismatch');
if (calculateMonthlyStats(scenario, '2026-09').total !== 20000) throw new Error('Previous month total mismatch');

const edited = scenario.map((entry) => entry.id === 'coffee' ? { ...entry, items: [{ ...entry.items[0], amountMinor: 15000 }] } : entry);
if (calculateMonthlyStats(edited, '2026-10').total !== 53050) throw new Error('Edited total mismatch');
const deleted = edited.filter((entry) => entry.id !== 'bus');
if (calculateMonthlyStats(deleted, '2026-10').total !== 50050) throw new Error('Deleted total mismatch');

const recategorized = scenario.map((entry) => entry.id === 'coffee' ? { ...entry, items: [{ ...entry.items[0], categoryId: 'cat_food' }] } : entry);
const recategorizedStats = calculateMonthlyStats(recategorized, '2026-10');
const recategorizedAmounts = Object.fromEntries(recategorizedStats.summaries.map(summary => [summary.categoryId, summary.amountMinor]));
if (recategorizedStats.total !== 50050 || recategorizedAmounts.cat_food !== 47050) throw new Error('Recategorization mismatch');

const multiCategory: Expense = { id: 'receipt', date: '2026-10-15', currency: 'TRY', source: 'receipt', items: [
  { id: 'r1', description: 'Süt', amountMinor: 6000, categoryId: 'cat_food' },
  { id: 'r2', description: 'Deterjan', amountMinor: 14000, categoryId: 'cat_cleaning' },
], createdAt: '', updatedAt: '' };
const multiStats = calculateMonthlyStats([...scenario, multiCategory], '2026-10');
const multiAmounts = Object.fromEntries(multiStats.summaries.map(summary => [summary.categoryId, summary.amountMinor]));
if (multiAmounts.cat_food !== 41050 || multiAmounts.cat_cleaning !== 14000) throw new Error('Multi-category receipt mismatch');
const empty = calculateMonthlyStats(scenario, '2025-01');
if (empty.total !== 0 || empty.summaries.length !== 0 || !Number.isFinite(empty.total)) throw new Error('Empty month mismatch');
console.log('Test passed');
