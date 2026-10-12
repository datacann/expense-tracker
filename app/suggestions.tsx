import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { limitRepository } from '../src/storage/limitRepository';
import { buildSavingsSummary, requestSavingsSuggestions, savingsSnapshotKey, SuggestionResponse } from '../src/services/savingsSuggestions';
import { formatCurrency } from '../src/utils/money';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';

export default function Suggestions() {
  const { month = '' } = useLocalSearchParams<{ month?: string }>();
  const { state } = useExpense();
  const [limit, setLimit] = useState<number | null>(null);
  const [result, setResult] = useState<SuggestionResponse | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => { void limitRepository.getLimit(month).then(setLimit).catch(() => setError('Aylık limit okunamadı.')); }, [month]);
  useEffect(() => () => requestRef.current?.abort(), []);
  const summary = useMemo(() => buildSavingsSummary(state.expenses, month, limit), [state.expenses, month, limit]);
  const currentKey = savingsSnapshotKey(summary);
  const stale = resultKey !== null && resultKey !== currentKey;

  const generate = async () => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setLoading(true); setError(null);
    try { const next = await requestSavingsSuggestions(summary, controller.signal); setResult(next); setResultKey(currentKey); }
    catch (caught) { if (!(caught instanceof Error && caught.name === 'AbortError')) setError(caught instanceof Error ? caught.message : 'Öneriler alınamadı.'); }
    finally { if (requestRef.current === controller) { requestRef.current = null; setLoading(false); } }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Tasarruf önerileri · {month}</Text>
    <View style={styles.summary}><Text>Harcama: {formatCurrency(summary.totalMinor)}</Text><Text>Limit: {limit ? formatCurrency(limit) : 'Belirlenmedi'}</Text></View>
    <Text style={styles.notice}>Bu hesap bir tahmindir; mevcut harcamalarını değiştirmez.</Text>
    {stale && <Text style={styles.warning}>Harcama veya limit değişti. Önerileri yenilemelisin.</Text>}
    {summary.recordCount === 0 ? <Text style={styles.empty}>Bu ay öneri oluşturmak için harcama bulunmuyor.</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
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
  container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: SPACING.md }, title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  summary: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, gap: 6 }, notice: { color: COLORS.textSecondary, marginVertical: SPACING.md }, warning: { color: COLORS.error, marginBottom: SPACING.sm },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.md }, error: { color: COLORS.error, marginVertical: SPACING.md }, button: { backgroundColor: COLORS.accent, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.md }, buttonText: { color: COLORS.primary, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: 6 }, cardTitle: { color: COLORS.text, fontWeight: 'bold' }, saving: { color: COLORS.primary, fontWeight: 'bold' },
});
