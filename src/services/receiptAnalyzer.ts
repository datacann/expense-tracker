import { ReceiptAnalysis } from '../types/receipt';
import { parseReceiptAnalysisResponse } from './parseReceiptAnalysisResponse';
import { parseReceiptApiError } from './receiptApiError';
import Constants from 'expo-constants';
import { prepareReceiptImage } from './prepareReceiptUpload';
import { File } from 'expo-file-system';

// Yapılandırma sabitleri
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;
const ANALYZE_ENDPOINT = '/v1/receipts/analyze';
const REQUEST_TIMEOUT_MS = 60000;

export class ReceiptAnalysisError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ReceiptAnalysisError';
  }
}

export const analyzeReceipt = async (
  uri: string,
  useSample: boolean,
  signal?: AbortSignal
): Promise<ReceiptAnalysis> => {
  if (useSample) {
    if (!__DEV__) {
      throw new ReceiptAnalysisError('FORBIDDEN', 'Örnek analiz yalnızca geliştirme ortamında kullanılabilir');
    }
    // Örnek analiz servisini kullan (devReceiptAnalyzer'ı koruyoruz)
    const { analyzeReceiptDev } = require('./devReceiptAnalyzer');
    return await analyzeReceiptDev();
  }

  if (!API_BASE_URL) {
    throw new ReceiptAnalysisError('CONFIG_ERROR', 'API adresi yapılandırılmamış');
  }

  if (typeof uri !== 'string' || uri.trim().length === 0) {
    throw new ReceiptAnalysisError(
      'INVALID_IMAGE',
      'Fiş görseli bulunamadı. Lütfen yeniden bir fiş seçin.'
    );
  }

  // 1. Görseli Hazırla
  let uploadUri = uri;
  try {
    uploadUri = await prepareReceiptImage(uri);
  } catch (e: any) {
    throw new ReceiptAnalysisError('INVALID_IMAGE', 'Fiş görseli işlenemedi');
  }

  // FormData hazırlığı
  const formData = new FormData();
  const uploadFile = new File(uploadUri);
  formData.append('image', uploadFile as any);

  // Zaman aşımı ve iptal yönetimi için Controller
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  if (signal) signal.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}${ANALYZE_ENDPOINT}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      try {
        const apiError = parseReceiptApiError(await response.json());
        if (apiError) throw new ReceiptAnalysisError(apiError.code, apiError.message);
      } catch (error) {
        if (error instanceof ReceiptAnalysisError) throw error;
      }

      if (response.status === 413) throw new ReceiptAnalysisError('IMAGE_TOO_LARGE', 'Fiş görseli çok büyük');
      if (response.status === 429) throw new ReceiptAnalysisError('RATE_LIMITED', 'Çok fazla istek gönderildi');
      if (response.status >= 500) throw new ReceiptAnalysisError('SERVICE_UNAVAILABLE', 'Sunucu hatası');
      throw new ReceiptAnalysisError('UNREADABLE_RECEIPT', 'Sunucu fişi işleyemedi');
    }

    const json = await response.json();
    try {
      return parseReceiptAnalysisResponse(json);
    } catch {
      throw new ReceiptAnalysisError(
        'INVALID_RESPONSE',
        'Analiz servisi geçersiz bir cevap döndürdü. Lütfen tekrar deneyin.'
      );
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (signal?.aborted && !timedOut) {
        throw new ReceiptAnalysisError('CANCELLED', 'Fiş analizi iptal edildi');
      }
      throw new ReceiptAnalysisError('TIMEOUT', 'İşlem zaman aşımına uğradı');
    }
    if (error instanceof ReceiptAnalysisError) throw error;
    throw new ReceiptAnalysisError('SERVICE_UNAVAILABLE', 'Bağlantı hatası');
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', abortFromCaller);
  }
};
