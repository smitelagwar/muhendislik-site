# DÖKÜMANTASYON MODÜLÜ — OPERASYONEL RUNBOOK & MİMARİ REHBER

Bu belge, Dökümantasyon Modülü'nün Vercel Serverless, Neon Postgres ve Vercel Private Blob mimarisindeki çalışma prensiplerini, operasyonel bakımını, sorun giderme adımlarını ve acil durum kurtarma (rollback) prosedürlerini içerir.

---

## 1. MİMARİ ÖZET

```mermaid
graph TD
    User([Kullanıcı / Tarayıcı])
    NextAPI[Next.js API Routes]
    Blob[Vercel Private Blob Store]
    DB[(Neon Postgres DB)]

    User -->|1. POST /upload/token| NextAPI
    NextAPI -->|2. Client Token + Signed Intent| User
    User -->|3. put access:private| Blob
    User -->|4. POST /upload/finalize| NextAPI
    NextAPI -->|5. SDK get Range:0-511 & Verify| Blob
    NextAPI -->|6. Idempotent INSERT ON CONFLICT| DB
    User -->|7. Presigned Private URL| Blob
```

### Değiştirilemez İlkeler:
1. **Private Blob Zorunluluğu**: Depolama alanı private erişimindedir. İstemci `put()` ve sunucu `presignUrl()` çağrılarının tamamı `access: "private"` sözleşmesini uygular.
2. **SSRF Koruması**: İstemcinin gönderdiği `blobUrl` adresine sunucu secret'ı ile asla doğrudan `fetch()` atılmaz. Resmi SDK'nın `get(blobPathname, { access: 'private', token })` fonksiyonu kullanılır.
3. **Fail-Closed Güvenlik**: Üretim ortamında `SESSION_SECRET`, `RATE_LIMIT_SALT` veya `DATABASE_URL` eksik olduğunda sessiz fallback yapılmaz; 503 fırlatılır.

---

## 2. GEREKLİ ORTAM DEĞİŞKENLERİ (ENV)

Vercel Panelinde (`Project -> Settings -> Environment Variables`) **Production** ortamı için tanımlı olması gereken değişkenler:

| Değişken Adı | Açıklama | Örnek / Format |
|---|---|---|
| `DATABASE_URL` | Neon Postgres bağlantı dizesi | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Private Blob Read-Write belirteci | `vercel_blob_rw_...` |
| `SESSION_SECRET` | Admin oturumu ve JWT imzalama anahtarı (min 32 karakter) | `kriptografik_rastgele_uzun_anahtar` |
| `ADMIN_USERNAME` | Admin panel giriş kullanıcı adı | `admin` |
| `ADMIN_PASSWORD_HASH` | Bcrypt şifre hash'i | `$2a$10$...` |
| `RATE_LIMIT_SALT` | IP parmak izi tuzlama anahtarı | `rastgele_salt_degeri` |
| `ADMIN_SESSION_VERSION` | Oturum geçersiz kılma sürüm numarası (opsiyonel) | `1` |

---

## 3. VERİTABANI MİGRASYONLARI

Veritabanı tabloları `db/migrations/` dizininde versiyonlu SQL dosyaları olarak tutulur:
- `001_dokumantasyon_base.sql`: Temel klasör, dosya ve paylaşım tabloları.
- `002_upload_integrity.sql`: `UNIQUE(blob_pathname)`, atomik dosya adı indeksleri, `dok_upload_intents` yaşam döngüsü tablosu ve purge sütunları.

### Manuel Migrasyon Çalıştırma:
```bash
node scripts/dokumantasyon-migrate.mjs
```

---

## 4. READINESS SAĞLIK KONTROLÜ

Sistem durumunu API üzerinden sorgulamak için:
```bash
GET /api/dokumantasyon/readiness
```

**Beklenen Yanıt:**
```json
{
  "ok": true,
  "environment": "production",
  "storageMode": "durable",
  "database": {
    "configured": true,
    "reachable": true,
    "schemaReady": true,
    "currentSchemaVersion": "002",
    "requiredSchemaVersion": "002"
  },
  "blob": {
    "configured": true,
    "reachable": true,
    "access": "private"
  },
  "localFallbackAllowed": false
}
```

---

## 5. SORUN GİDERME AĞACI (TROUBLESHOOTING)

### A. Ekranda `Depolama Eksik (Korumalı)` veya `storageMode: "blocked"` Uyarısı
- **Neden:** `BLOB_READ_WRITE_TOKEN` veya `DATABASE_URL` Vercel Production deployment'ına eklenmemiş ya da token süresi dolmuş olabilir.
- **Çözüm:** Vercel Dashboard'da Storage bağlantılarını kontrol edin ve yeni bir deployment (Redeploy) tetikleyin.

### B. Yükleme Sırasında `Upload token alınamadı` / 401 Hatası
- **Neden:** Admin oturumu zaman aşımına uğramış veya `SESSION_SECRET` değişmiştir.
- **Çözüm:** Admin panelinden çıkış yapıp tekrar giriş yapın.

### C. Yükleme Sırasında `Kayıt tamamlanamadı` / 400 Hatası
- **Neden:** Dosya içeriği ile uzantısı uyuşmuyor (magic byte kontrolü başarısız) veya dosya boyutu değişmiş olabilir.
- **Çözüm:** Dosyanın bozuk olmadığını ve izin verilen formatlar (`.pdf`, `.dwg`, `.dxf`, vb.) arasında olduğunu doğrulayın.

---

## 6. MUTABAKAT VE TEMİZLİK (RECONCILIATION)

Veritabanı ile Vercel Blob arasındaki tutarlılığı raporlamak için:
```bash
# Sadece rapor al (Dry-run / Güvenli)
node scripts/reconcile-dokumantasyon-storage.mjs

# 24 saatten eski sahipsiz objeleri temizle
node scripts/reconcile-dokumantasyon-storage.mjs --delete-safe-orphans
```

---

## 7. ROLLBACK PROSEDÜRÜ

Bir deployment sonrasında acil geri alma gerekirse:
1. Vercel Dashboard -> Deployments sekmesinden bir önceki başarılı deployment'a **Instant Rollback** yapın.
2. `db/migrations/` içindeki şemalar geriye dönük uyumlu (non-destructive) olduğundan veritabanı geri alma gerektirmez.
3. Blob depolama nesnelerini silmeyin; gerekirse reconciliation raporu alarak durumu inceleyin.
