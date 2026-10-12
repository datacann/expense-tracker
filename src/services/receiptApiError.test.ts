import { parseReceiptApiError } from './receiptApiError';

const error = parseReceiptApiError({
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Fiş analiz servisi şu anda kullanılamıyor.',
    requestId: 'req_missing_provider',
  },
});

if (!error) throw new Error('Servis hata gövdesi ayrıştırılamadı');
if (error.code !== 'SERVICE_UNAVAILABLE') throw new Error('Servis hata kodu korunmadı');
if (error.message !== 'Fiş analiz servisi şu anda kullanılamıyor.') {
  throw new Error('Anlaşılır servis mesajı korunmadı');
}

console.log('Eksik sağlayıcı mobil hata testi geçti');
