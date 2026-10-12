import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';

export default function Settings() {
  const router = useRouter();
  const { isPremium, loading } = useSubscription();
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ayarlar</Text>
        <Text style={styles.subtitle}>Uygulama tercihleri için bu alan yakında genişletilecek.</Text>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Para birimi</Text><Text style={styles.infoValue}>Türk Lirası (TRY)</Text></View>
        <View style={styles.divider} />
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Veri saklama</Text><Text style={styles.infoValue}>Bu cihazda</Text></View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.subscriptionRow} onPress={() => router.push('/premium')} disabled={loading}>
          <View><Text style={styles.infoLabel}>Abonelik</Text><Text style={styles.subscriptionHint}>{isPremium ? 'Premium özellikler açık' : 'Sesle ekleme ve Premium özellikler'}</Text></View>
          <Text style={[styles.infoValue, isPremium && styles.premiumValue]}>{loading ? 'Kontrol ediliyor…' : isPremium ? 'Premium' : 'Yükselt ›'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border },
  subscriptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
  subscriptionHint: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3 },
  premiumValue: { color: COLORS.primary },
});
