import { Alert, Linking } from 'react-native';

export const openExternalLink = async (url: string, label: string): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('URL desteklenmiyor');
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Bağlantı açılamadı',
      `${label} şu anda açılamıyor. İnternet bağlantını kontrol edip tekrar dene.`,
    );
  }
};
