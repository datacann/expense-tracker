import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES, CATEGORY_IDS } from '../constants/categories';

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export const CategoryPicker = ({ value, onValueChange }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kategori</Text>
      <Picker selectedValue={value} onValueChange={onValueChange}>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Picker.Item key={key} label={label} value={CATEGORY_IDS[key as keyof typeof CATEGORIES]} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontSize: 16, fontWeight: 'bold' },
});
