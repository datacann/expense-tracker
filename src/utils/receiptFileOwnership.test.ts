import { isReceiptCacheFile } from './receiptFileOwnership';

const receiptsDirectory = 'file:///data/user/0/app/cache/receipts';

if (!isReceiptCacheFile('file:///data/user/0/app/cache/receipts/receipt-1.jpg', receiptsDirectory)) {
  throw new Error('Uygulamanın fiş cache dosyası tanınmadı');
}

if (isReceiptCacheFile('file:///data/user/0/app/cache/receipts-evil/original.jpg', receiptsDirectory)) {
  throw new Error('Benzer adlı komşu klasör uygulama cache alanı sayıldı');
}

if (isReceiptCacheFile('file:///storage/emulated/0/DCIM/original.jpg', receiptsDirectory)) {
  throw new Error('Galeri orijinali uygulama cache alanı sayıldı');
}

if (isReceiptCacheFile(receiptsDirectory, receiptsDirectory)) {
  throw new Error('Klasörün kendisi silinebilir dosya sayıldı');
}

console.log('Receipt file ownership tests passed');
