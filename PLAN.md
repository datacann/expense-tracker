# PLAN.md

## Görev 46-50: Aylık Harcama Limiti ve AI Tasarruf Önerileri

### 1. Aylık Limit (Storage & State)
- `ExpenseProvider` içinde `monthlyLimits` (AsyncStorage: `monthly_limits_storage`) yönetimi.
- Ana ekranda limit hesaplama ve görselleştirme (tutar, bar, aşım metni).
- Ay değişimi ve limit düzenleme testleri.

### 2. AI Veri Hazırlama & Backend Servisi
- Backend: `v1/voice/suggestions` (veya `v1/ai/suggestions`) endpoint'i.
- Deterministik veri özeti (Ay toplamı, kategori bazlı veriler).
- OpenAI ile yapılandırılmış öneri üretimi.

### 3. Öneri Ekranı
- `app/voice/suggestions.tsx` (veya `app/analysis/suggestions.tsx`).
- Yükleniyor, hata, veri yetersizliği boş durumları.
- Kullanıcı tetiklemeli AI çağrısı.
- Sonuç koruma (Yenileme uyarısı).

### 4. Testler
- Limit mantığı (Test: `tests/limit_calculation.test.ts`).
- Sağlayıcı mock'lama (Test: `tests/ai_suggestions.test.ts`).
- Hata yönetimi (Test: `tests/error_boundary.test.ts`).
