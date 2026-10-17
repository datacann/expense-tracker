import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { isReceiptCacheFile } from '../utils/receiptFileOwnership';
import { Alert, Linking } from 'react-native';
import { resolvePermissionAction } from './receiptPermission';

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

const handlePermissionDenied = async (permissionName: string) => {
  Alert.alert(
    'İzin Gerekli',
    `${permissionName} erişimi reddedildi. Uygulamayı kullanabilmek için ayarlardan izin vermeniz gerekmektedir.`,
    [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ayarları Aç', onPress: () => Linking.openSettings() }
    ]
  );
};

export const pickImage = async (useCamera: boolean): Promise<string | null> => {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    // Sistem kırpma ekranı uzun fişlerin üstünü/altını kesebiliyor.
    // Orijinal kadrajı koru; yalnızca yükleme öncesi boyutlandırma uygulanır.
    allowsEditing: false,
    quality: 0.8,
  };

  if (useCamera) {
    const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();

    const permissionAction = resolvePermissionAction(status, canAskAgain);
    if (permissionAction === 'launch') {
      const result = await ImagePicker.launchCameraAsync(options);
      return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
    }

    if (permissionAction === 'settings') {
      await handlePermissionDenied('Kamera');
      return null;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync(options);
      return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
    }

    if (!permission.canAskAgain) {
      await handlePermissionDenied('Kamera');
    }
    return null;
  } else {
    // MediaLibrary permissions are mostly not needed for launchImageLibraryAsync on modern Android/iOS
    // unless you want to browse the full library with a custom UI. 
    // launchImageLibraryAsync uses system picker which handles its own permissions.
    try {
      const result = await ImagePicker.launchImageLibraryAsync(options);
      return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
    } catch (e) {
      // Fallback for older versions or specific platform restrictions
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permissionAction = resolvePermissionAction(
        currentPermission.status,
        currentPermission.canAskAgain,
      );
      if (permissionAction === 'settings') {
        await handlePermissionDenied('Galeri');
        return null;
      }
      const permission = permissionAction === 'request'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : currentPermission;
      if (!permission.granted) {
        if (!permission.canAskAgain) await handlePermissionDenied('Galeri');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync(options);
      return result.canceled ? null : copyToReceiptCache(result.assets[0].uri);
    }
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
