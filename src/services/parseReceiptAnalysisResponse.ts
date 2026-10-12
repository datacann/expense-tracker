import { CATEGORY_IDS } from '../constants/categories';
import type { ReceiptAnalysis } from '../types/receipt';

const VALID_CATEGORY_IDS = new Set(Object.values(CATEGORY_IDS));

const isValidCalendarDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isSafeNonNegativeInteger = (val: unknown): val is number => {
  return typeof val === 'number' && Number.isSafeInteger(val) && val >= 0;
};

/**
 * API yanıtını doğrular ve ReceiptAnalysis modeline dönüştürür.
 * Beklenmedik veya bozuk verilerde hata fırlatır.
 */
export const parseReceiptAnalysisResponse = (data: unknown): ReceiptAnalysis => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Geçersiz cevap: Cevap bir nesne olmalı');
  }

  const response = data as Record<string, unknown>;

  // 1. Temel Yapı Doğrulaması
  if (response.schemaVersion !== 1) {
    throw new Error('Geçersiz veya desteklenmeyen schemaVersion');
  }
  if (typeof response.requestId !== 'string' || response.requestId.trim().length === 0) {
    throw new Error('Geçersiz veya eksik requestId');
  }
  if (typeof response.analysis !== 'object' || response.analysis === null || Array.isArray(response.analysis)) {
    throw new Error('Geçersiz veya eksik analysis nesnesi');
  }

  const analysis = response.analysis as Record<string, unknown>;

  // 2. Alan Doğrulamaları
  let merchant: string | null = null;
  if (typeof analysis.merchant === 'string') {
    const trimmed = analysis.merchant.trim();
    merchant = trimmed.length > 0 ? trimmed : null;
  } else if (analysis.merchant !== null && analysis.merchant !== undefined) {
    throw new Error('Geçersiz merchant veri tipi');
  }

  // Date YYYY-MM-DD veya GG.AA.YYYY ve takvim kontrolü
  let date: string | null = null;
  if (typeof analysis.date === 'string') {
    let dateStr = analysis.date;
    console.log('DEBUG: Parsing date string:', dateStr);
    
    // GG.AA.YYYY formatı
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('.');
      dateStr = `${year}-${month}-${day}`; // Burası doğru olmalı: 2026-09-22
    }
    // DAA.GG.YYYY formatı ihtimali
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
       const [month, day, year] = dateStr.split('/');
       dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    console.log('DEBUG: Parsed date string:', dateStr);
    if (!isValidCalendarDate(dateStr)) {
      throw new Error(`Geçersiz takvim tarihi biçimi: ${dateStr}`);
    }
    date = dateStr;
  } else if (analysis.date !== null && analysis.date !== undefined) {
    throw new Error('Geçersiz date veri tipi');
  }

  // Currency: TRY ise 'TRY', başka string ise hata fırlat.
  let currency: 'TRY';
  if (analysis.currency === 'TRY' || analysis.currency === null || analysis.currency === undefined) {
    currency = 'TRY';
  } else {
    throw new Error(`Desteklenmeyen para birimi: ${analysis.currency}`);
  }

  // Total (nullable, safe non-negative integer)
  let totalMinor: number | null = null;
  if (analysis.totalMinor !== null && analysis.totalMinor !== undefined) {
    if (!isSafeNonNegativeInteger(analysis.totalMinor)) {
      throw new Error('Geçersiz totalMinor: Tam sayı ve güvenli aralıkta olmalı');
    }
    totalMinor = analysis.totalMinor;
  }

  // Items
  if (!Array.isArray(analysis.items)) {
    throw new Error('Geçersiz items: Dizi olmalı');
  }

  const warnings: string[] = Array.isArray(analysis.warnings)
    ? analysis.warnings.filter((w): w is string => typeof w === 'string')
    : [];

  let hadUnknownCategory = false;

  const items = analysis.items.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`Ürün ${index} geçersiz nesne`);
    }
    const itemObj = item as Record<string, unknown>;

    const rawText = typeof itemObj.rawText === 'string' ? itemObj.rawText : '';
    const description = typeof itemObj.description === 'string' && itemObj.description.trim().length > 0
      ? itemObj.description.trim()
      : 'Bilinmeyen Ürün';

    let amountMinor: number | null = null;
    if (itemObj.amountMinor !== null && itemObj.amountMinor !== undefined) {
      if (!isSafeNonNegativeInteger(itemObj.amountMinor)) {
        throw new Error(`Ürün ${index} için geçersiz amountMinor`);
      }
      amountMinor = itemObj.amountMinor;
    }

    let categoryId: string | null = null;
    if (typeof itemObj.categoryId === 'string') {
      if (VALID_CATEGORY_IDS.has(itemObj.categoryId)) {
        categoryId = itemObj.categoryId;
      } else {
        // Tanınmayan kategori ID'sini null yap ve uyarı ekle
        hadUnknownCategory = true;
        categoryId = null;
      }
    } else if (itemObj.categoryId !== null && itemObj.categoryId !== undefined) {
      throw new Error(`Ürün ${index} için geçersiz categoryId`);
    }

    return {
      rawText,
      description,
      amountMinor,
      categoryId,
    };
  });

  if (hadUnknownCategory) {
    warnings.push('Bazı ürünlerin kategorisi tanınmadığı için seçim yapılması gerekiyor.');
  }

  return {
    merchant,
    date,
    currency,
    totalMinor,
    items,
    warnings,
    isSample: false, // Sunucudan gelen isSample yetkilendirme olarak kabul edilmez.
  };
};