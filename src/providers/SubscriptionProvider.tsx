import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { hasPremiumEntitlement } from '../subscriptions/subscriptionAccess';

interface SubscriptionContextValue {
  configured: boolean; loading: boolean; isPremium: boolean; packages: PurchasesPackage[]; error: string | null;
  refresh: () => Promise<void>; purchase: (purchasePackage: PurchasesPackage) => Promise<boolean>; restore: () => Promise<boolean>;
}
const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const getPlatformApiKey = (): string => {
  const extra = Constants.expoConfig?.extra;
  if (Platform.OS === 'ios') return extra?.REVENUECAT_IOS_API_KEY ?? '';
  if (Platform.OS === 'android') return extra?.REVENUECAT_ANDROID_API_KEY ?? '';
  return '';
};
const readableError = (error: unknown) => {
  if (typeof error === 'object' && error && 'userCancelled' in error && error.userCancelled) return null;
  return error instanceof Error ? error.message : 'Abonelik servisine ulaşılamadı.';
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const apiKey = getPlatformApiKey();
  const configured = Boolean(apiKey);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!configured) { setError('RevenueCat platform anahtarı henüz yapılandırılmadı.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
      setCustomerInfo(info); setPackages(offerings.current?.availablePackages ?? []);
      if (!offerings.current) setError('RevenueCat üzerinde aktif bir offering bulunamadı.');
    } catch (caught) { setError(readableError(caught) ?? 'Abonelik bilgisi alınamadı.'); }
    finally { setLoading(false); }
  }, [configured]);

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    void Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener); void refresh();
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [apiKey, configured, refresh]);

  const purchase = async (purchasePackage: PurchasesPackage) => {
    setLoading(true); setError(null);
    try { const { customerInfo: info } = await Purchases.purchasePackage(purchasePackage); setCustomerInfo(info); return hasPremiumEntitlement(info); }
    catch (caught) { const message = readableError(caught); if (message) setError(message); return false; }
    finally { setLoading(false); }
  };
  const restore = async () => {
    if (!configured) { setError('RevenueCat platform anahtarı henüz yapılandırılmadı.'); return false; }
    setLoading(true); setError(null);
    try { const info = await Purchases.restorePurchases(); setCustomerInfo(info); const active = hasPremiumEntitlement(info); if (!active) setError('Bu mağaza hesabında aktif Premium abonelik bulunamadı.'); return active; }
    catch (caught) { setError(readableError(caught) ?? 'Satın alımlar geri yüklenemedi.'); return false; }
    finally { setLoading(false); }
  };
  const value = useMemo(() => ({ configured, loading, isPremium: hasPremiumEntitlement(customerInfo), packages, error, refresh, purchase, restore }), [configured, loading, customerInfo, packages, error, refresh]);
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
export const useSubscription = () => { const context = useContext(SubscriptionContext); if (!context) throw new Error('useSubscription must be used within SubscriptionProvider'); return context; };
