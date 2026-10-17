import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSubscription } from '../providers/SubscriptionProvider';
import { getProductionAdUnitId, isExpoGo } from '../services/adConfig';
import { COLORS } from '../constants/theme';
import { useAds } from '../providers/AdProvider';

export function AdBanner() {
  const { isPremium } = useSubscription();
  const { canRequestAds } = useAds();
  const [ads, setAds] = useState<any>(null);

  useEffect(() => {
    if (!isExpoGo && !isPremium && canRequestAds) {
      try { setAds(require('react-native-google-mobile-ads')); } catch { setAds(null); }
    } else {
      setAds(null);
    }
  }, [canRequestAds, isPremium]);

  if (!ads || isPremium || !canRequestAds) return null;
  const unitId = __DEV__ ? ads.TestIds.ADAPTIVE_BANNER : getProductionAdUnitId('banner');
  if (!unitId) return null;
  const BannerAd = ads.BannerAd;
  return <View style={styles.container}><BannerAd unitId={unitId} size={ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: false }} /></View>;
}

const styles = StyleSheet.create({
  container: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
});
