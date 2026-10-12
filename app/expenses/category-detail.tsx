import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { getCategoryDetails } from '../../src/utils/expenseAnalytics';

export default function CategoryDetail() {
  const { yearMonth, categoryId, name } = useLocalSearchParams<{ yearMonth: string, categoryId: string, name: string }>();
  const { state } = useExpense();
  const router = useRouter();

  const items = getCategoryDetails(state.expenses, yearMonth, categoryId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name} Detayları</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.itemId}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => router.push(`/expenses/${item.expenseId}`)}
          >
            <Text>{item.description} {item.merchant ? `(${item.merchant})` : ''}</Text>
            <Text>{(item.amountMinor / 100).toFixed(2)} TL</Text>
            <Text style={styles.date}>{item.date}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  date: { fontSize: 12, color: '#666' }
});