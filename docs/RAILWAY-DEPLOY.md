# RAILWAY-DEPLOY.md

## Deployment Yönergesi

Bu proje, FastAPI backend bileşeninin Railway üzerinde host edilmesi için yapılandırılmıştır.

### Railway Ayarları

1. **Service Root Directory**: `/backend`
2. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   - `PORT`: (Railway tarafından atanır, manuel atama gerekmez)
   - `OPENAI_API_KEY`: OpenAI API anahtarınız (Zorunlu)

### Kontrol Listesi

- [ ] Railway servisi oluşturulduğunda "Root Directory" `/backend` olarak ayarlandı.
- [ ] Environment Variables kısmına `OPENAI_API_KEY` eklendi.
- [ ] Deployment sonrası `/health` endpoint'i `200 OK` dönüyor.
- [ ] `/v1/voice/analyze` ve diğer AI uç noktaları, API anahtarı girilene kadar otomatik korunmaktadır.

### Erişim Koruması
Üretim ortamında `OPENAI_API_KEY` tanımlanmadığı sürece AI servisleri pasiftir. Anahtar girildiğinde servis aktif hale gelir.

### Test
Deploy sonrası: `curl https://<senin-domainin>.railway.app/health` ile erişilebilirliği doğrulayın.
