import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { limitRepository } from '../src/storage/limitRepository';
import { buildSavingsSummary, requestSavingsSuggestions, savingsSnapshotKey, SuggestionResponse } from '../src/services/savingsSuggestions';
import { formatCurrency, toMinorUnits } from '../src/utils/money';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../src/providers/SubscriptionProvider';

export default function Suggestions() {
  const { month = '' } = useLocalSearchParams<{ month?: string }>();
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const { state, setMonthlyLimit } = useExpense();
  const [limit, setLimit] = useState<number | null>(null);
  const [result, setResult] = useState<SuggestionResponse | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [limitSaving, setLimitSaving] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => { void limitRepository.getLimit(month).then((value) => { setLimit(value); setLimitInput(value ? String(value / 100).replace('.', ',') : ''); }).catch(() => setError('Aylık limit okunamadı.')); }, [month]);
  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      router.replace({ pathname: '/premium', params: { returnTo: 'suggestions', month } });
    }
  }, [isPremium, month, router, subscriptionLoading]);
  useEffect(() => () => requestRef.current?.abort(), []);
  const summary = useMemo(() => buildSavingsSummary(state.expenses, month, limit), [state.expenses, month, limit]);
  const currentKey = savingsSnapshotKey(summary);
  const stale = resultKey !== null && resultKey !== currentKey;

  const generate = async () => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setLoading(true); setError(null);
    try { const next = await requestSavingsSuggestions(summary, controller.signal); setResult(next); setResultKey(currentKey); }
    catch (caught) { if (!(caught instanceof Error && caught.name === 'AbortError')) { const message = caught instanceof Error ? caught.message : ''; setError(message.includes('timed out') || message.includes('fetch failed') || message.includes('Network') ? 'Öneri servisine şu anda ulaşılamıyor. Bağlantını kontrol edip tekrar dene.' : message || 'Öneriler alınamadı.'); } }
    finally { if (requestRef.current === controller) { requestRef.current = null; setLoading(false); } }
  };

  if (subscriptionLoading || !isPremium) {
    return <View style={styles.gateLoading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.notice}>Premium erişimi kontrol ediliyor…</Text></View>;
  }

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.titleRow}><View style={styles.titleIcon}><Ionicons name="sparkles" size={23} color={COLORS.primary} /></View><View><Text style={styles.title}>Tasarruf önerileri</Text><Text style={styles.month}>{month}</Text></View></View>
    <View style={styles.summary}><Text style={styles.summaryLabel}>Bu ay harcanan</Text><Text style={styles.summaryValue}>{formatCurrency(summary.totalMinor)}</Text><View style={styles.divider} /><Text style={styles.limitTitle}>Aylık harcama limiti</Text><View style={styles.limitRow}><TextInput value={limitInput} onChangeText={setLimitInput} placeholder="Örn. 10000" keyboardType="decimal-pad" style={styles.limitInput} placeholderTextColor={COLORS.textSecondary} /><TouchableOpacity style={styles.limitButton} disabled={limitSaving} onPress={async () => { try { const value = toMinorUnits(limitInput); setLimitSaving(true); await setMonthlyLimit(month, value); setLimit(value); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Limit kaydedilemedi.'); } finally { setLimitSaving(false); } }}><Text style={styles.limitButtonText}>{limitSaving ? '...' : limit ? 'Güncelle' : 'Belirle'}</Text></TouchableOpacity></View>{limit ? <Text style={styles.activeLimit}>Mevcut limit: {formatCurrency(limit)}</Text> : null}</View>
    <Text style={styles.notice}>Bu hesap bir tahmindir; mevcut harcamalarını değiştirmez.</Text>
    {stale && <Text style={styles.warning}>Harcama veya limit değişti. Önerileri yenilemelisin.</Text>}
    {summary.recordCount === 0 ? <Text style={styles.empty}>Bu ay öneri oluşturmak için harcama bulunmuyor.</Text> : null}
    {error ? <View style={styles.errorCard}><Ionicons name="cloud-offline-outline" size={22} color={COLORS.error} /><Text style={styles.error}>{error}</Text></View> : null}
    {loading ? <ActivityIndicator color={COLORS.primary} /> : (
      <TouchableOpacity style={styles.button} onPress={() => void generate()} disabled={summary.recordCount === 0}><Text style={styles.buttonText}>{result ? 'Önerileri Yenile' : 'Önerileri Oluştur'}</Text></TouchableOpacity>
    )}
    {!stale && result?.message ? <Text style={styles.empty}>{result.message}</Text> : null}
    {!stale && result?.suggestions.map((item) => <View key={item.categoryId} style={styles.card}>
      <Text style={styles.cardTitle}>{item.categoryName}</Text><Text>{item.basis}</Text><Text>{item.change}</Text>
      <Text style={styles.saving}>%{item.reductionPercent} daha az → yaklaşık {formatCurrency(item.estimatedSavingMinor)}</Text>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  gateLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, titleIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, title: { fontSize: 24, fontWeight: '800', color: COLORS.text }, month: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  summary: { backgroundColor: COLORS.card, padding: 18, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border }, summaryLabel: { color: COLORS.textSecondary, fontSize: 12 }, summaryValue: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginTop: 3 }, divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 }, limitTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 8 }, limitRow: { flexDirection: 'row', gap: 8 }, limitInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, color: COLORS.text, backgroundColor: COLORS.surfaceMuted }, limitButton: { height: 44, minWidth: 86, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, limitButtonText: { color: '#FFFFFF', fontWeight: '700' }, activeLimit: { color: COLORS.primary, fontSize: 11, marginTop: 7, fontWeight: '600' },
  notice: { color: COLORS.textSecondary, marginVertical: SPACING.md, fontSize: 12, lineHeight: 18 }, warning: { color: COLORS.error, marginBottom: SPACING.sm },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.md }, errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, backgroundColor: '#FFF6F5', borderRadius: 10, marginBottom: 12 }, error: { flex: 1, color: COLORS.error, fontSize: 12, lineHeight: 17 }, button: { backgroundColor: COLORS.accent, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.md }, buttonText: { color: COLORS.primary, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: 6 }, cardTitle: { color: COLORS.text, fontWeight: 'bold' }, saving: { color: COLORS.primary, fontWeight: 'bold' },
});
