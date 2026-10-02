import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { CategoryPicker } from './CategoryPicker';
import { CATEGORY_IDS } from '../constants/categories';
import { toMinorUnits } from '../utils/money';

interface Props {
  initialData?: { description: string; amount: string; categoryId: string; date: string };
  onSubmit: (data: { description: string; amount: string; categoryId: string; date: string }) => Promise<void>;
  isLoading: boolean;
}

export const ExpenseForm = ({ initialData, onSubmit, isLoading }: Props) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || CATEGORY_IDS.OTHER);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    try {
      toMinorUnits(amount); // Validate amount
      if (!description.trim()) throw new Error('Açıklama boş olamaz');
      await onSubmit({ description, amount, categoryId, date });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Açıklama" value={description} onChangeText={setDescription} style={styles.input} />
      <TextInput placeholder="Tutar (örn: 120,50)" value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />
      <CategoryPicker value={categoryId} onValueChange={setCategoryId} />
      <TextInput placeholder="Tarih (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} />
      <Button title={isLoading ? 'Kaydediliyor...' : 'Kaydet'} onPress={handleSubmit} disabled={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 5 },
});
