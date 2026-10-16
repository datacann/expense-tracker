import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/money';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';

interface Props {
  expense: Expense;
}

export const ExpenseListItem = ({ expense }: Props) => {
  const router = useRouter();
  const total = expense.items.reduce((sum, item) => sum + item.amountMinor, 0);
  const itemCount = expense.items.length;
  const title = expense.merchant || expense.items[0]?.description || 'Harcama';
  const categoryId = expense.items[0]?.categoryId;
  const category = Object.entries(CATEGORIES).find(([key]) => `cat_${key.toLowerCase()}` === categoryId)?.[1] || 'Diğer';
  const icon = categoryId === 'cat_food' || categoryId === 'cat_shopping' ? 'cart-outline' : categoryId === 'cat_dining' ? 'cafe-outline' : categoryId === 'cat_transport' ? 'bus-outline' : categoryId === 'cat_bills' ? 'document-text-outline' : 'wallet-outline';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push(`/expenses/${expense.id}`)}
    >
      <View style={styles.iconCircle}><Ionicons name={icon} size={20} color={COLORS.primary} /></View>
      <View style={styles.info}>
        <Text style={styles.description}>{title}</Text>
        <Text style={styles.date}>
          {category} · {expense.source === 'receipt' ? 'Fiş' : expense.source === 'voice' ? 'Ses' : 'Manuel'}{itemCount > 1 ? ` · ${itemCount} ürün` : ''}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(total)}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
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
    marginRight: SPACING.xs,
  },
});
