/**
 * Fiş fotoğrafı yükleme hazırlığı için yapılandırma sabitleri.
 * Gerçek cihaz ve fiş testlerine göre tek bir yerden ayarlanabilir.
 */
import * as ImageManipulator from 'expo-image-manipulator';

export const RECEIPT_UPLOAD_CONFIG = {
  MAX_LONG_EDGE_PX: 3000,
  JPEG_QUALITY: 0.9,
  MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024,
  OUTPUT_EXTENSION: '.jpg',
};

export const prepareReceiptImage = async (uri: string): Promise<string> => {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: RECEIPT_UPLOAD_CONFIG.MAX_LONG_EDGE_PX } }],
    { compress: RECEIPT_UPLOAD_CONFIG.JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult.uri;
};

// ... mevcut fonksiyonlar (calculateTargetDimensions, validateUploadFileSize) ...

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Görüntü oranını bozmadan ve büyütme (upscale) yapmadan yeni boyutları hesaplar.
 */
export const calculateTargetDimensions = (
  dimensions: ImageDimensions,
  maxLongEdge = RECEIPT_UPLOAD_CONFIG.MAX_LONG_EDGE_PX,
): ImageDimensions => {
  const { width, height } = dimensions;

  if (width <= 0 || height <= 0) {
    throw new Error('Geçersiz görsel boyutları');
  }

  const longEdge = Math.max(width, height);

  // Eğer uzun kenar zaten sınırdan küçük veya eşitse boyutları koru (büyütme yapma)
  if (longEdge <= maxLongEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

/**
 * Dosya boyutunun sınırı aşıp aşmadığını kontrol eder.
 */
export const validateUploadFileSize = (
  fileSizeBytes: number,
  maxBytes = RECEIPT_UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES,
): void => {
  if (fileSizeBytes > maxBytes) {
    const sizeMiB = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    const maxMiB = (maxBytes / (1024 * 1024)).toFixed(0);
    throw new Error(`Fiş fotoğrafı çok büyük (${sizeMiB} MiB). İzin verilen maksimum boyut ${maxMiB} MiB'dır.`);
  }
};
