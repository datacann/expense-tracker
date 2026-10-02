import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { toMinorUnits } from '../../src/utils/money';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function NewExpense() {
  const { addExpense } = useExpense();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: { description: string; amount: string; categoryId: string; date: string }) => {
    setIsLoading(true);
    try {
      await addExpense({
        id: uuidv4(),
        date: data.date,
        currency: 'TRY',
        source: 'manual',
        items: [{
          id: uuidv4(),
          description: data.description,
          amountMinor: toMinorUnits(data.amount),
          categoryId: data.categoryId,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      router.replace('/expenses');
    } catch (e: any) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpenseForm onSubmit={handleSave} isLoading={isLoading} />
    </View>
  );
}
