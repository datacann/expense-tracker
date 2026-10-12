# Görev Listesi

## Tamamlanan Görevler
- [x] Proje kurulumu (React Native + Expo + TypeScript + Expo Router).
- [x] Temel dosya yapısı (app/_layout.tsx, app/index.tsx).
- [x] Git repository başlatıldı.
- [x] Belgeler (`AGENTS.md`, `PLAN.md`, `TASKS.md`) oluşturuldu.

## Uygulanacak Görevler
- [x] Harcama modeli (tür, tutar, tarih, kategori) tanımlanması.
- [x] Manuel harcama ekleme formu oluşturulması.
- [x] Yerel depolama (AsyncStorage) entegrasyonu.
- [x] Harcama listesinin ekrana yansıtılması.
- [ ] Kamera/Fiş okuma entegrasyonu.
- [x] Aylık harcama limiti ve AI tasarruf önerileri (Görev 46–50; cihaz ve gerçek sağlayıcı kontrolü bekliyor).
- [x] RevenueCat Premium istemci akışı ve sesle ekleme entitlement kapısı (panel/store anahtarları ve development build bekliyor).

## Fiş Akışı 11–20 Doğrulama (2026-10-02)
- [x] TypeScript kontrolü ve mevcut yardımcı testler çalıştırıldı.
- [x] Toplam/fark, eksik toplam onayı, kategori dağılımı ve ay izolasyonu regresyon testleri eklendi.
- [x] Eski analiz isteğinin yeni sonucu ezmesi engellendi.
- [x] Örnek analiz production ortamında kapatıldı.
- [x] Fotoğrafı erken silebilen analyze cleanup effect'i kaldırıldı.
- [ ] Kamera/galeri izin ve iptal davranışlarını cihazda doğrula.
- [ ] Fiş kontrol/düzenleme ekranını analiz akışına bağla.
- [ ] Fişi tek Expense ve çoklu ExpenseItem olarak idempotent biçimde kaydet.
- [ ] Depolama hatası ve hızlı çift kaydetme regresyon testlerini ekle.
- [x] Seçilen fotoğrafı uygulamanın `cache/receipts` klasörüne kopyala ve sahiplik sınırını test et.
- [ ] Uygulamaya ait geçici kopyaları başarı/vazgeçmede güvenle temizle.
- [ ] Çok kalemli fiş düzenlemesinde diğer kalemleri koru.
- [ ] ESLint 9 yapılandırmasını ekleyip lint kontrolünü çalıştır.

## Örnek Fiş Kaydı (2026-10-02)
- [x] Örnek analiz, `validateReceiptDraft` sonrasında mevcut `ExpenseProvider.addExpense` yoluyla tek Expense ve çoklu ExpenseItem olarak kaydediliyor.
- [x] Depolama tamamlanmadan detay navigasyonu yapılmıyor; hata durumunda taslak ekranda korunuyor.
- [x] Kayıt sürerken tekrar gönderim ref ve disabled durumuyla engelleniyor.
- [x] Geçerli kayıt, geçersiz taslak ve depolama hatası izole testlerle doğrulandı.

Ayrıntılar: `docs/RECEIPT-TEST-REPORT.md`.

## İlk 10 Görev Doğrulaması (2026-10-05)
- [x] Kod/config incelemesi ve mevcut saf TypeScript testleri çalıştırıldı.
- [x] Para, yerel tarih ve aylık analiz kritik senaryoları otomatik testlerle doğrulandı.
- [x] Backend sağlık ve eksik sağlayıcı hata testleri doğrulandı.
- [x] Expo bağımlılık uyumu: `react-native-get-random-values` SDK 57 ile uyumlu `~1.11.0` sürümüne getirildi.
- [x] Provider yakın zamanlı mutasyonlarda kayıt kaybına karşı seri yazma kuyruğuyla düzeltildi ve izole depolama testleri eklendi.
- [x] Manuel hızlı çift gönderim koruması senkron kilitle eklendi ve hata sonrası retry ile test edildi.
- [x] Manuel forma opsiyonel işletme alanı eklendi; oluşturma/düzenleme/temizleme test edildi.
- [x] Detay ekranında yükleniyor/hata/bulunamadı ayrıldı; silme hatası ve tekrar silme koruması test edildi.
- [ ] Fiziksel cihaz akışı doğrulanmalı.

Ayrıntılar: `docs/TEST-REPORT-01-10.md`.
