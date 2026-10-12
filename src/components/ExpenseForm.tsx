import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { CategoryPicker } from './CategoryPicker';
import { CATEGORY_IDS } from '../constants/categories';
import { toMinorUnits } from '../utils/money';
import { formatLocalDate, isValidCalendarDate } from '../utils/localDate';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  initialData?: { description: string; amount: string; categoryId: string; date: string; merchant?: string; notes?: string };
  onSubmit: (data: { description: string; amount: string; categoryId: string; date: string; merchant?: string; notes?: string }) => Promise<void>;
  isLoading: boolean;
}

export const ExpenseForm = ({ initialData, onSubmit, isLoading }: Props) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || CATEGORY_IDS.OTHER);
  const [date, setDate] = useState(initialData?.date || formatLocalDate(new Date()));
  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = async () => {
    try {
      toMinorUnits(amount); // Validate amount
      if (!description.trim()) throw new Error('Açıklama boş olamaz');
      if (!isValidCalendarDate(date)) throw new Error('Geçerli bir tarih girin (YYYY-MM-DD)');
      if (notes.length > 500) throw new Error('Not 500 karakterden uzun olamaz');
      await onSubmit({ description, amount, categoryId, date, merchant, notes });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={styles.card}>
        <Text style={styles.label}>Tutar (TL)</Text>
        <TextInput 
          placeholder="0,00" 
          placeholderTextColor={COLORS.textSecondary}
          value={amount} 
          onChangeText={setAmount} 
          keyboardType="decimal-pad" 
          style={styles.amountInput} 
        />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput 
          placeholder="Örn: Market alışverişi" 
          placeholderTextColor={COLORS.textSecondary}
          value={description} 
          onChangeText={setDescription} 
          style={styles.input} 
        />

        <Text style={styles.label}>Kategori</Text>
        <CategoryPicker value={categoryId} onValueChange={setCategoryId} />

        <Text style={styles.label}>Tarih</Text>
        <TextInput 
          placeholder="YYYY-MM-DD" 
          placeholderTextColor={COLORS.textSecondary}
          value={date} 
          onChangeText={setDate} 
          style={styles.input} 
        />

        <Text style={styles.label}>İşletme (İsteğe bağlı)</Text>
        <TextInput 
          placeholder="Örn: Migros" 
          placeholderTextColor={COLORS.textSecondary}
          value={merchant} 
          onChangeText={setMerchant} 
          style={styles.input} 
        />

        <Text style={styles.label}>Not (İsteğe bağlı)</Text>
        <TextInput 
          placeholder="Eklemek istediğin notlar..." 
          placeholderTextColor={COLORS.textSecondary}
          value={notes} 
          onChangeText={setNotes} 
          multiline 
          numberOfLines={3} 
          style={[styles.input, styles.textArea]} 
          maxLength={500}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isLoading && styles.disabledButton]} 
        onPress={handleSubmit} 
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: SPACING.sm,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  input: { 
    height: 44,
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: RADIUS.sm, 
    paddingHorizontal: SPACING.sm, 
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
