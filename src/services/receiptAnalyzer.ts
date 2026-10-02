import { ReceiptAnalysis } from '../types/receipt';
import { analyzeReceiptDev } from './devReceiptAnalyzer';

export const analyzeReceipt = async (uri: string, useSample: boolean): Promise<ReceiptAnalysis> => {
  if (useSample) {
    if (!__DEV__) {
      throw new Error('Örnek analiz yalnızca geliştirme ortamında kullanılabilir');
    }
    return await analyzeReceiptDev();
  }
  
  throw new Error('Analiz servisi henüz bağlı değil');
};
