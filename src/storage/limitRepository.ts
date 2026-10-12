import AsyncStorage from '@react-native-async-storage/async-storage';

export const MONTHLY_LIMITS_STORAGE_KEY = 'monthly_limits_storage';
export type MonthlyLimits = Record<string, number>;

const isValidMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const isValidAmount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

const parseLimits = (data: string | null): MonthlyLimits => {
  if (!data) return {};
  const parsed: unknown = JSON.parse(data);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Limit verisi geçersiz');
  return Object.fromEntries(Object.entries(parsed).filter(([month, amount]) => isValidMonth(month) && isValidAmount(amount)));
};

export const createLimitRepository = (storage = AsyncStorage) => ({
  async getAll(): Promise<MonthlyLimits> {
    return parseLimits(await storage.getItem(MONTHLY_LIMITS_STORAGE_KEY));
  },
  async getLimit(yearMonth: string): Promise<number | null> {
    return (await this.getAll())[yearMonth] ?? null;
  },
  async setLimit(yearMonth: string, amountMinor: number): Promise<void> {
    if (!isValidMonth(yearMonth) || !isValidAmount(amountMinor)) throw new Error('Geçersiz aylık limit');
    const limits = await this.getAll();
    limits[yearMonth] = amountMinor;
    await storage.setItem(MONTHLY_LIMITS_STORAGE_KEY, JSON.stringify(limits));
  },
  async removeLimit(yearMonth: string): Promise<void> {
    if (!isValidMonth(yearMonth)) throw new Error('Geçersiz ay');
    const limits = await this.getAll();
    delete limits[yearMonth];
    await storage.setItem(MONTHLY_LIMITS_STORAGE_KEY, JSON.stringify(limits));
  }
});

export const limitRepository = createLimitRepository();
