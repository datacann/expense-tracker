import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types/expense';

const STORAGE_KEY = '@expenses_data';
const SCHEMA_VERSION = 1;

interface StorageData {
  expenses: Expense[];
  schemaVersion: number;
}

export const expenseRepository = {
  async getAll(): Promise<Expense[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as StorageData;
    return parsed.expenses;
  },

  async saveAll(expenses: Expense[]): Promise<void> {
    const data: StorageData = {
      expenses,
      schemaVersion: SCHEMA_VERSION,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
