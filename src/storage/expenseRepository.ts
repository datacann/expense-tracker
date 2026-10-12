import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types/expense';

const STORAGE_KEY = '@expenses_data';
const SCHEMA_VERSION = 1;

interface StorageData {
  expenses: Expense[];
  schemaVersion: number;
}

export interface ExpenseRepository {
  getAll(): Promise<Expense[]>;
  saveAll(expenses: Expense[]): Promise<void>;
}

export interface ExpenseStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const createExpenseRepository = (storage: ExpenseStorage): ExpenseRepository => ({
  async getAll(): Promise<Expense[]> {
    const data = await storage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as StorageData;
    return parsed.expenses;
  },

  async saveAll(expenses: Expense[]): Promise<void> {
    const data: StorageData = {
      expenses,
      schemaVersion: SCHEMA_VERSION,
    };
    await storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
});

export const expenseRepository = createExpenseRepository(AsyncStorage);
