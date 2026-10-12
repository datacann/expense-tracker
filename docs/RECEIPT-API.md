# Fiş Analiz API Sözleşmesi (v1)

## Genel Bilgiler
Bu doküman, mobil uygulama ile arka uç (backend) arasındaki fiş analizi iletişimini tanımlar.

- **Base URL:** `/v1`
- **İçerik Türü:** `multipart/form-data`

---

## 1. POST /receipts/analyze
Fiş fotoğrafını analiz eder ve ayrıştırılmış verileri döner.

### İstek (Request)
`multipart/form-data` formatında:
- `image`: JPEG veya PNG dosyası (Binary).

### Başarılı Cevap (200 OK)
```json
{
  "schemaVersion": 1,
  "requestId": "req_123456789",
  "analysis": {
    "merchant": "Market X",
    "date": "2026-10-04",
    "currency": "TRY",
    "totalMinor": 30000,
    "items": [
      {
        "rawText": "Süt 1L",
        "description": "Süt",
        "amountMinor": 6000,
        "categoryId": "cat_food"
      }
    ],
    "warnings": [],
    "isSample": false
  }
}
```

---

## 2. Hata Cevapları
Hatalı durumlarda dönülecek yapı:
```json
{
  "error": {
    "code": "UNREADABLE_RECEIPT",
    "message": "Fiş okunamadı.",
    "requestId": "req_123456789"
  }
}
```

**Hata Kodları:**
- `INVALID_IMAGE`: Geçersiz dosya formatı veya boyutu.
- `IMAGE_TOO_LARGE`: Fotoğraf boyutu sınırın üzerinde.
- `UNREADABLE_RECEIPT`: Fotoğraftan veri çıkarılamadı.
- `RATE_LIMITED`: Çok fazla istek gönderildi.
- `SERVICE_UNAVAILABLE`: Arka uç geçici olarak kapalı.

---

## 3. Örnek JSON Gövdeleri

### Başarılı Analiz
```json
{
  "schemaVersion": 1,
  "requestId": "req_success_001",
  "analysis": {
    "merchant": "Cafe Y",
    "date": "2026-10-03",
    "currency": "TRY",
    "totalMinor": 15000,
    "items": [
      { "rawText": "Kahve", "description": "Kahve", "amountMinor": 15000, "categoryId": "cat_food" }
    ],
    "warnings": [],
    "isSample": false
  }
}
```

### Eksik Alanlı Analiz
```json
{
  "schemaVersion": 1,
  "requestId": "req_partial_002",
  "analysis": {
    "merchant": null,
    "date": null,
    "currency": null,
    "totalMinor": null,
    "items": [
      { "rawText": "Bilinmeyen Ürün", "description": "Bilinmeyen Ürün", "amountMinor": null, "categoryId": null }
    ],
    "warnings": ["Toplam tutar okunamadı"],
    "isSample": false
  }
}
```

### Hata Durumu
```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Gönderilen dosya bir görsel değil.",
    "requestId": "req_error_003"
  }
}
```
