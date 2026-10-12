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

export default function Index() {
  const { state, setMonthlyLimit, deleteMonthlyLimit } = useExpense();
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [limitSaving, setLimitSaving] = useState(false);
  
  const currentMonth = formatLocalDate(new Date()).substring(0, 7);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Selamlama & Başlık */}
      <View style={styles.header}>
        <Text style={styles.greetingTitle}>Merhaba,</Text>
        <Text style={styles.greetingSubtitle}>Bu ayki harcamalarını buradan takip edebilirsin.</Text>
      </View>

      {/* Koyu Yeşil Özet Kartı */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Bu ay harcaman</Text>
        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
        
        {hasPrev && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Geçen aya göre %{percentChange} {isLess ? 'daha az' : 'daha fazla'}
            </Text>
          </View>
        )}
      </View>

      {/* Limit Kartı */}
      <View style={styles.limitCard}>
        {monthlyLimit ? (
          <>
            <Text style={styles.limitLabel}>
              Harcanan {formatCurrency(total)} · Limit {formatCurrency(monthlyLimit)}{`\n`}
              {budget && budget.exceededMinor > 0 ? `${formatCurrency(budget.exceededMinor)} aşıldı` : `${formatCurrency(budget?.remainingMinor ?? 0)} kaldı`}
            </Text>
            <View style={styles.progressBackground}>
               <View style={[styles.progressFill, { width: `${budget?.progressPercent ?? 0}%` }]} />
            </View>
            <View style={styles.limitActions}>
              <TouchableOpacity onPress={() => { setLimitInput((monthlyLimit / 100).toFixed(2).replace('.', ',')); setLimitModalVisible(true); }}><Text style={styles.seeAll}>Düzenle</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Limiti kaldır', 'Bu aya ait limit kaldırılsın mı?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Kaldır', style: 'destructive', onPress: () => void deleteMonthlyLimit(currentMonth).catch(() => Alert.alert('Hata', 'Limit kaldırılamadı.')) }])}><Text style={styles.removeText}>Kaldır</Text></TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.setLimitButton} onPress={() => { setLimitInput(''); setLimitModalVisible(true); }}>
            <Text style={styles.actionButtonText}>Aylık limit belirle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tasarruf Önerileri Butonu */}
      {__DEV__ && <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: COLORS.accent, marginTop: SPACING.md }]}
        onPress={() => router.push({ pathname: '/suggestions', params: { month: currentMonth } })}
      >
        <Text style={styles.actionButtonText}>Nereden tasarruf edebilirim?</Text>
      </TouchableOpacity>}

      {/* Ana Aksiyon Butonları */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
          onPress={() => router.push('/expenses/new')}
        >
          <Text style={styles.actionButtonText}>+ Harcama ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]}
          onPress={() => router.push('/receipts/new')}
        >
          <Text style={[styles.actionButtonText, { color: COLORS.text }]}>Fiş tara</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: COLORS.primary, marginTop: SPACING.sm }]}
        onPress={() => router.push(isPremium ? '/voice/new' : { pathname: '/premium', params: { returnTo: 'voice' } })}
        disabled={subscriptionLoading}
      >
        <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>🎤 Sesle ekle {!isPremium ? '· Premium' : ''}</Text>
      </TouchableOpacity>

      {/* Kategorilere Göre Harcama */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategorilere göre</Text>
        <TouchableOpacity onPress={() => router.push('/analytics')}>
          <Text style={styles.seeAll}>Tümünü gör &gt;</Text>
        </TouchableOpacity>
      </View>

      {summaries.slice(0, 4).map((s) => {
        const percentage = total > 0 ? Math.round((s.amountMinor / total) * 100) : 0;
        return (
          <View key={s.categoryId} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{s.name}</Text>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.categoryAmount}>{formatCurrency(s.amountMinor)}</Text>
          </View>
        );
      })}

      {summaries.length === 0 && (
        <Text style={styles.emptyText}>Henüz bu aya ait harcama yok.</Text>
      )}

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
      <Modal transparent visible={limitModalVisible} animationType="fade" onRequestClose={() => setLimitModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.sectionTitle}>{currentMonth} aylık limiti</Text>
          <TextInput value={limitInput} onChangeText={setLimitInput} keyboardType="decimal-pad" placeholder="Örn: 10000" style={styles.limitInput} editable={!limitSaving} />
          <View style={styles.limitActions}>
            <TouchableOpacity onPress={() => setLimitModalVisible(false)} disabled={limitSaving}><Text style={styles.seeAll}>Vazgeç</Text></TouchableOpacity>
            <TouchableOpacity disabled={limitSaving} onPress={async () => { try { const amount = toMinorUnits(limitInput.trim()); setLimitSaving(true); await setMonthlyLimit(currentMonth, amount); setLimitModalVisible(false); } catch (error) { Alert.alert('Limit kaydedilemedi', error instanceof Error ? error.message : 'Tekrar deneyin.'); } finally { setLimitSaving(false); } }}><Text style={styles.saveText}>{limitSaving ? 'Kaydediliyor…' : 'Kaydet'}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  limitCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  limitLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  setLimitButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  badge: {
    backgroundColor: 'rgba(232, 245, 200, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  categoryName: {
    width: 90,
    fontSize: 12,
    color: COLORS.text,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
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
});
