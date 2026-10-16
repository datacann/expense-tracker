import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CATEGORY_IDS } from '../constants/categories';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

const OPTIONS = Object.entries(CATEGORIES).map(([key, label]) => ({ label, value: CATEGORY_IDS[key as keyof typeof CATEGORIES] }));

export const CategoryPicker = ({ value, onValueChange, label = 'Kategori' }: Props) => {
  const [visible, setVisible] = useState(false);
  const selected = OPTIONS.find((item) => item.value === value)?.label ?? 'Kategori seç';
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}><Text style={styles.triggerText}>{selected}</Text><Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setVisible(false)}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Kategori seç</Text><TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity></View>
          <ScrollView>{OPTIONS.map((item) => <TouchableOpacity key={item.value} style={styles.option} onPress={() => { onValueChange(item.value); setVisible(false); }}><Text style={[styles.optionText, item.value === value && styles.selectedText]}>{item.label}</Text>{item.value === value && <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />}</TouchableOpacity>)}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  </View>;
};

const styles = StyleSheet.create({
  container: { marginVertical: SPACING.xs }, label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 5 },
  trigger: { height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, backgroundColor: COLORS.background, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, triggerText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' }, sheet: { maxHeight: '72%', backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 28 },
  sheetHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border }, sheetTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  option: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border }, optionText: { color: COLORS.text, fontSize: 15 }, selectedText: { color: COLORS.primary, fontWeight: '800' },
});
