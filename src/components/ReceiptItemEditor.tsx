import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, FlatList, Text } from 'react-native';
import { ReceiptItem } from '../types/receipt';
import { CategoryPicker } from './CategoryPicker';
import { toMinorUnits } from '../utils/money';

interface Props {
  initialItems: ReceiptItem[];
  onSave: (items: ReceiptItem[]) => void;
}

export const ReceiptItemEditor = ({ initialItems, onSave }: Props) => {
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { rawText: '', description: '', amountMinor: 0, categoryId: 'cat_other' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <TextInput value={item.description} onChangeText={(v) => updateItem(index, 'description', v)} style={styles.input} placeholder="Açıklama" />
            <TextInput 
              value={(item.amountMinor ? item.amountMinor / 100 : '').toString()} 
              onChangeText={(v) => updateItem(index, 'amountMinor', toMinorUnits(v))} 
              keyboardType="numeric" 
              style={styles.input} 
              placeholder="Tutar"
            />
            <CategoryPicker value={item.categoryId || 'cat_other'} onValueChange={(v) => updateItem(index, 'categoryId', v)} />
            <Button title="Sil" color="red" onPress={() => removeItem(index)} />
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
      />
      <Button title="Ürün Ekle" onPress={addItem} />
      <Button title="Kaydet" onPress={() => onSave(items)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  itemRow: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  input: { borderWidth: 1, padding: 5, marginVertical: 2 }
});
