import { analyzeReceipt, ReceiptAnalysisError } from './receiptAnalyzer';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

type MockFetch = ((...args: Parameters<typeof fetch>) => Promise<unknown>) & {
  mockResolvedValueOnce: (value: unknown) => void;
  mockRejectedValueOnce: (value: unknown) => void;
};

const queuedResponses: Array<{ type: 'resolve' | 'reject'; value: unknown }> = [];
const mockFetch = (async () => {
  const next = queuedResponses.shift();
  if (!next) throw new Error('Eksik fetch mock cevabı');
  if (next.type === 'reject') throw next.value;
  return next.value;
}) as unknown as MockFetch;
mockFetch.mockResolvedValueOnce = (value: unknown) => {
  queuedResponses.push({ type: 'resolve', value });
};
mockFetch.mockRejectedValueOnce = (value: unknown) => {
  queuedResponses.push({ type: 'reject', value });
};
globalThis.fetch = mockFetch as typeof fetch;

const testSuccess = async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      schemaVersion: 1,
      requestId: 'test_req',
      analysis: {
        merchant: 'Test',
        date: '2026-10-04',
        currency: 'TRY',
        totalMinor: 100,
        items: [{ rawText: 'X', description: 'X', amountMinor: 100, categoryId: 'cat_food' }],
        warnings: [],
      }
    })
  });

  const result = await analyzeReceipt('file://test.jpg', false);
  assert(result.merchant === 'Test', 'Başarı cevabı yanlış');
};

const test413Error = async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 413,
    json: async () => ({
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: 'Fiş görseli izin verilen boyut sınırını aşıyor.',
        requestId: 'req_large',
      },
    }),
  });
  try {
    await analyzeReceipt('file://test.jpg', false);
    assert(false, '413 hata kodu yakalanmadı');
  } catch (e: any) {
    assert(e.code === 'IMAGE_TOO_LARGE', 'Hata kodu yanlış');
  }
};

const testMissingProviderError = async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 503,
    json: async () => ({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Fiş analiz servisi şu anda kullanılamıyor.',
        requestId: 'req_missing_provider',
      },
    }),
  });

  try {
    await analyzeReceipt('file://test.jpg', false);
    assert(false, 'Eksik sağlayıcı hatası yakalanmadı');
  } catch (error) {
    if (!(error instanceof ReceiptAnalysisError)) {
      throw new Error('Beklenen mobil hata türü dönmedi');
    }
    assert(error.code === 'SERVICE_UNAVAILABLE', 'Servis hata kodu korunmadı');
    assert(
      error.message === 'Fiş analiz servisi şu anda kullanılamıyor.',
      'Backend servis mesajı kullanıcıya aktarılmadı'
    );
  }
};

const testMissingImageUri = async () => {
  try {
    await analyzeReceipt(undefined as unknown as string, false);
    assert(false, 'Eksik görsel URI hatası yakalanmadı');
  } catch (error) {
    if (!(error instanceof ReceiptAnalysisError)) {
      throw new Error('Beklenen mobil hata türü dönmedi');
    }
    assert(error.code === 'INVALID_IMAGE', 'Eksik görsel hata kodu yanlış');
    assert(
      error.message === 'Fiş görseli bulunamadı. Lütfen yeniden bir fiş seçin.',
      'Eksik görsel için anlaşılır mesaj dönmedi'
    );
  }
};

const testMalformedSuccessUsesRuntimeParser = async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ schemaVersion: 1, requestId: 'bad', analysis: { items: [], totalMinor: 1.5 } }),
  });
  try {
    await analyzeReceipt('file://test.jpg', false);
    assert(false, 'Bozuk başarılı HTTP cevabı kabul edildi');
  } catch (error) {
    assert(error instanceof ReceiptAnalysisError, 'Parser hatası kontrollü servis hatasına çevrilmedi');
    assert((error as ReceiptAnalysisError).code === 'SERVICE_UNAVAILABLE', 'Parser hata kodu yanlış');
  }
};

const testCallerCancellationIsNotTimeout = async () => {
  const abortError = new Error('aborted');
  abortError.name = 'AbortError';
  mockFetch.mockRejectedValueOnce(abortError);
  const controller = new AbortController();
  controller.abort();
  try {
    await analyzeReceipt('file://test.jpg', false, controller.signal);
    assert(false, 'İptal edilen istek başarılı sayıldı');
  } catch (error) {
    assert(error instanceof ReceiptAnalysisError, 'İptal kontrollü hataya dönüşmedi');
    assert((error as ReceiptAnalysisError).code === 'CANCELLED', 'Kullanıcı iptali timeout sayıldı');
  }
};

const run = async () => {
  await testMissingImageUri();
  await testSuccess();
  await test413Error();
  await testMissingProviderError();
  await testMalformedSuccessUsesRuntimeParser();
  await testCallerCancellationIsNotTimeout();
  console.log('Tüm ağ katmanı testleri geçti');
};

run().catch(console.error);
