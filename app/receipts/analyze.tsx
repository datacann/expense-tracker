import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity, BackHandler, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useReceiptAnalysis } from '../../src/hooks/useReceiptAnalysis';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { saveReceiptAnalysis } from '../../src/services/receiptSaveFlow';
import { cleanupReceiptFile } from '../../src/services/receiptImageService';
import { ReceiptItemEditor } from '../../src/components/ReceiptItemEditor';
import { ExpenseItemDraft } from '../../src/services/expenseEditFlow';
import { toMinorUnits } from '../../src/utils/money';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';

export default function Analyze() {
  const { uri: uriParam } = useLocalSearchParams<{ uri?: string | string[] }>();
  const uri = Array.isArray(uriParam) ? uriParam[0] : uriParam;
  const { data, loading, error, startAnalysis } = useReceiptAnalysis();
  const { addExpense } = useExpense();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [total, setTotal] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const savingRef = useRef(false);
  const draftId = useRef(uuidv4()).current;
  const abortController = useRef<AbortController | null>(null);

  const runAnalysis = (useSample: boolean) => {
    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();
    if (uri) startAnalysis(uri, useSample, abortController.current.signal);
  };

  useEffect(() => {
    runAnalysis(false);
    return () => { abortController.current?.abort(); };
  }, [uri]);

  useEffect(() => {
    if (!data) return;
    setMerchant(data.merchant ?? '');
    setDate(data.date ?? '');
    setTotal(data.totalMinor === null ? '' : (data.totalMinor / 100).toString());
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const isMerchantChanged = merchant !== (data.merchant ?? '');
    const isDateChanged = date !== (data.date ?? '');
    const isTotalChanged = total !== (data.totalMinor === null ? '' : (data.totalMinor / 100).toString());
    if (isMerchantChanged || isDateChanged || isTotalChanged) setIsDirty(true);
  }, [merchant, date, total, data]);

  const handleSave = async (items: ExpenseItemDraft[], missingTotalConfirmed = false) => {
    if (!data || savingRef.current) return;
    let totalMinor: number | null = null;
    if (total.trim().length > 0) {
      try { totalMinor = toMinorUnits(total); } 
      catch { Alert.alert('Hata', 'Geçerli bir toplam girin.'); return; }
    }
    if (totalMinor === null && !missingTotalConfirmed) {
      Alert.alert('Fiş toplamı eksik', 'Toplam olmadan kaydetmek ister misiniz?', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kaydet', onPress: () => { void handleSave(items, true); } },
      ]);
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    const draft = {
      ...data,
      merchant: merchant.trim() || null,
      date: date.trim() || null,
      totalMinor,
      items: items.map((item) => ({
        rawText: item.description,
        description: item.description,
        amountMinor: item.amountMinor,
        categoryId: item.categoryId,
      })),
    };
    const result = await saveReceiptAnalysis(draft, {
      addExpense,
      navigateToExpense: (expenseId) => { router.replace({ pathname: '/expenses/[id]', params: { id: expenseId } }); },
      cleanupReceiptFile: cleanupReceiptFile,
      createId: uuidv4,
      now: () => new Date(),
    }, uri, draftId, missingTotalConfirmed);
    if (result.status !== 'saved') {
      Alert.alert('Hata', result.message);
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (savingRef.current) return;
    await cleanupReceiptFile(uri);
    router.back();
  };

  const confirmCancel = () => {
    if (isDirty) {
      Alert.alert('Düzenlemeler kaybolacak', 'Fiş üzerindeki değişiklikleri kaydetmeden çıkmak istiyor musunuz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çık', style: 'destructive', onPress: handleCancel }
      ]);
    } else {
      handleCancel();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => { confirmCancel(); return true; };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isDirty, merchant, date, total])
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fiş analiz ediliyor...</Text>
        </View>
      )}
      {!uri && (
        <View style={styles.center}>
          <Text style={styles.error}>Görsel bulunamadı.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Geri dön</Text>
          </TouchableOpacity>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => runAnalysis(false)}>
            <Text style={styles.buttonText}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {data && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View style={styles.titleRow}><TouchableOpacity style={styles.backButton} onPress={confirmCancel}><Ionicons name="arrow-back" size={25} color={COLORS.text} /></TouchableOpacity><Text style={styles.title}>Fişi kontrol et</Text></View>
          <View style={styles.receiptIntro}>{uri ? <Image source={{ uri }} style={styles.receiptThumb} resizeMode="cover" /> : null}<Text style={styles.helperText}>Bilgileri kontrol et,{`\n`}gerekirse düzenle.</Text></View>
          {data.warnings.length > 0 && <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Kontrol edilmesi gerekenler</Text>
            {data.warnings.map((warning, index) => <Text key={`${warning}-${index}`} style={styles.warningText}>• {warning}</Text>)}
          </View>}
          <View style={styles.formCard}>
            <Text style={styles.label}>Genel toplam</Text>
            <View style={styles.inputWrap}><TextInput value={total} onChangeText={setTotal} keyboardType="decimal-pad" style={[styles.input, styles.totalInput]} placeholder="0,00 TL" placeholderTextColor={COLORS.textSecondary} /><Ionicons name="pencil-outline" size={19} color={COLORS.primary} /></View>
            <Text style={styles.label}>İşletme</Text>
            <View style={styles.inputWrap}><TextInput value={merchant} onChangeText={setMerchant} style={styles.input} placeholder="İşletme adı" placeholderTextColor={COLORS.textSecondary} /><Ionicons name="pencil-outline" size={19} color={COLORS.primary} /></View>
            <Text style={styles.label}>Tarih</Text>
            <View style={styles.inputWrap}><TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="YYYY-AA-GG" placeholderTextColor={COLORS.textSecondary} /><Ionicons name="calendar-outline" size={19} color={COLORS.primaryDark} /></View>
          </View>
          
          <Text style={styles.sectionHeader}>Ürünler</Text>
          <ReceiptItemEditor
            initialItems={data.items.map((item, index) => ({
              id: `${draftId}-item-${index}`,
              description: item.description,
              amountMinor: item.amountMinor,
              categoryId: item.categoryId,
            }))}
            onSave={(items) => handleSave(items)}
            isSaving={isSaving}
            receiptTotalMinor={total.trim() ? (() => { try { return toMinorUnits(total); } catch { return null; } })() : null}
            onDirty={() => setIsDirty(true)}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={confirmCancel} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Vazgeç</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: SPACING.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backButton: { width: 42, height: 42, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  receiptIntro: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 },
  receiptThumb: { width: 112, height: 142, borderRadius: 12, backgroundColor: COLORS.surfaceMuted },
  helperText: { flex: 1, color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
  warningCard: { backgroundColor: '#FFF6E5', borderColor: '#E9A23B', borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  warningTitle: { color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.xs },
  warningText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  formCard: { marginBottom: SPACING.md },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 5, marginTop: 3 },
  inputWrap: { height: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.card, paddingRight: 13, marginBottom: 10 },
  input: { flex: 1, height: 48, paddingHorizontal: 13, color: COLORS.text, fontSize: 15 },
  totalInput: { fontSize: 22, fontWeight: '800' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.sm, color: COLORS.text },
  error: { color: COLORS.error, marginBottom: SPACING.md, textAlign: 'center' },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textSecondary },
  button: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  cancelButton: { height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { color: COLORS.textSecondary, fontWeight: 'bold' }
});
