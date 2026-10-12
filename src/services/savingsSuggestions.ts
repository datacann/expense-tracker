import Constants from 'expo-constants';
import { buildSavingsSummary } from './savingsSummary';
export { buildSavingsSummary, savingsSnapshotKey } from './savingsSummary';

export interface SavingsSuggestion { categoryId: string; categoryName: string; basis: string; change: string; reductionPercent: number; estimatedSavingMinor: number }
export interface SuggestionResponse { requestId: string; month: string; suggestions: SavingsSuggestion[]; message?: string }

export const requestSavingsSuggestions = async (summary: ReturnType<typeof buildSavingsSummary>, signal?: AbortSignal): Promise<SuggestionResponse> => {
  if (summary.recordCount === 0) throw new Error('Bu ay öneri oluşturmak için harcama bulunmuyor.');
  const baseUrl = Constants.expoConfig?.extra?.API_BASE_URL;
  if (!baseUrl) throw new Error('API adresi yapılandırılmamış.');
  const response = await fetch(`${baseUrl}/v1/savings/suggestions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(summary), signal,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.error?.message === 'string' ? body.error.message : `Sunucu hatası (${response.status})`);
  if (!Array.isArray(body?.suggestions)) throw new Error('Öneri servisi geçersiz cevap döndürdü.');
  return body as SuggestionResponse;
};
