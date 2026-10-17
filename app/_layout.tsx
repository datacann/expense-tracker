import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { ExpenseProvider } from '../src/providers/ExpenseProvider';
import { SubscriptionProvider } from '../src/providers/SubscriptionProvider';
import { COLORS } from '../src/constants/theme';
import { AdProvider } from '../src/providers/AdProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SubscriptionProvider>
      <AdProvider>
        <ExpenseProvider>
        <Tabs
          screenOptions={{
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              height: 70,
              paddingBottom: 10,
              paddingTop: 7,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            headerStyle: { backgroundColor: COLORS.background },
            headerTitleStyle: { color: COLORS.text, fontWeight: 'bold' },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Özet', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="expenses" options={{ title: 'Geçmiş', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="analytics" options={{ title: 'Analiz', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="settings" options={{ title: 'Ayarlar', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="receipts/new" options={{ href: null }} />
          <Tabs.Screen name="receipts/analyze" options={{ href: null }} />
          <Tabs.Screen name="receipts/preview" options={{ href: null }} />
          <Tabs.Screen name="expenses/[id]" options={{ href: null }} />
          <Tabs.Screen name="expenses/new" options={{ href: null, title: 'Yeni harcama' }} />
          <Tabs.Screen name="expenses/category-detail" options={{ href: null }} />
          <Tabs.Screen name="suggestions" options={{ href: null, title: 'Tasarruf Önerileri' }} />
          <Tabs.Screen name="premium" options={{ href: null, title: 'Premium' }} />
          <Tabs.Screen name="voice/new" options={{ href: null, title: 'Sesle harcama ekle' }} />
          <Tabs.Screen name="voice/analyze" options={{ href: null, title: 'Ses kaydını kontrol et' }} />
        </Tabs>
        </ExpenseProvider>
      </AdProvider>
    </SubscriptionProvider>
  );
}
