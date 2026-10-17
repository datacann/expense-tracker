import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Premium() {
  const router = useRouter();
  const { returnTo, month } = useLocalSearchParams<{ returnTo?: string; month?: string }>();
  const { configured, loading, isPremium, packages, error, purchase, restore, refresh } = useSubscription();
  const continueAfterPurchase = () => {
    if (returnTo === 'voice') return router.replace('/voice/new');
    if (returnTo === 'suggestions') return router.replace({ pathname: '/suggestions', params: { month: month ?? '' } });
    router.back();
  };
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="sparkles" size={26} color="#7A5A00" /></View><Text style={styles.badge}>PREMIUM</Text><Text style={styles.title}>Harcamalarını saniyeler içinde kaydet</Text><Text style={styles.subtitle}>Daha az uğraş, bütçene daha çok odaklan.</Text></View>
    <View style={styles.card}><Feature icon="mic-outline" title="Sesle hızlı ekleme" text="Tutarı ve açıklamayı söyle; kaydın hazır olsun." /><Feature icon="bulb-outline" title="Kişisel tasarruf önerileri" text="Harcama alışkanlıklarına göre uygulanabilir öneriler al." /><Feature icon="ban-outline" title="Reklamsız kullanım" text="Banner ve geçiş reklamları olmadan bütçene odaklan." /><Feature icon="refresh-outline" title="Tüm cihazlarında geri yükle" text="Üyeliğini App Store hesabınla kolayca geri getir." /><Text style={styles.note}>Kesin fiyat ve abonelik dönemi App Store ödeme ekranında gösterilir.</Text></View>
    {isPremium && <View style={styles.successCard}><Text style={styles.successTitle}>Premium aktif</Text><Text style={styles.note}>Sesle ekleme, kişisel tasarruf önerileri ve reklamsız kullanım aktif.</Text><TouchableOpacity style={styles.primaryButton} onPress={continueAfterPurchase}><Text style={styles.primaryText}>Devam Et</Text></TouchableOpacity></View>}
    {!configured && <View style={styles.warningCard}><Text style={styles.warningTitle}>Satın alma bu sürümde kullanılamıyor</Text><Text style={styles.note}>RevenueCat anahtarları ekli. Ancak uygulama şu anda Expo Go içinde çalışıyor; App Store paketleri yalnızca telefona yüklenen development build veya TestFlight sürümünde görüntülenebilir.</Text></View>}
    {error && <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => void refresh()}><Text style={styles.link}>Tekrar dene</Text></TouchableOpacity></View>}
    {loading && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}
    {!isPremium && packages.map((item) => {
      const isYearly = item.packageType === 'ANNUAL' || item.product.identifier.toLowerCase().includes('year');
      const isMonthly = item.packageType === 'MONTHLY' || item.product.identifier.toLowerCase().includes('month');

      return (
        <TouchableOpacity
          key={item.identifier}
          style={[styles.packageCard, isYearly && { borderColor: COLORS.accent, borderWidth: 2 }]}
          disabled={loading}
          onPress={async () => {
            const active = await purchase(item);
            if (active) Alert.alert('Premium aktif', 'Aboneliğin başarıyla etkinleştirildi.', [{ text: 'Devam Et', onPress: continueAfterPurchase }]);
          }}
        >
          <View style={styles.packageInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.packageTitle}>{item.product.title}</Text>
              {isYearly && (
                <View style={{ backgroundColor: '#FFE59A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#7A5A00' }}>%40 İNDİRİM</Text>
                </View>
              )}
            </View>
            <Text style={styles.packageDescription}>
              {item.product.description || (isYearly ? 'Yıllık plan ile avantajlı kullanım' : 'Aylık yenilenen tam erişim')}
            </Text>
            {isYearly && (
              <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>
                En çok tercih edilen • 2 ay bedava
              </Text>
            )}
          </View>
          <Text style={styles.price}>{item.product.priceString}</Text>
        </TouchableOpacity>
      );
    })}
    {!isPremium && <TouchableOpacity style={styles.restoreButton} disabled={loading} onPress={async () => { const active = await restore(); if (active) Alert.alert('Premium aktif', 'Satın alımın geri yüklendi.'); }}><Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text></TouchableOpacity>}
    <Text style={styles.legal}>Satın alma işlemi Apple App Store veya Google Play hesabın üzerinden gerçekleştirilir.</Text>
  </ScrollView>;
}
function Feature({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) { return <View style={styles.featureRow}><View style={styles.featureIcon}><Ionicons name={icon} size={21} color={COLORS.primary} /></View><View style={styles.featureBody}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View></View>; }
const styles = StyleSheet.create({container:{flex:1,backgroundColor:COLORS.background},content:{padding:20,paddingBottom:SPACING.xl},hero:{backgroundColor:COLORS.primary,borderRadius:24,padding:24},heroIcon:{width:48,height:48,borderRadius:24,backgroundColor:'#FFE59A',alignItems:'center',justifyContent:'center',marginBottom:16},badge:{color:COLORS.accent,fontSize:11,fontWeight:'800',letterSpacing:1.5},title:{color:'#fff',fontSize:29,fontWeight:'800',marginTop:SPACING.sm,lineHeight:35},subtitle:{color:'#DDE8E2',fontSize:15,lineHeight:22,marginTop:SPACING.sm},card:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:18,borderWidth:1,borderColor:COLORS.border,marginTop:SPACING.md,gap:16},featureRow:{flexDirection:'row',alignItems:'center'},featureIcon:{width:42,height:42,borderRadius:21,backgroundColor:COLORS.accent,alignItems:'center',justifyContent:'center'},featureBody:{flex:1,marginLeft:12},featureTitle:{color:COLORS.text,fontWeight:'800',fontSize:14},featureText:{color:COLORS.textSecondary,fontSize:11,lineHeight:16,marginTop:2},note:{color:COLORS.textSecondary,fontSize:11,lineHeight:17},successCard:{backgroundColor:COLORS.accent,borderRadius:RADIUS.md,padding:SPACING.md,marginTop:SPACING.md},successTitle:{color:COLORS.primary,fontSize:18,fontWeight:'bold'},warningCard:{backgroundColor:'#FFF6E5',borderColor:'#E9A23B',borderWidth:1,borderRadius:RADIUS.md,padding:SPACING.md,marginTop:SPACING.md},warningTitle:{color:COLORS.text,fontWeight:'bold',marginBottom:SPACING.xs},errorCard:{backgroundColor:'#FFF6F5',borderColor:COLORS.error,borderWidth:1,borderRadius:RADIUS.md,padding:SPACING.md,marginTop:SPACING.md},errorText:{color:COLORS.error,fontSize:13},link:{color:COLORS.primary,fontWeight:'bold',marginTop:SPACING.sm},loader:{marginVertical:SPACING.lg},packageCard:{backgroundColor:COLORS.card,borderColor:COLORS.primary,borderWidth:1.5,borderRadius:RADIUS.md,padding:SPACING.md,marginTop:SPACING.md,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:SPACING.sm},packageInfo:{flex:1},packageTitle:{color:COLORS.text,fontWeight:'bold'},packageDescription:{color:COLORS.textSecondary,fontSize:11,marginTop:3},price:{color:COLORS.primary,fontWeight:'bold'},primaryButton:{backgroundColor:COLORS.primary,borderRadius:RADIUS.md,height:48,alignItems:'center',justifyContent:'center',marginTop:SPACING.md},primaryText:{color:'#fff',fontWeight:'bold'},restoreButton:{height:48,alignItems:'center',justifyContent:'center',marginTop:SPACING.md},restoreText:{color:COLORS.primary,fontWeight:'bold'},legal:{color:COLORS.textSecondary,fontSize:10,lineHeight:15,textAlign:'center',marginTop:SPACING.md}});
