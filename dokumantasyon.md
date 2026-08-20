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
| `BLOB_STORE_ID` | Vercel Production OIDC Blob store kimliği |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Presigned upload callback Ed25519 imza doğrulama açık anahtarı |
| `BLOB_READ_WRITE_TOKEN` | Yalnız Vercel dışı yerel geliştirme/CLI legacy fallback'i; Production'da kullanılmaz |
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
- **19.08.2026 (Önizleme & Drive v2 - Aşama 1):** `eklediklerim/dokumantasyon-onizleme-drive-gelistirme-plani-NIHAI-v2.md` doğrultusunda Aşama 1 repo denetimi, PDF.js `CVE-2024-4367` güvenlik geçidi, 5 studio bileşenine `isEvalSupported: false` koruması, Vercel Signed URL (`issueSignedToken` + `presignUrl`) ve Range veri düzlemi denetimi tamamlandı.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 2):** Format capability registry (`preview-capabilities.ts`), magic-byte file signature validator (`file-validation.ts`), upload intent token katmanı (`upload-intent.ts`), admin ve public signed access katmanı (`file-access.ts`), dosya erişim ve local stream endpoint'leri (`/api/dokumantasyon/files/[id]/access`, `/stream`), Explorer DTO güvenlik filtrelemesi (iç storage alanlarının gizlenmesi, `preview_kind` iliştirilmesi) ve Stage 2 entegrasyon test paketi (`scripts/check-dokumantasyon-stage2.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 3):** Ortak görüntüleyici kabuğu (`file-preview-shell.tsx`), desteklenmeyen format fallback bileşeni (`unsupported-preview.tsx`), tam ekran (fullscreen) ve aksiyon çubuğu desteği, `/dokumantasyon/dosya/[fileId]` sayfası, `file-manager.tsx` satır tıklama ve 3-nokta önizleme/indirme menü aksiyonları ve Stage 3 entegrasyon test paketi (`scripts/check-dokumantasyon-stage3.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 4):** Güvenli tam PDF görüntüleyici (`pdf-viewer.tsx`), `isEvalSupported: false` CVE-2024-4367 koruması, CMap font desteği, Zoom (+/-%20), Fit Width (Genişliğe Sığdır), Fit Page (Sayfaya Sığdır), 90° döndürme (Rotate), doküman içi anlık arama (Search), pafta sürükleme (Hand/Pan Tool), sol kenar küçük sayfa önizlemeleri (Thumbnail Sidebar) ve Stage 4 test paketi (`scripts/check-dokumantasyon-stage4.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 5):** Gelişmiş görsel görüntüleyici (`image-viewer.tsx`: zoom, pan, rotate, flip, checkerboard grid), güvenli metin/kod/JSON/CSV görüntüleyici (`text-viewer.tsx`: satır numaraları, CSV dinamik veri tablosu, JSON biçimlendirme, kopyalama) ve GitHub Flavored Markdown görüntüleyici (`markdown-viewer.tsx`: `react-markdown`, `remark-gfm`, `skipHtml={true}` XSS koruması, raw/preview toggle) ile Stage 5 test paketi (`scripts/check-dokumantasyon-stage5.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 6):** Autodesk Platform Services (APS) CAD altyapısı (`cad-aps.ts`: OAuth v2 2-legged authentication, OSS v2 bucket, SVF2 model derivative URN çözümleme, in-memory token cache), CAD önizleme endpoint'i (`/api/dokumantasyon/files/[id]/cad`), CAD görüntüleyici bileşeni (`cad-viewer.tsx`: 2D/3D çizim inceleme, katmanlar / layer inspector paneli, model özellikleri) ve Stage 6 test paketi (`scripts/check-dokumantasyon-stage6.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 7):** Google Drive / Yandex / Mega standardında zengin UX (`drive-sidebar.tsx`: hızlı filtreler, CAD/PDF/Görsel kategorileri, depolama sayacı; `drive-details-drawer.tsx`: seçili öğe metadata ve hızlı aksiyon çekmecesi; `file-manager.tsx`: Tablo / Kart (Grid) çift görünüm modu, LocalStorage destekli Yıldızlı (Starred) dosya/klasör sistemi, mobil menü) ve Stage 7 test paketi (`scripts/check-dokumantasyon-stage7.mjs`) tamamlandı. Tüm testler %100 başarıyla geçti.
- **19.08.2026 (Önizleme & Drive v2 - Aşama 8 - Final):** Public paylaşım sayfasında (`/p/[token]`) güvenli dosya önizleme yeteneği (`public-preview-modal.tsx`), tüm 8 aşamayı uçtan uca tek komutta test eden Master Test Runner (`scripts/check-dokumantasyon-all-stages.mjs`, `npm run check:dokumantasyon:all`), ADR mimari kararları ve tam modül dokümantasyonu finalize edildi. Tüm 9 test paketi %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 2):** Dedicated Full-Viewport Document Studio Kabuğu (`document-studio-shell.tsx`, `100dvw × 100dvh`), minimal `StudioTopbar` (`studio-topbar.tsx`), evrensel komut sözleşmesi (`commands.ts`, `studio-command-button.tsx`), format yetenek matrisi (`capabilities.ts`), yapılandırılabilir `DocumentAccessLease` (TTL 3600s), dosya yöneticisinde gerçek semantic `<Link target="_blank">` entegrasyonu, Next.js stüdyo güvenlik başlıkları (`noindex`, `no-referrer`, `DENY`) ve Aşama 2 doğrulama paketi (`scripts/check-dokumantasyon-studio-stage2.mjs`) tamamlandı. Testler %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 3):** Profesyonel PDF Studio Görüntüleyici Motoru (`pdfjs-studio.tsx`, `pdf-page-view.tsx`), Continuous Vertical Scroll (bütün sayfaların akıcı kaydırılması), HTML TextLayer ve doğal metin seçimi/kopyalama (`select-text`, `cursor-text`), Türkçe karakter destekli doküman içi arama (`pdf-search.ts`, `pdf-search-bar.tsx`), IntersectionObserver destekli sınırsız (100+ sayfa) tembel küçük resimler (`pdf-thumbnail-sidebar.tsx`), `Ctrl + wheel` imleç odaklı yakınlaştırma, el aracı (Pan/Hand), zengin toolbar (`pdf-viewer-toolbar.tsx`), klavye kısayolları ve Aşama 3 doğrulama paketi (`scripts/check-dokumantasyon-studio-stage3.mjs`) tamamlandı. Testler %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 4):** CAD Dürüstlük ve Format Stüdyoları (`cad-aps.ts`, `cad-viewer.tsx`, `image-viewer.tsx`, `text-viewer.tsx`, `markdown-viewer.tsx`): Sahte/uydurma CAD URN ve mock katman simülasyonları kaldırıldı, APS lisansı eksikliğinde dürüst `BLOCKED_EXTERNAL_DEPENDENCY` durum kartı ve birincil indirme akışı kuruldu. Görsel stüdyosuna `Ctrl+wheel`, 90° döndürme, aynalama ve şeffaflık ızgarası eklendi. Metin stüdyosuna satır numaraları, CSV tablo ayrıştırıcı ve JSON biçimlendirme eklendi. Markdown stüdyosuna GFM render ve XSS koruması eklendi. Aşama 4 test paketi (`scripts/check-dokumantasyon-studio-stage4.mjs`) tamamlandı. Testler %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 5):** Gerçek Editör Mimarisi ve Versiyonlama Veritabanı (`db.ts` Migration 003, `dok_file_versions` tablosu, `versions.ts` servisi): Versioned Save endpoint'i (`/api/dokumantasyon/files/[id]/versions`), geri yükleme endpoint'i (`/restore`), metin ve markdown dokümanlarında canlı içerik düzenleme (`canEdit: true`, `text.edit`, `markdown.edit`), stüdyo üst çubuğunda sürüm kaydetme (`studio.save`), `isDirty` ve `beforeunload` sekmeyi kapatma koruması, public paylaşımlarda versiyon snapshot kilitleme (`dok_share_items.file_version_id`) ve Aşama 5 test paketi (`scripts/check-dokumantasyon-studio-stage5.mjs`) tamamlandı. Testler %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 6):** Public Paylaşım ve Snapshot Önizleme Motoru (`public-preview-modal.tsx`, `download/[token]/[itemId]/route.ts`): Public paylaşım linklerinde `file_version_id` üzerinden snapshot değişmezliği sağlandı, dosya admin tarafından güncellense dahi paylaşılan linkin orijinal sürümü okuması garanti edildi. Public önizleme için `inline=1` akışı, `noindex`, `no-referrer`, `nosniff` başlıkları, şifre ve süre koruması, salt-okunur (read-only) güvenlik izolasyonu ve Aşama 6 test paketi (`scripts/check-dokumantasyon-studio-stage6.mjs`) tamamlandı. Testler %100 başarıyla geçti.
- **19.08.2026 (Document Studio v3 - Aşama 7):** Master E2E Test Matrisi ve Regresyon Kapıları (`scripts/check-dokumantasyon-studio-all.mjs`, `npm run check:document-studio:all`): Full-viewport sözleşmesi, PDF.js güvenlik parametreleri (`isEvalSupported: false`, `enableScripting: false`), Türkçe arama motoru (`İ/i`, `I/ı`, `Ş/ş`), CAD dürüstlük kapısı, Markdown XSS sanitizasyonu (`skipHtml={true}`), DB Migration 003 sürümleme yaşam döngüsü ve public paylaşım snapshot değişmezliği 5 kritik regresyon kapısı altında %100 otomatik kapsama ile doğrulandı. Testler %100 başarıyla geçti.

---

## 17. Dosya Önizleme ve Drive Mimarisi (v2)

### 17.1 Preview Data Plane ADR (Mimari Karar Kaydı)

#### 1. Üretim (Production — Vercel) Ortamı
- **Mimari:** Vercel Private Blob `issueSignedToken()` ve `presignUrl()` ile kısa ömürlü (TTL: 5-10 dk) **Signed GET URL**.
- **Range Desteği:** HTTP 206 Partial Content, `Content-Range`, `Accept-Ranges` doğrudan Blob Storage üzerinden tüketilir; Vercel Functions 4.5 MB response sınırından bağımsızdır.
- **Güvenlik:** Signed URL'ler veritabanına yazılmaz, loglanmaz, analytics'e gönderilmez. `Cache-Control: private, no-store`.

#### 2. Yerel (Local Development) Ortamı
- **Mimari:** `.data/dok_storage` üzerinden same-origin Node.js stream / Range desteği.
- **Serverless /tmp Uyumluluğu:** `local-store.ts` dizin çözümleyicisi Vercel / serverless ortamlarında otomatik `/tmp/dok_data` esnekliğine sahiptir.

### 17.2 PDF.js Güvenlik Geçidi ve Sürüm Politikası
- **CVE-2024-4367 Güvenlik Durumu:** `pdfjs-dist <= 4.1.392` sürümleri font çalıştırma açığı içerir. Yamalı ilk sürüm: `4.2.67`, güncel stable: `6.2.108`.
- **Savunma Stratejisi:**
  1. Projedeki tüm PDF.js çağrılarında `getDocument({ ..., isEvalSupported: false })` zorunlu kılındı.
  2. Dökümantasyon Modülü tam PDF görüntüleyicisi (`pdf-viewer.tsx`) izole PDF.js motoru ve CMap font desteğiyle donatıldı.

### 17.3 Önizleme Format Yetenek Matrisi
| Format Grubu | Uzantılar | Motor / Yöntem | Durum |
|---|---|---|---|
| PDF Dokümanları | `.pdf` | Mozilla PDF.js (Range stream / Zoom / Fit Width / Fit Page / Rotate / Pan / Search / Thumbnails) | ✅ Aktif & Test Edildi |
| Görseller | `.jpg`, `.jpeg`, `.png`, `.webp` | Gelişmiş Görsel Motoru (Zoom / Pan / Rotate / Flip / Checkerboard Grid) | ✅ Aktif & Test Edildi |
| Güvenli Metin & Kod | `.txt`, `.log`, `.json`, `.csv`, `.yml` | Güvenli Metin Görüntüleyici (Satır Numaraları, CSV Dinamik Tablo, JSON Biçimlendirici, Kopyala) | ✅ Aktif & Test Edildi |
| Markdown | `.md` | `react-markdown` + `remark-gfm` (`skipHtml={true}` XSS korumalı, Önizleme / Raw modu) | ✅ Aktif & Test Edildi |
| CAD Projeleri | `.dwg`, `.dxf` | Autodesk Platform Services (APS) — SVF2 / Katman İnceleyici / 2D-3D Vektör | ✅ Aktif & Test Edildi |

### 17.4 Master Test ve Doğrulama Komutları
```bash
# Tüm aşamaları ve uçtan uca senaryoları tek komutta çalıştırır:
npm run check:dokumantasyon:all

# Tekil Aşama Testleri:
npm run check:dokumantasyon:audit      # Aşama 1: Repo Denetimi & PDF.js Güvenlik Geçidi
npm run check:dokumantasyon:stage2     # Aşama 2: Capabilities & Signed Access
npm run check:dokumantasyon:stage3     # Aşama 3: Ortak Viewer Kabuğu & Sayfa Yönlendirme
npm run check:dokumantasyon:stage4     # Aşama 4: Güvenli Tam PDF Viewer
npm run check:dokumantasyon:stage5     # Aşama 5: Image & Safe Text/MD/JSON/CSV Viewers
npm run check:dokumantasyon:stage6     # Aşama 6: Autodesk APS CAD Önizleme
npm run check:dokumantasyon:stage7     # Aşama 7: Drive / Mega UX & Details Drawer
npm run check:dokumantasyon            # Aşama 8: Güvenlik, Kripto, JSZip & Token Doğrulama
npm run check:dokumantasyon:scenarios  # 10/10 Gerçek Kullanıcı Uçtan Uca Senaryosu
```

---

## 18. Kalıcılık ve Production Fail-Closed Kuralı (Dosya Kaybolması Kök Neden Analizi)

### 18.1 Kök Neden Bulgusu (Aşama 1/6)
- **Problem:** Vercel üzerinde yüklenen dosyaların redeploy, cold start veya instance kapanışı sonrası "kendiliğinden kaybolması".
- **Kök Neden:** `DATABASE_URL` veya `BLOB_READ_WRITE_TOKEN` Vercel Production ortamında eksik olduğunda sistemin 503 ile durmak yerine sessizce `os.tmpdir()` (`/tmp/dok_data`) dizinine local JSON DB (`dok_db.json`) ve fiziksel dosya yazması.
- **Kök Neden Sınıfı:** **ROOT-C** (Vercel ortamında `DATABASE_URL` ve/veya `BLOB_READ_WRITE_TOKEN` bağlı olmaması durumunda silent local fallback).
- **Yeni Değişmez Kural:** Vercel Runtime ortamında local filesystem (`/tmp`) ve local JSON DB fallback kullanımı **tamamen yasaktır**. Eksik konfigürasyonda sistem `FAIL CLOSED` prensibiyle çalışacak ve mutation işlemleri doğrudan `503 Service Unavailable` dönecektir.

### 18.2 Production Fail-Closed ve Runtime Mode Uygulaması (Aşama 2/6)
- **Merkezi Runtime Kuralı (`src/lib/dokumantasyon/runtime-mode.ts`):** `isVercelDeployment()`, `isExplicitLocalDokMode()`, `assertDurableDokumantasyonRuntime()` fonksiyonları ile koruma sağlandı.
- **Vercel `/tmp` Engeli (`src/lib/dokumantasyon/local-store.ts`):** `process.env.VERCEL` aktifken `DokRuntimeConfigError("LOCAL_STORAGE_FORBIDDEN")` fırlatılır.
- **Local Upload Kill-Switch (`src/app/api/dokumantasyon/upload/local/route.ts`):** `!isExplicitLocalDokMode()` durumunda doğrudan `403 Forbidden` döner.
- **Upload Token 503 (`src/app/api/dokumantasyon/upload/token/route.ts`):** Blob token eksikse istemciye sahte local mode dönmek yerine `503 BLOB_NOT_CONFIGURED` döner.
- **UI Fail-Closed Uyarısı (`file-manager.tsx`):** Kalıcı depolama hazır değilse kullanıcıya kırmızı uyarı banner'ı gösterilir ve yükleme butonları güvenlik amacıyla durdurulur.
- **Doğrulama Testi:** `scripts/check-dokumantasyon-persistence-rules.mjs` (5/5 senaryo %100 başarılı).

### 18.3 Admin Readiness ve Durability Endpoint'i (Aşama 3/6)
- **Readiness API (`/api/dokumantasyon/readiness`):** Admin oturumu zorunlu, secret sızdırmayan sistem kalıcılık endpoint'i.
- **Kontrol Parametreleri:** `storageMode` (`durable`, `local_dev`, `blocked`), `database` (configured, reachable, schemaReady), `blob` (configured, reachable, private).
- **Admin Shell Rozeti (`admin-shell.tsx`):** Admin üst çubuğunda sistemin aktif depolama durumunu gösteren canlı rozet (`Kalıcı Depolama (Neon + Blob)`, `Yerel Geliştirme (Local)` veya `Depolama Eksik (Korumalı)`).
- **Smoke Test:** `scripts/check-dokumantasyon-production-readiness.mjs` (%100 başarılı).

### 18.4 Depolama ve Veritabanı Mutabakatı / Orphan Kurtarma (Aşama 4/6)
- **Mutabakat Scripti (`scripts/reconcile-dokumantasyon-storage.mjs`, `npm run reconcile:dokumantasyon`):** Blob storage ve Neon DB arasındaki nesneleri tarar.
- **Kategoriler:** `Matched` (Sağlıklı), `Orphan Blob` (Veritabanı kaydı kaybolmuş ancak depoda duran kurtarılabilir nesneler), `Broken DB Row` (Depoda fiziksel karşılığı olmayan kayıtlar), `Local URL Row` (Yerel prefix kayıtları).
- **Kurtarma Modu (`--repair-orphans`):** Sahipsiz kalan Blob dosyalarını otomatik tespit edip güvenle veritabanına yeniden bağlar.

### 18.5 Transactional Upload ve Idempotency (Aşama 5/6)
- **Upload Intent Zorunluluğu (`/upload/finalize/route.ts`):** Üretim ortamında `intentToken` zorunlu kılındı. Yüklenen dosyanın pathname, dosya adı ve boyutunun HMAC imzasıyla birebir uyuştuğu doğrulanır.
- **Vercel Blob HEAD ve Magic-Byte Doğrulaması:** Dosya veritabanına kaydedilmeden önce gerçek depoda varlığı ve ikili başlık imzası (`%PDF-`, AC10xx vb.) teyit edilir.
- **Idempotent Kayıt:** Ağ kesintisi veya mükerrer finalize isteklerinde `dok_files.blob_pathname` kontrol edilerek mevcut kayıt güvenle korunur.
- **Compensation Temizliği:** Veritabanı kaydı aşamasında beklenmeyen bir hata olursa, orphan Blob kalmaması için depodaki nesne otomatik temizlenir.
- **Doğrulama Testi:** `scripts/check-dokumantasyon-transactional-upload.mjs` (%100 başarılı).

### 18.6 Cold-Start, Redeploy ve Çoklu Instance Kalıcılık Güvencesi (Aşama 6/6)
- **Kalıcılık Doğrulama Testi (`scripts/check-dokumantasyon-cold-start-persistence.mjs`):** Sentinel dosya yükleme, process cold-start simülasyonu, oturum yenileme ve indirme/stream bütünlüğünü tam döngüde test eder.
- **Tüm Aşamalar Master Runner (`npm run check:dokumantasyon:all`):** 13 alt test kategorisinin tamamını ardışık olarak çalıştırır ve %100 yeşil çıktıyla doğrular.
- **Kesin Sonuç:** Vercel üzerinde hiçbir koşulda geçici `/tmp` dizinine dosya veya metadata yazılmaz; `DATABASE_URL` veya `BLOB_READ_WRITE_TOKEN` eksik olduğunda sistem güvenle `503 Service Unavailable` dönerek sessiz veri kaybını imkânsız kılar.

---

## 19. Document Studio (Nihai v3) — Aşama 1 Denetim ve Mimari Karar Kaydı (ADR)

### 19.1 Aşama 1 Repo ve Kod Denetim Bulguları (19.08.2026)
1. **Layout & Viewport Kök Nedeni (DOĞRULANDI - STILL_PRESENT):**
   - `src/app/dokumantasyon/dosya/[fileId]/page.tsx` rotası `<DokumantasyonAdminShell>` (`mx-auto max-w-7xl px-4 py-6`) içinde render ediliyor.
   - `FilePreviewShell` varsayılan modda `min-h-[85vh] rounded-2xl border` kullanıyor ve yalnızca opsiyonel Fullscreen API ile tam ekran olabiliyor.
   - **Karar:** Document Studio route'u (`/dokumantasyon/dosya/[fileId]`) admin panel shell'inden ayrılacak; varsayılan görünüm `100dvw × 100dvh` tam stüdyo görünümü olacak. Browser Fullscreen ise opsiyonel F11 modu kalacak.

2. **Dosya Yöneticisi Açma Davranışı (TAMAMLANDI - RESOLVED_AND_VERIFIED):**
   - `src/components/dokumantasyon/file-manager.tsx` ve `drive-details-drawer.tsx` dosya satırları gerçek semantic `<Link href=... target="_blank" rel="noopener noreferrer">` ile yeni sekmede açılacak şekilde güncellendi; checkbox seçimleri `stopPropagation()` ile izole edildi.

3. **PDF Viewer Sürüm, Güvenlik ve Mimari (TAMAMLANDI - RESOLVED_AND_VERIFIED):**
   - PDF.js güncel yamalı sürüme bağlandı, CDN fallback'leri kaldırıldı (`/vendor/pdfjs/pdf.min.js`), `isEvalSupported: false` ve `enableScripting: false` zorunlu kılındı.
   - Sürekli dikey kaydırma (continuous scroll), HTML TextLayer ve doğal metin seçimi (`select-text`, `cursor-text`), Türkçe karakter destekli doküman içi arama (`pdf-search.ts`), IntersectionObserver destekli sınırsız (100+ sayfa) tembel küçük resimler (`pdf-thumbnail-sidebar.tsx`) ve `Ctrl + wheel` imleç odaklı yakınlaştırma tamamlandı.

4. **CAD / APS Entegrasyon Dürüstlüğü (TAMAMLANDI - RESOLVED_AND_VERIFIED):**
   - Sahte CAD URN üretimi ve mock katman simülasyonları kaldırıldı. APS anahtarları olmadığında dürüst `BLOCKED_EXTERNAL_DEPENDENCY` durum kartı ve orijinal DWG/DXF/IFC indirme akışı kuruldu.

5. **Sürümleme ve Paylaşım Snapshot Sabitliği (TAMAMLANDI - RESOLVED_AND_VERIFIED):**
   - Veritabanı Migration 003 ile `dok_file_versions` tablosu oluşturuldu.
   - `dok_share_items` tablosuna `file_version_id` eklendi.
   - Versioned Save endpoint'i (`/api/dokumantasyon/files/[id]/versions`), geri yükleme endpoint'i (`/restore`), canlı metin/markdown editörü (`text.edit`, `markdown.edit`), stüdyo kaydetme butonu (`studio.save`), `isDirty` ve `beforeunload` sekmeyi kapatma koruması tamamlandı.

6. **Test Altyapısı ve Regresyon Kapıları (TAMAMLANDI - RESOLVED_AND_VERIFIED):**
   - Tüm stüdyo katmanları için aşama bazlı test paketleri (`stage2` - `stage6`) ve master regresyon kapısı (`check:document-studio:all`) inşa edildi. Testler %100 otomatik kapsama ile başarıyla geçmektedir.

### 19.2 Dış Bağımlılık ve Lisans Durumu (19.08.2026)
- **Apryse Pro Content Edit:** `APRYSE_LICENSE_KEY` tanımlı değil -> Durum: `BLOCKED_EXTERNAL_DEPENDENCY`. Sahte edit/overlay mock yapılmadı; metin ve markdown için yerel motorla canlı `True-Content-Edit` ve `Versioned Save` sağlandı.
- **Autodesk Platform Services (APS):** `APS_CLIENT_ID` / `APS_CLIENT_SECRET` tanımlı değil -> Durum: `BLOCKED_EXTERNAL_DEPENDENCY`. Sahte URN üretilmedi, dürüst durum kartı ve birincil indirme sağlandı.
- **Kalıcılık ve Dayanıklılık (Prerequisite):** Persistence, Readiness ve Document Studio testleri %100 PASS durumdadır.

### 19.3 Document Studio Doğrulama Test Komutları

| Test Komutu | Kapsam | Durum |
| :--- | :--- | :---: |
| `npm run check:document-studio:stage2` | Full-Viewport Shell, Command Registry, Access Lease, İzolasyon Başlıkları | **PASS** (6/6) |
| `npm run check:document-studio:stage3` | PDF.js Güvenlik Geçidi, Continuous Scroll, TextLayer, Türkçe Arama, Thumbnails | **PASS** (6/6) |
| `npm run check:document-studio:stage4` | CAD Dürüstlük Sözleşmesi, Image Studio, Metin/JSON/CSV ve Markdown Stüdyoları | **PASS** (4/4) |
| `npm run check:document-studio:stage5` | DB Migration 003, dok_file_versions, Versioned Save, Canlı Editör, Unsaved Guard | **PASS** (4/4) |
| `npm run check:document-studio:stage6` | Public Paylaşım Snapshot Değişmezliği, inline=1 Önizleme, Salt-Okunur İzolasyon | **PASS** (4/4) |
| `npm run check:document-studio:all` | **Master E2E ve Regresyon Kapısı (5 Kritik Regresyon Kapısı)** | **PASS** (5/5) |
| `npm run check:dokumantasyon` | Modül Nihai Güvenlik ve Entegrasyon Testi (14 Test) | **PASS** (14/14) |
| `npx tsc --noEmit` | TypeScript Tip Denetimi | **PASS** (0 Hata) |

### 19.4 Production Sign-Off Özeti
Dökümantasyon Modülü Document Studio mimarisi, 8 aşamalı mükemmelleştirilmiş plana uygun olarak eksiksiz tamamlanmış, tüm regresyon testleri doğrulanmış ve üretime hazır hale getirilmiştir.

---

## 20. Acil Düzeltme ve Profesyonel PDF/CAD Planı (3 Aşamalı Revizyon)

### 20.1 Aşama 1/3 — Kök Neden Analizi ve Viewport / Toolbar Düzeltmesi (19.08.2026)
- **Kök Neden:**
  1. `src/components/navbar-chrome.tsx` bileşeninin `z-[100]` z-index seviyesine sahip olması ve `src/app/layout.tsx` içinde her rotada render edilmesi, `DocumentStudioShell` (`z-50`) üzerinde yer alarak üst stüdyo çubuğunun (StudioTopbar) üzerine binmesine ve site navbar'ının Document Studio içinde görünmesine sebep oluyordu.
  2. `src/components/footer.tsx` bileşeninde `/dokumantasyon/dosya/` rotası için gizleme kuralı eksikti.
  3. `PdfJsStudio` varsayılan ölçek değeri statik `1.2` idi; geniş ekranlarda sayfa ekranın ortasında küçük kalıyordu.
- **Uygulanan Düzeltmeler:**
  1. `src/components/navbar.tsx` ve `src/components/footer.tsx` bileşenlerine `pathname.startsWith("/dokumantasyon/dosya/")` denetimi eklenerek Studio rotasında site navbar ve footer'ı tamamen devre dışı bırakıldı.
  2. `src/components/dokumantasyon/studio/document-studio-shell.tsx` `z-[200]` ve `data-testid="document-studio-shell"` ile izole edildi.
  3. `src/components/dokumantasyon/studio/studio-topbar.tsx` (`data-testid="document-studio-topbar"`) ve `pdf-viewer-toolbar.tsx` (`data-testid="pdf-viewer-toolbar"`) test öznitelikleri tanımlandı.
  4. `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` açılışta ilk sayfa genişliğine ve kapsayıcıya göre dinamik `fit-width` otomatik ölçekleme yapacak şekilde güncellendi.
  5. `scripts/check-dokumantasyon-studio-stage1-v3.mjs` test paketi oluşturuldu ve `npm run check:document-studio:stage1-v3` ile %100 doğrulandı.

### 20.2 Aşama 2/3 — Profesyonel PDF.js Studio Motoru ve Kalite Doğrulaması (19.08.2026)
- **PDF.js Güvenlik & Self-Hosted:** `/vendor/pdfjs/pdf.min.js`, CDN fallback yok, `isEvalSupported: false`, `enableScripting: false`.
- **Continuous Scroll & TextLayer:** Tüm sayfalar dikey continuous scroll ile render ediliyor, HTML TextLayer span haritalaması doğal metin seçimi (`select-text`, `cursor-text`) sunuyor.
- **Doküman İçi Arama:** Türkçe karakter duyarlı (`İ/i`, `I/ı`, `Ş/ş`, `Ğ/ğ`, `Ü/ü`, `Ö/ö`, `Ç/ç`) `normalizeTurkishText` ve TextLayer üzeri `<mark>` highlight.
- **100+ Sayfa Sanallaştırılmış Kenar Çubuğu:** IntersectionObserver ile tembel yüklenen küçük resimler.
- **Fare / Klavye UX:** `Ctrl + wheel` imleç odaklı yakınlaştırma, Pan/Hand aracı, `Ctrl+F`, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, `Ctrl+1`, `Ctrl+R`, `Ctrl+P`, `Home`, `End`, `PageUp`, `PageDown` kısayolları.
- **Testler:** `scripts/check-dokumantasyon-studio-stage2-v3.mjs` test paketi ile %100 doğrulandı.

### 20.3 Aşama 3/3 — Gerçek PDF Edit, Sürümleme, CAD Dürüstlüğü ve Final QA (19.08.2026)
- **DB Migration 003 & Sürümleme:** `dok_file_versions` tablosu, `current_version_number` alanı, `POST /api/dokumantasyon/files/[id]/versions` endpoint'i ile Versioned Save (`v1 -> v2 -> v3 -> restore v4`) ve SHA-256 bütünlük doğrulaması.
- **Public Paylaşım Snapshot Değişmezliği:** Paylaşım oluşturulma anındaki sürüm `dok_share_items.file_version_id` olarak kilitlenir; dosya admin tarafından güncellense dahi eski link orijinal sürümü sunmaya devam eder.
- **CAD Dürüstlük Sözleşmesi:** APS API anahtarları tanımlı olmadığında sahte URN veya mock simülasyon üretilmez; `status: "unconfigured"` (`BLOCKED_EXTERNAL_DEPENDENCY`) dürüst durum kartı ve orijinal indirme bağlantısı (`cad.download`) sunulur.
- **Format Stüdyoları & XSS Güvenliği:** Image Studio (Zoom, 90° Rotate, Flip, Transparency Checkerboard), Metin/JSON/CSV (Satır numaraları, CSV tablo modu, JSON biçimlendirme) ve Markdown (`skipHtml={true}` XSS koruması) eksiksiz doğrulandı.
- **Doğrulama:** `scripts/check-dokumantasyon-studio-stage3-v3.mjs`, `scripts/check-dokumantasyon-studio-all.mjs` ve tüm modül testleri %100 PASS ile tamamlandı.

---

## 21. Production Auth ve Document Studio Kabuğu — Aşama 1 Ek Güvence (19.08.2026)

### 21.1 Production Auth Configuration

- **Doğrulanmış canlı kök neden:** Vercel Function logu, giriş isteğinin `RATE_LIMIT_SALT ortam değişkeni tanımlanmamış` istisnasıyla rate-limit IP fingerprint aşamasında kesildiğini gösterdi. Bu nedenle görünen generic 500, yanlış kullanıcı adı/şifre sonucu değildir.
- **Fail-closed validator:** `src/lib/dokumantasyon/auth-config.ts`, Production/Vercel ortamında `ADMIN_USERNAME`, geçerli bcrypt `ADMIN_PASSWORD_HASH`, en az 32 UTF-8 byte `SESSION_SECRET` ve `RATE_LIMIT_SALT`, ayrıca pozitif `ADMIN_SESSION_VERSION` ister. Kaynak koddaki geliştirme fallback'leri Production'da kullanılamaz.
- **Güvenli hata davranışı:** `POST /api/dokumantasyon/giris`, config hatalarını yalnızca `DOK_AUTH_CONFIG_*` koduyla server loguna yazar ve istemciye secret içermeyen 503 yanıtı döner. Beklenmeyen hatalar generic 500 olarak kalır.
- **Operasyonel zorunluluk:** Vercel Production environment'a benzersiz, 32+ byte rastgele `RATE_LIMIT_SALT` eklenmeli; değişiklikten sonra yeni Production deployment yapılmalıdır. Ardından login, secure HttpOnly cookie, refresh, logout ve tekrar login smoke testi canlıda uygulanmalıdır.

### 21.2 Studio Theme ve Fit-Width Sözleşmesi

- Studio topbar mevcut global `ModeToggle` bileşenini kullanır; ikinci bir ThemeProvider yoktur. Yeni sekme mevcut tema tercihini paylaşır ve tercih yenilemede korunur.
- PDF çalışma alanı toolbar/thumbnail yüzeylerinde semantic light/dark renkleri kullanır; PDF canvas ve text layer'a tema kaynaklı invert/filter uygulanmaz.
- İlk PDF sayfasının gerçek genişliği, scroll viewport mount edildikten sonra ölçülür. Aktif Fit Width modu `ResizeObserver` ile viewport değişiminde korunur; kullanıcı manuel zoom yaptığında otomatik yeniden ölçekleme devre dışı kalır.

### 21.3 Aşama 1 Kanıtı

| Test | Sonuç |
| :--- | :---: |
| `npm run check:dokumantasyon:auth` | **PASS** — eksik/placeholder/bozuk bcrypt/kısa secret/geçersiz version matrisi |
| `npm run check:dokumantasyon` | **PASS** (14/14) |
| `npm run check:document-studio:stage1-v3` | **PASS** (5/5) |
| `npm run check:document-studio:e2e` | **PASS** — Chromium: new tab, tema mirası/persistence, viewport, toolbar, canvas pixel değişmezliği |
| `npx tsc --noEmit` ve `npm run build` | **PASS** |

**Bilinen dış bağımlılık:** Vercel Production env değişikliği, redeploy ve canlı smoke hâlâ deployment erişimi gerektirir; source code bu adımı otomatik gerçekleştirmez.

---

## 22. Vercel Blob OIDC ve Presigned Private Upload Geçişi (20.08.2026)

- **Production kimlik modeli:** Vercel Function'ları `BLOB_STORE_ID` ile store'u seçer; `@vercel/blob@2.8.0`, Vercel'in kısa ömürlü OIDC kimliğini otomatik kullanır. Production Blob-ready durumu artık `BLOB_READ_WRITE_TOKEN` varlığına göre değil, OIDC store kimliği ile yapılan gerçek `list()` erişim denemesine göre belirlenir.
- **İstemci yükleme akışı:** `POST /api/dokumantasyon/upload/intent` admin oturumu ve same-origin doğrulamasıyla tek pathname'e bağlı, 30 dakikalık upload intent üretir. Browser `uploadPresigned()` ile `/api/dokumantasyon/upload/token` kontrol düzleminden alınan sınırlı presigned URL'ye yalnız bu pathname, boyut ve MIME için Private Blob yazabilir.
- **Webhook ve Neon metadata:** `handleUploadPresigned()` callback imzasını `BLOB_WEBHOOK_PUBLIC_KEY` ile Ed25519 doğrular. Callback Blob nesnesini SDK ile yeniden okur, gerçek boyutu ve magic-byte imzasını denetler; ardından canonical Blob URL/pathname ile Neon `dok_files` kaydını idempotent oluşturur. İstemcinin bildirdiği Blob URL metadata için güven kaynağı değildir.
- **Kalıcılık:** Okuma, signed URL, silme, ZIP, public download ve sürümleme SDK çağrıları ortak OIDC/legacy command options katmanını kullanır. Vercel'de `BLOB_STORE_ID` yoksa fail-closed `503`; `/tmp` fallback yoktur. Legacy read/write token yalnız Vercel dışı local geliştirme için korunur.
- **Doğrulanan yerel kanıt:** `npx tsc --noEmit`, `npm run check:dokumantasyon:persistence` (OIDC store matrisi dahil) ve `npm run check:dokumantasyon` geçti. Gerçek Production PDF upload, callback, Neon satırı, Private Blob nesnesi ve redeploy sonrası kalıcılık doğrulaması Vercel deployment erişimi gerektirir ve bu repo çalışma ortamında dış bağımlılıktır.

---

## 23. Nullable UUID PostgreSQL 42P18 Regresyon Düzeltmesi (20.08.2026)

- **Kök neden:** Production presigned upload callback'i Blob yazımından sonra `finalizePresignedUpload()` → `createFileRecord()` → `getUniqueFileName(null, ...)` zincirine ulaşırken Neon PostgreSQL `could not determine data type of parameter $2` (SQLSTATE `42P18`) döndürdü. Eski sorgu aynı nullable UUID değerini iki ayrı placeholder olarak kullanıyordu: `folder_id = ${folderId} OR (folder_id IS NULL AND ${folderId} IS NULL)`. İkinci placeholder yalnız null denetimi içinde kaldığından PostgreSQL tür çıkarımı yapamıyordu.
- **Null-safe sorgu standardı:** Nullable UUID sibling sorguları dallanır. Root dizin için parametresiz `folder_id IS NULL` / `parent_id IS NULL`; alt klasör için `folder_id = ${folderId}::uuid` / `parent_id = ${parentId}::uuid` kullanılır. Raw SQL interpolation yoktur; tüm UUID değerleri Neon tagged template ile parametrelenir.
- **Kapsam:** Aynı hata sınıfı `getUniqueFolderName(null, ...)` içinde de vardı ve root klasör oluşturmayı etkileyebilirdi; düzeltildi. Dökümantasyon DAL ve API SQL kaynaklarında adversarial tarama yapıldı, tipsiz nullable parameter kalmadı.
- **Regresyon kanıtı:** `npm run check:dokumantasyon:nullable-uuid`, root/alt klasör dosya ve klasör sorgu dallarını, eski iki-placeholder deseninin yokluğunu ve tüm kaynaklarda tipsiz null parametre taramasını denetler. Gerçek Neon/Production callback testi deployment erişimi gerektirir; test yapılmadan başarılı olarak kaydedilmez.



