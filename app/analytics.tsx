import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { calculateMonthlyStats, getPreviousMonth } from '../src/utils/expenseAnalytics';
import { formatCurrency } from '../src/utils/money';
import { formatLocalDate } from '../src/utils/localDate';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';

export default function Analytics() {
  const router = useRouter();
  const { state } = useExpense();
  const [currentMonth, setCurrentMonth] = useState(() => formatLocalDate(new Date()).substring(0, 7));
  
  const stats = calculateMonthlyStats(state.expenses, currentMonth);
  const prevMonth = getPreviousMonth(currentMonth);
  const prevStats = calculateMonthlyStats(state.expenses, prevMonth);
  
  const diff = stats.total - prevStats.total;
  const hasPrev = prevStats.total > 0;
  const percentChange = hasPrev ? ((diff / prevStats.total) * 100).toFixed(0) : null;
  const currentCalendarMonth = formatLocalDate(new Date()).substring(0, 7);
  const nextMonth = (() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  })();
  const canGoNext = nextMonth <= currentCalendarMonth;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.monthPicker}>
        <TouchableOpacity style={styles.monthButton} onPress={() => setCurrentMonth(prevMonth)}><Text style={styles.monthButtonText}>‹</Text></TouchableOpacity>
        <View style={styles.monthCenter}><Text style={styles.eyebrow}>SEÇİLİ AY</Text><Text style={styles.monthText}>{currentMonth}</Text></View>
        <TouchableOpacity style={[styles.monthButton, !canGoNext && styles.disabled]} onPress={() => canGoNext && setCurrentMonth(nextMonth)} disabled={!canGoNext}><Text style={styles.monthButtonText}>›</Text></TouchableOpacity>
      </View>

      <View style={styles.totalCard}><Text style={styles.totalLabel}>Toplam harcama</Text><Text style={styles.total}>{formatCurrency(stats.total)}</Text></View>
      
      <View style={styles.comparison}>
        <Text style={styles.comparisonLabel}>Önceki ay ({prevMonth})</Text>
        <Text style={styles.comparisonValue}>{formatCurrency(prevStats.total)}</Text>
        <Text style={styles.diff}>
          Fark: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
          {percentChange ? ` (%${percentChange})` : ''}
        </Text>
      </View>

      <Text style={styles.subtitle}>Kategori dağılımı</Text>
      {stats.summaries.map(s => (
        <View key={s.categoryId} style={styles.row}>
          <View style={styles.categoryInfo}><Text style={styles.categoryName}>{s.name}</Text><Text style={styles.categoryPercent}>%{stats.total ? Math.round(s.amountMinor / stats.total * 100) : 0}</Text></View>
          <Text style={styles.categoryAmount}>{formatCurrency(s.amountMinor)}</Text>
        </View>
      ))}
      {stats.summaries.length === 0 && <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Bu ay veri yok</Text><Text style={styles.center}>Harcama eklediğinde kategori dağılımı burada görünecek.</Text></View>}
      {__DEV__ && <TouchableOpacity style={styles.suggestionButton} onPress={() => router.push({ pathname: '/suggestions', params: { month: currentMonth } })}>
        <Text style={styles.suggestionText}>Nereden tasarruf edebilirim?</Text>
      </TouchableOpacity>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  monthButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  monthButtonText: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  monthCenter: { alignItems: 'center' }, eyebrow: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }, monthText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginTop: 2 }, disabled: { opacity: 0.35 },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.lg },
  totalLabel: { color: COLORS.accent, fontSize: 13 }, total: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold', marginTop: SPACING.xs },
  comparison: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.md },
  comparisonLabel: { color: COLORS.textSecondary, fontSize: 12 }, comparisonValue: { color: COLORS.text, fontSize: 17, fontWeight: 'bold', marginTop: 3 }, diff: { color: COLORS.textSecondary, fontWeight: '600', marginTop: SPACING.sm },
  subtitle: { color: COLORS.text, fontSize: 17, fontWeight: 'bold', marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xs },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, categoryName: { color: COLORS.text, fontWeight: '600' }, categoryPercent: { color: COLORS.textSecondary, fontSize: 11 }, categoryAmount: { color: COLORS.text, fontWeight: 'bold' },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }, emptyTitle: { color: COLORS.text, fontWeight: 'bold' }, center: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, fontSize: 12 },
  suggestionButton: { backgroundColor: COLORS.accent, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.md }, suggestionText: { color: COLORS.primary, fontWeight: 'bold' },
});
