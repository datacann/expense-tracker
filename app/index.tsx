import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { calculateMonthlyStats, getPreviousMonth } from '../src/utils/expenseAnalytics';
import { formatCurrency, toMinorUnits } from '../src/utils/money';
import { formatLocalDate } from '../src/utils/localDate';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { ExpenseListItem } from '../src/components/ExpenseListItem';
import { calculateBudgetStatus } from '../src/utils/budget';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function Index() {
  const { state, setMonthlyLimit, deleteMonthlyLimit } = useExpense();
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [limitSaving, setLimitSaving] = useState(false);
  
  const currentMonth = formatLocalDate(new Date()).substring(0, 7);
  const [currentYearNumber, currentMonthNumber] = currentMonth.split('-').map(Number);
  const currentMonthLabel = `${MONTHS[currentMonthNumber - 1]} ${currentYearNumber}`;
  const prevMonth = getPreviousMonth(currentMonth);

  const { total, summaries } = calculateMonthlyStats(state.expenses, currentMonth);
  const monthlyLimit = state.monthlyLimit;
  const budget = monthlyLimit ? calculateBudgetStatus(total, monthlyLimit) : null;
  const prevStats = calculateMonthlyStats(state.expenses, prevMonth);

  // Önceki ay karşılaştırması
  const diff = total - prevStats.total;
  const hasPrev = prevStats.total > 0;
  const percentChange = hasPrev ? Math.round(Math.abs(diff) / prevStats.total * 100) : null;
  const isLess = diff < 0;

  // Son harcamalar (en fazla 3)
  const recentExpenses = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greetingTitle}>{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.text} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Bu ay harcanan</Text>
        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
        {monthlyLimit ? (
          <>
            <View style={styles.limitNumbers}>
              <View><Text style={styles.limitCaption}>Limit</Text><Text style={styles.limitValue}>{formatCurrency(monthlyLimit)}</Text></View>
              <View style={styles.limitRight}><Text style={styles.limitCaption}>Kalan</Text><Text style={styles.limitValue}>{formatCurrency(budget?.remainingMinor ?? 0)}</Text></View>
            </View>
            <TouchableOpacity onPress={() => { setLimitInput((monthlyLimit / 100).toFixed(2).replace('.', ',')); setLimitModalVisible(true); }}>
              <View style={styles.budgetProgress}><View style={[styles.budgetProgressFill, { width: `${budget?.progressPercent ?? 0}%` }]} /></View>
              <Text style={styles.progressText}>%{budget?.progressPercent ?? 0}</Text>
            </TouchableOpacity>
            <View style={styles.hiddenActions}>
              <TouchableOpacity onPress={() => Alert.alert('Limiti kaldır', 'Bu aya ait limit kaldırılsın mı?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Kaldır', style: 'destructive', onPress: () => void deleteMonthlyLimit(currentMonth).catch(() => Alert.alert('Hata', 'Limit kaldırılamadı.')) }])}><Text style={styles.removeText}>Limiti kaldır</Text></TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.setLimitButton} onPress={() => { setLimitInput(''); setLimitModalVisible(true); }}>
            <Text style={styles.setLimitText}>Aylık limit belirle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionRow}>
        <QuickAction icon="add-circle-outline" label="Manuel" onPress={() => router.push('/expenses/new')} />
        <QuickAction icon="camera-outline" label="Fiş tara" onPress={() => router.push('/receipts/new')} />
        <QuickAction icon="mic-outline" label="Sesle" premium={!isPremium} disabled={subscriptionLoading} onPress={() => router.push(isPremium ? '/voice/new' : { pathname: '/premium', params: { returnTo: 'voice' } })} />
      </View>

      {/* Son Harcamalar */}
      <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
        <Text style={styles.sectionTitle}>Son harcamalar</Text>
        <TouchableOpacity onPress={() => router.push('/expenses')}>
          <Text style={styles.seeAll}>Tümünü gör &gt;</Text>
        </TouchableOpacity>
      </View>

      {recentExpenses.map((expense) => (
        <ExpenseListItem key={expense.id} expense={expense} />
      ))}

      {recentExpenses.length === 0 && (
        <Text style={styles.emptyText}>Kayıtlı harcama bulunmuyor.</Text>
      )}
      {hasPrev && <View style={styles.comparisonRow}><Ionicons name={isLess ? 'trending-down' : 'trending-up'} size={22} color={isLess ? '#087B54' : COLORS.error} /><View><Text style={styles.comparisonCaption}>Geçen aya göre</Text><Text style={[styles.comparisonText, !isLess && { color: COLORS.error }]}>{formatCurrency(Math.abs(diff))} {isLess ? 'daha az' : 'daha fazla'}</Text></View></View>}
      <Modal transparent visible={limitModalVisible} animationType="fade" onRequestClose={() => setLimitModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.sectionTitle}>{currentMonthLabel} aylık limiti</Text>
          <TextInput value={limitInput} onChangeText={setLimitInput} keyboardType="decimal-pad" placeholder="Örn: 10000" style={styles.limitInput} editable={!limitSaving} />
          <View style={styles.limitActions}>
            <TouchableOpacity onPress={() => setLimitModalVisible(false)} disabled={limitSaving}><Text style={styles.seeAll}>Vazgeç</Text></TouchableOpacity>
            <TouchableOpacity disabled={limitSaving} onPress={async () => { try { const amount = toMinorUnits(limitInput.trim()); setLimitSaving(true); await setMonthlyLimit(currentMonth, amount); setLimitModalVisible(false); } catch (error) { Alert.alert('Limit kaydedilemedi', error instanceof Error ? error.message : 'Tekrar deneyin.'); } finally { setLimitSaving(false); } }}><Text style={styles.saveText}>{limitSaving ? 'Kaydediliyor…' : 'Kaydet'}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView></SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress, premium, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; premium?: boolean; disabled?: boolean }) {
  return <TouchableOpacity style={styles.quickAction} onPress={onPress} disabled={disabled}><Ionicons name={icon} size={25} color={COLORS.primaryDark} /><Text style={styles.quickLabel}>{label}</Text>{premium && <Text style={styles.premiumDot}>Premium</Text>}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  greetingTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 22,
    marginBottom: 14,
    minHeight: 208,
  },
  setLimitButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  setLimitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  summaryLabel: {
    color: '#D8EEE5',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  limitNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  limitRight: { alignItems: 'flex-end' },
  limitCaption: { color: '#D8EEE5', fontSize: 13 },
  limitValue: { color: '#FFFFFF', fontWeight: '700', fontSize: 17, marginTop: 2 },
  budgetProgress: { height: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, marginTop: 16, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', backgroundColor: COLORS.accentStrong, borderRadius: 8 },
  progressText: { color: '#D8EEE5', fontSize: 12, textAlign: 'right', marginTop: 4 },
  hiddenActions: { position: 'absolute', right: 20, top: 14 },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    flex: 1,
    height: 82,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  quickLabel: { color: COLORS.text, fontWeight: '700', fontSize: 13, marginTop: 5 },
  premiumDot: { color: COLORS.primary, fontSize: 8, marginTop: 1, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAll: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  limitActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  removeText: { color: COLORS.error, fontSize: 12, fontWeight: 'bold' },
  saveText: { color: COLORS.primary, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg },
  limitInput: { marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: SPACING.sm, color: COLORS.text, fontSize: 20 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  comparisonCaption: { color: COLORS.textSecondary, fontSize: 11 },
  comparisonText: { color: '#087B54', fontSize: 17, fontWeight: '800' },
});
