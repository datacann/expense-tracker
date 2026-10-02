# Görev Listesi

## Tamamlanan Görevler
- [x] Proje kurulumu (React Native + Expo + TypeScript + Expo Router).
- [x] Temel dosya yapısı (app/_layout.tsx, app/index.tsx).
- [x] Git repository başlatıldı.
- [x] Belgeler (`AGENTS.md`, `PLAN.md`, `TASKS.md`) oluşturuldu.

## Uygulanacak Görevler
- [x] Harcama modeli (tür, tutar, tarih, kategori) tanımlanması.
- [x] Manuel harcama ekleme formu oluşturulması.
- [x] Yerel veritabanı (expo-sqlite) entegrasyonu.
- [x] Harcama listesinin ekrana yansıtılması.
- [ ] Kamera/Fiş okuma entegrasyonu.
- [ ] İstatistik ve grafik ekranı.

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
