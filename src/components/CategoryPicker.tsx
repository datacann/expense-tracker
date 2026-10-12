import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES, CATEGORY_IDS } from '../constants/categories';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export const CategoryPicker = ({ value, onValueChange }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kategori</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={value} onValueChange={onValueChange} style={styles.picker}>
            {Object.entries(CATEGORIES).map(([key, label]) => (
            <Picker.Item key={key} label={label} value={CATEGORY_IDS[key as keyof typeof CATEGORIES]} />
            ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: SPACING.xs },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, backgroundColor: COLORS.background },
  picker: { height: 44 },
});
