import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { pickImage } from '../../src/services/receiptImageService';

export default function NewReceipt() {
  const router = useRouter();

  const handleSelection = async (useCamera: boolean) => {
    try {
      const uri = await pickImage(useCamera);
      if (uri) {
        router.push({ pathname: '/receipts/preview', params: { uri } });
      }
    } catch {
      Alert.alert('Hata', 'Fotoğraf hazırlanamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 20, padding: 20 }}>
      <Button title="Kamera ile Çek" onPress={() => handleSelection(true)} />
      <Button title="Galeriden Seç" onPress={() => handleSelection(false)} />
    </View>
  );
}
