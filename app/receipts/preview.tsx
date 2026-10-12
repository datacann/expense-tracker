import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptImagePreview } from '../../src/components/ReceiptImagePreview';
import { pickImage, cleanupReceiptFile } from '../../src/services/receiptImageService';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

export default function Preview() {
  const { uri: initialUri } = useLocalSearchParams<{ uri: string }>();
  const [uri, setUri] = useState(initialUri);
  const router = useRouter();

  const handleCancel = async () => {
    await cleanupReceiptFile(uri);
    router.back();
  };

  const handleReplace = async () => {
    Alert.alert(
      'Fotoğrafı Değiştir',
      'Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Değiştir',
          onPress: async () => {
            const newUri = await pickImage(false); // Galeri üzerinden
            if (newUri) {
              const oldUri = uri;
              setUri(newUri);
              await cleanupReceiptFile(oldUri);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        <ReceiptImagePreview uri={uri} />
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReplace}>
            <Text style={styles.secondaryButtonText}>Değiştir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Vazgeç</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/receipts/analyze', params: { uri } })}>
            <Text style={styles.primaryButtonText}>Analiz Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    previewContainer: { flex: 1, padding: SPACING.md },
    footer: { padding: SPACING.md, backgroundColor: COLORS.card, flexDirection: 'row', gap: SPACING.xs, borderTopWidth: 1, borderColor: COLORS.border },
    primaryButton: { flex: 2, height: 48, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
    secondaryButton: { flex: 1, height: 48, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    secondaryButtonText: { color: COLORS.text, fontWeight: 'bold' },
    cancelButton: { flex: 1, height: 48, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    cancelButtonText: { color: COLORS.error, fontWeight: 'bold' },
});
