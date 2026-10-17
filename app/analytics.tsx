import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { calculateMonthlyStats, getPreviousMonth } from '../src/utils/expenseAnalytics';
import { formatCurrency } from '../src/utils/money';
import { formatLocalDate } from '../src/utils/localDate';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../src/components/AdBanner';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const BAR_COLORS = ['#07865E', '#E8B13F', '#4285EA', '#8B50D9', '#9CA8B5'];

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
  const [selectedYear, selectedMonth] = currentMonth.split('-').map(Number);

  return (
    <SafeAreaView style={styles.container} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
      <View style={styles.titleRow}><Text style={styles.title}>Analiz</Text><View style={styles.monthPicker}><TouchableOpacity onPress={() => setCurrentMonth(prevMonth)}><Ionicons name="chevron-back" size={17} color={COLORS.text} /></TouchableOpacity><Text style={styles.monthText}>{MONTHS[selectedMonth - 1]} {selectedYear}</Text><TouchableOpacity onPress={() => canGoNext && setCurrentMonth(nextMonth)} disabled={!canGoNext}><Ionicons name="chevron-down" size={17} color={canGoNext ? COLORS.text : COLORS.border} /></TouchableOpacity></View></View>

      <Text style={styles.totalLabel}>Toplam harcama</Text><Text style={styles.total}>{formatCurrency(stats.total)}</Text>
      {hasPrev && <Text style={styles.diff}>{MONTHS[selectedMonth === 1 ? 11 : selectedMonth - 2]}: {formatCurrency(prevStats.total)}  ·  <Text style={diff <= 0 ? styles.good : styles.bad}>{formatCurrency(Math.abs(diff))} {diff <= 0 ? 'daha az' : 'daha fazla'}</Text></Text>}

      <View style={styles.stackedBar}>{stats.summaries.slice(0, 5).map((s, index) => <View key={s.categoryId} style={{ flex: s.amountMinor || 1, backgroundColor: BAR_COLORS[index], height: 28 }} />)}</View>
      <View style={styles.percentRow}>{stats.summaries.slice(0, 5).map((s) => <Text key={s.categoryId} style={styles.percent}>%{stats.total ? Math.round(s.amountMinor / stats.total * 100) : 0}</Text>)}</View>

      <View style={styles.categoryList}>
      {stats.summaries.map((s, index) => (
        <TouchableOpacity key={s.categoryId} style={styles.row} onPress={() => router.push({ pathname: '/expenses/category-detail', params: { categoryId: s.categoryId, month: currentMonth } })}>
          <View style={styles.categoryInfo}><View style={[styles.dot, { backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }]} /><Text style={styles.categoryName}>{s.name}</Text></View>
          <Text style={styles.categoryAmount}>{formatCurrency(s.amountMinor)}</Text><Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
      </View>
      {stats.summaries.length === 0 && <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Bu ay veri yok</Text><Text style={styles.center}>Harcama eklediğinde kategori dağılımı burada görünecek.</Text></View>}
      <TouchableOpacity style={styles.suggestionButton} onPress={() => router.push({ pathname: '/suggestions', params: { month: currentMonth } })}>
        <View style={styles.suggestionTitleRow}><Ionicons name="stats-chart" size={23} color={COLORS.primary} /><Text style={styles.suggestionText}>Nereden tasarruf edebilirim?</Text><Text style={styles.premiumBadge}>Premium</Text></View>
        <Text style={styles.suggestionCaption}>Harcamalarına göre kişisel öneriler keşfet.</Text>
        <View style={styles.suggestionCta}><Text style={styles.suggestionCtaText}>Önerileri gör</Text></View>
      </TouchableOpacity>
    </ScrollView><AdBanner /></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: SPACING.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  monthPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 10, height: 42, backgroundColor: COLORS.card },
  monthText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  totalLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' }, total: { color: COLORS.text, fontSize: 37, fontWeight: '900', marginTop: 7 },
  diff: { color: COLORS.textSecondary, fontWeight: '500', marginTop: 3 }, good: { color: '#087B54', fontWeight: '800' }, bad: { color: COLORS.error, fontWeight: '800' },
  stackedBar: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginTop: 22, backgroundColor: COLORS.border },
  percentRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }, percent: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  categoryList: { marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderColor: COLORS.border },
  categoryInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, dot: { width: 13, height: 13, borderRadius: 7 }, categoryName: { color: COLORS.text, fontWeight: '600' }, categoryAmount: { color: COLORS.text, fontWeight: 'bold', marginRight: 8 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }, emptyTitle: { color: COLORS.text, fontWeight: 'bold' }, center: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, fontSize: 12 },
  suggestionButton: { backgroundColor: COLORS.accent, padding: 16, borderRadius: RADIUS.md, marginTop: 22 },
  suggestionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, suggestionText: { color: COLORS.text, fontWeight: '800', flex: 1 }, premiumBadge: { color: '#7A5A00', backgroundColor: '#FFE59A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, fontSize: 10, fontWeight: '700' },
  suggestionCaption: { color: COLORS.textSecondary, fontSize: 12, marginLeft: 31, marginTop: 5 }, suggestionCta: { height: 44, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, suggestionCtaText: { color: '#FFFFFF', fontWeight: '800' },
});
