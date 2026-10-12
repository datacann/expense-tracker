import { Tabs } from 'expo-router';
import { ExpenseProvider } from '../src/providers/ExpenseProvider';
import { COLORS } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionProvider } from '../src/providers/SubscriptionProvider';

export default function Layout() {
  return (
    <SubscriptionProvider>
    <ExpenseProvider>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTitleStyle: {
            color: COLORS.text,
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Özet',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="expenses" 
          options={{ 
            title: 'Geçmiş', 
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="analytics" 
          options={{ 
            title: 'Analiz',
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="settings" 
          options={{ 
            title: 'Ayarlar',
            tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />
          }} 
        />
        {/* Diğer ekranların tab barında görünmesini engellemek için: */}
        <Tabs.Screen name="receipts/new" options={{ href: null }} />
        <Tabs.Screen name="receipts/analyze" options={{ href: null }} />
        <Tabs.Screen name="receipts/preview" options={{ href: null }} />
        <Tabs.Screen name="expenses/[id]" options={{ href: null }} />
        <Tabs.Screen name="expenses/new" options={{ href: null }} />
        <Tabs.Screen name="expenses/category-detail" options={{ href: null }} />
        <Tabs.Screen name="suggestions" options={{ href: null, title: 'Tasarruf Önerileri' }} />
        <Tabs.Screen name="premium" options={{ href: null, title: 'Premium' }} />
      </Tabs>
    </ExpenseProvider>
    </SubscriptionProvider>
  );
}
