import { useRef, useState } from 'react';
import { analyzeReceipt, ReceiptAnalysisError } from '../services/receiptAnalyzer';
import { ReceiptAnalysis } from '../types/receipt';

export const useReceiptAnalysis = () => {
  const [data, setData] = useState<ReceiptAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const startAnalysis = async (uri: string, useSample: boolean, signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const result = await analyzeReceipt(uri, useSample, signal);
      if (requestId === requestIdRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (e: any) {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        if (!(e instanceof ReceiptAnalysisError && e.code === 'CANCELLED')) {
          setError(e.message || 'Bir hata oluştu');
        }
      }
    }
  };

  return { data, loading, error, startAnalysis };
};
