import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { toMinorUnits } from '../../src/utils/money';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams();
  const { state, updateExpense, deleteExpense } = useExpense();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const expense = state.expenses.find(e => e.id === id);

  if (!expense) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Harcama bulunamadı.</Text>;

  const handleUpdate = async (data: { description: string; amount: string; categoryId: string; date: string }) => {
    setIsLoading(true);
    try {
      await updateExpense(expense.id, {
        ...expense,
        date: data.date,
        items: expense.items.map(i => i.id === expense.items[0].id ? { ...i, description: data.description, amountMinor: toMinorUnits(data.amount), categoryId: data.categoryId } : i),
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (e: any) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Sil', 'Bu harcamayı silmek istediğinizden emin misiniz?', [
      { text: 'İptal' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        await deleteExpense(expense.id);
        router.back();
      }}
    ]);
  };

  if (isEditing) {
    return (
      <View style={{ flex: 1 }}>
        <ExpenseForm 
          initialData={{ 
            description: expense.items[0].description, 
            amount: (expense.items[0].amountMinor / 100).toString(), 
            categoryId: expense.items[0].categoryId,
            date: expense.date 
          }} 
          onSubmit={handleUpdate} 
          isLoading={isLoading} 
        />
        <Button title="İptal" onPress={() => setIsEditing(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Açıklama: {expense.items[0].description}</Text>
      <Text>Tutar: {expense.items[0].amountMinor / 100} TL</Text>
      <Button title="Düzenle" onPress={() => setIsEditing(true)} />
      <Button title="Sil" color="red" onPress={handleDelete} />
    </View>
  );
}
