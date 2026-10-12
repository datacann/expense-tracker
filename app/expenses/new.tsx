import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { toMinorUnits } from '../../src/utils/money';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { createSubmissionLock } from '../../src/services/submissionLock';

export default function NewExpense() {
  const { addExpense } = useExpense();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const submissionLock = useRef(createSubmissionLock()).current;

  const handleSave = async (data: { description: string; amount: string; categoryId: string; date: string; merchant?: string; notes?: string }) => {
    await submissionLock.run(async () => {
      setIsLoading(true);
      try {
        await addExpense({
        id: uuidv4(),
        merchant: data.merchant?.trim() || undefined,
        date: data.date,
        currency: 'TRY',
        source: 'manual',
        items: [{
          id: uuidv4(),
          description: data.description,
          amountMinor: toMinorUnits(data.amount),
          categoryId: data.categoryId,
        }],
        notes: data.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        });
        router.replace('/expenses');
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpenseForm onSubmit={handleSave} isLoading={isLoading} />
    </View>
  );
}
