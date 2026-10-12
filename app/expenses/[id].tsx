import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { ReceiptItemEditor } from '../../src/components/ReceiptItemEditor';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { ExpenseItemDraft, saveExpenseEdits } from '../../src/services/expenseEditFlow';
import { toMinorUnits } from '../../src/utils/money';
import { createSubmissionLock } from '../../src/services/submissionLock';
import { deleteExpenseFromDetail, resolveExpenseDetailState } from '../../src/services/expenseDetailFlow';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { formatCurrency } from '../../src/utils/money';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateExpense, deleteExpense, retryLoad } = useExpense();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteLock = useRef(createSubmissionLock()).current;

  const detailState = resolveExpenseDetailState(state, id);
  if (detailState.status === 'loading') return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  if (detailState.status === 'error') return <View style={styles.center}><Text>{detailState.message}</Text><TouchableOpacity onPress={retryLoad}><Text>Tekrar dene</Text></TouchableOpacity></View>;
  if (detailState.status === 'not-found') return <View style={styles.center}><Text>Harcama bulunamadı.</Text></View>;
  const expense = detailState.expense;

  const saveItems = async (items: ExpenseItemDraft[], date = expense.date, notes = expense.notes, merchant = expense.merchant) => {
    if (isLoading) return;
    setIsLoading(true);
    const result = await saveExpenseEdits(expense, items, date, {
      updateExpense,
      now: () => new Date(),
    }, notes, merchant);

    if (result.status === 'saved') {
      setIsEditing(false);
    } else {
      Alert.alert('Hata', result.message);
    }
    setIsLoading(false);
  };

  const handleManualUpdate = async (data: { description: string; amount: string; categoryId: string; date: string; merchant?: string; notes?: string }) => {
    await saveItems([{
      id: expense.items[0].id,
      description: data.description,
      amountMinor: toMinorUnits(data.amount),
      categoryId: data.categoryId,
    }], data.date, data.notes, data.merchant);
  };

  const handleDelete = () => {
    Alert.alert('Sil', 'Bu harcamayı silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { void deleteLock.run(async () => {
        setIsDeleting(true);
        try {
          const result = await deleteExpenseFromDetail(true, expense.id, { deleteExpense, navigateBack: () => router.back() });
          if (result.status === 'storage-error') Alert.alert('Hata', result.message);
        } finally {
          setIsDeleting(false);
        }
      }); }},
    ]);
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.editHeader}>
            <Text style={styles.headerTitle}>Düzenle</Text>
            <TouchableOpacity onPress={() => setIsEditing(false)}><Text style={styles.cancelText}>İptal</Text></TouchableOpacity>
        </View>
        {expense.source === 'manual' ? (
            <ExpenseForm
            initialData={{
                description: expense.items[0].description,
                amount: (expense.items[0].amountMinor / 100).toString(),
                categoryId: expense.items[0].categoryId,
                date: expense.date,
                merchant: expense.merchant,
                notes: expense.notes,
            }}
            onSubmit={handleManualUpdate}
            isLoading={isLoading}
            />
        ) : (
            <ReceiptItemEditor
            initialItems={expense.items.map((item) => ({ ...item }))}
            onSave={(items) => saveItems(items)}
            isSaving={isLoading}
            />
        )}
      </View>
    );
  }

  const totalMinor = expense.items.reduce((sum, item) => sum + item.amountMinor, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>{expense.merchant || 'Harcama'}</Text>
            <Text style={styles.amountText}>{formatCurrency(totalMinor)}</Text>
            <Text style={styles.dateText}>{expense.date}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionHeader}>Ürünler</Text>
            {expense.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemAmount}>{formatCurrency(item.amountMinor)}</Text>
                </View>
            ))}
        </View>

        {expense.notes && (
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Not</Text>
                <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
        )}

        <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isDeleting}>
                <Text style={styles.deleteButtonText}>{isDeleting ? 'Siliniyor...' : 'Sil'}</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, alignItems: 'center' },
  cancelText: { color: COLORS.error, fontWeight: 'bold' },
  headerCard: { backgroundColor: COLORS.card, padding: SPACING.lg, borderRadius: RADIUS.lg, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  amountText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginVertical: SPACING.sm },
  dateText: { color: COLORS.textSecondary },
  section: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemDesc: { color: COLORS.text },
  itemAmount: { fontWeight: 'bold', color: COLORS.text },
  notesText: { color: COLORS.text, fontStyle: 'italic' },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  editButton: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  deleteButton: { backgroundColor: COLORS.card, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.error },
  deleteButtonText: { color: COLORS.error, fontWeight: 'bold' }
});