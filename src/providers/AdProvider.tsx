import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSubscription } from './SubscriptionProvider';
import { getProductionAdUnitId, isExpoGo } from '../services/adConfig';

const ACTION_COUNT_KEY = 'ad_interstitial_action_count';
const LAST_SHOWN_KEY = 'ad_interstitial_last_shown_at';
const ACTIONS_REQUIRED = 5;
const MIN_INTERVAL_MS = 15 * 60 * 1000;

const AdContext = createContext({ canRequestAds: false, maybeShowInterstitial: async () => false });

export function AdProvider({ children }: { children: ReactNode }) {
  const { isPremium } = useSubscription();
  const [canRequestAds, setCanRequestAds] = useState(false);
  const interstitialRef = useRef<any>(null);
  const loadedRef = useRef(false);

  const loadInterstitial = useCallback(() => {
    if (!interstitialRef.current || loadedRef.current) return;
    interstitialRef.current.load();
  }, []);

  useEffect(() => {
    setCanRequestAds(false);
    if (isExpoGo || isPremium) return;
    let active = true;
    let cleanups: Array<() => void> = [];
    void (async () => {
      try {
        const ads = require('react-native-google-mobile-ads');
        const productionId = getProductionAdUnitId('interstitial');
        const unitId = __DEV__ ? ads.TestIds.INTERSTITIAL : productionId;
        if (!unitId) return;
        const consent = await ads.AdsConsent.requestInfoUpdate();
        const finalConsent = consent.isConsentFormAvailable
          ? await ads.AdsConsent.loadAndShowConsentFormIfRequired()
          : consent;
        if (!finalConsent.canRequestAds || !active) return;
        await ads.default().initialize();
        if (!active) return;
        setCanRequestAds(true);
        const interstitial = ads.InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: false });
        interstitialRef.current = interstitial;
        cleanups = [
          interstitial.addAdEventListener(ads.AdEventType.LOADED, () => { loadedRef.current = true; }),
          interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => { loadedRef.current = false; if (active) interstitial.load(); }),
          interstitial.addAdEventListener(ads.AdEventType.ERROR, () => { loadedRef.current = false; }),
        ];
        interstitial.load();
      } catch {
        loadedRef.current = false;
      }
    })();
    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
      interstitialRef.current = null;
      loadedRef.current = false;
      setCanRequestAds(false);
    };
  }, [isPremium]);

  const maybeShowInterstitial = useCallback(async () => {
    try {
      if (isExpoGo || isPremium) return false;
      const currentCount = Number(await AsyncStorage.getItem(ACTION_COUNT_KEY) ?? '0') + 1;
      const lastShownAt = Number(await AsyncStorage.getItem(LAST_SHOWN_KEY) ?? '0');
      const eligible = currentCount >= ACTIONS_REQUIRED && Date.now() - lastShownAt >= MIN_INTERVAL_MS;
      if (!eligible || !loadedRef.current || !interstitialRef.current) {
        await AsyncStorage.setItem(ACTION_COUNT_KEY, String(currentCount));
        return false;
      }
      await AsyncStorage.multiSet([[ACTION_COUNT_KEY, '0'], [LAST_SHOWN_KEY, String(Date.now())]]);
      loadedRef.current = false;
      await interstitialRef.current.show();
      return true;
    } catch {
      loadInterstitial();
      return false;
    }
  }, [isPremium, loadInterstitial]);

  const value = useMemo(() => ({ canRequestAds, maybeShowInterstitial }), [canRequestAds, maybeShowInterstitial]);
  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export const useAds = () => useContext(AdContext);
