import React, { useEffect, useRef } from 'react';
import { Alert, AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { COLORS, SPACING } from '../../src/constants/theme';
import { copyVoiceRecording } from '../../src/services/voiceRecordingFile';
import { useSubscription } from '../../src/providers/SubscriptionProvider';

export default function VoiceRecord() {
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (!subscriptionLoading && !isPremium) router.replace({ pathname: '/premium', params: { returnTo: 'voice' } });
  }, [isPremium, subscriptionLoading, router]);

  const stopRecording = async (cancel = false) => {
    if (!recorderState.isRecording || stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('Ses dosyası oluşturulamadı');

      if (cancel || recorderState.durationMillis < 1000) {
        const file = new File(uri);
        if (file.exists) file.delete();
        if (!cancel) Alert.alert('Kısa Kayıt', 'Kayıt çok kısa, lütfen tekrar deneyin.');
        return;
      }

      // Recorder aynı geçici URI'yi sonraki kayıtlarda yeniden kullanabilir.
      // Analize her seferinde o ana ait benzersiz ve değişmez bir kopya gönder.
      const recordingUri = await copyVoiceRecording(uri);
      router.push({ pathname: '/voice/analyze', params: { uri: recordingUri } });
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      Alert.alert('Hata', 'Ses kaydı tamamlanamadı.');
    } finally {
      stoppingRef.current = false;
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && recorderState.isRecording) void stopRecording(true);
    });
    return () => subscription.remove();
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    try {
      const currentPermission = await getRecordingPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert('İzin Gerekli', 'Mikrofon iznini Ayarlar’dan açmanız gerekiyor.', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
          ]);
        } else {
          Alert.alert('İzin Reddedildi', 'Ses kaydı için mikrofon izni gerekiyor.');
        }
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 30 });
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', 'Kayıt başlatılamadı.');
    }
  };

  const durationSec = Math.min(30, Math.floor(recorderState.durationMillis / 1000));

  if (subscriptionLoading || !isPremium) return <View style={styles.container}><View style={styles.centerBox}><Text style={styles.subtitle}>Premium erişimi kontrol ediliyor…</Text></View></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesle Harcama Ekle</Text>
      <Text style={styles.subtitle}>Örneğin “Bugün markete 150 lira verdim” deyin.</Text>
      <View style={styles.centerBox}>
        <Text style={styles.timerText}>{durationSec}s / 30s</Text>
        <TouchableOpacity
          style={[styles.micButton, recorderState.isRecording && styles.recording]}
          onPress={recorderState.isRecording ? () => void stopRecording(false) : startRecording}
          disabled={stoppingRef.current}
        >
          <Text style={styles.buttonText}>{recorderState.isRecording ? 'Durdur' : 'Kaydı Başlat'}</Text>
        </TouchableOpacity>
        {recorderState.isRecording && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => void stopRecording(true)}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.xl },
  subtitle: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  centerBox: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  timerText: { fontSize: 40, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.lg },
  micButton: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  recording: { backgroundColor: COLORS.error },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { padding: SPACING.md, marginTop: SPACING.md },
  cancelText: { color: COLORS.error, fontWeight: 'bold' },
});
