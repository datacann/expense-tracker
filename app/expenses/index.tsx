import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { ExpenseListItem } from '../../src/components/ExpenseListItem';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { formatCurrency } from '../../src/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, CATEGORY_IDS } from '../../src/constants/categories';
import { AdBanner } from '../../src/components/AdBanner';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function ExpensesIndex() {
  const { state, retryLoad } = useExpense();
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const yearMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }, [currentDate]);

  const filteredExpenses = useMemo(() => {
    const term = searchText.trim().toLocaleLowerCase('tr-TR');
    
    let list = state.expenses.filter(e => e.date.startsWith(yearMonth));

    if (term) {
      list = list.filter(e => {
        const merchantMatch = (e.merchant || '').toLocaleLowerCase('tr-TR').includes(term);
        const itemMatch = e.items.some(i => i.description.toLocaleLowerCase('tr-TR').includes(term));
        return merchantMatch || itemMatch;
      });
    }
    if (selectedCategory) list = list.filter((expense) => expense.items.some((item) => item.categoryId === selectedCategory));

    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [state.expenses, yearMonth, searchText, selectedCategory]);

  const monthOptions = useMemo(() => Array.from({ length: 37 }, (_, index) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - index, 1);
  }), []);
  const categoryOptions = useMemo(() => Object.entries(CATEGORIES).map(([key, label]) => ({ label, value: CATEGORY_IDS[key as keyof typeof CATEGORIES] })), []);
  const selectedCategoryLabel = categoryOptions.find((item) => item.value === selectedCategory)?.label ?? 'Tüm kategoriler';

  const totalMinor = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => 
      sum + e.items.reduce((iSum, i) => iSum + i.amountMinor, 0), 0
    );
  }, [filteredExpenses]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const setThisMonth = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  if (state.loading) return (
    <View style={styles.center}>
      <Text style={styles.loadingText}>Harcamalar yükleniyor...</Text>
    </View>
  );

  if (state.error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{state.error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
        <Text style={styles.retryButtonText}>Tekrar dene</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Üst Bar: Arama ve Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geçmiş</Text>
        <View style={styles.searchWrap}><Ionicons name="search-outline" size={20} color={COLORS.textSecondary} /><TextInput 
          style={styles.searchBar} placeholder="İşletme veya açıklama ara" placeholderTextColor={COLORS.textSecondary} value={searchText} onChangeText={setSearchText}
        /></View>

        {/* Ay Seçici */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setMonthPickerVisible(true)}><Ionicons name="calendar-outline" size={17} color={COLORS.primary} /><Text style={styles.filterText}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</Text><Ionicons name="chevron-down" size={17} color={COLORS.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setCategoryPickerVisible(true)}><Text style={styles.filterText} numberOfLines={1}>{selectedCategoryLabel}</Text><Ionicons name="chevron-down" size={17} color={COLORS.text} /></TouchableOpacity>
        </View>
        <Text style={styles.resultText}>{filteredExpenses.length} kayıt · {formatCurrency(totalMinor)}</Text>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ExpenseListItem expense={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchText ? 'Eşleşen harcama bulunamadı' : 'Bu ay için harcama yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 'Farklı bir arama terimi deneyebilirsin.' : 'Yeni bir harcama ekleyerek başlayabilirsin.'}
            </Text>
          </View>
        }
      />

      <SelectionModal visible={monthPickerVisible} title="Ay seç" onClose={() => setMonthPickerVisible(false)}>{monthOptions.map((date) => { const selected = date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth(); return <TouchableOpacity key={`${date.getFullYear()}-${date.getMonth()}`} style={styles.option} onPress={() => { setCurrentDate(date); setMonthPickerVisible(false); }}><Text style={[styles.optionText, selected && styles.selectedOption]}>{MONTHS[date.getMonth()]} {date.getFullYear()}</Text>{selected && <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />}</TouchableOpacity>; })}</SelectionModal>
      <SelectionModal visible={categoryPickerVisible} title="Kategori seç" onClose={() => setCategoryPickerVisible(false)}><TouchableOpacity style={styles.option} onPress={() => { setSelectedCategory(null); setCategoryPickerVisible(false); }}><Text style={[styles.optionText, selectedCategory === null && styles.selectedOption]}>Tüm kategoriler</Text>{selectedCategory === null && <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />}</TouchableOpacity>{categoryOptions.map((item) => <TouchableOpacity key={item.value} style={styles.option} onPress={() => { setSelectedCategory(item.value); setCategoryPickerVisible(false); }}><Text style={[styles.optionText, selectedCategory === item.value && styles.selectedOption]}>{item.label}</Text>{selectedCategory === item.value && <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />}</TouchableOpacity>)}</SelectionModal>
      <AdBanner />
    </SafeAreaView>
  );
}

function SelectionModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}><TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}><View style={styles.sheet} onStartShouldSetResponder={() => true}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity></View><ScrollView>{children}</ScrollView></View></TouchableOpacity></Modal>;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: { 
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, 
    borderColor: COLORS.border 
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  searchWrap: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: COLORS.surfaceMuted, flexDirection: 'row', alignItems: 'center' },
  searchBar: { 
    flex: 1,
    height: 48,
    paddingHorizontal: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  filterRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  filterButton: { flex: 1, height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  filterText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  resultText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 10 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' }, sheet: { maxHeight: '72%', backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 28 }, sheetHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border }, sheetTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' }, option: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border }, optionText: { color: COLORS.text, fontSize: 15 }, selectedOption: { color: COLORS.primary, fontWeight: '800' },
});
