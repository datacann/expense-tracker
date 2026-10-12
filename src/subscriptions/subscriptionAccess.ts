import type { CustomerInfo } from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export const hasPremiumEntitlement = (customerInfo: CustomerInfo | null): boolean =>
  Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
