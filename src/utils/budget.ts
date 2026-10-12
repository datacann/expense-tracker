export const calculateBudgetStatus = (spentMinor: number, limitMinor: number) => ({
  remainingMinor: Math.max(0, limitMinor - spentMinor),
  exceededMinor: Math.max(0, spentMinor - limitMinor),
  progressPercent: Math.min(100, Math.max(0, (spentMinor / limitMinor) * 100)),
});
