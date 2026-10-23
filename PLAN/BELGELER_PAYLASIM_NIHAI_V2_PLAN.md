# İNŞA BLOG — BELGELER: AKILLI PDF DOSYA ADI + 90 GÜNLÜK SALT-OKUNUR BAĞLANTI

**Plan kimliği:** `INSA-BELGELER-LINK-V2-20261023`  
**Revizyon:** `2` — 23 Ekim 2026, Europe/Istanbul  
**Durum:** `PLAN_HAZIR` / `BASLAMADI`  
**Hedef proje:** https://github.com/smitelagwar/muhendislik-site — https://muhendislik-site.vercel.app/belgeler  
**İncelenen kaynak sürümü:** `main` / `323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47` (2026-10-23). Yerel çalışma ağacı bu sürümden farklı olabilir.  
**Hedef ortam:** Windows yerel proje; Codex / Antigravity / Gemini / Claude gibi terminal, dosya, tarayıcı ve test yetkisi olan masaüstü ajanı. Hedef model belirtilmedi; plan modelden bağımsız ve net kabul kapılıdır.  
**Yayın:** Kapsamda. `ASAMA_01–09` yerelde; yalnız `ASAMA_10` tek kontrollü `main` push → Vercel Production doğrulaması.  
**Durum dosyası:** `PLAN/BELGELER_PAYLASIM_NIHAI_V2_STATE.md`. Planın repo içindeki yeri: `PLAN/BELGELER_PAYLASIM_NIHAI_V2_PLAN.md`. **Önceki v1 plan ve state dosyalarını ezme.**

> **KESİN KAPSAM DEĞİŞİKLİĞİ:** WhatsApp paylaşımı kaldırıldı. **PDF'yi uygulamaya dosya olarak gönderme; `navigator.share`/`navigator.canShare`; `wa.me`/WhatsApp deep-link; WhatsApp'a bağlantı gönder; Telegram/e-posta/cihaz paylaşım sayfası; QR ile paylaşım YOK.** “Paylaş” düğmesinin **tek işi**, kullanıcı istediğinde 90 gün geçerli görüntüleme bağlantısı oluşturmak ve **Kopyala** sunmaktır. Var olan **PDF İndir** düğmesi aynen korunur; otomatik dosya adı ona uygulanır. Bir sonraki aşamada doğrudan uygulamaya paylaşımı kendiliğinden ekleme.

## 0 — Nihai kararlar ve seçme gerekçeleri

1. **Beş belge tipi, tek isimlendirme sözleşmesi.** Dolu PDF indirirken `Taahhutname_Huseyin-Yilmaz_2026-10-23.pdf` benzeri güvenli ad. Belge tarihi geçerliyse formdaki tarih ISO biçimine çevrilir; geçersiz/boşsa **Europe/Istanbul'da dışa aktarıldığı gün** kullanılır. Örnek kişi adı dosya adına taşınmaz. Beş şablonun `*_BOS.pdf` isimleri korunur.
2. **Tek Paylaş → Bağlantı Oluştur → Kopyala** akışı. Bağlantı oluşmadan sunucuya veri gitmez; yalnızca aktif kullanıcı tıklamasından sonra sunucu işlemi başlar. Süre **90 × 24 saat sabit**; kullanıcıya süre sorulmaz.
3. **Sunucu tarafından üretilen, düzleştirilmiş PDF.** Claude v1'de önerilen istemciden keyfî PDF baytı POST etme yaklaşımı **reddedildi**: anonim yükleme, belge sahteciliği/host suistimali ve istenmeyen içerik riskini artırıyor. `POST` yalnız belge kimliği ve izin verilen form alanlarını içeren küçük JSON alır; sunucu mevcut PDF motoruyla `flatten:true` çıktı üretir. Beş belge için sunucu-istemci görsel eşliği `ASAMA_01` POC ve `ASAMA_09` kabul kapısıdır. **Sunucuda üretim başarısızsa düzleştirilmemiş veya keyfî PDF yüklemeye sessizce geçme.**
4. **Yalnız-okunur, bağımsız PDF.js görüntüleyici.** Mevcut `PdfJsStudio` PDF okuyucusunda callback verilmezse bile indirme fallback'i ve “yeni sekmede aç” davranışı bulunuyor. Bu nedenle devasa düzenleyiciye `viewOnly` istisnaları serpiştirmek yerine, var olan `pdfjs-client`/worker, render ve zoom yardımcılarını yeniden kullanan **küçük salt-okunur bir görüntüleyici** yap. Form/inline-edit katmanları, yazdır, indir, dosya değiştirme ve paylaşım yönetimi asla bu bileşene import edilmez. Dokümantasyon'un `/p/[token]` ekranı etkilenmez.
5. **Ayrı altyapı, ortak güvenli yardımcılar.** Neon'da ayrı `belge_paylasim_links` tablosu; **private** Vercel Blob'da `belge_paylasim/<rastgele-id>.pdf` öneki; kısa `/b/[token]` adresi. Yönetici `/p/[token]`, `dok_*` tabloları, yetkilendirmesi ve indirme davranışları değiştirilmez.
6. **Erişimin sonlanması anlık, fiziksel temizleme periyodik.** `expires_at` geldiği anda her istekte `410` (cron zamanına bağlı değil). Günlük yetkili cron PDF'yi Blob'dan siler; hata halinde tekrar dener; mezar taşı kayıtlarını da sonunda kaldırır. Silme anında **önce DB'de erişimi kapat**, sonra Blob'u sil: önce Blob silip kaydı hâlâ aktif bırakmak güvenli değil.
7. **İptal edilebilir bağlantı.** Bağlantıyı oluşturan tarayıcı gizli bir *yönetim anahtarı* saklayarak kendi bağlantısını iptal edebilir. Bağlantının kendisi **asla** değiştirme/iptal yetkisi vermez. Anahtar yalnız cihazda kalır; kaybolursa kullanıcı hesabı bulunmadığından başka cihazdan yönetim garantisi verilmez.
8. **Gerçek güvenlik sınırı:** Sayfanın düzenleme kontrolleri kapalı ve sunucudaki PDF değişmezdir. PDF içeriğini görüntüleyebilen kişinin ekran görüntüsü almasını, ağdan baytları çıkarmasını veya **kendi kopyasını** haricî araçta değiştirmesini yüzde yüz engellemek mümkün değildir. DRM veya kopya engelleme vaadi yazma.

### Karşılaştırmalı karar tablosu

| Konu | Claude v1 | Önceki ChatGPT v1 | Nihai V2 |
|---|---|---|---|
| WhatsApp / native dosya paylaşma | Var | Var | **Tamamen çıkarıldı** |
| Otomatik dosya adı | Form tarihini parse eder | Dışa aktarma günü | **Geçerli belge tarihi, yoksa İstanbul'da bugün** |
| Link verisi | İstemciden 3 MB PDF yüklemesi | Küçük JSON, sunucuda PDF üretimi | **Sunucu üretimi — saldırı yüzeyini küçültür** |
| Görüntüleyici | `PdfJsStudio.viewOnly` yamaları | Ayrı yalnız-okunur PDF.js bileşeni | **Küçük ayrı görüntüleyici; PDF motoru yardımcıları ortak** |
| İptal | Yönetim anahtarı | Opsiyonel | **Varsayılan; yetki anahtarı zorunlu** |
| Temizlik | Günlük cron + purge hatası | Günlük cron + orphan reconcile | **İkisi + anında erişim kapatma** |
| Sunucu kotası | Sayma + kota | Atomik, kalıcı, fail-closed | **Atomik kota rezervasyonu + toplam byte bütçesi** |
| Release | 9. aşama | 9. aşama | **10. aşama; ara deploy yok** |

## 1 — İncelenen kaynak, kanıt ve sınırlar

**Doğrudan kaynak koddan görülenler (`main`, yukarıdaki commit):**

- Next.js `16.4.2`, React `19.2.3`, `pdf-lib` `1.17.1`, `pdfjs-dist` `6.3.289`, `@vercel/blob` `^2.8.0`, `@neondatabase/serverless` `^1.1.0`. Yeni bir veritabanı, PDF paketi veya barındırma ürünü gerekmiyor.
- Beş stüdyo: `src/components/{taahhutname,istifa,insaat-ruhsati,sozlesme,beton-dokum}-studio.tsx`; ortak eylemler `src/components/belge-studio-actions.tsx`. Mobilde mevcut `Formu Düzenle` ve `PDF İndir` alanını daraltmak kabul edilmez.
- Hazır PDF: `src/hooks/use-belge-studio-document.ts` → `snapshot.bytes`, `revision`, `blobUrl`; `sourceData`/`status` üzerinden eski revizyon ayırımı. İndirme fonksiyonları `src/lib/pdf-engine.ts`, `downloadFilled*Pdf`; mevcut dosya isimleri farklı öneklerle ve ham `tarih` metniyle kuruluyor. `populateForm` içinde `flatten` var; üst düzey `generateBelgeDocument` çağrısı bu seçeneği henüz dışarı açmıyor.
- İsim alanları: taahhütname `santiye_sefi_ad_soyad`; istifa ve ruhsat `ad_soyad`; sözleşme `santiye_sefi_ad`; beton için tam 7 haneli `yibf`. Tarih: çoğunda `tarih`, sözleşmede `sozlesme_tarihi`.
- `src/lib/belge-draft-storage.ts` ve `src/lib/document-field-contracts.ts` yalnız izin verilen alanları doğrulamak için yeniden kullanılabilir; tarayıcı taslağı PDF'nin yanında depoya **yüklenmez**.
- Dokümantasyon paylaşımı `src/lib/dokumantasyon/{shares,public-share,security,db}.ts` üzerinde mevcut; yöneticinin dosya/veri modeli ayrı. `checkRateLimit` başarısız girişimleri saydığından anonim başarılı bağlantı oluşturma kotasında **doğrudan kullanılamaz**. Kodu mümkün olduğunca yeniden kullan ama bu ayrımı koru.
- Kaynakta `src/app/layout.tsx` genel `Navbar`, `Footer`, `GlobalOverlays` içeriyor; yeni `/b/` yalnızca viewer olacaksa route-aware chrome düzeltmesi gerekir.
- Mevcut testlerden: `npm run check:belgeler-pdf`; `tests/site-audit/belgeler-functional-audit.spec.ts` eski filename öneklerini bekliyor, bilinçli güncellenmeli. `AGENTS.md` yerel/test sonrası tek atomik `main` commit/push'u ve Vercel Production yayını öngörüyor. `.agents/rules/belgeler-kurallari.md` ile `.agents/rules/test-ve-otomasyon-standardi.md` zorunlu bağlam.
- `vercel.json` şu an günlük cron içermiyor. `.env.example` mevcut Neon ve private Blob ayarlarını örnekliyor. **Production ortam değişkenleri gerçekten ayarlı mı, kontrol edilmedi.**

**Claude v1'deki ek inceleme bulgusu — yerelde yeniden doğrulanacak:** beş kaynak PDF'nin sayfaları 1/1/1/2/1; sözleşme şablonunun yaklaşık 1,17 MB olması. Bunlar *şablon* ölçümüdür; flatten edilmiş **nihai** PDF boyutu ve Vercel Node runtime uyumu henüz kanıtlanmış değildir. Sayfa sayıları, özel form alanları ve görsel eşlik `ASAMA_01` ile ölçülecek.

**Resmî belgelerle doğrulanan dış koşullar (23.10.2026):**

- Vercel Cron Hobby dahil tüm planlarda var; Hobby için günde bir çalıştırma sınırı ve saatlik düzeyde başlatma belirsizliği bulunuyor. Bu nedenle expiry anlık DB kontrolüyle yapılır. https://vercel.com/docs/cron-jobs/usage-and-pricing
- `CRON_SECRET` belirlenince Vercel cron isteklerinde Authorization bearer olarak aktarılıyor. Gizli değer yoksa `Bearer undefined` kontrol tuzağına düşme; **açık fail-closed**. https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Private Blob okuma yetkilendirilmiş server route'u üzerinden streaming ile yapılır, hassas belge için `Cache-Control: private, no-store` uygundur. https://vercel.com/docs/vercel-blob/private-storage
- Vercel Functions request/response payload limitleri (4,5 MB) nedeniyle JSON isteğini küçük tut; PDF üretimini sunucuda yap, viewer PDF yanıtında gerçek streaming ve boyut sınırını test et. https://vercel.com/docs/functions/limitations
- Next 16 güncel route handler kurallarını `node_modules/next/dist/docs/` içindeki kurulu sürüm dokümanından da kontrol et: https://nextjs.org/docs/app/api-reference/file-conventions/route

**Henüz doğrulanmayan:** yerel çalışma ağacı/aktif başka değişiklikler, canlı Vercel planının ayarları/secret izinleri, production cron mevcut işleri, sunucuda 5 PDF'nin flatten ve font eşliği, gerçek çıktı boyutları, private Blob erişimi. Bu noktaları `ASAMA_01` dışında kanıtlanmış sayma.

## 2 — İşlev sözleşmesi (kullanıcının göreceği ürün)

### 2.1 İndirilen PDF'nin otomatik adı

Örnekler:

| Belge | Dosya adı şeması |
|---|---|
| Şantiye Şefi Taahhütnamesi | `Taahhutname_Ad-Soyad_2026-10-23.pdf` |
| Şantiye Şefi İstifa Dilekçesi | `Istifa-Dilekcesi_Ad-Soyad_2026-10-23.pdf` |
| İnşaat Ruhsatı Dilekçesi | `Ruhsat-Dilekcesi_Ad-Soyad_2026-10-23.pdf` |
| Şantiye Şefi Hizmet Sözleşmesi | `Hizmet-Sozlesmesi_Ad-Soyad_2026-10-23.pdf` |
| Beton Döküm Tutanağı | `Beton-Tutanagi_YIBF-1234567_2026-10-23.pdf` |

- Saf yardımcı: `buildBelgeFilename(documentId, values, now: Date)`. Geçerli `GG.AA.YYYY`, `GG/AA/YYYY`, `GG-AA-YYYY`, `YYYY-AA-GG` tarihleri ISO'ya çevir; takvimde olmayan tarih geçersizdir. **Ad boşsa veya belge şablonunun örnek adının aynısıysa ad parçasını tamamen atla.** Tarih parse edilemiyorsa mevcut İstanbul yerel takvim gününü kullan; testlerde sabit saat enjekte et. Örnek tarih belgeye yazıldığı gibi kalır; yalnız dosya adı normalize edilir.
- Türkçe karakterleri ASCII Latin'e dönüştür; sözcükleri `-` ile birleştir, 40 karakterlik ad parçası ve 100 karakterlik toplam sınır. `..`, kontrol karakterleri, yol ayırıcılar, çift `.pdf`, Windows sakıncalı adları temizle. 200 karakter/emoji/boş isim/yol enjeksiyonu test et.
- **Yalnız dolu belge indir** adı değişir. Beş `downloadFilled*Pdf` fonksiyonunda haricî `fileName` parametresi verilirse korunur; `*_BOS.pdf` dosyaları aynen kalır. PDF'nin düzenlenebilir AcroForm yapısı ve `snapshot.bytes` yeniden üretmeden indirilebilmesi korunur.
- Link görüntüleyicisi **kişisel isimli** başlık/OG/URL göstermeyecek; yukarıdaki ad yalnız kullanıcı cihazına inen dosyada görünür. Bağlantı veritabanında mümkünse sadece **hassas olmayan belge türü etiketi** tutulur.

### 2.2 Paylaş düğmesi ve sonuç ekranı

Masaüstünde eylem grubu: `Boş form indir | Yazdır | Paylaş | PDF İndir`. Mobilde 44×44 dokunma alanlı ikonlu **Paylaş** düğmesini mevcut `Formu Düzenle` ve `PDF İndir` alanlarını daraltmadan sığdır; 320px'de taşarsa `⋯ > Paylaş` menüsünde tut, ama tek bir erişilebilir giriş noktası her zaman olsun. Yeni `Paylaş` butonu PDF'yi doğrudan cihaza paylaşmaz; **yalnız link** üretme dialog/sheet'ini açar.

Dialog/drawer davranışı:

1. Açıldığında başlık **“PDF görüntüleme bağlantısı”**; metin: “Bağlantıya sahip herkes bu belgeyi 90 gün görüntüleyebilir. PDF düzenlenemez; bağlantıyı bu cihazdan iptal edebilirsin.”
2. Varsayılan örnek veriler veya TC/telefon/adres doluysa küçük, açık uyarı; gerçek olmayan örnek veriyi gerçek kullanıcı verisi diye belirsizce sunma. Onay vermeden veri yüklenmez. **Tek bilinçli “Bağlantı oluştur” basışı** gönderimi başlatır; ayrıca süre seçimi veya tekrar tekrar onay ekranı yok.
3. İşlem sırasında `Oluşturuluyor…` + eşzamanlı çift basma engeli. Hata olursa ilgili Türkçe uyarı ve yeniden dene; form taslağı/düzenleme hali bozulmaz.
4. Başarıda **yalnız** tam HTTPS linki (salt-okunur input), **Bağlantıyı kopyala** düğmesi ve **Son kullanım: GG.AA.YYYY SS:DD (Türkiye saati)**. `navigator.clipboard.writeText` başarısızsa seçilebilir input ile elle kopyalama. **WhatsApp / PDF gönder / uygulamayla paylaş / QR butonu yok.**
5. `Bağlantılarım` bölümü **yalnız bu tarayıcıda** oluşturulan en çok 20 son bağlantının minimal metadata'sını ve `İptal et` işlemini gösterir. PDF baytı, kişi adı, TC, adres veya ham form değeri `localStorage`'a link kaydı olarak yazılmaz. Var olan otomatik taslak storage anahtarlarıyla karışmaz. Depolama kapalıysa link oluşturma çalışabilir; kullanıcı iptal anahtarının daha sonra geri bulunamayacağını önceden görür.
6. Eski bağlantı, oluşturulduktan sonra **donmuş PDF snapshot**'ıdır. Kullanıcı formu değiştirince eski bağlantının içeriği değişmez; değişmiş form için yeni link gerekir. Aynı kullanıcı isteğine ağ sebebiyle yeniden yanıt alınırsa duplicate yükleme önlenir.

### 2.3 PDF alıcı ekranı

`https://muhendislik-site.vercel.app/b/<yüksek-entropili-token>` açıldığında **yalnız** kompakt başlık, PDF tuvali, `− / % / +`, `Genişliğe sığdır`, `Sayfaya sığdır`, çok sayfalıysa `Önceki/Sonraki` ve sayfa sayacı görünsün. Mobil pinch-zoom, dikey kaydırma ve geri/ileri erişimi çalışsın. Ekranda **form alanı, inline-edit, seçili alan düzenleyicisi, imzala, kaydet, indir, yazdır, paylaş, düzenle, yeni sekmede ham PDF aç, orijinal belgeye dön, site genel header/footer** bulunmasın.

Ekranda PDF metin seçimi gerekmiyorsa etkinleştirme; PDF.js annotation scripting/URI etkin aksiyonları kapalı olsun. `iframe`/tarayıcı yerel PDF viewer'a ham URL'yi koyma. Ekran okuyucu/klavye odağı/44px erişilebilirlik ve dark/light tema tutarlı olsun. Alıcı giriş yapmadan görüntüleyebilir; URL'yi bilenin okuyabilmesi istenen davranıştır. **Bu bir kimlik doğrulama değil, gizli URL yetkisidir.**

## 3 — Teknik sözleşme

### 3.1 API ve veri akışı

```text
KULLANICI /belgeler/<belge-türü>
 form verileri → mevcut istemci PDF preview (normal, düzenlenebilir)
     ├─ PDF İndir → hazır snapshot.bytes + buildBelgeFilename → yerel indirme
     └─ Paylaş → kullanıcı “Bağlantı oluştur”a basar
          → formun o anda sabitlenen izinli değerleri ve clientRequestId
          → POST /api/belgeler/paylasim (küçük JSON; *PDF baytı değil*)
          → sunucu doğrula + atomik kota + PDF generator flatten:true
          → private Blob + Neon hazır kayıt, 90 gün TTL
          → /b/<token> + sadece oluşturan tarayıcıya manageToken
          → Kopyala / Bağlantılarım / İptal et

ALICI /b/<token>
   → server token hash, status, expires_at kontrolü
   → GET /api/belgeler/paylasim/<token>/pdf
   → yalnız yetki sonrası Private Blob GET → Stream
   → minimal salt-okunur PDF.js viewer

GÜNLÜK CRON → süresi dolmuş / iptal edilmiş / yarım kalmış işlerin
              Blob silinmesi + DB kayıt temizlik/uzlaştırma
```

**İstek şeması** (kesin belge alan isimleri `DOCUMENT_EDITABLE_FIELDS` ile doğrulanacak):

```ts
POST /api/belgeler/paylasim
Content-Type: application/json
{
  documentId: BelgeDocumentId,      // 5 değerden biri
  values: Record<string, string>,   // yalnız izinli, sınırlı uzunluklu alanlar
  clientRequestId: string           // o paylaşma girişimine ait UUID
}

201 | 200 (idempotent replay): {
  url: string,              // canonical /b/<token>
  manageToken: string,      // YALNIZ oluşturana döner; linkin içinde bulunmaz
  expiresAt: string,        // UTC ISO
  documentId: BelgeDocumentId
}
```

- `POST` aynı-origin `Origin` kontrolü (uygun CSRF koruması) ve JSON body **en çok 64 KiB**, `Content-Length` güvenmeyerek limitli stream okuma; kötü `Origin`, bilinmeyen alan, iç içe object, çok uzun string, sahte documentId ve örnek dışı fazla alanı reddet. Sunucu `clientRequestId` formatını ve kaynak/veri eşleşmesini de doğrular; istemci `expiresAt`, dosya yolu veya Blob URL belirleyemez.
- Sunucu `validateEditableSnapshot`/`DOCUMENT_EDITABLE_FIELDS` gibi mevcut saf izin listelerinden yararlanıp belgeye özel ek sınırları kontrol eder; bilinmeyen alanları **sessizce atmak yerine** açık ret. Formun doğal uzun metin ihtiyacını kıracak keyfî 30 karakter limiti ekleme; toplam 64 KiB yeterli olabilir, gerçek alan sınırlarını ölç.
- `generateBelgeDocument(id, values, { flatten: true })` geriye uyumlu opsiyon ekler; `flatten:false` İndir'in varsayılanıdır. Kaynak şablondaki sayfa sayısı korunur, `getForm().getFields().length === 0`, Türkçe karakterler ve uzun alan görünümü doğrulanır. Sunucuda oluşturulan baytları Blob'a göndermeden önce `%PDF-`, PDF.js/pdf-lib parse, boyut ve sayfa sayısı kontrolleri yapılır; sunucunun kendi ürettiği belgeye sırf ham byte regex ile `/URI` arayan hatalı false-positive filtresi uygulama.
- PDF limitini **ilk ölçüme göre** belirle. Başlangıç hedefi `3 MiB` (Claude'un 3 MB önerisi), ancak örnek/uzun-adres/duble font çıktıları 3 MiB'i aşıyorsa gerçek maksimum ve Vercel response akış kapasitesini ölçüp kontrollü artır; sınırsız büyütme yok. `POST` her hâlükârda yalnız 64 KiB JSON taşır.
- Sunucu işlemi `runtime="nodejs"`; `maxDuration`, asset tracing, font ve PDF şablonlarının deploy paketine dahil edilmesi **kurulu Next/Vercel sürümüne göre** doğrulanır; hatada paylaşım oluşturma durur, mevcut indirme bozulmaz.

### 3.2 İzole şema ve özel depolama

**Yeni tablo:** `belge_paylasim_links` (yaşayan migration sistemindeki sıradaki kullanılmayan numara; `005` veya `009` olduğunu görmeden varsayma). Mevcut `dok_*` tablolarını veya `LATEST_REQUIRED_SCHEMA_VERSION` işaretleyicisini kanıtsız değiştirme.

Önerilen alanlar:

```sql
id uuid primary key,
request_id_hash char(64) not null unique,
payload_digest char(64) not null, -- HMAC, düz alan hash'i değil
token_hash char(64) not null unique,
manage_token_hash char(64) not null unique,
document_id text not null,       -- CHECK: yalnız 5 desteklenen ID
blob_pathname text not null unique,
size_bytes integer null,
pdf_sha256 char(64) null,
status text not null,            -- pending | ready | revoked | purged | failed
creator_ip_hash char(64) not null,
created_at timestamptz not null,
expires_at timestamptz not null,
revoked_at timestamptz null,
purged_at timestamptz null,
purge_attempts integer not null default 0,
last_purge_error_code text null,
lease_until timestamptz null
```

- Index: token hash, request hash, expiry + ready/purge status, `(creator_ip_hash, created_at)`. PDF veya form alanları SQL'de tutulmaz; yalnız teknik byte boyutu/hash ve hassas olmayan belge tipi. Blob yolu tahmin edilemez random ID içerir, kişi adı içermez. `private` Blob kullan ve `put`, `get`, `del` için mevcut `getBlobCommandOptions()` biçimini koru; **saklama nesnesinin URL'sini istemciye verme**.
- **Şema değişikliği request sırasında yaratılmaz.** Migration sürümlü, idempotent/güvenli ve yayın öncesi uygulanır; yeni tablo için hazırlık başka kullanıcıların `dok_*` verisini değiştirmez. Üretimde varsayılan bellek/disk fallback **yasak**; testte bellek Blob ve PGlite veya mevcut güvenli test DB'si kullanılabilir.
- **Aynı istek için idempotency:** `clientRequestId` tek kullanıcı eyleminde üretilir; ağ hatasıyla tekrar denendiğinde *aynı* değer kullanılır. Salt hash tutulurken tokenı aynı istekte yeniden hesaplayabilmek için sunucunun **ayrı 32 baytlık `BELGE_SHARE_SECRET`** anahtarıyla domain-separated `HMAC-SHA256("view:v1:" + requestId)` ve `HMAC-SHA256("manage:v1:" + requestId)` tokenları üretmesini tercih et. Her biri 256 bit. DB yalnız SHA-256 token hash'lerini saklar; `(request_id_hash, payload_digest)` eşleşmeyen tekrar `409`, eşleşen hazır kayıt aynı URL/management token'ı döndürür; iptal edilmiş link yeniden etkinleşmez. `BELGE_SHARE_SECRET` kayıp/rotasyonunda eski token erişimi DB hash lookup üzerinden sürer, ancak aynı request için token yeniden üretme/iptal anahtarı kurtarma kaybolur; secret rotasyonu versiyonlanmalı, geçmiş anahtar gereksiz uzun tutulmamalı. Secret oluşturma ve Vercel'e ekleme ASAMA_10 yayın ön koşuludur.
- **Yarış/kota:** Her başarılı/başarısız create denemesi DB'de atomik sayaç veya kilitlenmiş counter rezervasyonuyla sınırlandırılır; önce `SELECT COUNT` sonra `INSERT` yapan yarışlı çözüm **yasak**. Başlangıç önerisi IP başına **15 dakikada 3 deneme, 24 saatte 10, 20 aktif link**, global günde **200** ve en çok **1 GiB toplam aktif blob**; tüm limitler kod config'i, gizli formda kullanıcıdan istenmez. Ölçülen trafiğe göre sonraki revizyonlarda ayarlanabilir. Üretimde DB/Blob/kota başarısızsa `503`, disk veya serverless RAM fallback yok. Anonim abuse riskinin tamamen ortadan kalkmadığını dokümante et; CAPTCHA/ücretli servisi başlangıçta zorunlu hale getirme.
- IP kimliği platformun **güvenilir proxy** başlığından alınmalı; istemcinin yazabildiği uydurma header kota atlamasına neden olmamalı; DB'de **tuzlanmış/pseudonymous IP hash'i** sakla; düz IP saklama. Düşük trafik varsayımıyla kaynak tüketimini ölç ve gereksiz yüksek eşzamanlı PDF üretimini sınırlı tut.
- Yazma sırası: atomik quota + `pending` rezervasyon → sunucu PDF doğrulama/flatten → Private Blob put → `ready` finalize. Her `pending` kayıt yetkisiz; Blob/DB hatalarında best-effort temizlik + lease/reconciliation. Aynı request id ile eşzamanlı gönderim yalnız tek aktif nesne üretir. İptalde **önce** veritabanında `revoked` (anında 410) → Blob silme denemesi; silme başarısızsa cron tekrar dener. **`del` başarısız diye erişim açık kalmaz.**

### 3.3 Rotalar ve yetki

| Yeni rota | Yöntem | Davranış |
|---|---|---|
| `/api/belgeler/paylasim` | `POST` | Küçük JSON alır, server PDF üretir, 201/200 URL + manageToken; 400/409/413/415/429/503 yapılandırılmış Türkçe hata; yanlış origin 403 |
| `/api/belgeler/paylasim/[token]` | `DELETE` | `x-manage-token` zorunlu, hash sabit-zamanlı kıyas; doğruysa önce DB revoke, sonra purge denemesi. Yanlış/kayıp token 403/404; başkasının anahtarıyla erişim yok |
| `/api/belgeler/paylasim/[token]/pdf` | `GET`, gerekirse `HEAD` | Her istekte token+durum+expiry kontrolü sonrası private Blob stream; `404` bilinmeyen, `410` iptal/süre dolu. Diğer yöntemler 405 |
| `/b/[token]` | `GET` | İndekslenmeyen, genel header/footer içermeyen salt-okunur PDF.js ekranı; expired/revoked/not_found güvenli durum ekranı |
| `/api/cron/belge-paylasim-temizlik` | `GET` | Yalnız **tanımlı** `CRON_SECRET` ile `Authorization: Bearer <secret>`; önce expired, revoked, pending orphan, failed purge işleri ve eski tombstone'ları işler |

- Tüm PDF, link ve başarısız durum yanıtları uygun `Cache-Control: private, no-store`; `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow, noarchive`, `X-Content-Type-Options: nosniff`. `Content-Disposition: inline` ve kullanıcı adı taşımayan başlık. `GET` her defasında expiry doğrular; `HEAD` varsa aynı kontrolle çalışır. Range için ya doğru yetki sonrası 206/416 sözleşmesi uygula ya PDF.js ile doğrulanmış `200` tam akış kullan; **sahte `Accept-Ranges: none` başlığı ile var olmayan 206 davranışı vaat etme**.
- Tokenı URL içinde taşıyan alıcı sayfası üçüncü taraf analitik/piksel/font/haricî bağlantılara token sızdırmamalı; OG title ve metadata genel `Paylaşılan PDF`, dosya içeriği ve kişi adı yok. `robots.ts` disallow yalnız ek savunmadır; güvenlik `noindex` veya `robots`'a dayanmaz. `src/app/[slug]` rotası ile kısa `/b/[token]` çakışmadığını yerelde kontrol et.
- Root `layout.tsx` global chrome'u render ediyor. **Koşullu site kabuğu** çıkar ve `/b/` sayfasında navbar/footer/overlay DOM'a dahi eklenmesin; CSS ile gizlemeye veya fixed overlay ile üstünü örtmeye dayanma. Varsayılan tüm diğer rotalarda mevcut header/footer/safe-area normal kalsın; SSR/hydration sırasında header flash olmasın.
- Kullanıcı arayüzünde Yazdır/İndir/`Ctrl+P`/`Ctrl+S` gizleme veya önleme **yalnız UX** katmanıdır, ağ araçlarıyla PDF içeriğinin alınmasını önlemez. Sunucuda **hiçbir PDF düzenle/güncelle rotası** bulunmamalı. PDF düzleştirme form alanını kaldırmalı. Görüntüleyici yeni sekmeye ham PDF açmamalı.

### 3.4 90 günlük temizlik ve depolama büyümesi

- Oluşturma saati DB/UTC; sona erme tam **90 × 24 saat**, UI Europe/Istanbul'a çevirir. Süresi geçen PDF'nin API erişimi aynı saniye `410` olur; cron henüz silmese bile görüntülenemez.
- `vercel.json`'da var olan ayarlar korunarak **günde bir** cron (ör. `0 3 * * *`, Vercel UTC). Hobby planında izinli; saatin dakik kesinliğine güvenme. `CRON_SECRET` eksik/yanlışsa **401**; prod'da secret olmadan temizleme yetkili olmaz. Bu durumda **yayın kapısı başarısız** sayılır.
- Temizlik 50–100 kayıtlık, süre limitli `claim/lease` batch'leriyle: `expires_at <= now()` veya revoked; Blob `del` → `purged_at`; hata `purge_attempts++`, `last_purge_error_code` ile izlenir, sonraki cronda retry. İşlem ortasında 504/restart olursa lease zamanı dolunca tekrar işlenebilir. Tekrarlı `del`/`not found` idempotent kabul edilir.
- `pending` olup saatlerce finalize olmayan kayıtları uzlaştır; kaydı olmadan yazılmış `belge_paylasim/` orphan Blob'larını tarayıp **24 saat grace** ile temizle (SDK prefix listing ve maliyet gerçekliğini ölç; çok büyük listeyi tek çağrıda tüketme). Başka prefix'e asla dokunma. Fiziksel silmede başarılı PDF sonrası 30 günlük minimal “süresi doldu/iptal” mezar taşı kalabilir; süresi biten mezar taşları da silinir; kişisel alan hiç saklanmaz. Üretimde cleanup testlerini **sahte/kontrollü kayıtlarla** yap; mevcut kullanıcı dosyalarını silme.
- Küresel aktif byte bütçesi ve oran limitleri şişmeyi kontrol eder. Gözlem: aktif link sayısı/byte, kalan süresi 0 olan ama Blob'u duranlar, purge hataları, 429 sayıları, yaklaşık Function+Blob transferi. Her link görüntüleme için private Blob sunucudan aktarıldığından maliyetsiz sınırsız trafik varsayma.

## 4 — Aşamalar (bir `devam` = en fazla bir aşama)

| Aşama | Tek somut çıktı | Commit/deploy |
|---|---|---|
| `ASAMA_01` | Mevcut durum/baseline + 5 sunucu flatten POC kanıtı | Yok |
| `ASAMA_02` | Tek akıllı dosya adı ve 5 indirme entegrasyonu | Yok |
| `ASAMA_03` | Paylaş dialog'u ve responsive giriş noktası (arka uç kapalı) | Yok |
| `ASAMA_04` | Ayrı DB/Blob adaptörü, kota, token/idempotency çekirdeği | Yok |
| `ASAMA_05` | Server-side PDF üretimi + POST ve yönetim/iptal API'leri | Yok |
| `ASAMA_06` | Yetkili PDF akışı + sade yalnız-okunur `/b/[token]` | Yok |
| `ASAMA_07` | Dialog'un gerçek link oluşturma/kopyalama/iptal entegrasyonu | Yok |
| `ASAMA_08` | Günlük cron, purge/reconcile, retention ve maliyet limiti | Yok |
| `ASAMA_09` | Bütünsel test/güvenlik/UX/perf kabulü ve belgeler | Yok |
| `ASAMA_10` | Bir atomik `main` release + Vercel canlı kabul | **Tek release** |

**Her aşama için ortak kural:** Giriş koşulu = önceki aşama `PASS`; test çalıştır, gerçek sonucu STATE'te kanıtla; zorunlu kabul sağlanmıyorsa `ENGELLI` ve bağımlı aşamaya geçme. Gerekli küçük düzeltmeleri aynı aşamada yap, her adımda kullanıcıya soru sorma. Hata/geri dönüş yalnız yeni görev değişikliklerini hedefler; kullanıcının mevcut dosyalarını sıfırlama. Aşama sonunda **dur** ve kısa sonuç yaz.

### ASAMA_01 — Kanıtlı başlangıç ve mimari POC

**Giriş:** Plan ve yerel proje mevcut. Sırayla `PROJECT.md`, `AGENTS.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md` (varsa), ilgili alt dizin ve yaşayan ürün dokümanlarını oku. `git status --short --branch`, `git rev-parse HEAD`, Node/npm sürümleri, mevcut test komutlarını kaydet. Dirty çalışma ağacını **ezme, temizlemeye zorlama**; sadece çakışan kullanıcı değişikliği varsa bu aşamada engel olarak belirt.

**Uygulama:** Kod değiştirmeden 5 stüdyonun isim/alan/varsayılan verilerini, PDF üretim/indirme ve son revizyon tutarlılığını incele. `flatten:true` ile Node/server ortamında beş gerçek sahte-verili çıktı **POC** üret: boyut, sayfa, AcroForm alan sayısı, metin çıkarımı, örnek TC/adres ve uzun alan yerleşimi; aynı verinin istemci flatten:false PDF'si ile görsel/metinsel farkı ölç. Fontlar, `public/belgeler` şablonları ve Vercel bundle tracing uyumunu kontrol et. Vercel bağlantısı varsa plan tipini, secret **varlığını** (değeri asla yazma), cron ve private store erişimini kontrol et. `db/migrations` içindeki gerçek numara düzenini çöz. `src/app/layout.tsx` chrome davranışı ve `/b/` rota çakışmasını değerlendir. Baseline `npx tsc --noEmit`, `npm run check:belgeler-pdf`, ilgili `belgeler-functional-audit` Playwright ve `npm run lint` (mevcut scriptlerin gerçek varlığını doğrula); baseline kırıklarını ayrı işaretle.

**Kabul:** Beş adet server flatten PDF başarıyla oluştu; AcroForm 0, sayfa/metin/görünüm makul eş; output boyut limiti gerekçeli; gerçek HEAD ve baseline PASS/KNOWN_FAIL kayıtlı; private Blob/Neon test için hangi adaptörün kullanılacağı net; migration numarası çakışmıyor. **Server POC başarısızsa arka uca geçme; çözümü mevcut PDF motoru Node uyumuyla sınırlı biçimde düzelt/raporla. Keyfî PDF upload'a geçme.**

**Hata/geri dönüş:** Geçici ölçüm dosyaları/süreçleri temizle; eski çalışma ağacını koru. **Dur**; state'i güncelle.

### ASAMA_02 — Dosya adı çekirdeği ve indirme davranışı

**Giriş:** ASAMA_01 kabul edildi.

**Dosyalar:** YENİ `src/lib/belge-filename.ts`, `tests/belgeler/belge-filename.test.ts`; MEVCUT `src/lib/pdf-engine.ts`, eski filename kontrolü olan `tests/site-audit/belgeler-functional-audit.spec.ts` ve gerekiyorsa stüdyo wiring.

**Uygulama:** Bölüm 2.1'i saf fonksiyonlarla kodla; 5 `downloadFilled*Pdf` yalnız ad üretimini bu modüle yönlendirsin; `generatedBytes` ve `fileName` geriye uyumlu. Dosya adındaki tarih gerçek belge tarihinden çekilir; desteklenmeyen tarih `now` ile düşer. Örnek form adlarını dışarı aktarırken atla; döngüsel import oluşturma (saf profile/default yardımcılar veya sabit testli tablo).

**Doğrulama:** Unit tablo: 5 belge × varsayılan veriler, Türkçe harfler `İ/ı`, `23.10.2026`, `31.02.2026`, `../../etc/passwd`, emoji, 200 karakter, boş ad, YIBF doğru/yanlış. `npm run check:belgeler-pdf`, `npx tsc --noEmit`; eski Playwright filename beklentisini sadece bilinçli yeni kurala güncelle. Boş form `*_BOS.pdf`, PDF'de edit edilebilir alanlar ve mevcut PDF içerik görüntüsü değişmediğini test et.

**Kabul:** 5 tipte doğru isim, hiçbir çift `.pdf`, indirilen filled PDF editable; yeni birim ve güncellenen E2E PASS. **Hata/geri:** Yalnız ad entegrasyonunu düzelt; PDF çizim mantığına gereksiz dokunma. **Dur.**

### ASAMA_03 — Kullanıcıya görünen Paylaş kontrolü (henüz sunucu bağlı değil)

**Giriş:** ASAMA_02 başarılı.

**Dosyalar:** YENİ `src/components/belge-paylasim/belge-share-dialog.tsx`, `src/hooks/use-belge-share.ts`; MEVCUT `src/components/belge-studio-actions.tsx`, beş stüdyo ve gerekiyorsa simge yardımcıları. YENİ hedefli UI testi.

**Uygulama:** `onShare?: () => void` prop'u ile 5 stüdyoyu bağla; kullanıcı tıklamadan PDF sunucuya gitmez. Ortak dialog'da bilgilendirme, örnek veri/hassas alan uyarısı, 90 gün metni, boş halde disabled `Bağlantı oluştur` feature flag ve link sonucu/iptal iskeleti. Backend hazır olmadan butonu aktifmiş gibi gösterme: geliştirme ortamında disabled veya yerel test mock'u ile doğrula; production'da henüz hiç yayın yok. **Her türlü WhatsApp/native/file share kodunu bu iş için yazma.** Mobil 320/360/390/414 ve masaüstü 1366 ekranlarda taşma, odak dönüşü, Escape, aria-label, dark/light, safe-area ve `Formu Düzenle` ışık/hitbox regresyonu test et.

**Kabul:** Tek Paylaş eylemi tüm 5 stüdyoda erişilebilir, responsive; PDF Önizle ve PDF İndir çalışma alanını bozmadı; HTML/console/hydration hata yok. **Hata/geri:** Dialog bir görev kapsamı içinde izole edilir, ortak stüdyo motoruna dokunma. **Dur.**

### ASAMA_04 — Kalıcı veri, yetki ve kota altyapısı

**Giriş:** ASAMA_01 POC başarılı, ASAMA_03 tamamlandı; test için Neon/Blob bağımsız adaptör bulunuyor.

**Dosyalar:** YENİ `src/lib/belge-paylasim/{config,types,repository,quota,tokens,blob-store,service-core}.ts`, yeni migration `db/migrations/<uygun-sira>_belge_paylasim.sql`, `tests/belgeler/belge-share-server*.test.ts`. Gerekirse mevcut `src/lib/dokumantasyon/security.ts` saf fonksiyonları *import* et; yönetici shares tablosunu değiştirme.

**Uygulama:** Bölüm 3.2 şeması ve private Blob arayüzlerini geliştir. `BELGE_SHARE_SECRET` ile domain-separated deterministik, yüksek-entropili token + hash; requestId idempotency; payload bütünlüğü; state `pending/ready/revoked/purged/failed`; yarış güvenli atomik quota/sayaç ve global byte sınırı. Neon SQL transaksiyon kabiliyetini doğru adaptörle sağla (HTTP query'nin desteklemediği interaktif `BEGIN/COMMIT` varmış gibi davranma; gerekirse uygun transaction-capable driver/tek SQL fonksiyonu). Production fail-closed, test sahte adaptör.

**Doğrulama:** İzole PGlite/benzer DB: migration tekrar çalıştırma, unique constraints, token hash, payload HMAC, aynı requestId ve farklı payload 409, 20 paralel POST eşdeğeri yarış testi, kota eşikleri ±1, aktif byte limit, Blob hata/DB hata ve arta kalan `pending` durumları. Testte üçüncü taraf gerçek private store masrafı yok.

**Kabul:** Ham token, IP ve form değerleri DB'de yok; eşzamanlı quota bypass yok; yeni modül `dok_*`'e dokunmuyor; testler + typecheck PASS. **Hata/geri:** Yeni migration ve adapter içinden düzelt, eski tabloyu resetleme. **Dur.**

### ASAMA_05 — Gerçek create/revoke API, sunucu PDF snapshot'ı

**Giriş:** ASAMA_04 tamam; sunucu flatten POC uygun.

**Dosyalar:** YENİ `src/app/api/belgeler/paylasim/route.ts`, `src/app/api/belgeler/paylasim/[token]/route.ts`, `src/lib/belge-paylasim/request-validation.ts`; MEVCUT `src/lib/pdf-engine.ts` (geriye uyumlu `flatten` opsiyonu), `src/lib/site-config.ts` (güvenli canonical URL). YENİ route/integration testleri.

**Uygulama:** JSON body 64 KiB limiti, izin verilen belge alanları, same-origin, PDF sunucuda üret/flatten + font/file safety, kaynak şablon sayfa doğrulama, otomatik snapshot boyutu üst sınırı; DB pending → Blob put → ready; idempotent tekrar; management-token ile revoke **DB önce, silme sonra**. Düz `console.error` ile PII/token loglama; structured error kodları kullan. Var olan indir/yazdır koduna dokunma.

**Doğrulama:** Her 5 docId için sahte veriyle POST → PDF bytes parse/flatten, yeni link, tekrar same ID → tek Blob, farklı payload → 409, invalid doc/input/header/body → 400/413/415/403, kota → 429 Retry-After, DB/store yok → 503, wrong manageToken → 403, revoke sonrası get 410. Sunucu ile istemci görsel PDF eşliği; `npx tsc --noEmit` ve hedefli testler.

**Kabul:** Her paylaşılan belge sitedeki aynı görüntüyü korur; PDF düzleştirilmiş; yalnız küçük JSON kabulü, private Blob hazır; üretim dışı testte sır yok. **Hata/geri:** Backend feature kapalı, yanlış dosya public'e konmaz. **Dur.**

### ASAMA_06 — Salt-okunur /b sayfası ve yetkili PDF akışı

**Giriş:** ASAMA_05 başarıyla oluşturma/iptal kanıtlı.

**Dosyalar:** YENİ `src/app/b/[token]/page.tsx`, `src/components/belge-paylasim/belge-share-viewer.tsx`, `src/app/api/belgeler/paylasim/[token]/pdf/route.ts`, viewer testleri; MEVCUT `src/app/layout.tsx`/navbar/global chrome veya en dar koşullu wrapper, `src/app/robots.ts`.

**Uygulama:** Viewer bölüm 2.3'teki **sadece okuma + zoom + sayfa** kontrolünü uygulasın; mevcut PDF.js worker/load/zoom altyapısından yararlansın. İçinde form düzenleyici, indirme/yazdır, `window.open`, `pdf.print`, `defaultDownload` import/callback yok. Route token yetki ve expiration kontrolünden sonra private stream açsın; içerik başlıkları bölüm 3.3; Range destekleniyorsa tam doğru sözleşme. Sayfa durumları `ok/expired/revoked/not_found`; `noindex` ve sızıntısız metadata; root site chrome `/b/` içinde DOM'a gelmesin.

**Doğrulama:** Playwright 320/390/768/1366, çok sayfalı sözleşme, +/−/fit, mobil pinch gesture, klavye, dark/light. Alıcıda edit/form/link yönetim/print/download butonları yok; Ctrl+P/S kendi aksiyonunu tetiklemez (tarayıcıyı mutlak kilitleme iddiası yok); site diğer yollarında menü/footer çalışır. 404/410; başlık/no-store; expired tokenla PDF API çağrısı 410. PDF.js worker/console/hydration kontrolü.

**Kabul:** PDF yalnız gözlem ve zoom, sunucu PDF immutable, global site ve Dokümantasyon modülü regresyonu yok. **Hata/geri:** Yeni viewer'ı izole düzelt; `PdfJsStudio` içine çok sayıda özel koşul ekleyerek Dokümantasyon'u bozma. **Dur.**

### ASAMA_07 — Bağlantı oluştur, kopyala, bağlantılarım ve iptal

**Giriş:** ASAMA_05–06 API ve viewer PASS.

**Dosyalar:** `src/hooks/use-belge-share.ts`, `src/components/belge-paylasim/belge-share-dialog.tsx`, YENİ `src/lib/belge-paylasim/local-link-registry.ts`; testler.

**Uygulama:** Kullanıcı `Bağlantı oluştur` dediği anda o belgeye ait **mevcut güncel formu sabit kopya** al; status/snapshot hazır değilse engelle; `clientRequestId` üret ve aynı isteğin retry'larında sakla. Server response sadece ilgili frozen form için link kartı açsın; form daha sonra değişirse kart eski snapshot'a ait olduğunu açıkça söylesin. Clipboard API + elle kopyalama fallback. `localStorage` altında en fazla 20 bağlantının token, manageToken, belge tipi, oluşturulma/sona erme zamanı gibi minimal alanları; PDF/form/kişisel ad yok. İptal `DELETE + x-manage-token`, önce kullanıcı onayı; 410 durumunu açık göster. Storage unavailable/bozuk JSON/ağ hatası/429/503 hata metinleri. **WhatsApp/cihaz share yöntemlerini ekleme.**

**Doğrulama:** Unit local registry 20 sınır/bozuk JSON/TTL, requestId duplicate+retry, API mock; Playwright bağlantı oluştur → kopyala → yeni anonim sekmede aç → formu değiştir, eski link aynı → iptal → 410. Mobil sheet erişilebilir; asla istem dışı API POST yok; 320px taşma yok.

**Kabul:** Kullanıcı tek butonla 90 gün link oluşturup kopyalıyor, linki iptal ediyor, yanlışlıkla PDF'yi paylaşmıyor; 5 belgede tutarlı. **Hata/geri:** UI flag kapatıldığında indir/önizle etkilenmez. **Dur.**

### ASAMA_08 — Retention, cron ve maliyet koruması

**Giriş:** ASAMA_04–07 tamam, veri yaşam döngüsü çalışıyor.

**Dosyalar:** YENİ `src/lib/belge-paylasim/cleanup.ts`, `src/app/api/cron/belge-paylasim-temizlik/route.ts`, testler; MEVCUT `vercel.json` günde bir cron, `.env.example` yalnız **örnek değişken adı** `CRON_SECRET`, `BELGE_SHARE_SECRET`; `DOK_STORAGE_CONTRACT.md` içinde yeni prefix semantiği.

**Uygulama:** Bölüm 3.4 batch/lease, expired/revoked/failed/pending/orphan purge, mezar taşı GC, idempotent silme ve gözlem metrikleri. Cron yetkisiz/secret yok → 401. Vercel Hobby ile uyumlu günlük ifade (`0 3 * * *`) ve production yalnız. Orphan taraması yalnız yeni prefix, grace 24 saat; yoğun store'da pagination/budget. Cron çalışmamasına rağmen `expiresAt` yüzünden link otomatik kapanmalı; `503` depolama bozuksa yeni link yazmayı durdurmalı.

**Doğrulama:** Saat enjekte edilmiş yerel DB + sahte Blob: tam expiry sınırında 410, 90 gün öncesinde 200; eski link/blob fiziksel silinir; silme exception/retry; paralel cron/lease, 504 sonrası yeniden deneme, yetkisiz cron, `Bearer undefined`, orphans, tombstone 30 gün, global byte sınırı. Mevcut Dokümantasyon nesnesi asla silinmez. Vercel cron yapılandırma route dosyasıyla eşleşir.

**Kabul:** Veri sonsuza kadar birikmiyor, erişim tam süresinde kapanıyor, fiziksel silme güvenli ve retry edilebilir; test PASS. **Hata/geri:** Cron'u değil temel erişim kapatma koşulunu koru, hatalı purge'ü çalıştırma; fail durumunu raporla. **Dur.**

### ASAMA_09 — Entegre kabul ve güvenlik/perf denetimi

**Giriş:** ASAMA_01–08 test ve kanıtları PASS.

**Uygulama:** Hızlı testlerden başlayarak `npx tsc --noEmit`, `npm run lint`, `npm run check:belgeler-pdf`, ilgili `npm run check:pdf-v4:unit` (script varlığı teyit), `npm run build`, `tests/site-audit/belgeler-functional-audit.spec.ts`, `belgeler-mobile-studio`, `belgeler-stage04-pdf-e2e`, `belgeler-pdf-quality` ve yeni 5 belge paylaşım Playwright spec'lerini koştur. Windows/Playwright süreç temizleme ve timeout repo standardına uy. Ekran boyutları 320/360/390/414/768/1024/1366/1920; dark/light, yatay taşma, safe-area, 44px, zoom pinch, dokunma, Erişilebilirlik.

**Güvenlik zorunlu kapısı:** Anonim kullanıcının keyfî PDF baytı yükleyememesi; form allowlist; kimlik/telefon/adres tam metinlerini DB/log/analytics/URL/OG'de sızdırmama; private Blob GET doğrudan URL'den kapalı; token 256 bit ve hash; yönetim anahtarıyla IDOR; sahte origin/ip header; kota eşzamanlı yarış; JSON boyut limiti; blocked/expired/revoked erişim ve print/edit düğmeleri; `no-store`, `noindex`; cron secret fail-closed; `dok_*` ve `/p/` izolasyonu. Bağlantı alıcısının PDF'yi ağ araçlarıyla kopyalamasının teknik olarak engellenemediğini açık yaz, buna başarısızlık demeden site içi edit olmamasını test et.

**Belge eşliği:** 5/5 belgede form düzenleme, zoom, odak, alan uyarıları, otomatik taslak/temizle, `PDF İndir` editable; yeni share PDF flatten; çok uzun adres, Türkçe harf, en az 2 sayfalı sözleşme, örnek değer uyarısı. Bir link oluşturulduktan sonra form değişirse paylaşılmış içerik değişmemeli. On kez dialog/viewer aç-kapat ile Blob/Canvas/objectURL sızıntısı ve ilk açılış süresi baseline'a göre kıyaslanır; tahminî metrikler uydurulmaz.

**Ürün dokümanı:** `docs/BELGELER_SISTEMI.md`, `.agents/rules/belgeler-kurallari.md`, `DOK_STORAGE_CONTRACT.md`, `.env.example` ve gerekiyorsa living architecture açıklaması yeni özelliğe göre güncellenir. Karşılaştırmalı kod incelemesi: paylaşım amacı dışında tasarım/refactor bağımlılığı eklenmemiş, yeni secretlar commit'e girmemiş, bilinmeyen network/cloud ücret yok.

**Kabul:** Zorunlu otomatik kontroller PASS, kritik/güvenlik regresyonu sıfır, beş belge testli; varsa gerçek cihaz testleri `NOT_RUN — cihaz erişimi yok` diye dürüst yazılır, gerçekleştirilmeden PASS sayılmaz. Kullanıcı cihazı gerektiren isteğe bağlı doğrulama final kapıyı kırmıyorsa gerekçe açıkça kaydedilir. Başarısız zorunlu testte `ASAMA_10`'a geçme. **Hata/geri:** Bulunan kusuru ilgili modül içinde düzelt, gerekli regresyonları tekrarla; ayrı stage icat etme. **Dur.**

### ASAMA_10 — Tek atomik release, Vercel Production canlı smoke

**Giriş:** ASAMA_01–09 `PASS`; mevcut yerel kullanıcı değişiklikleri korunmuş, staged diff açık; Vercel erişimi ve gizli değişkenleri kontrol edilmiş. Production'da Neon DB, **private** Blob, canonical domain, `BELGE_SHARE_SECRET` ve `CRON_SECRET` **gerçekten hazır**; eksikse ilgili bağlantı/yetki ile tamamla; izinsiz erişim/engel varsa `ENGELLI`, yayın yok. Vercel planında günlük cron geçerli (resmî kaynağa göre Hobby de kabul); kullanıcının plan türünü özel zorunlu soru haline getirme.

**Uygulama sırası:** (1) Üretim DB'de güvenli, **eklemeli** migration + readiness kontrolü (geri dönüşte `DROP` yok); (2) secrets'ı değerini göstermeden/commit etmeden Vercel Production'da doğrula; (3) son ilgili test/build çıktısını ve tek değişiklik setini incele; (4) sadece bu işin dosyalarını tek anlamlı commit `feat(belgeler): akilli dosya adi ve 90 gunluk salt okunur link`, yerel doğrulanmış `main`'e **tek push**, otomatik Production deployment; (5) `READY` ve domain/route kontrolü; (6) gerçek ama **tamamen sahte veri** ile taahhütname + sözleşme ve tüm 5 stüdyo UI smoke: İndir adı, Paylaş → Kopyala, anonim link → zoom/sayfa, form yok, network headers, geri edit yok, iptal → 410; (7) cron yapılandırması Vercel'de görünüyor, yetkisiz çağrı 401; geçerli cron ile gerçek kullanıcı verisi üzerinde test purge **yapma**; (8) test linkini iptal et/temizle, STATE'e gerçek deployment kimliği ve kabul kanıtlarını ekle.

**Kabul:** Production `READY`, yeni share/reader ve beş stüdyo smoke PASS, cron gerçekten yapılandırılmış, private Blob ve expiry çalışıyor; `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null`. Bir sorun varsa **rollback eski doğru deployment'a** ya da güvenli özellik kapatma üzerinden yapılır, DB'de destrüktif rollback olmaz; tek push/doğrulama kuralı dışında gereksiz deneme deploy'u yapılmaz. **Dur:** Bundan sonra yalnız “devam” gelirse “Plan tamamlandı; uygulanacak başka aşama yok.”

## 5 — İlerleme protokolü ve fail-safe çalışma

1. Planı masaüstü ajana yüklemek **otomatik başlama değildir**. İlk `başla` veya `devam`, `ASAMA_01`'i başlatır; daha önce ilerleme varsa yalnız `next_stage` uygulanır. **Bir mesaj = en fazla bir aşama**, aynı turda sonraki aşamaya otomatik geçilmez.
2. Her aşama sonunda state dosyası güncellenir. Kayıt: stage, değiştirilen dosyalar, komut/test adı, gerçek sonuç, referans commit/çalışma ağacı, varsa hata ve kısa kanıt yolu. Durumlar `BASLAMADI / DEVAM_EDIYOR / ENGELLI / TAMAMLANDI`; test sonucunda `PASS / FAIL / NOT_RUN / BASELINE_FAIL` ayrımı.
3. İlk çalışma ağacı kirliyse kullanıcı çalışmasını **reset/checkout/pull ile yok etme**. Kapsamla çatışan kısımlar ayrı raporlanır; sorunsuz kısımlara güvenli ilerleme mümkünse devam edilir. Repo kuralları öncelikli. Gerekli süreci başlatıp yalnız kendine ait süreçleri kapat.
4. Uygulama süresince test çıktısını başarılı diye tahmin etme. Yeni paket ya da servis eklemek gerekli değilse ekleme. Ara aşamalarda uzaktan commit/push, Vercel Preview veya Production yok; GitHub/API uzaktan yazım yöntemi **bu planın uygulama modu değil**.
5. ASAMA_10 bitip state `TAMAMLANDI` olduktan sonra yalın `devam` yeni audit, deploy, temizlik veya refactor başlatmaz. Yeni iş için açık kapsam değişikliği şart. Plan revizyonu yükselirse eski kanıtları silme.
6. **Planı yalnızca hazırlayan ChatGPT sohbeti** bu talep üzerine kod/DB/Vercel değiştirmez. Bu dosya kod uygulanmış veya testler geçmiş demek değildir.

**Aşama sonu kısa rapor şablonu:** `ASAMA_0X | Yapılan: ... | Kontroller: PASS/FAIL/NOT_RUN ... | Engel: ... | Sıradaki: ASAMA_0Y`.

## 6 — Masaüstü ajana ilk tek prompt

> `PLAN/BELGELER_PAYLASIM_NIHAI_V2_PLAN.md` dosyasını **eksiksiz oku** ve `PLAN/BELGELER_PAYLASIM_NIHAI_V2_STATE.md` durumunu takip et. Bu görevde **WhatsApp, native PDF dosya paylaşma veya telefonun paylaşım sayfasını kesinlikle oluşturma**. Yalnız PDF İndir için akıllı ad ve 90 günlük salt-okunur bağlantı **oluştur/kopyala/iptal et** özelliği geliştirilecek. Önce `PROJECT.md`, `AGENTS.md`, ilgili `.agents/rules` ve güncel yerel kaynakları oku; önceki v1 planları uygulama. İlk tamamlanmamış aşamayı uygula, test et, state'e gerçek kanıtları yaz ve **dur**. `devam` her zaman en fazla bir aşama; ASAMA_10'dan önce push/deploy yok. Final release sadece ASAMA_10'da. State `TAMAMLANDI` ise hiçbir yeni işlem yapma.

## 7 — Kaynak bağlantıları

- Proje: https://github.com/smitelagwar/muhendislik-site
- Repo talimatları: https://github.com/smitelagwar/muhendislik-site/blob/main/PROJECT.md ; https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- PDF motoru: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/pdf-engine.ts
- PDF snapshot: https://github.com/smitelagwar/muhendislik-site/blob/main/src/hooks/use-belge-studio-document.ts
- Ortak aksiyonlar: https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-studio-actions.tsx
- Neon/Blob altyapısı: https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/dokumantasyon/db.ts ; https://github.com/smitelagwar/muhendislik-site/blob/main/DOK_STORAGE_CONTRACT.md
- Vercel Cron sınırı: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel Cron güvenliği: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel Private Blob: https://vercel.com/docs/vercel-blob/private-storage
- Vercel Function sınırları: https://vercel.com/docs/functions/limitations
- Next.js güncel route handler: https://nextjs.org/docs/app/api-reference/file-conventions/route

**SON KABUL TANIMI:** Yalnız `PDF İndir` için standart dosya adı; tek `Paylaş` düğmesinden **90 günlük link oluşturma + kopyalama + iptal**, alıcıda **yalnız PDF/zoom**, PDF düzleştirilmiş ve immutable, süresi dolunca anında 410, Private Blob fiziksel temizleme, beş stüdyo ve Dokümantasyon regresyonsuz, zorunlu testler + Production smoke PASS. **WhatsApp veya dosya göndermeye ilişkin hiçbir yeni arayüz/işlev yok.**
