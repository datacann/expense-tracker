export const toMinorUnits = (value: string): number => {
  // Replace comma with dot
  const normalized = value.replace(',', '.');
  
  // Validation: Only digits and at most one dot, max 2 decimals
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error('Geçersiz tutar formatı');
  }
  
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Tutar pozitif olmalıdır');
  }
  
  return Math.round(parsed * 100);
};

export const formatCurrency = (amountMinor: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amountMinor / 100);
};
