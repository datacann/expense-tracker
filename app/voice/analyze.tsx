import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { formatLocalDate } from '../../src/utils/localDate';
import { cleanupVoiceRecording } from '../../src/services/voiceRecordingFile';
import { toMinorUnits } from '../../src/utils/money';

type VoiceResult = { description: string; amountMinor: number; categoryId: string; transcript?: string };
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;

export default function VoiceAnalyze() {
  const params = useLocalSearchParams<{ uri?: string | string[] }>();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const router = useRouter();
  const { addExpense } = useExpense();
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const requestRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    if (!uri) return setError('Ses kaydı bulunamadı. Lütfen yeniden kayıt alın.');
    if (!API_BASE_URL) return setError('API adresi yapılandırılmamış.');

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', new File(uri) as any);
      const response = await fetch(`${API_BASE_URL}/v1/voice/analyze`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof body?.error?.message === 'string' ? body.error.message : `Sunucu hatası (${response.status})`);
      }
      const analysis = body?.analysis;
      if (typeof analysis?.description !== 'string' || !analysis.description.trim()
        || !Number.isInteger(analysis?.amountMinor) || analysis.amountMinor <= 0
        || typeof analysis?.categoryId !== 'string' || !analysis.categoryId) {
        throw new Error('Analiz servisi geçersiz bir cevap döndürdü.');
      }
      setResult({
        description: analysis.description.trim(),
        amountMinor: analysis.amountMinor,
        categoryId: analysis.categoryId,
        transcript: typeof body?.transcript === 'string' ? body.transcript : undefined,
      });
      setAmountInput((analysis.amountMinor / 100).toFixed(2).replace('.', ','));
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'Ses analizi yapılamadı.');
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, [uri]);

  useEffect(() => {
    void analyze();
    return () => requestRef.current?.abort();
  }, [analyze]);

  const deleteOwnedRecording = () => {
    cleanupVoiceRecording(uri);
  };

  const save = async () => {
    if (!result || saveLock.current) return;
    const description = result.description.trim();
    if (!description) {
      Alert.alert('Eksik bilgi', 'Açıklama boş olamaz.');
      return;
    }

    let amountMinor: number;
    try {
      amountMinor = toMinorUnits(amountInput.trim());
    } catch (validationError) {
      Alert.alert('Geçersiz tutar', validationError instanceof Error ? validationError.message : 'Geçerli bir tutar girin.');
      return;
    }

    saveLock.current = true;
    setSaving(true);
    try {
      const now = new Date();
      await addExpense({
        id: uuidv4(),
        date: formatLocalDate(now),
        currency: 'TRY',
        source: 'voice',
        items: [{ id: uuidv4(), description, amountMinor, categoryId: result.categoryId }],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      deleteOwnedRecording();
      router.replace('/expenses');
    } catch (saveError) {
      Alert.alert('Kayıt başarısız', saveError instanceof Error ? saveError.message : 'Harcama kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const cancel = () => {
    requestRef.current?.abort();
    deleteOwnedRecording();
    router.back();
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Ses kaydı analiz ediliyor…</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={cancel}><Text style={styles.secondaryText}>İptal</Text></TouchableOpacity>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.title}>Analiz yapılamadı</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => void analyze()}><Text style={styles.buttonText}>Tekrar Dene</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={cancel}><Text style={styles.secondaryText}>Vazgeç</Text></TouchableOpacity>
        </View>
      ) : result ? (
        <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Analiz Sonucu</Text>
          {result.transcript ? <Text style={styles.transcript}>Algılanan: “{result.transcript}”</Text> : null}
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            value={result.description}
            onChangeText={(description) => setResult((current) => current ? { ...current, description } : current)}
            placeholder="Örn: Yemek"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            editable={!saving}
          />
          <Text style={styles.label}>Tutar (TL)</Text>
          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0,00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.input, styles.amountInput]}
            editable={!saving}
          />
          <TouchableOpacity style={styles.confirmButton} onPress={() => void save()} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Kaydediliyor…' : 'Onayla ve Kaydet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={cancel} disabled={saving}><Text style={styles.secondaryText}>Vazgeç</Text></TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'center' },
  center: { alignItems: 'center' },
  statusText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md },
  text: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 4, marginTop: SPACING.sm },
  input: { color: COLORS.text, backgroundColor: COLORS.background, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, height: 46 },
  amountInput: { color: COLORS.primary, fontSize: 22, fontWeight: 'bold' },
  transcript: { color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: SPACING.md },
  errorText: { color: COLORS.error, marginBottom: SPACING.md },
  confirmButton: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.sm },
  secondaryButton: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryText: { color: COLORS.textSecondary, fontWeight: 'bold' },
});
