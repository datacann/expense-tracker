import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AdUnitKind = 'banner' | 'interstitial';

export const isExpoGo = Constants.appOwnership === 'expo';

export const getProductionAdUnitId = (kind: AdUnitKind): string | null => {
  const extra = Constants.expoConfig?.extra;
  const key = Platform.OS === 'ios'
    ? kind === 'banner' ? 'ADMOB_IOS_BANNER_ID' : 'ADMOB_IOS_INTERSTITIAL_ID'
    : kind === 'banner' ? 'ADMOB_ANDROID_BANNER_ID' : 'ADMOB_ANDROID_INTERSTITIAL_ID';
  const value = extra?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};
