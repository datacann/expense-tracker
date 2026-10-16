import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CategoryPicker } from './CategoryPicker';
import { toMinorUnits } from '../utils/money';
import { appendExpenseItemDraft, ExpenseItemDraft, removeExpenseItemDraft, updateExpenseItemDraft } from '../services/expenseEditFlow';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { formatCurrency } from '../utils/money';

interface Props {
  initialItems: ExpenseItemDraft[];
  onSave: (items: ExpenseItemDraft[]) => Promise<void>;
  isSaving: boolean;
  receiptTotalMinor?: number | null;
  onDirty?: () => void;
}

export const ReceiptItemEditor = ({ initialItems, onSave, isSaving, receiptTotalMinor, onDirty = () => {} }: Props) => {
  const [items, setItems] = useState<ExpenseItemDraft[]>(() => initialItems.map((item) => ({ ...item })));
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>(() => Object.fromEntries(
    initialItems.map((item) => [item.id, item.amountMinor === null ? '' : (item.amountMinor / 100).toString().replace('.', ',')]),
  ));

  const updateItem = (index: number, patch: Partial<Omit<ExpenseItemDraft, 'id'>>) => {
    onDirty();
    setItems((current) => updateExpenseItemDraft(current, index, patch));
  };

  const addItem = () => {
    onDirty();
    const id = uuidv4();
    setAmountInputs((current) => ({ ...current, [id]: '' }));
    setItems((current) => appendExpenseItemDraft(current, id));
  };

  const removeItem = (index: number) => {
    onDirty();
    const id = items[index]?.id;
    if (id) setAmountInputs((current) => { const next = { ...current }; delete next[id]; return next; });
    setItems((current) => removeExpenseItemDraft(current, index));
  };

  const updateAmount = (index: number, id: string, value: string) => {
    setAmountInputs((current) => ({ ...current, [id]: value }));
    try {
      updateItem(index, { amountMinor: toMinorUnits(value) });
    } catch {
      updateItem(index, { amountMinor: null });
    }
  };

  const itemsTotalMinor = items.reduce((sum, item) => sum + (item.amountMinor ?? 0), 0);
  const shownReceiptTotal = receiptTotalMinor ?? null;
  const differenceMinor = shownReceiptTotal === null ? null : shownReceiptTotal - itemsTotalMinor;

  return (
    <View style={styles.container}>
      <View style={[styles.totalCard, differenceMinor !== null && differenceMinor !== 0 && styles.totalCardWarning]}>
        <View><Text style={styles.totalLabel}>Ürünler toplamı</Text><Text style={styles.totalValue}>{formatCurrency(itemsTotalMinor)}</Text></View>
        {shownReceiptTotal !== null && <View style={styles.totalRight}><Text style={styles.totalLabel}>Fiş toplamı</Text><Text style={styles.totalValue}>{formatCurrency(shownReceiptTotal)}</Text></View>}
        {differenceMinor !== null && differenceMinor !== 0 && <Text style={styles.differenceText}>Toplamlar arasında {formatCurrency(Math.abs(differenceMinor))} fark var. Kaydetmeden önce düzelt.</Text>}
      </View>
      <View style={styles.listContent}>
        {items.map((item, index) => (
          <View style={styles.itemCard} key={item.id}>
            <Text style={styles.itemTitle}>Ürün {index + 1}</Text>
            <Text style={styles.fieldLabel}>Açıklama</Text>
                <TextInput 
                    value={item.description} 
                    onChangeText={(value) => updateItem(index, { description: value })} 
                    style={[styles.input, !item.description.trim() && styles.invalidInput]} 
                    placeholder="Ürün adı" 
                    placeholderTextColor={COLORS.textSecondary}
                />
            <Text style={styles.fieldLabel}>Tutar (TL)</Text>
                <TextInput 
                    value={amountInputs[item.id] ?? ''}
                    onChangeText={(value) => updateAmount(index, item.id, value)}
                    keyboardType="decimal-pad" 
                    style={[styles.input, styles.amountInput, item.amountMinor === null && styles.invalidInput]} 
                    placeholder="Tutar"
                    placeholderTextColor={COLORS.textSecondary}
                />
            {item.amountMinor === null && <Text style={styles.fieldError}>Pozitif bir tutar gir.</Text>}
            <CategoryPicker value={item.categoryId || ''} onValueChange={(value) => updateItem(index, { categoryId: value })} />
            <TouchableOpacity style={styles.deleteButton} onPress={() => removeItem(index)} disabled={isSaving}>
                <Text style={styles.deleteButtonText}>Ürünü sil</Text>
            </TouchableOpacity>
          </View>
        ))}
        {items.length === 0 && <Text style={styles.emptyText}>En az bir ürün eklemelisin.</Text>}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={addItem} disabled={isSaving}>
            <Text style={styles.addButtonText}>+ Ürün Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => onSave(items)} disabled={isSaving}>
            <Text style={styles.saveButtonText}>{isSaving ? 'Kaydediliyor…' : 'Kabul Et ve Kaydet'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingVertical: SPACING.sm },
  itemCard: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  itemTitle: { color: COLORS.text, fontWeight: 'bold', fontSize: 13, marginBottom: SPACING.sm },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4, marginTop: SPACING.xs },
  input: { height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, backgroundColor: COLORS.background, color: COLORS.text },
  amountInput: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
  invalidInput: { borderColor: COLORS.error },
  fieldError: { color: COLORS.error, fontSize: 11, marginTop: 4 },
  deleteButton: { alignSelf: 'flex-end', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs, minHeight: 36, justifyContent: 'center' },
  deleteButtonText: { color: COLORS.error, fontSize: 12, fontWeight: 'bold' },
  footer: { paddingTop: SPACING.md, gap: SPACING.sm },
  addButton: { height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  addButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  saveButton: { height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  totalCard: { padding: SPACING.md, backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  totalCardWarning: { borderColor: COLORS.error, backgroundColor: '#FFF6F5' },
  totalRight: { alignItems: 'flex-end' },
  totalLabel: { color: COLORS.textSecondary, fontSize: 11 },
  totalValue: { color: COLORS.text, fontWeight: 'bold', marginTop: 2 },
  differenceText: { width: '100%', color: COLORS.error, fontSize: 12, fontWeight: '600', marginTop: SPACING.sm },
  emptyText: { color: COLORS.error, textAlign: 'center', paddingVertical: SPACING.md },
});
