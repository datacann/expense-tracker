import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceCurrency } from '../src/utils/money';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
  const router = useRouter();
  const { isPremium, loading } = useSubscription();
  const currency = getDeviceCurrency();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Ayarlar</Text>
      <Text style={styles.sectionLabel}>GENEL</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}><View style={styles.rowIcon}><Ionicons name="cash-outline" size={20} color={COLORS.primary} /></View><View style={styles.rowContent}><Text style={styles.rowTitle}>Para birimi</Text><Text style={styles.subscriptionHint}>Cihazının bölgesine göre otomatik</Text></View><Text style={styles.infoValue}>{currency.code}</Text></View>
      </View>
      <Text style={styles.sectionLabel}>ÜYELİK</Text>
      <View style={[styles.card, styles.premiumCard]}>
        <TouchableOpacity style={styles.subscriptionRow} onPress={() => router.push('/premium')} disabled={loading}>
          <View style={styles.premiumIcon}><Ionicons name="sparkles" size={22} color="#7A5A00" /></View><View style={styles.rowContent}><Text style={styles.rowTitle}>{isPremium ? 'Premium aktif' : 'Premium’a geç'}</Text><Text style={styles.subscriptionHint}>{isPremium ? 'Tüm Premium özellikleri kullanabilirsin' : 'Sesle ekle, hızlıca kaydet ve daha fazlasını keşfet'}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.currencyNote}>{currency.isFallback ? 'Cihaz bölgesi belirlenemediği için Türk Lirası kullanılıyor.' : `${currency.name}, cihaz bölgen (${currency.region}) üzerinden seçildi.`}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: SPACING.lg },
  pageTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: SPACING.lg },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  premiumCard: { backgroundColor: COLORS.accent, borderColor: COLORS.accentStrong },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  premiumIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE59A', alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, marginLeft: 12 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  subscriptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  subscriptionHint: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3 },
  currencyNote: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 10, paddingHorizontal: 4 },
});
