import React from 'react';
import { View, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptImagePreview } from '../../src/components/ReceiptImagePreview';

export default function Preview() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <ReceiptImagePreview uri={uri} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
        <Button title="Değiştir" onPress={() => router.back()} />
        <Button title="Devam et" onPress={() => router.push({ pathname: '/receipts/analyze', params: { uri } })} />
      </View>
    </View>
  );
}
