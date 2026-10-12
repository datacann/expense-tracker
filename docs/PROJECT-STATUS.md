# Proje Durumu (PROJECT-STATUS.md)

## Ürün Amacı ve Kapsam
Kişisel harcama takip uygulaması.
- Manuel harcama girişi.
- Fiş fotoğrafı/kamera ile harcama okuma.
- Harcama kategorileri ve geçmişi.
- Basit grafiksel özetler.

## Mevcut Teknik Yapı
- **Framework:** React Native, Expo (SDK 57).
- **Depolama:** AsyncStorage.
- **Navigasyon:** Expo Router.
- **Dil:** TypeScript.

## Uygulanmış ve Doğrulanmış Akışlar
- **Aylık Filtreleme:** Harcama geçmişi için takvim ayı bazlı filtreleme, ay geçişleri ve istatistik özeti eklendi. (Uygulandı; cihazda doğrulanmadı).
- **Manuel Tek Kalem Düzenleme:** Mevcut `ExpenseForm` yolu korunuyor; açıklama, tutar, kategori ve tarih güncellemesi otomatik akış testiyle doğrulandı.
- **Fiş Analizi:** Örnek (mock) analiz yapısı mevcut; üretim ortamında örnek analiz kapatıldı.
- **Çok Kalemli Düzenleme:** Gerçek detay ekranı `saveExpenseEdits` üzerinden mevcut `ExpenseProvider.updateExpense` yoluna bağlı. 60/140/100 TL kaydında ikinci ürün 160 TL yapıldığında üç ürünün korunması ve toplamın 320 TL olması otomatik testle doğrulandı. Açıklama/kategori/tutar değişimi, satır ekleme-silme izolasyonu, geçersiz formun engellenmesi, depolama hatasında orijinal kayıt ve taslak korunumu ile Expense metadata korunumu da otomatik testle doğrulandı.
- **Yükleme Koruması:** Veri yükleme hatalarında eski verilerin korunması, "Tekrar dene" aksiyonu, yükleme sırasında işlem engelleme ve JSON çözümleme hata yönetimi eklendi. (Uygulandı; cihazda doğrulanmadı).
- **Fiş Analizi API Doğrulama (Contract Validation):** Sunucudan gelen fiş analizi JSON yanıtını doğrulamadan forma aktarmayı engelleyen `parseReceiptAnalysisResponse` fonksiyonu yazıldı. schemaVersion, takvim tarihi, tam sayı kuruş, güvenli tam sayı sınırları, bilinmeyen kategori null'a çevirme ve uyarı ekleme kuralları izole otomatik testlerle doğrulandı. (Uygulandı; otomatik testle doğrulandı).
- **Fiş Analizi HTTP İstemcisi:** Hazırlanan görseli `multipart/form-data` ile yapılandırılmış backend'e gönderen analiz istemcisi oluşturuldu. 60sn timeout, iptal edilebilir (abortable) istekler, Hata kodları (413, 429, 5xx) yönetimi ve `parseReceiptAnalysisResponse` entegrasyonu tamamlandı. (Uygulandı; izole testlerle doğrulandı).
- **Analiz Ekranı Bağlantısı:** Fotoğraf, hazırlama, HTTP analiz ve mevcut düzenleme/kayıt ekranı birbirine bağlandı. `useReceiptAnalysis` hook'u analiz isteklerini iptal edilebilir hale getirildi. Analiz ekranı, fotoğraf değişimlerinde eski sonuçları reddedecek ve ağ hatalarında tekrar deneme imkanı sunacak şekilde yapılandırıldı. (Uygulandı; izole otomatik testle doğrulandı; gerçek backend/AI uçtan uca testi bekliyor).

## Bilinen Eksikler
- **Premium abonelik:** RevenueCat SDK, özel paywall, satın alma geri yükleme ve `premium` entitlement ile sesli ekleme kapısı uygulandı. RevenueCat paneli/store ürünleri, iOS/Android public SDK anahtarları, bundle/application kimlikleri ve EAS development build henüz kullanıcı tarafından tamamlanmadı. Backend tarafında kullanıcı hesabı/doğrulanmış abonelik kimliği bulunmadığından ses analiz endpoint'i sunucu seviyesinde entitlement doğrulamıyor; mevcut koruma mobil istemci kapısıdır.
- **Görev 46–50 cihaz/sağlayıcı kontrolü:** Ay bazlı limit depolama ve kullanıcı tetiklemeli Premium öneri akışı uygulandı. Limit/özet ve backend doğrulama kontrolleri otomatik çalıştırıldı; fiziksel cihaz ve gerçek OpenAI öneri çağrısı yapılmadı. Premium yetkilendirme sistemi bulunmadığından öneri girişi yalnız `__DEV__` ortamında görünür.
- **Fotoğraf Temizliği:** Uygulamaya ait geçici kopyaların başarılı kayıt/vazgeçme sonrası temizlenmesi eksik.
- **İdempotency:** Aynı taslağın yeniden gönderilmesi ve hata sonrası retry davranışı cihazda doğrulanmadı.
- **Düzenleme Cihaz Kontrolü:** Çok kalemli düzenleme ekranının dokunma, klavye ve görsel davranışı cihazda doğrulanmadı.

## Çok Kalemli Düzenleme Kanıtı (2026-10-02)
- `.\node_modules\.bin\tsc.cmd --noEmit`: geçti.
- `src/services/expenseEditFlow.test.ts`: geçti.
- Cihaz/emülatör testi yapılmadı.

## Yerel Backend ve Mobil Bağlantı Doğrulaması (2026-10-05)
- Backend bağımlılıkları mevcut `backend/.venv` içinde kontrol edildi; eksik `pydantic-settings` kuruldu ve sürümler `backend/requirements.txt` içinde sabitlendi.
- OpenAI anahtarı veya model adı eksikken uygulama açılıyor, `GET /health` yanıt veriyor ve analiz endpoint'i ücretli sağlayıcı çağrısı yapmadan `503` ile `error.code/message/requestId` sözleşmesini döndürüyor.
- Backend testleri: `backend/.venv/Scripts/python.exe -m pytest -q tests` -> **3 geçti**.
- Sağlık kontrolü: `http://127.0.0.1:8000/health` ve `http://192.168.1.73:8000/health` -> **HTTP 200**, `{"status":"ok"}`.
- Etkin fiziksel ağ adaptörü Realtek Ethernet (`192.168.1.73/24`, ağ geçidi `192.168.1.1`) olarak belirlendi; WSL sanal adaptörü seçilmedi. `app.json` içindeki `extra.API_BASE_URL`, `http://192.168.1.73:8000` olarak güncellendi.
- Mobil istemcinin adres kaynağı `Constants.expoConfig?.extra?.API_BASE_URL`; ikinci bir yapılandırma mekanizması eklenmedi.
- TypeScript kontrolü: `.\node_modules\.bin\tsc.cmd --noEmit` -> **geçti**.
- Expo `npm start -- --clear` ile yeniden başlatıldı; Metro `0.0.0.0:8081` üzerinde dinliyor.
- Yapılandırılan `gpt-4o-mini` modeli değiştirilmedi. Resmî OpenAI dokümantasyonu modelin görsel girdiyi ve Structured Outputs'u desteklediğini doğruluyor; Python SDK `chat.completions.parse(..., response_format=ReceiptAnalysis)` çağrı yüzeyi yerel SDK'da da doğrulandı.
- `backend/.env` mevcut değil ve `.gitignore` tarafından dışlanıyor. Gerçek OpenAI isteği gönderilmedi.
- Fiziksel telefondan erişim ve gerçek fiş analizi doğrulanmadı; kullanıcı testi bekliyor.

## İlk 10 Görev Denetimi (2026-10-05)
- TypeScript, para, yerel tarih, analiz, fiş doğrulama/kaydetme/düzenleme ve backend testleri geçti.
- Expo SDK kontrolü `react-native-get-random-values@2.0.0` için beklenen `~1.11.0` uyumsuzluğunu bildirdi.
- Yerel takvim tarihi üretimi ve `.venv/` ignore kuralı düzeltildi.
- Provider mutasyonları seri ve en güncel snapshot üzerinde çalışacak şekilde düzeltildi; yarış, yazma hatası sonrası retry ve yeniden yükleme testleri geçti.
- Manuel eklemeye senkron çift gönderim kilidi eklendi; tek kayıt ve hata sonrası retry testleri geçti. Manuel işletme alanı, detay yükleme ayrımı ve silme hata bildirimi açık kaldı.
- Ayrıntılı kanıt: `docs/TEST-REPORT-01-10.md`.

## Görev 46–50 Doğrulaması (2026-10-07)
- Ay limitleri `monthly_limits_storage` alanında `YYYY-MM -> integer kuruş` olarak bağımsız saklanıyor; ekleme, güncelleme, kaldırma, yeniden yükleme, ay izolasyonu ve depolama hatası hedefli testten geçti.
- 10.000 TL / 7.500 TL için 2.500 TL kalan; 10.000 TL / 10.500 TL için 500 TL aşım ve %100 görsel sınır testi geçti.
- Öneri payload'ı yalnız ay, toplam, kayıt sayısı, kategori toplamları, limit ve geçmiş-tamlık işaretini içeriyor; not/açıklama/fotoğraf/ses içermediği test edildi.
- Backend toplam tutarlılığını, kayıtlı kategori kümesini, tekil kategori önerisini ve %5–30 oran sınırını doğruluyor; tahmini tasarrufu doğrulanmış kategori toplamından kodla hesaplıyor.
- `npm run test:budget` geçti. iOS geliştirme bundle'ı HTTP 200 ile üretildi. Backend health ve sağlayıcıya ulaşmayan geçersiz sözleşme testi geçti.
- Genel `npx tsc --noEmit`, önceden mevcut `receiptFlowIntegration.test.ts` içindeki üç hatadan dolayı başarısız. Mevcut fiş test komutunda Expo modül yükleme ve eksik `receiptValidation.ts` altyapı engelleri sürüyor. Taşınmış backend `.venv` içinde `pytest` bulunmadığından tam pytest paketi çalıştırılamadı.
- Gerçek OpenAI öneri çağrısı ve fiziksel cihaz kontrolü yapılmadı.
