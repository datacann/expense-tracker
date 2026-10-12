import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { ExpenseListItem } from '../../src/components/ExpenseListItem';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { formatCurrency } from '../../src/utils/money';

export default function ExpensesIndex() {
  const { state, retryLoad } = useExpense();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [searchText, setSearchText] = useState('');

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

    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [state.expenses, yearMonth, searchText]);

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
    <View style={styles.container}>
      {/* Üst Bar: Arama ve Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Harcama Geçmişi</Text>
        <TextInput 
          style={styles.searchBar} 
          placeholder="İşletme veya ürün ara..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Ay Seçici */}
        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.monthNavButton} onPress={() => changeMonth(-1)}>
            <Text style={styles.monthNavText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setThisMonth}>
            <Text style={styles.monthText}>{yearMonth}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.monthNavButton} onPress={() => changeMonth(1)}>
            <Text style={styles.monthNavText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Özet Satırı */}
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>
            {searchText ? 'Eşleşenler' : 'Toplam'}: {filteredExpenses.length} kayıt • {formatCurrency(totalMinor)}
          </Text>
        </View>
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

      {/* Yeni Ekle Yüzen Buton (veya alt buton) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/expenses/new')}
        >
          <Text style={styles.addButtonText}>+ Yeni Harcama</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
    padding: SPACING.md, 
    backgroundColor: COLORS.card, 
    borderBottomWidth: 1, 
    borderColor: COLORS.border 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  searchBar: { 
    height: 44,
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.md, 
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  monthRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginVertical: SPACING.xs 
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  monthText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: COLORS.text 
  },
  summaryBadge: {
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  summaryBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
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
  bottomBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
