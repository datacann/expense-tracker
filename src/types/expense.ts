export interface ExpenseItem {
  id: string;
  description: string;
  amountMinor: number; // Kuruş cinsinden
  categoryId: string;
}

export interface Expense {
  id: string;
  merchant?: string;
  isSample?: boolean;
  date: string; // YYYY-MM-DD
  currency: 'TRY';
  source: 'manual' | 'receipt' | 'voice';
  items: ExpenseItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
