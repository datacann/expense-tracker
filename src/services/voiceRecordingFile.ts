import { Directory, File, Paths } from 'expo-file-system';

const getVoiceDirectory = () => new Directory(Paths.cache, 'voice-recordings');

export const copyVoiceRecording = async (sourceUri: string): Promise<string> => {
  const directory = getVoiceDirectory();
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(sourceUri);
  if (!source.exists) throw new Error('Ses kaydı dosyası bulunamadı');
  const extension = source.extension || '.m4a';
  const destination = new File(
    directory,
    `voice-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
  await source.copy(destination);
  return destination.uri;
};

export const cleanupVoiceRecording = (uri: string | undefined): void => {
  if (!uri) return;
  const directory = getVoiceDirectory();
  if (!uri.startsWith(`${directory.uri}/`) && !uri.startsWith(directory.uri)) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Geçici ses kaydı temizlenemedi:', error);
  }
};
