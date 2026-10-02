import { ReceiptAnalysis } from '../types/receipt';

export const sampleReceipt: ReceiptAnalysis = {
  merchant: 'Market X',
  date: new Date().toISOString().split('T')[0],
  currency: 'TRY',
  totalMinor: 30000,
  items: [
    { rawText: 'Süt', description: 'Süt', amountMinor: 6000, categoryId: 'cat_food' },
    { rawText: 'Deterjan', description: 'Deterjan', amountMinor: 14000, categoryId: 'cat_cleaning' },
    { rawText: 'Şampuan', description: 'Şampuan', amountMinor: 10000, categoryId: 'cat_personal_care' },
  ],
  warnings: ['Örnek veri — fotoğraf okunmadı'],
  isSample: true,
};
