import { Tabs } from 'expo-router';
import { ExpenseProvider } from '../src/providers/ExpenseProvider';

export default function Layout() {
  return (
    <ExpenseProvider>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Tabs.Screen name="expenses" options={{ title: 'Harcamalar', headerShown: false }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analizler' }} />
      </Tabs>
    </ExpenseProvider>
  );
}
