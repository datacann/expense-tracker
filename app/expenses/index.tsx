import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { ExpenseListItem } from '../../src/components/ExpenseListItem';

export default function ExpensesIndex() {
  const { state } = useExpense();
  const router = useRouter();

  const sortedExpenses = [...state.expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (state.loading) return <Text style={styles.center}>Yükleniyor...</Text>;
  if (state.error) return <Text style={styles.center}>{state.error}</Text>;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseListItem expense={item} />}
        ListEmptyComponent={<Text style={styles.center}>Henüz harcama yok.</Text>}
      />
      <Button title="Yeni Ekle" onPress={() => router.push('/expenses/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, textAlign: 'center', marginTop: 50 },
});
