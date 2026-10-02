import { useRef, useState } from 'react';
import { analyzeReceipt } from '../services/receiptAnalyzer';
import { ReceiptAnalysis } from '../types/receipt';

export const useReceiptAnalysis = () => {
  const [data, setData] = useState<ReceiptAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const startAnalysis = async (uri: string, useSample: boolean) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await analyzeReceipt(uri, useSample);
      if (requestId === requestIdRef.current) setData(result);
    } catch (e: any) {
      if (requestId === requestIdRef.current) setError(e.message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  return { data, loading, error, startAnalysis };
};
