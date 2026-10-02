import { ReceiptAnalysis } from '../types/receipt';
import { sampleReceipt } from '../fixtures/sampleReceipt';

export const analyzeReceiptDev = async (): Promise<ReceiptAnalysis> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(sampleReceipt), 1000);
  });
};
