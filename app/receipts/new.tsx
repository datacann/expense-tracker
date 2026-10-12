import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { pickImage } from '../../src/services/receiptImageService';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

export default function NewReceipt() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelection = async (useCamera: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const uri = await pickImage(useCamera);
      if (uri) {
        router.push({ pathname: '/receipts/preview', params: { uri } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fişini tara</Text>
      <Text style={styles.subtitle}>Analiz için fişin fotoğrafını çek veya galerinden seç.</Text>
      
      <View style={styles.options}>
        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelection(true)} disabled={loading}>
            <Text style={styles.optionText}>📸 Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionButton, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]} onPress={() => handleSelection(false)} disabled={loading}>
            <Text style={[styles.optionText, { color: COLORS.text }]}>📁 Galeri</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  options: { gap: SPACING.md },
  optionButton: { height: 60, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  optionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});
