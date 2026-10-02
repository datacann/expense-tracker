import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/money';
import { useRouter } from 'expo-router';

interface Props {
  expense: Expense;
}

export const ExpenseListItem = ({ expense }: Props) => {
  const router = useRouter();
  const total = expense.items.reduce((sum, item) => sum + item.amountMinor, 0);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push(`/expenses/${expense.id}`)}
    >
      <View>
        <Text style={styles.description}>{expense.items[0]?.description}</Text>
        <Text style={styles.date}>{expense.date}</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(total)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  description: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#666' },
  amount: { fontSize: 16, fontWeight: 'bold' },
});
