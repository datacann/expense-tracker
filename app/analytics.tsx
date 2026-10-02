import { View, Text, StyleSheet } from 'react-native';
import { useExpense } from '../src/providers/ExpenseProvider';
import { calculateMonthlyStats } from '../src/utils/expenseAnalytics';
import { formatCurrency } from '../src/utils/money';

export default function Analytics() {
  const { state } = useExpense();
  const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
  const { total, summaries } = calculateMonthlyStats(state.expenses, currentMonth);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analizler ({currentMonth})</Text>
      <Text style={styles.total}>Toplam: {formatCurrency(total)}</Text>
      {summaries.map(s => (
        <View key={s.categoryId} style={styles.row}>
          <Text>{s.name}</Text>
          <Text>{formatCurrency(s.amountMinor)}</Text>
        </View>
      ))}
      {summaries.length === 0 && <Text style={styles.center}>Veri yok.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  total: { fontSize: 24, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  center: { textAlign: 'center', marginTop: 20 }
});
