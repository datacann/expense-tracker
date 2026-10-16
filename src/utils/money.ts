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

const REGION_CURRENCY: Record<string, { code: string; name: string }> = {
  TR: { code: 'TRY', name: 'Türk Lirası' }, US: { code: 'USD', name: 'ABD Doları' },
  GB: { code: 'GBP', name: 'İngiliz Sterlini' }, CA: { code: 'CAD', name: 'Kanada Doları' },
  AU: { code: 'AUD', name: 'Avustralya Doları' }, JP: { code: 'JPY', name: 'Japon Yeni' },
  CH: { code: 'CHF', name: 'İsviçre Frangı' }, DE: { code: 'EUR', name: 'Euro' },
  FR: { code: 'EUR', name: 'Euro' }, IT: { code: 'EUR', name: 'Euro' }, ES: { code: 'EUR', name: 'Euro' },
  NL: { code: 'EUR', name: 'Euro' }, BE: { code: 'EUR', name: 'Euro' }, AT: { code: 'EUR', name: 'Euro' },
};

export const getDeviceCurrency = () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'tr-TR';
  const region = locale.split(/[-_]/)[1]?.toUpperCase() || 'TR';
  const currency = REGION_CURRENCY[region] ?? REGION_CURRENCY.TR;
  return { ...currency, locale, region, isFallback: !REGION_CURRENCY[region] };
};

export const formatCurrency = (amountMinor: number): string => {
  const { locale, code } = getDeviceCurrency();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(amountMinor / 100);
};
