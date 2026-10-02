import { ReceiptItem } from '../types/receipt';

export const validateReceiptDraft = (
  items: ReceiptItem[],
  readTotal: number | null,
  missingTotalConfirmed = false,
) => {
  const calculatedTotal = items.reduce((sum, item) => sum + (item.amountMinor || 0), 0);
  const diff = readTotal === null ? 0 : Math.abs(readTotal - calculatedTotal);
  
  const isValid = items.length > 0 && 
                  items.every(i => i.description.trim().length > 0 && i.amountMinor !== null && i.amountMinor > 0 && i.categoryId) &&
                  (readTotal === null ? missingTotalConfirmed : diff === 0);

  return { isValid, calculatedTotal, diff };
};
