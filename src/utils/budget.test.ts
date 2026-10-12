import { calculateBudgetStatus } from './budget';
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const under = calculateBudgetStatus(750_000, 1_000_000);
assert(under.remainingMinor === 250_000 && under.exceededMinor === 0 && under.progressPercent === 75, 'Kalan limit hesabı hatalı');
const over = calculateBudgetStatus(1_050_000, 1_000_000);
assert(over.remainingMinor === 0 && over.exceededMinor === 50_000 && over.progressPercent === 100, 'Limit aşımı hesabı hatalı');
