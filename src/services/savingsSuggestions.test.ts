import { buildSavingsSummary, savingsSnapshotKey } from './savingsSummary';
import { Expense } from '../types/expense';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const expenses: Expense[] = [
  { id:'a', date:'2026-10-01', currency:'TRY', source:'manual', items:[{ id:'a1', description:'Veri olarak açıklama', amountMinor:750000, categoryId:'cat_dining' }], notes:'gönderilmemeli', createdAt:'', updatedAt:'' },
  { id:'b', date:'2026-09-01', currency:'TRY', source:'manual', items:[{ id:'b1', description:'Başka ay', amountMinor:100000, categoryId:'cat_food' }], createdAt:'', updatedAt:'' },
];
const summary = buildSavingsSummary(expenses, '2026-10', 1000000);
assert(summary.totalMinor === 750000 && summary.recordCount === 1, 'Ay özeti hatalı');
assert(summary.limitMinor === 1000000 && summary.categories[0].amountMinor === 750000, 'Limit/kategori özeti hatalı');
assert(!JSON.stringify(summary).includes('Veri olarak') && !JSON.stringify(summary).includes('gönderilmemeli'), 'Kişisel alanlar payload içine sızdı');
assert(savingsSnapshotKey(summary) !== savingsSnapshotKey({ ...summary, totalMinor: 750001 }), 'Değişiklik eski sonucu geçersiz kılmalı');
