# 1. Gün Devir Notu

## Tamamlananlar (MVP)
- **Proje Kurulumu:** React Native, Expo, TypeScript, Expo Router yapılandırıldı.
- **Veri Modeli:** `Expense` ve `ExpenseItem` modelleri oluşturuldu, kuruş bazlı hesaplama sistemi kuruldu.
- **Kalıcı Depolama:** `AsyncStorage` ile yerel veri yönetimi (Repository Pattern) sağlandı.
- **Ekranlar:** Manuel harcama ekleme, listeleme, detay görüntüleme, düzenleme, silme ve analiz ekranları tamamlandı.
- **Testler:** Para birimi dönüşümü ve analiz hesaplamaları için birim testleri yapıldı.

## Doğrulananlar
- TypeScript `tsc --noEmit` kontrolü başarılı.
- Para birimi dönüşüm ve analiz testleri başarılı.
- CRUD akışları (ekle, listele, düzenle, sil) mantıksal olarak test edildi.

## Doğrulanmayanlar (Kullanıcı Tarafından Kontrol Edilecek)
- **Cihaz Uyumu:** Fiziksel cihazda uygulama açılışı ve Expo Go ile test.
- **UI/UX:** Klavye davranışları, küçük ekranlarda görünüm ve genel tasarım.
- **Kalıcılık:** Uygulama tamamen kapatılıp açıldığında `AsyncStorage` verilerinin korunması.

## Bilinen Eksikler ve Yapılmayanlar
- **Fiş/Fotoğraf Analizi:** Uygulanmadı.
- **Sesli Giriş:** Uygulanmadı.
- **Premium Özellikler:** Uygulanmadı.
- **Backend Entegrasyonu:** Uygulanmadı.
- **Linting:** `eslint` kurulumunda bağımlılık çakışması yaşandı, yapılandırılamadı.

## Önerilen Commit Mesajı
`feat: complete manual expense tracking MVP (CRUD, analytics, storage)`
