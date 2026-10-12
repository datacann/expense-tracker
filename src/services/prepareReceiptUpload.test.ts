import { calculateTargetDimensions, validateUploadFileSize, RECEIPT_UPLOAD_CONFIG } from './prepareReceiptUpload';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const testDimensions = () => {
  // Sınırın altında (değişmemeli)
  const small = calculateTargetDimensions({ width: 1000, height: 800 });
  assert(small.width === 1000 && small.height === 800, 'Küçük resim boyutları değişti');

  // Sınırın üstünde (oran korunmalı)
  const large = calculateTargetDimensions({ width: 6000, height: 3000 });
  assert(large.width === 3000 && large.height === 1500, 'Oran korunmadı');

  // Dikey (yüksek) sınır üstü
  const tall = calculateTargetDimensions({ width: 1000, height: 6000 });
  assert(tall.width === 500 && tall.height === 3000, 'Dikey oran korunmadı');
  
  console.log('✓ Boyut hesaplama testleri geçti');
};

const testFileSize = () => {
  // Sınırın altında
  validateUploadFileSize(5 * 1024 * 1024);
  
  // Sınırın üstünde
  try {
    validateUploadFileSize(9 * 1024 * 1024);
    assert(false, 'Boyut hatası fırlatılmalıydı');
  } catch (e: any) {
    assert(e.message.includes('büyük'), 'Hata mesajı yanlış');
  }
  
  console.log('✓ Dosya boyutu doğrulama testleri geçti');
};

try {
  testDimensions();
  testFileSize();
  console.log('Tüm hazırlık yardımcıları testleri başarıyla tamamlandı.');
} catch (e) {
  console.error(e);
  process.exit(1);
}
