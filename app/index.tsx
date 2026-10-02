import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../src/providers/ExpenseProvider';
import { calculateMonthlyStats } from '../src/utils/expenseAnalytics';
import { formatCurrency } from '../src/utils/money';

export default function Index() {
  const { state } = useExpense();
  const router = useRouter();
  const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
  const { total } = calculateMonthlyStats(state.expenses, currentMonth);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Bu ay harcadıkların:</Text>
      <Text style={{ fontSize: 32, fontWeight: 'bold' }}>{formatCurrency(total)}</Text>
      <Button title="Harcama Ekle" onPress={() => router.push('/expenses/new')} />
    </View>
  );
}
