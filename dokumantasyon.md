# Dökümantasyon Modülü — Sistem Referansı

> **KURAL:** Yalnız Dökümantasyon modülü (`/dokumantasyon`, `/p/[token]` ve ilgili backend/storage/auth/share sistemleri) ile doğrudan ilgili bir görevde bu dosya baştan sona okunur. İş bitince gerçek mimari ve değişikliklerle güncellenir.

---

## 1. Amaç ve Kapsam

Bu modül; site sahibi (tek admin) için Google Drive / Yandex Disk benzeri hiyerarşik klasörlü dosya yönetimi, süreli ve isteğe bağlı şifreli/limitli paylaşım bağlantıları üretimi ve harici kullanıcıların giriş yapmadan dosya indirebildiği WeTransfer benzeri bir genel paylaşım arayüzü sağlar.

### Temel Veri İlkesi
> **ÖNEMLİ:** Dökümantasyon modülü kullanım kolaylığı ve hızlı paylaşım sağlar; ayrı bir backup stratejisi doğrulanmadan önemli mesleki belgelerin tek kopyası olarak kabul edilmez.

---

## 2. Güncel Repo Entegrasyon Noktaları

- **Navigation Config:** `src/lib/navigation-config.ts` (`PRIMARY_NAV_ITEMS` ve `MOBILE_NAV_ITEMS` dizilerinde `belgeler` öğesinin hemen sağında)
- **Desktop Navbar:** `src/components/navbar-desktop-nav.tsx` (`home`, `deprem-yonetmelik`, `hesaplamalar`, `araclar`, `bina-asamalari`, `belgeler`, `dokumantasyon`)
- **Mobile Menu:** `src/components/mobile-menu.tsx` (`MOBILE_NAV_ITEMS` ve `MOBILE_ICONS` entegrasyonu)
- **Admin Route:** `src/app/dokumantasyon/page.tsx` (Oturum yoksa login formu, varsa dosya yöneticisi)
- **Public Share Route:** `src/app/p/[token]/page.tsx` (WeTransfer benzeri sade indirme ekranı)
- **Proxy Katmanı:** `src/proxy.ts` (Next.js 16 App Router uyumlu ilk savunma katmanı)
- **SEO & Robots:** `src/app/robots.ts` (`/dokumantasyon` ve `/p/` yolları disallow), `src/app/sitemap.ts` (Dökümantasyon ve share rotaları sitemap'e eklenmez)

---

## 3. Nihai Teknoloji Kararları

- **Storage:** Vercel Blob — **Private Store** (`@vercel/blob/client` direct upload + server-side signed token exchange)
- **Database:** **Neon Postgres** (`@neondatabase/serverless` ile parametrik/tagged-template SQL)
- **DB Erişim Yöntemi:** DAL/Repository katmanı (`src/lib/dokumantasyon/`) ve versiyonlanmış SQL migration dosyaları (`db/dokumantasyon/001_initial.sql`)
- **Admin Auth:** Tek admin kullanıcısı; `bcryptjs` (şifre hashleme), `jose` (JWT imzalama/doğrulama), HttpOnly + Secure + SameSite=Strict `dokumantasyon_session` çerezi (maks 7 gün). `ADMIN_SESSION_VERSION` ile anında tüm oturumları geçersiz kılma yeteneği.
- **Güvenlik Mimarisi:** Proxy katmanına ek olarak tüm Server Action / Route Handler seviyelerinde `requireDokumantasyonAdmin()` ve mutating isteklerde same-origin kontrolü (`assertSameOriginForMutation()`).
- **Rate Limiting:** Neon Postgres üzerinde hafif IP fingerprint tablosu (`HMAC-SHA256(RATE_LIMIT_SALT, normalizedIp + scope)`).
- **ZIP Arşivleme:** `archiver` kütüphanesi ile Node.js runtime üzerinde RAM'de biriktirmeden streaming ZIP üretimi.

---

## 4. Environment Variables

> **DİKKAT:** Yalnızca environment variable İSİMLERİ ve amaçları listelenmiştir. Gerçek secret değerleri buraya veya repo içine ASLA yazılmaz.

| Değişken Adı | Açıklama |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sitenin ana URL'si (örn. `https://muhendislik-site.vercel.app`) |
| `ADMIN_USERNAME` | Dökümantasyon admin kullanıcı adı |
| `ADMIN_PASSWORD_HASH` | Admin şifresinin bcrypt hash'i |
| `SESSION_SECRET` | Admin JWT oturum token imzalama anahtarı (min. 32 byte) |
| `ADMIN_SESSION_VERSION` | Oturum versiyonu (artırıldığında aktif tüm oturumlar düşer) |
| `RATE_LIMIT_SALT` | Rate limiting IP hashleme tuzu |
| `DATABASE_URL` | Neon Postgres bağlantı URL'si (Vercel Marketplace) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Private Blob store server okuma/yazma token'ı |
| `DOK_MAX_FILE_SIZE_MB` | İzin verilen maksimum tekil dosya boyutu (varsayılan: 100 MB) |
| `SHARE_TOKEN_ENCRYPTION_KEY` | (Opsiyonel) Aktif linklerin admin tarafından tekrar kopyalanabilmesi için AES-GCM anahtarı |

---

## 5. Veritabanı Şeması / Migration Durumu

Tablolar `db/dokumantasyon/` altındaki SQL dosyalarıyla yönetilir:

1. **`dok_folders`**: Klasör hiyerarşisi (`id`, `name`, `parent_id`, `created_at`, `updated_at`, `deleted_at`)
2. **`dok_files`**: Dosya kayıtları (`id`, `folder_id`, `display_name`, `blob_pathname`, `blob_url`, `size_bytes`, `mime_type`, `extension`, `created_at`, `updated_at`, `deleted_at`)
3. **`dok_share_links`**: Paylaşım bağlantıları (`id`, `token_hash`, `title`, `expires_at`, `password_hash`, `max_downloads`, `download_count`, `created_at`, `revoked_at`, `last_accessed_at`, `url_token_encrypted`)
4. **`dok_share_items`**: Paylaşılan öğelerin snapshot kayıtları (`share_link_id`, `file_id`, `snapshot_name`, `relative_path`, `snapshot_size_bytes`, `snapshot_mime_type`, `sort_order`)
5. **`dok_auth_attempts`**: Başarısız login ve share password brute-force koruma kayıtları (`id`, `scope`, `subject_hash`, `success`, `created_at`)

---

## 6. API / Route Haritası

| Metot | Yol | Amaç | Yetki | Rate Limit |
|---|---|---|---|---|
| POST | `/api/dokumantasyon/giris` | Admin oturumu açma | Public | 15 dk / 5 deneme |
| POST | `/api/dokumantasyon/cikis` | Admin oturumunu kapatma | Admin | - |
| GET | `/api/dokumantasyon/items` | Klasör içeriği listeleme | Admin | - |
| POST | `/api/dokumantasyon/folders` | Yeni klasör oluşturma | Admin | - |
| PATCH | `/api/dokumantasyon/folders/[id]` | Klasör adlandırma / taşıma | Admin | - |
| DELETE | `/api/dokumantasyon/folders/[id]` | Klasörü çöp kutusuna taşıma | Admin | - |
| POST | `/api/dokumantasyon/folders/[id]/restore` | Klasörü geri yükleme | Admin | - |
| POST | `/api/dokumantasyon/upload/token` | Client upload için Blob token alma | Admin | - |
| POST | `/api/dokumantasyon/upload/finalize` | Yükleme sonrası DB kaydını tamamlama | Admin | - |
| PATCH | `/api/dokumantasyon/files/[id]` | Dosya adlandırma / taşıma | Admin | - |
| DELETE | `/api/dokumantasyon/files/[id]` | Dosyayı çöp kutusuna taşıma | Admin | - |
| POST | `/api/dokumantasyon/files/[id]/restore` | Dosyayı geri yükleme | Admin | - |
| GET | `/api/dokumantasyon/trash` | Çöp kutusu listesi | Admin | - |
| DELETE | `/api/dokumantasyon/trash/files/[id]` | Dosyayı kalıcı silme | Admin | - |
| DELETE | `/api/dokumantasyon/trash/folders/[id]` | Klasörü kalıcı silme | Admin | - |
| POST | `/api/dokumantasyon/trash/empty` | Çöp kutusunu boşaltma | Admin | - |
| GET | `/api/dokumantasyon/search` | Dosya/klasör arama | Admin | - |
| POST | `/api/dokumantasyon/shares` | Yeni süreli link oluşturma | Admin | - |
| GET | `/api/dokumantasyon/shares` | Aktif linkleri listeleme | Admin | - |
| POST | `/api/dokumantasyon/shares/[id]/revoke` | Linki anında iptal etme | Admin | - |
| POST | `/api/dokumantasyon/public/share/[token]/unlock` | Şifreli linki açma | Public | 15 dk / 8 deneme |
| GET | `/api/dokumantasyon/public/share/[token]/files/[fileId]/download` | Tek dosya indirme stream'i | Public | Atomic Max-Download |
| GET | `/api/dokumantasyon/public/share/[token]/download-all` | Tümünü ZIP indirme stream'i | Public | Atomic Max-Download |

---

## 7. Dosya ve Klasör Kuralları

- **Desteklenen Uzantılar:** `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.zip`, `.dwg`, `.dxf`
- **MIME & İçerik Kontrolü:** Sadece uzantıya güvenilmez; `file-type` magic bytes analizi ve PDF için `%PDF-` imzası kontrol edilir.
- **İsimlendirme ve Normalizasyon:** Görünen ad DB'de UTF-8 olarak tutulur. Download response'ta `Content-Disposition` RFC 5987 / RFC 6266 uyumlu `filename*=UTF-8''...` formatında verilir.
- **Taşıma ve Döngü Engeli:** Bir klasörün kendi içine veya alt soyuna (descendant) taşınması engellenir.

---

## 8. Upload Akışı

1. Admin dosya seçer (desktop drag-and-drop veya mobil file picker).
2. Client, Next.js `/api/dokumantasyon/upload/token` endpoint'ine dosya adı, boyutu ve türünü iletir.
3. Server yetkiyi, boyutu (`<= DOK_MAX_FILE_SIZE_MB`) ve dosya türünü doğrular; Vercel Blob client token üretir.
4. Dosya doğrudan istemciden Vercel Private Blob store'a yüklenir (büyük dosyalar sunucu belleğini tüketmez).
5. Yükleme tamamlanınca `/api/dokumantasyon/upload/finalize` ile DB kaydı oluşturulur.
6. DB kaydı başarısız olursa compensation mekanizması yetim Blob objesini siler.

---

## 9. Share Link Akışı

1. Admin bir veya daha fazla dosya/klasör seçer; süre (1 Gün, 3 Gün, 1 Hafta, 1 Ay, Özel), opsiyonel şifre ve indirme limiti belirler.
2. Seçili klasörler recursive olarak çözülerek ShareItem snapshot listesine dönüştürülür.
3. `crypto.randomBytes(32).toString('base64url')` ile ham token üretilir.
4. DB'ye yalnızca `SHA-256(rawToken)` kaydedilir. Ham token asla DB'ye düz metin yazılmaz.
5. Kullanıcıya `/p/[token]` bağlantısı, QR kod ve kopyalama arayüzü sunulur.

---

## 10. Download / ZIP Akışı

- **Tek Dosya İndirme:**
  - Token hash doğrulanır, expiry ve revoke kontrol edilir.
  - Şifre korumalıysa geçerli `dok_share_grant` çerezi aranır.
  - Atomik `download_count` artırılır (indirme sınırı aşımı engellenir).
  - Private Blob üzerinden sunucu akışı (stream) ile güvenli `Content-Disposition` başlıklarıyla istemciye iletilir. Ham Blob URL'si asla sızdırılmaz.
- **Toplu ZIP İndirme:**
  - Node.js runtime üzerinde `archiver` kütüphanesi ile anlık stream üretilir.
  - Dosyalar disk/RAM'de biriktirilmeden aktarılır; snapshot içindeki bağıl yollar sanitize edilir.

---

## 11. Güvenlik Kararları

- **Private Blob:** Depolama public erişime tamamen kapalıdır.
- **Çift Katmanlı Auth:** `proxy.ts` ilk hat yönlendirmesidir; her API route'u kendi içinde de session doğrulaması yapar.
- **CSRF Koruması:** Tüm admin mutating endpoint'lerinde `Origin` / `Host` same-origin denetimi yapılır.
- **Sızıntı Önleme:** `/p/[token]` sayfalarında `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store` ve `X-Robots-Tag: noindex, nofollow, noarchive` uygulanır.
- **Generic Hatalar:** Geçersiz, süresi dolmuş veya iptal edilmiş linkler için tek tip güvenli mesaj gösterilir.

---

## 12. Çöp Kutusu / Kalıcı Silme Davranışı

1. **Silme (Soft Delete):** Dosya/klasör `deleted_at` damgası alır, listeden gizlenir ve dahil olduğu tüm aktif paylaşım linkleri **otomatik olarak iptal edilir (revoke)**.
2. **Geri Yükleme:** Öğe normal ağaca döner; ancak eski paylaşım linkleri güvenlik gereği otomatik yeniden etkinleştirilmez.
3. **Kalıcı Silme:** İlgili Blob nesnesi fiziksel olarak silinir ve DB kaydı temizlenir.

---

## 13. Backup / Recovery

- **DB Metadata:** Neon Postgres üzerindeki hiyerarşi, dosya bilgileri ve link snapshot'ları.
- **Blob Inventory:** Vercel Private Blob nesneleri.
- **Yedekleme Yöntemi:** `scripts/dokumantasyon-backup.mjs` (Aşama 8) ile periyodik metadata manifest JSON exportu alınabilir.
- **Kurtarma Prosedürü:** Manifest üzerinden dosyalar yeniden indekslenebilir veya lokal kopyalara dönüştürülebilir.

---

## 14. Bilinen Limitler

1. **Vercel Function Execution Timeout:** Vercel Hobby planında sunucu fonksiyonları 10–60 saniye ile sınırlıdır. Çok büyük ZIP paketlerinde veya yavaş bağlantılarda streaming kesilmemesi için devasa arşivlerde tek tek indirme önerilir.
2. **Vercel Egress / Bandwidth:** Private Blob üzerinden yapılan indirmeler Vercel Function egress kotasını kullanır. Yoğun dosya dağıtımlarında kota takibi yapılmalıdır.
3. **DWG / DXF Format İmzası:** CAD dosyaları için standart MIME magic bytes tespiti her zaman kesin olmayabilir; dosya uzantısı, admin yetkisi ve güvenli sanitizasyon birlikte uygulanır.

---

## 15. Test Komutları

```bash
# Tip ve Kod Standartları
npx tsc --noEmit
npm run lint
npm run build

# Mevcut Site Tutarlılık Testleri
npm run check:navigation
npm run check:smoke

# Dökümantasyon Modül Testleri (Aşama 8'de eklenecektir)
npm run check:dokumantasyon
```

---

## 16. Değişiklik Günlüğü

- **19.08.2026 (Aşama 1):** Repo denetimi tamamlandı, mimari sözleşme oluşturuldu, `dokumantasyon.md` yazıldı, `master.md` güncellendi ve `.agents/rules/dokumantasyon-kurallari.md` eklendi.
- **19.08.2026 (Aşama 2):** Veritabanı şema migrasyonu (`db/dokumantasyon/001_initial.sql`), migrasyon scripti (`scripts/migrate-dokumantasyon.mjs`), `@neondatabase/serverless` DAL katmanı (`src/lib/dokumantasyon/`), JWT session auth (`auth.ts`), rate-limit (`rate-limit.ts`), kriptografi (`security.ts`), Zod şemaları (`validation.ts`), giriş/çıkış/oturum route'ları (`/api/dokumantasyon/giris`, `/cikis`, `/auth/session`) oluşturuldu. Güvenlik birim testleri (`scripts/test-dokumantasyon-auth.mjs`) başarıyla geçti.
- **19.08.2026 (Aşama 3):** Masaüstü navbar (`src/components/navbar-desktop-nav.tsx`), mobil menü (`src/components/mobile-menu.tsx`), navigasyon sıralaması (`src/lib/navigation-config.ts`), `/dokumantasyon` rotası, login formu (`login-form.tsx`), admin shell (`admin-shell.tsx`), `robots.ts` disallow kuralları tamamlandı. Puppeteer UI entegrasyon testleri (`scripts/check-dokumantasyon-stage3.mjs`) başarıyla geçti.
- **19.08.2026 (Aşama 4):** Klasör ve dosya DAL servisleri (`folders.ts`, `files.ts`, `trash.ts`, `search.ts`), döngüsel klasör taşıma (cycle) engeli, benzersiz isim türetme, Vercel Private Blob client upload token exchange (`/api/dokumantasyon/upload/token`), compensation cleanup destekli yükleme tamamlama (`/api/dokumantasyon/upload/finalize`), öğe listeleme (`/api/dokumantasyon/items`), klasör ve dosya CRUD/trash/restore route'ları, çöp kutusu yönetimi (`/api/dokumantasyon/trash/*`) ve arama API'si (`/api/dokumantasyon/search`) tamamlandı. İş mantığı birim testleri (`scripts/test-dokumantasyon-stage4.mjs`) başarıyla geçti.
- **19.08.2026 (Aşama 5):** Drive benzeri dosya yöneticisi arayüzü (`file-manager.tsx`), breadcrumb gezintisi, masaüstü sürükle-bırak dropzone alanı, mobil ve çoklu dosya yükleyici (`@vercel/blob/client` direct stream) ve yükleme ilerleme göstergesi (`upload-progress-toast.tsx`), çoklu seçim yüzen aksiyon çubuğu, yeni klasör (`new-folder-modal.tsx`), yeniden adlandırma (`rename-modal.tsx`), klasör taşıma (`move-modal.tsx`), silme ve aktif link revoke uyarılı onay modalı (`delete-confirm-modal.tsx`), anlık arama (`search-modal.tsx`) ve çöp kutusu yönetim ekranı (`trash-modal.tsx`) tamamlandı.
- **19.08.2026 (Aşama 6):** Süreli paylaşım DAL servisi (`shares.ts`), 32-byte kriptografik raw token üretimi, DB SHA-256 token hash saklama, AES-256-GCM ile şifreli link kopyalama, recursive klasör snapshot çözümleme ve deduplication, süre hesaplama (1 Gün, 3 Gün, 1 Hafta, 1 Ay, Özel Tarih), opsiyonel şifre (bcrypt) ve indirme sınırı, link oluşturma modalı (`create-share-modal.tsx`), sonuç ve QR kod modalı (`share-result-modal.tsx`), aktif linkler yönetimi ve derhal iptal (revoke) modalı (`active-shares-modal.tsx`), paylaşım API route'ları (`/api/dokumantasyon/shares`, `/revoke`) tamamlandı. Birim testler (`scripts/test-dokumantasyon-stage6.mjs`) başarıyla geçti.
- **19.08.2026 (Aşama 7):** Public WeTransfer / Drive benzeri indirme sayfası (`/p/[token]`), süresi dolmuş/iptal edilmiş/limit aşılmış link durum ekranları, şifre koruma formu ve brute-force rate limitli oturum doğrulama (`/api/dokumantasyon/public/verify-password`), tekil dosya güvenli stream indirme endpoint'i (`/api/dokumantasyon/public/download/[token]/[itemId]`), klasör hiyerarşisini koruyan dinamik JSZip streaming ZIP arşivi indirme endpoint'i (`/api/dokumantasyon/public/zip/[token]`), indirme sayacı ve son erişim takibi tamamlandı. Birim testler (`scripts/test-dokumantasyon-stage7.mjs`) başarıyla geçti.
- **19.08.2026 (Aşama 8 - Final):** Modül master doğrulama paketi (`scripts/check-dokumantasyon.mjs`, `npm run check:dokumantasyon`), veritabanı ve metadata JSON yedekleme scripti (`scripts/backup-dokumantasyon.mjs`, `npm run backup:dokumantasyon`), robots.ts/sitemap.ts/timing-attack/CSRF/AES-256-GCM/JSZip güvenlik sertleştirmeleri, `package.json` scriptleri ve `dokumantasyon.md` tam kılavuzu tamamlandı. Tüm sistem ve navigasyon testleri %100 başarıyla sonuçlandı.







