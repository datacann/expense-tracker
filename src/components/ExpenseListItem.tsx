import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/money';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  expense: Expense;
}

export const ExpenseListItem = ({ expense }: Props) => {
  const router = useRouter();
  const total = expense.items.reduce((sum, item) => sum + item.amountMinor, 0);
  const itemCount = expense.items.length;
  const title = expense.merchant || expense.items[0]?.description || 'Harcama';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push(`/expenses/${expense.id}`)}
    >
      <View style={styles.info}>
        <Text style={styles.description}>{title}</Text>
        <Text style={styles.date}>
          {expense.date} {itemCount > 1 ? `• ${itemCount} ürün` : ''}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(total)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: SPACING.md, 
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  info: {
    flex: 1,
  },
  description: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: COLORS.text,
  },
  date: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 2,
  },
  amount: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: COLORS.text,
  },
});
