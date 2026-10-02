export interface ReceiptItem {
  rawText: string;
  description: string;
  amountMinor: number | null;
  categoryId: string | null;
}

export interface ReceiptAnalysis {
  merchant: string | null;
  date: string | null;
  currency: 'TRY';
  totalMinor: number | null;
  items: ReceiptItem[];
  warnings: string[];
  isSample: boolean;
}
