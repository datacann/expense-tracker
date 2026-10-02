import React, { useRef, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReceiptAnalysis } from '../../src/hooks/useReceiptAnalysis';
import { useExpense } from '../../src/providers/ExpenseProvider';
import { saveReceiptAnalysis } from '../../src/services/receiptSaveFlow';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function Analyze() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { data, loading, error, startAnalysis } = useReceiptAnalysis();
  const { addExpense } = useExpense();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSave = async () => {
    if (!data || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    const result = await saveReceiptAnalysis(data, {
      addExpense,
      navigateToExpense: (expenseId) => {
        router.replace({ pathname: '/expenses/[id]', params: { id: expenseId } });
      },
      createId: uuidv4,
      now: () => new Date(),
    });

    if (result.status !== 'saved') {
      Alert.alert('Hata', result.message);
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      {!data && !loading && !error && (
        <Button title="Örnek veriyle dene" onPress={() => startAnalysis(uri, true)} />
      )}
      {loading && <ActivityIndicator size="large" />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {data && (
        <View>
          <Text>İşletme: {data.merchant}</Text>
          <Text>Toplam: {data.totalMinor ? data.totalMinor / 100 : 0} TL</Text>
          {data.warnings.map((warning) => <Text key={warning}>{warning}</Text>)}
          <Button title={isSaving ? 'Kaydediliyor...' : 'Kaydet'} onPress={handleSave} disabled={isSaving} />
        </View>
      )}
    </View>
  );
}
