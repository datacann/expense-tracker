import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { isReceiptCacheFile } from '../utils/receiptFileOwnership';

const getReceiptsDirectory = () => new Directory(Paths.cache, 'receipts');

const copyToReceiptCache = async (sourceUri: string): Promise<string> => {
  const directory = getReceiptsDirectory();
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const destination = new File(
    directory,
    `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
  await source.copy(destination);
  return destination.uri;
};

export const pickImage = async (useCamera: boolean): Promise<string | null> => {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  };

  if (useCamera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
    const result = await ImagePicker.launchCameraAsync(options);
    return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync(options);
    return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
  }
};

export const cleanupReceiptFile = async (uri: string | undefined | null) => {
  if (!uri) return;

  const receiptsDirectory = getReceiptsDirectory();
  if (!isReceiptCacheFile(uri, receiptsDirectory.uri)) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.error('Fotoğraf temizlenemedi:', e);
  }
};
