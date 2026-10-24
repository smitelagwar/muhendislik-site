# İNŞA BLOG — PAYLAŞILAN PDF İÇİN PROFESYONEL SALT-OKUNUR GÖRÜNTÜLEYİCİ

**NİHAİ BİRLEŞTİRİLMİŞ UYGULAMA PLANI · V4**  
**Plan ID:** `INSA-BELGELER-PUBLIC-READER-V4-20261024`  
**Revizyon:** `4.0` · **Hazırlanma:** 24.10.2026, Europe/Istanbul  
**Uygulayıcı:** Gemini 3.8 Flash (`gemini-3.8-flash`), arayüzde varsa `high` düşünme ayarı  
**Çalışma ortamı:** Windows yerel proje, terminal + yerel browser + Playwright erişimli masaüstü ajanı  
**Repo:** https://github.com/smitelagwar/muhendislik-site · **Site:** https://muhendislik-site.vercel.app/  
**Araştırılmış `main` referansı:** `04048e50fd02e50c1c9ea783acec2d7383f516b4`, commit zamanı 2026-10-23T15:15:55Z. **Yerel veya canlı sürümün aynı olduğu doğrulanmadı.**  
**Repo içine eklenecek plan:** `PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_PLAN.md` (**yeni**)  
**Kalıcı uygulama durumu:** `PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_STATE.md` (**yeni, ASAMA_01'de**)  
**Yayın kapsamı:** Evet; **yalnız final ASAMA_09** içinde tüm kontrollerden sonra tek anlamlı main push → Vercel production → canlı smoke.  
**Şu anki durum:** `PLAN_HAZIR / BASLAMADI`. Bu Markdown yalnız plandır; hiçbir aşama uygulanmış sayılmaz.

> **Hızlı uygulama ilkesi:** Mevcut `PdfJsStudio` okuma motorunu kullan; Belgeler'deki düzenleme motorunu public rotaya taşıma. Public paylaşımın sunucu tarafında `flatten:true` üretilmiş PDF'sini göster. PDF içinde zoom, arama, sayfa gezinme, metin seçme, döndürme, yazdırma ve indirme sun; **form düzenleme asla açılmasın**. 90 gün/iptal/token güvenliği korunsun. UI temiz, mobilde kompakt olsun.

---

## 0. KARŞILAŞTIRMALI ÖZ ELEŞTİRİ — İKİ PLANIN EN İYİLERİNİ AL, HATALARINI TEKRARLAMA

Bu V4, ChatGPT'nin `BELGELER_PAYLASILAN_PDF_OKUYUCU_GEMINI_3_8_FLASH_NIHAI_PLAN.md` taslağı ile Sonnet 5.5'in `BELGELER_PAYLASIM_VIEWER_V3_PLAN.md` taslağını yeniden değerlendirir.

| Konu | ChatGPT V1 değerlendirmesi | Sonnet V3 değerlendirmesi | V4 bağlayıcı karar |
|---|---|---|---|
| Motor | Doğru: ortak `PdfJsStudio` + `public-readonly` adapter; fakat kapsam yer yer geniş | Doğru: dosya/prop/test hedefleri somut | `PdfJsStudio` aynı motor; **opsiyonel tek mod** `public-share` + dar kapasiteler, varsayılan mod birebir aynı. Gereksiz ikinci adapter katmanı açma. |
| Zoom | Doğru: yalnız PDF panesinde, global müdahale yok; test kapsamı kısmen soyut | Detaylı jest testleri değerli; ama `document` capture'da bütün Ctrl+wheel iptali riskli | **İlk tercih: mevcut viewer scroll container'ındaki jest motoru**. Yalnız kanıtlanmış gerekli event için kök sınırında küçük müdahale; global zoom yasaklama yok. |
| Mobil | Doğru: erişilebilir tarayıcı zoom'u korunmalı | **Hatalı:** `maximum-scale:1`, `userScalable:false`; erişilebilirlik kaybı, ayrıca tüm tarayıcılarda garanti değil | Bu iki viewport ayarını **KESİNLİKLE EKLEME**. Zoom ve pinch'i belge viewport'una odaklı yönet; tarayıcının a11y büyütmesini zorla kapatma. |
| İndirme | Doğru: mevcut yetkili API üzerinde `?download=1`; hata ve checksum testleri faydalı | Doğru: `Content-Disposition`, dosya adı, owner modalında ayrı düğme | Inline ve attachment aynı private Blob snapshot'ını sunsun. Hata durumları görünür; indirme butonu gerçek `.pdf` döndürsün. |
| Yazdırma | Doğru: PDF bytes, tüm sayfalar; iOS akışını test et | Doğru: mevcut `printPdfBytes` kullan, `Ctrl+P` yasağını kaldır | Yeni baskı renderer'ı yazma. Print action'da 410/404 gibi yetki hatasında eski PDF'yi sessizce fallback olarak göstermeye çalışma. |
| Güvenlik | Doğru: UI hidden ≠ gerçek erişim kontrolü, `flatten` DRM değil | Doğru: `fileId` verme ve gizli token'ı storage'a taşımama | Server yetki her GET/HEAD'de zorunlu; public modda düzenleme, yönetim, tanılama, kalıcı konum kaydı yok; debug/query parametreleriyle baypas olamaz. |
| Test | Geniş gerçek senaryolar | Doğru hedeflenmiş test adları; ancak **statik `source includes string` testleri yeterli değil** | Uygulama davranışı ve ağ yanıtını doğrulayan API + Playwright testleri öncelikli. Testi silerek/gevşeterek geçme. |
| Baseline | Sürüm tutarsızlığını fark etti | Aynı farkı fark etti; fakat `grep` sonucundan yerel/GitHub eşitliği çıkarımı **geçersiz** | Git SHA + `git status` + ilgili dosya diff'i + çalışma zamanında screenshot ile net kök neden belirle; metin araması tek başına parity kanıtı değildir. |
| Deployment | Tek release ve final kontrol doğru | `TAMAMLANDI`yı deploy **öncesi** yazma önerisi yanlış; gerçek telefon onayı mutlak önkoşul yaparak gereksiz tıkanabilir | `TAMAMLANDI` **ancak production READY + canlı smoke PASS** sonrası. Telefon testi erişilemiyorsa MANUAL_PENDING yaz; temel otomatik kabul sağlamken kural gereği yayın yapılabilir, risk şeffaf kalır. |
| Katılık | Teknik fallback seçeneğini koruyor | Bazı aşamalarda gereksiz `her aşamada lint`/toplu tekrar var | Küçük somut aşamalar + aşama sonu hedefli test + tam suite yalnız final kabul. Kritik başarısızlıkta dur. |

**Ek düzeltmeler:** (1) `Ctrl+S` global engeli kaldırılır ancak Ctrl+S'yi özel PDF indirme kısayolu yapmak zorunlu değildir; (2) arka arkaya indirme tıklamalarında yanlış dosya/tekerrür riskleri kontrol edilir; (3) API 410/404 durumları `PdfJsStudio` kaynak/print/download hata ekranına düzgün aktarılır; (4) üst toolbar'ın kendisi `scale` ile büyümez; (5) 90 gün etiketi yerine gerçek bitiş zamanı gösterilir; (6) ekran görüntüsündeki `400%` ile repo `300%` farkı baseline'da açıklığa kavuşturulur; (7) Safari/iOS mobil testlerinde sahte sentetik gesture testi **gerçek fiziksel pinch'in ispatı sayılmaz**.

---

## 1. HEDEF AKIŞ VE ÖLÇÜLEBİLİR İSTEKLER

**Akış:** `/belgeler/...` → form doldur → `Paylaş` → `Bağlantı oluştur` → **`Kopyala` + `Paylaşılan PDF'yi indir` + `Bağlantıyı aç`** → alıcı `/b/[token]` → gerçek PDF.js okuyucu → incele, metin seç, PDF içinde ara, zoom, sayfa değiştir, döndür, tam ekran, **Yazdır**, **İndir**.

**Salt okunur:** Alıcı PDF'yi site üzerinde değiştiremez, imzalayamaz, yeniden adlandıramaz, silemez, içerik güncelleyemez, yönetim token'ı kullanamaz. PDF'yi indirmesi **açıkça istenen** yetkidir. Flatten edilmiş dosya başka yerel PDF yazılımlarıyla sonradan değiştirilebilir: DRM vaadi yok. Paylaşılan PDF ile form düzenleyicinin yerel **editable AcroForm indirmesi** farklı akıştır; mevcut editable export aynen kalır.

**PDF zoom:** Ekrandaki `[−] / [+] / % / Genişlik / Sayfa`, PDF viewport'unun içeriğine etki eder; araç çubuğu, belge başlığı ve uygulama çerçevesi sabit kalır. PDF viewport'undayken Ctrl/Cmd + wheel ve desteklenen pinch/gesture hareketleri okuyucuda zoom yapar. Sıradan wheel belgeyi kaydırır. PDF dışındaki tarayıcı zoom'u erişilebilirlik için engellenmez. `Ctrl+P` okuyucu odaktayken tüm PDF'yi yazdırabilir; odak dışında tarayıcı doğal davranışını korur.

**Gerçek PDF görüntüleme:** Tek bitmap `img` değil; PDF.js canvas + **PDF text layer** + çok sayfalı doküman akışı. Text layer gerçek flattened PDF'de okunabilir karakter üretiyorsa arama ve seçme çalışır. Tek başına canvas görülmesi PDF'nin “resme çevrildiğini” göstermez; esas kabul metin seçimi, arama ve sayfa davranışıdır.

**Görünüm:** Masaüstünde bir başlık/toolbar, PDF odaklı tam yükseklik; mobilde yalnız gerekli kontroller üstte, ikincil işlemler `⋯` menüsünde; light/dark temada kontrast; 320px'te yatay taşma yok. Gereksiz global navbar/footer overlay yok.

### 1.1 Kontrol/erişim matrisi

| İşlev | Desktop | Mobil | Public yetki |
|---|---|---|---|
| **PDF İndir** | Belirgin ana eylem | Görünür; sığmazsa `⋯` içinde tek dokunuş | **Evet**; server `attachment` |
| **Yazdır** | Görünür ikon/etiket | `⋯` içinde tek dokunuş | **Evet**; tüm gerçek PDF |
| `−`, `%`, `+` | Görünür | Kompakt; % değeri okunabilir | Evet, yalnız PDF |
| Genişliğe/Sayfaya sığdır, %100 | Görünür / menü | `⋯` menüsü | Evet |
| Önceki/sonraki + `N/toplam` | Görünür | Kompakt | Evet, 2+ sayfalıda |
| PDF içinde ara / Ctrl+F | Görünür | `⋯` menüsü | Evet; text layer |
| Küçük resimler / içindekiler | Uygunsa | Menü | Evet, outline varsa |
| Seçim/El aracı | Uygunsa | Doğal dokunma + menü | Evet |
| Döndür (yalnız görünüm) | Menü veya ikon | Menü | Evet |
| Tam ekran | Görünür | Menü | Evet |
| Gece modu, kısayollar | Menü | Menü | Evet; gizli doküman yönetimi yok |
| Bağlantıyı kopyala | `⋯` | `⋯` | Evet; yalnız clipboard |
| Salt okunur + **gerçek bitiş tarihi** | Başlıkta | Kısa başlık / menü | Bilgilendirme |
| Düzenle / Kaydet / Sil / Yeniden adlandır / Paylaşım iptal et | **YOK** | **YOK** | **Yetki yok** |
| QR / WhatsApp / native `navigator.share` / mailto paylaşım | **YOK** | **YOK** | Önceki kapsam dışı kararı sürer |

**Not:** Public rota için `onShare` verilmez; `Bağlantıyı kopyala` ayrı, eylemi sadece sayfanın mevcut public linkini clipboard'a kopyalayan küçük bir fonksiyondur. Management token bu linkte ya da arayüzde bulunmaz.

---

## 2. DOĞRULANAN REPO GERÇEKLİĞİ, BELİRSİZLİKLER, KORUNACAKLAR

**24 Ekim 2026'da GitHub `main` dosyaları doğrudan okundu:**

- `src/app/b/[token]/page.tsx` — token durumları `not_found / revoked / expired`; `BelgeShareViewer(viewToken, documentTitle, initialExpiresAt)`.
- `src/components/belge-paylasim/belge-share-viewer.tsx` — PDF.js ile tek canvas, `ZOOM_MIN=0.5`, `ZOOM_MAX=3.0`, `handleFitWidth` içinde 595.28 pt sabiti, `Ctrl+P/Ctrl+S` capture engeli. Ekran görüntüsündeki **400%** bu kaynakla uyuşmuyor; önce ASAMA_01'de test edilmelidir.
- `src/app/api/belgeler/paylasim/[token]/pdf/route.ts` — `GET/HEAD`, `Content-Disposition:inline`, private Blob, `no-store`, 404/410/425/502; Range yok, tam gövde 200. `HEAD` mevcut sürümde `GET` sonucunu çağırarak inşa ediliyor; ayrı yeni endpoint zorunlu değil.
- `src/components/belge-paylasim/belge-share-dialog.tsx` — link oluştur, kopyala, iptal; mevcut yeni **indir** ve **aç** yok.
- `src/hooks/use-belge-share.ts` — link sahibi için `viewToken`, `manageToken`, `expiresAt`, `documentId` mevcut olabilir; sözleşmeyi yerelde doğrula.
- `src/lib/belge-paylasim/server-pdf.ts` — `flatten:true`, sunucu tarafında PDF oluşturma; **dokunulmayacak**.
- `src/lib/belge-paylasim/config.ts` — 90 gün, 3 MiB PDF sınırı, kota ve Blob prefix; **dokunulmayacak**.
- `src/components/dokumantasyon/preview/pdf-viewer.tsx` — `DokPdfViewer` adaptörü, altında `PdfJsStudio`.
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` — çok sayfalı PDF, text layer, arama, navigation, zoom gesture, print, toolbar ve workspace ayarları.
- `src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx` — gelişmiş toolbar; indirme callback'e, fullscreen handler'a bağlı. Public mod için özellik filtresi gerekir.
- `src/lib/dokumantasyon/studio/pdf/use-zoom-gestures.ts` — scroll ref üzerinde Ctrl/Cmd+wheel, mobile touch pinch ve Safari gesture; mevcuttaki engine ile birlikte çalıştığını test et.
- `src/lib/dokumantasyon/studio/pdf/pdf-print.ts` — gerçek PDF baytlarından yazdırma; iOS popup fallback.
- `src/components/belge-studio-pdf-preview.tsx` — stüdyo form durumu ve inline edit'e bağlı; public paylaşım için **uygun değil**.
- `tests/site-audit/belgeler-share-e2e.spec.ts` — bugün viewer'da **İndir/Yazdır olmamasını** açıkça bekliyor, yeni istekle çeliştiği için *doğru davranışla güncellenecek*.
- `PLAN/BELGELER_PAYLASIM_NIHAI_V2_PLAN.md` ve `...STATE.md` — önceki kullanıcı kararları: 90 gün, flatten, erişim iptali, QR/native paylaşım yok. Yeni isteğin indirme/yazdır özelliği önceki eski yasağın yerini alıyor; geri kalan sınırlar aynı.
- `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/dokumantasyon-kurallari.md`, `docs/BELGELER_SISTEMI.md` kapsamıyla ilgili yaşayan referanslar.

**Gerçekten doğrulanan:** Yukarıda isimlenen repo dosyaları ve temel kod akışı, son görülen Git SHA, sonnet dosyasındaki önerilerin metni.  
**Henüz doğrulanmayan:** Kullanıcının Windows yerel HEAD/dirty worktree durumu, canlı deploy ile yerelin birebir eşitliği, gerçek paylaşımdaki Ctrl+wheel kök nedeni, mobil Safari gerçek pinch, production test linklerinin durumları. Bunları tamamlanmış/çalışır sanma.  
**Sürüm notu:** Google model sayfasında `gemini-3.8-flash` ve `low/medium/high` thinking listelenmiştir; model adı kullanıcı isteğine sadık tutulmuştur. Tek başarı garantisi çıkarma.

### 2.1 Kesin değişiklik sınırı

**Değişebilecek (ihtiyaç duyulduğu ölçüde):**

```
src/app/b/[token]/page.tsx
src/components/belge-paylasim/belge-share-viewer.tsx
src/components/belge-paylasim/belge-share-dialog.tsx
src/app/api/belgeler/paylasim/[token]/pdf/route.ts
src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx
src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx
src/components/dokumantasyon/studio/pdf/pdf-shortcuts-modal.tsx
src/components/dokumantasyon/studio/pdf/strings.ts
src/lib/belge-paylasim/document-labels.ts      # YENİ, gerekirse ortak isim sözleşmesi
src/lib/belge-paylasim/download-client.ts       # OPSİYONEL YENİ, yalnız küçük ortak helper gerekirse
tests/belgeler/*share*                    # hedefli revizyon / yeni test
tests/site-audit/belgeler-share-e2e.spec.ts
tests/pdf-v4/*share* veya mevcut fixture standardına uygun YENİ test
PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_*.md # YENİ
PROJECT.md / docs/BELGELER_SISTEMI.md    # yalnız mimari değişikliği yansıtan bölüm
```

**Kapsam dışı; değiştirme:** `src/lib/pdf-engine.ts`, `src/lib/belge-paylasim/server-pdf.ts`, repository/token/service-core/Neon tablosu/Blob lifecycle, `src/components/belge-studio-pdf-preview.tsx`, 5 belge stüdyosunun form ve editable export kodu, `/p/[token]` Dokümantasyon paylaşımı, DWG/DXF/CAD protected core, global site navbar/CSS/viewport, bağımlılık sürümleri. Düzgün çözüm için bu sınırın ihlali gerekirse çalışma durur, sebep kanıtlanır, etkilenen teknik aşama revize edilir; kendiliğinden genişletilmez.

---

## 3. MİMARİ SÖZLEŞME — NİHAİ TEKNİK KARAR

### 3.1 Ortak motor, izole public varyant

**Birincil çözüm:** `PdfJsStudio` içinde **opsiyonel** `variant?: "default" | "public-share"`, varsayılan `default` tanımla. Mevcut `DokPdfViewer` ve diğer çağrı noktalarında herhangi bir prop zorunlu kılma. `BelgeShareViewer` mevcut dış prop sözleşmesini koruyarak `PdfJsStudio`'yu `next/dynamic` (`ssr:false`) ile açar; ihtiyaç halinde tek ince presentation adapter'ı olur, aynı işi iki farklı nested wrapper'a yayma.

**Public varyant güvenlik/yetenek sözleşmesi:**

```ts
// TASARIM SÖZLEŞMESİ: mevcut kodda zaten varmış gibi davranma.
type PdfViewerVariant = "default" | "public-share";
type PublicShareCapability =
  | "read" | "search" | "select" | "navigate"
  | "zoom" | "rotate" | "print" | "download" | "fullscreen";
// Public'ta: düzenleme, dosya yönetimi, yeniden adlandırma, share yönetimi,
// yorum/imza, debug/diagnostics, kalıcı position ve tenant API yetkisi YOK.
```

- UI'da tehlikeli komut **render edilmez**, klavye kısayolu ve programatik handler da public modda çalıştırılmaz; yalnız buton gizlemek yeterli değildir.
- **Sunucudaki API yine tek gerçek erişim otoritesi**: `getShareByViewToken` + Blob; public viewer'ın görsel kabuğu güvenlik sınırı değildir.
- `fileId` geçirme; public link token'ını `localStorage`/`sessionStorage`/analytics/debug/HUD'a yazma. Viewer içindeki global ayarların storage erişimi varsa doğrula ve token/konum sızdırmayacak şekilde public'ta sınırlandır. No private cookies/tenant auth varsayımı, no management key.
- Public varyantta başlık `documentTitle`, okunur "Salt okunur" rozeti ve **`initialExpiresAt`** gerçek tarihi. Aşırı uzun başlıklar toolbar'ı itmesin.
- 404/410/425/502 yükleme ve sonradan iptal/süre bitimi ayrımı: yanlışlıkla login/auth yenilemesi isteme; 404/410'da anlamlı son durum, 425'te geçici yükleniyor/tekrar dene, 502'de denetlenebilir hata/tekrar dene. Public loader network error code'larını içerik üzerinden tahmin etmek yerine HTTP status üzerinden sınıflandır; token ve hassas veri loglama yok.
- PDF kaynak lease/Range ilk denemesinde server 200 full body döndürüyor olabilir: **ilk POC'de mevcut loader'ın bunu gerçekten tolere ettiğini doğrula**. Range performansı yüzünden yeni storage erişim yolu açma.

**Koşullu mimari geri dönüş:** ASAMA_01 POC ile ortak viewer'ın bir workspace auth/lease/tenant varsayımı nedeniyle public URL'yle güvenli şekilde çalışmadığı veya küçük değişiklikle giderilemeyecek ciddi bellek/davranış regresyonu **kanıtlanırsa**, yeni PDF framework kurma. Ortak `pdfjs-client` worker, mevcut zoom/print yardımcıları ve text layer'ı yeniden kullanan **ince özel public reader** tasarımına sadece ilgili aşamaları revize ederek geç. Değişimi raporla ve Dokümantasyon viewer'ını zorla değiştirme.

### 3.2 PDF HTTP sözleşmesi

| İstek | Aktif paylaşım | Revoked / expired | Notlar |
|---|---|---|---|
| `GET /api/belgeler/paylasim/{token}/pdf` | 200, `application/pdf`, `inline` | 410 | Viewer ve print kaynağı |
| `GET /api/belgeler/paylasim/{token}/pdf?download=1` | 200, `application/pdf`, `attachment` | 410 | Aynı flatten snapshot; yeni PDF üretimi yok |
| `HEAD` aynı iki adres | uygun metadata/status, **gövde yok** | 410 | İdeal olarak gereksiz Blob body GET etmez; önce mevcut sözleşmeyi bozma |
| Bilinmeyen token | 404 | 404 | Token varlığını gereksiz dışarı ifşa etme |
| Hazır değil / Blob yok / sunucu hatası | mevcut 425 / 502 / 500 semantiği | duruma göre | Kullanıcıya açık geri bildirim |
| PDF endpoint POST/DELETE | 405 | 405 | Korunur |

- `?download=1` için `Content-Disposition` dosya adını **allowlist `documentId`** üzerinden üret; kullanıcı metninden, formdaki şahıs adı/adresinden, token'dan veya URL parametresinden türetme. Örnek `Santiye-Sefi-Taahhutnamesi.pdf`; gerekli ise `filename` ASCII ve doğru `filename*` RFC 5987. Dosya adında CR/LF, slash, çift `.pdf` yok. Mevcut ayrı `src/lib/belge-filename.ts` editable export adlarını bozma.
- `Cache-Control: private, no-store, no-cache, must-revalidate`, `X-Robots-Tag:noindex,nofollow,noarchive`, `Referrer-Policy:no-referrer`, `X-Content-Type-Options:nosniff` her iki 200 modunda korunur. `/b` metadata noindex/no-cache, mevcut izolasyon korunur.
- **İndirme kullanıcısı için doğru hata:** Düz HTML `<a href>` ile 410 hata metninin sessizce dosyaya dönüşmesini engelle. Tercih edilen `fetch(no-store)` + `response.ok` + Content-Type kontrolü + Blob URL + programatik `download`, ardından `URL.revokeObjectURL` temizliği. 3 MiB tavanı nedeniyle bu pratik. Başlatılan indirme için tek in-flight isteği koru, durum göstergesi, kullanıcı görünür hata; yeni sekme/popup gerektiren mobil Safari'de native attachment yolunu kontrollü fallback olarak değerlendir ve gerçek cihazda test et. Dosya adı sunucunun doğruladığı başlıktan veya aynı allowlist'ten gelsin.
- Yazdırma için var olan `printPdfBytes` `GET inline` baytlarını alır; **print zamanında** 404/410 gelirse hata göster, eski cache/kayıt ile erişim sürdürdüğünü iddia etme. Kullanıcının daha önce indirdiği yerel kopyayı fiilen geri alamazsın.
- Hash/eşlik: `GET inline` ve `GET attachment` gövdesi **aynı PDF snapshot baytları**; testte SHA-256 karşılaştır. PDF `/b` görüntüsünden yeni PNG/PDF üretilmez.

### 3.3 Zoom / gesture / viewport

**Kritik ölçüt:** PDF paneline zoom yapılınca belge geometrisi büyür, üst başlık/toolbar ve navigasyon **CSS piksel boyutunda aynı kalır**; PDF dışında tarayıcı kontrolü kaldığı gibi kalır.

1. `PdfJsStudio` zaten scroll container'a bağlı `useZoomGestures` / engine input controller içeriyor. **Önce onu kullan**, kopya Ctrl+wheel kontrolcüsü ekleme.
2. PDF scroll viewport'u `overflow:auto`, flex child `min-height:0`, root `height:100dvh` / gerektiğinde safe-area. Header `flex-shrink:0`, `transform:none`.
3. Ctrl/Cmd + wheel, desktop trackpad pinch, Safari `gesture*`, touch pinch PDF alanında çalışır. Dinleyici non-passive gerekliyse ve `e.cancelable` ise `preventDefault`. Dinleyici hedefi belge alanı dışında ise doğal browser zoom'a müdahale etme. `document.addEventListener("wheel", capture:true)` ile her yerde `preventDefault` **YASAK**.
4. Klavyede odak viewer/toolbar içindeyken `Ctrl/Cmd + +/-/0/1/2` (mevcut viewer'ın desteklediği tuşlar) uygun PDF işlemlerini yapar; odak dışında browser kısayollarını bütünüyle yasaklama. Diğer input alanlarında yazmayı engelleme. `Ctrl+P` viewer odaklıyken print; global `Ctrl+S` block kaldır.
5. PDF içindeki imleç/parmak çıpası korunur; fazla zoomda PDF yatay/dikey kaydırma ve tüm kenarlara erişim mümkündür; `max-w-full` ile canvas'ın gerçek görsel ölçüsü yanlışlıkla kırpılmaz. Sayfa 90/270° rotate edildiğinde width/fit hesabı güncellenir, sabit 595.28pt kullanılmaz.
6. `meta viewport maximum-scale=1`, `user-scalable=no/false`, `touch-action:none` tüm sayfa/root üzerinde **eklenmez**. Normal tarayıcı/a11y zoom'u ve 200% içerik büyütme yolu korunsun (WCAG 1.4.4).
7. 400% senaryosu **sadece mevcut motor izin veriyorsa**; paylaşım ekranında 400% görüldüğü için mevcut limit farkını önce araştır. Global motor limitini bu görev uğruna artırma. Düşük RAM yüksek-DPR testinde raster/VRAM sınırı korunsun.
8. Playwright sentetik touch/gesture testi yardımcı kanıt; **gerçek iOS/Android trackpad/pinch testini kesin geçti sayma**. Otomasyonda yapılamayanı `MANUAL_PENDING` olarak ayrı bildir.

---

## 4. AŞAMA ÇİZELGESİ

| ID | Somut teslim | Temel risk |
|---|---|---|
| **ASAMA_01** | Baseline + gerçek yerel/canlı farkı + root-cause + POC/STATE | Farklı deploy'u yanlış düzenleme |
| **ASAMA_02** | Güvenli `?download=1`, ortak dosya adı, API testleri | Erişim/410, yanlış isim |
| **ASAMA_03** | `PdfJsStudio` geriye uyumlu `public-share` variant + capability ve hata sınırları | Dokümantasyon gerilemesi |
| **ASAMA_04** | `/b` gerçek PDF reader entegrasyonu, text layer/gezinme | Workspace motor bağlantısı |
| **ASAMA_05** | PDF-only zoom, scroll/gesture, 400%/rotation ve testleri | Browser zoom / erişilebilirlik |
| **ASAMA_06** | Owner modal + viewer İndir/Link Aç, gerçek download doğrulaması | Çift indirme/hata yönetimi |
| **ASAMA_07** | Print, toolbar, mobil/a11y, fallback ve UX cilası | iOS/print/hassas mod |
| **ASAMA_08** | Tam güvenlik/regresyon, performans, yerel production kabul | Gözden kaçan kırılma |
| **ASAMA_09** | Doküman, tek main push/deploy, production smoke, final state | Canlı tutarsızlık |

**Her aşama sözleşmesi:** `Giriş → Kapsam → Sıralı uygulama → Somut test/kanıt → PASS koşulu → Hata/geri dönüş → STOP`. Her "devam" **en fazla bir** aşamayı yürütür. Kabul geçmezse o aşamada kalır. Aşağıdaki teknik bağımlılıklar dışında aşamaları rastgele kaydırma.

### ASAMA_01 — Yerel gerçeklik, test baseline, kaynak uyumu (**özellik kodunu değiştirme**)

**Giriş:** Bu plan ve yerel repo mevcut; yeni plan `PLAN/...V4_PLAN.md` konumuna alınacak, durum dosyası henüz yoksa oluşturulacak.  
**Kapsam:** `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/dokumantasyon-kurallari.md`, testler, paylaşım routes/components, `PdfJsStudio` ve zoom helper'ları; STATE.  
**Sıralı işler:**
1. `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git log -5 --oneline`; kirli dosyaları ve varsa yerel kullanıcı değişikliklerini kaydet, **reset/stash/pull yapma**.
2. Uygun `.agents/rules/*.md` ve `AGENTS.md` alt klasörlerini oku, ECC durumu/GEMINI.md kurallarını hedef ortamda uygula. Paket yöneticisi/lock ve `playwright.site.config.ts`, `playwright.pdf-v4.config.ts` varlıklarını doğrula.
3. Ekran görüntüsünde `%400`, "Genişlik", "Sayfa", "Son geçerlilik" görünüyor; GitHub kodunda `%300` sınırı. `grep -R` tek başına parite kanıtı değildir: gerçek HTML/devtools handler, yerel dosya diff, current runtime/deploy commit ve route kaynağını eşleştir. Hangi bileşenin gerçekten `/b`yi render ettiğini STATE'te yaz.
4. Share API ve `getShareByViewToken` mantığını; `PdfJsStudio`'nun `accessUrl`, print/download, sessionStorage / remember-position davranışını, toolbar overflow'u, `use-zoom-gestures.ts`, engine source loader Range/200 davranışını ve test fixture yöntemini incele.
5. Yerel **sentetik** geçerli paylaşım linki üret (mevcut fixture veya test DB); hiçbir gerçek kullanıcı token'ını Markdown/console/test çıktısına kopyalama. PDF'yi aç, metin seçimi/arama, Ctrl+wheel, yalnız PDF zoom vs tüm sayfa zoom, `Ctrl+P`, `Ctrl+S` ve mobil view gözlemi yap. Nedeni hipotez değil kanıt olarak ayır.
6. Üretimi değiştirmeden küçük POC/spike ile ortak `PdfJsStudio` public URL/200 full-body'yı açabiliyor mu, text layer ve arama çalışıyor mu, auth sorunları var mı test et. POC geçici dosyalarını **yalnız sana ait olanları** temizle. Workspace viewer bağımsız smoke.
7. Hedefli baseline: `npx tsx --test tests/belgeler/belge-share-*.test.ts`, `npx tsc -p tsconfig.next.json --noEmit --incremental false`, varsa uygun tek PDF viewer browser testi. Mevcut hataları not et; exit status ve ciddi console hata bilgisi yaz.
8. `PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_STATE.md` oluştur; aşağıdaki şemayı kullan; `real_share_viewer_file`, `local_head`, test fixture stratejisi, `source_drift`, `POC`, gerçek tarayıcı sonucu kaydedilsin.

**PASS:** Kaynak farkı tespitli/ayrılmış, kök neden yeniden üretilebilir, POC'de seçilmiş mimari ya doğrulanmış ya somut engel + sınırlı alternatif raporlanmış, baseline durumu yazılmış; **feature kodu / deploy değişikliği yok**.  
**Hata/geri dönüş:** POC failure varsa aynı komutu sonsuz yineleme; sebepli revizyon ve `ENGELLI`. Kullanıcının başka değişiklikleri geri alınmaz.  
**Dur:** STATE'i güncelle, kısa raporla, sıradaki `devam`ı bekle.

### ASAMA_02 — Sunucu tarafı güvenli PDF attachment ve ad sözleşmesi

**Giriş:** ASAMA_01 PASS; token route doğrulandı.  
**Dosyalar:** `src/app/api/belgeler/paylasim/[token]/pdf/route.ts`, **yeni** `src/lib/belge-paylasim/document-labels.ts`, ilgili `tests/belgeler/belge-share-*.test.ts`.  
**Sıralı işler:**
1. Beş desteklenen `BelgePaylasimDocumentId` için tek canonical kısa/güvenli etiket + ASCII `.pdf` dosya adı. Yeni helper'da `Record<BelgePaylasimDocumentId,...>` exhaustive type ile koru; bilinmeyen fallback güvenli. Kullanıcı adı/adresini indirme adına katma.
2. API `GET` `new URL(request.url).searchParams.get('download')==='1'` ise 200 `Content-Disposition:attachment`; diğer hallerde mevcut `inline` ve mümkünse mevcut test header'ı **aynen**. PDF baytları **aynı private Blob**; upload, yeniden render veya açık Blob URL ekleme yok.
3. `HEAD` download modunda attachment header, inline modda inline header döner; body boş. Basit, güvenli bir metadata HEAD refactor'ı gerçekten kolay ve testlenebilir ise GET body read'i önle; aksi halde riskli optimizasyonu zorlamadan notla.
4. Her istek token DB durumu üzerinden 404/410/425, 502/500 semantiğini korur; güvenlik başlıkları tüm başarı yanıtında aynı.
5. Aynı fixture PDF'nin inline ve download bayt hash'i SHA-256 ile aynı; revoked/expired + download 410, unknown 404, HEAD no body, POST/DELETE 405, `Content-Type` ve Content-Disposition injection testleri.

**Test:** `npx tsx --test tests/belgeler/belge-share-*.test.ts`; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; yalnız değişen dosyalara lint.  
**PASS:** İki GET başarılı ve baytça aynı, download header güvenli, 404/410 bypass yok, önceki inline sözleşmesi ve testler geçiyor.  
**Hata:** API 200 davranışı bozulursa sadece route/helper branch'i onar; başka endpoint açma.  
**Dur:** STATE + kısa rapor.

### ASAMA_03 — Ortak `PdfJsStudio` public-share varyantı

**Giriş:** ASAMA_01–02 PASS.  
**Dosyalar:** `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`, `pdf-viewer-toolbar.tsx`; gerektiğinde `pdf-shortcuts-modal.tsx`/`strings.ts`; dar testler.  
**Sıralı işler:**
1. `variant?: 'default' | 'public-share'` ekle; default davranışı hiç değişmesin. Prop değişikliği minör olsun, `DokPdfViewer` adapter imzası geriye uyumlu kalsın.
2. Public'ta `onRename/onDelete/onShare/onBack/onCopyDiagnostics` render/komut yürütümü kapalı; diagnostic HUD/query flag gizli; toolbar overflow menüsünde de aynı garanti. Workspace'te hiçbir aksiyon gizlenmemeli.
3. Global remembered position / app settings public konumu veya token'ı kaydetmesin. `fileId` public'ta geçirilmemesi şart, ancak tek başına bunu kanıt sayma; kodda etkisiz/tetiklenmeyen storage kullanan satırları incele. Public'ta gereksiz setting satırı gizle.
4. Toolbar'a `statusSlot` benzeri yalnız görüntü amaçlı güvenli rozet yerleştirmesi ekle (veya daha az prop ile başlık altına entegre et). Geri/manager slotları yeni public modda görünmez, `PDF search/zoom/print/download` korunur.
5. Public kaynak fetch sırasında 410/404 gerçek HTTP durumunu anlamlı viewer mesajına bağla; 425'te geçici; network/502 retry. `variant` default'ta mevcut error classifier davranışı değişmesin.
6. Print/download public action'ları (ASAMA_06–07) ileride güvenli callback bağlayabilsin; otomatik `defaultDownload` public'ta callback sağlanmadıysa sessizce yanlış dosya indirmesin. Workspace fallback yine var.

**Test:** `npm run check:pdf-v3:unit`, `npm run check:pdf-v4:unit`, uygun `tests/document-studio/...` en az bir viewer browser smoke, typecheck + hedefli lint; `default` ve `public-share` varyantlarının komut durumları.  
**PASS:** `default` hiç bozulmadı, public yetenek kısıtı UI/shortcut/handler seviyesinde kanıtlı, docs viewer normal.  
**Hata:** Engine/render queue/worker refactor yapma; küçük adapter sapmalarını düzelt.  
**Dur:** STATE + kısa rapor.

### ASAMA_04 — `/b/[token]` gerçek PDF.js okuyucu entegrasyonu

**Giriş:** ASAMA_01–03 PASS; POC ortak motoru onayladı.  
**Dosyalar:** `src/components/belge-paylasim/belge-share-viewer.tsx`, `src/app/b/[token]/page.tsx`, gerekirse tek küçük ince public adapter, `document-labels.ts`.  
**Sıralı işler:**
1. Var olan export `BelgeShareViewer({viewToken,documentTitle?,initialExpiresAt?})` korunsun. Dinamik `PdfJsStudio` import et (`ssr:false`), `variant='public-share'`, `accessUrl=/api/belgeler/paylasim/${encodeURIComponent(viewToken)}/pdf`, okunabilir `displayName` ve gerçek son kullanma zamanı props.
2. Public'ta `fileId/onShare/onRename/onDelete/onBack` geçirme; `onDownload` için ASAMA_06 helper'ı henüz yoksa işlevi daha sonraya güvenli biçimde aşamala. Eski tek Canvas renderer/keyboard Ctrl+P-S engeli yalnız public viewer dosyasından kalkar.
3. `/b` server sayfasında token durumları, görsel izole hata ekranları, robots/noindex aynen. `DOCUMENT_TITLES` sözlüğünü ortak etiket helper'ına geçir; diğer `/p` ile karıştırma.
4. Sabit A4 genişliği ve kırpıcı `max-w-full` eski viewer ile birlikte kalkar; motorun kendi ölçüm algoritması işler. Dış root `100dvh` / `min-h-0`, PDF viewport iç scroll; toolbar ve butonlarda CSS scale yok.
5. 1 sayfalı taahhütname + 2 sayfalı sözleşmeyle DOM doğrula: PDF canvas ve text layer, seçilebilir kelime, `Ctrl+F` arama, scroll ile sayfa sayacı, thumbnail ve okunur başlık.
6. PDF kaynak gövdesindeki 200 Range fallback'ini, token 410 geçince viewer mesajını, loading/yüklenemedi ekranını çalışır göster.

**Test:** API/unit paylaşım testleri, gerçek Playwright `canvas + textLayer + search + pageCount`; desktop 1366 ve mobil 390 screenshot; Dokümantasyon smoke.  
**PASS:** `/b` gerçek PDF okuyucu, form düzenleme yeteneği/DOM'u yok, tüm sayfaları görüntüler, workspace değişmedi.  
**Hata:** POC'den farklı kritik auth etkisi çıktıysa ASAMA_01 koşullu fallback'ini kanıtla; rastgele renderer yazma.  
**Dur:** STATE + kısa rapor.

### ASAMA_05 — Yalnız PDF zoom + gezinme + metin arama / gestures

**Giriş:** ASAMA_04 PASS.  
**Dosyalar:** Public adapter, viewer scroll/zoom bağlantıları; sadece kanıtlı gerekiyorsa `use-zoom-gestures.ts` veya engine input (asıl motoru yeniden yazma).  
**Sıralı işler:**
1. ASAMA_01'de tespit edilen gerçek Ctrl+wheel/trackpad/pinch bug'ını kontrol et; önce mevcut `PdfJsStudio` gesture'ı yeterli mi test et. `document/window` genel dinleyici ekleme, `userScalable:false` / `maximumScale:1` ekleme.
2. Toolbar `boundingClientRect` ve computed font ölçülerini değişim öncesi/sonrası karşılaştır; PDF zoom yüzde 100→150→200 (motor destekliyorsa 400) artarken toolbar CSS boyutları eşit. PDF'nin imleç altındaki konumu odak korunarak görünür kalır.
3. Ctrl/Cmd+wheel **PDF içerideyken** PDF zoom, **PDF dışarıda** normal browser zoom davranışı korunur. Sıradan wheel scroll; Ctrl+/− ve fit controls odak politikasına uyumlu. Wheel event'te `cancelable` ve passive çakışmaları test et. Ayrı capture dinleyici gerekiyorsa sadece viewer scroll alanında, çift zoom/double prevent default olmadan.
4. `fitWidth` ve `fitPage`, ilk sayfa A4 olmayan/rotate edilmiş/320px dar ekranda doğru. Zoom >viewport olduğunda sağ, sol, alt, üst kenarlara pan/scroll yapılabiliyor; PDF'nin ortası kırpılmıyor.
5. 1/2 sayfalı belgede next/prev, numaradan atlama, scroll sayacı senkron, küçük resim geçişi. Arama Türkçe karakteri ve bulunan metin vurgusu doğru; text select/copy açık.
6. Mobil touch pinch için Chromium emülasyon, Safari/WebKit özel events yalnız desteklenen ortamda; fiziksel cihaz testlenemediğinde `MANUAL_PENDING` kanıt.
7. Unmount / rota değişiminde listener ve render kaynak temizliğini kontrol et. İçerik yeniden PDF olarak sunucuda üretilmez; yalnız canvas yeniden çizilir.

**Test:** `tests/pdf-v4/s03-ctrl-wheel.spec.ts`, `s05-pinch.spec.ts`, mevcut keyboard zoom spec (dosya yolunu doğrula); yeni `tests/pdf-v4/s17-share-readonly-zoom.spec.ts` veya mevcut Playwright yapısına uygun adla; 320/390/768/1366 viewport. Jest sentetik test = device validation değil.  
**PASS:** PDF büyür, toolbar boyutu değişmez; hiçbir browser-level zoom yasağı eklenmez, yüksek ölçek kenarlara erişim ve arama çalışır, docs zoom regresyonu yok.  
**Hata:** Olay çakışmasını yalnız ilgili hook'ta sınırlandır, global `preventDefault`'a kaçma.  
**Dur:** STATE + kısa rapor.

### ASAMA_06 — İndirme: viewer + paylaşım modalı + link geçmişi

**Giriş:** ASAMA_02/04 PASS; ASAMA_05 tamam.  
**Dosyalar:** `belge-share-viewer.tsx`, `belge-share-dialog.tsx`, gerekli ise **yeni** `download-client.ts`, paylaşım UI/API testleri.  
**Sıralı işler:**
1. Public viewer toolbar `İndir` ana eylemini çalışır bağla: **same-origin authorized** `?download=1`, `fetch` success + PDF type/bytes check, güvenli dosya adı, Blob URL lifecycle. Bir indirme sürerken ikinci aynı istek tetiklenmesin; 404/410/502'de hata göster, HTML/text hata gövdesini `.pdf` olarak kaydetme.
2. Owner'ın `Paylaş → Bağlantı oluştur` sonucu paneline `Paylaşılan PDF'yi indir` ve `Bağlantıyı aç` düğmesi ekle. Eski `Kopyala` ve `İptal` aynı kalır. Bu indirme yalnız flatten edilmiş server snapshot'ı indirir; stüdyodaki ayrı düzenlenebilir `Dolu PDF İndir` işlemini değiştirme.
3. Owner geçmişindeki geçerli linklere küçük İndir ikonu ekle; iptal edilmiş/süresi geçmiş linkte bu eylemi gösterme. Bir linkin UI durumu yarış sebebiyle eski kalırsa endpoint yine 410 ile korur.
4. `Bağlantıyı aç` için `target=_blank rel=noopener noreferrer`, URL linkin doğru `/b/` adresi. WhatsApp/QR/native/e-posta share yok. Clipboard link-kopyalama akışı yönetim token'ını içermemeli.
5. iOS Safari dosya kaydetme davranışında fetch Blob URL kısıtı varsa yalnız doğrulanmış aynı-origin `attachment` gezinmesi şeklinde fallback, siteden dışarı token aktarımı yok; açıklayıcı metin ve mobil smoke.
6. İndirilen byte hash'ini `GET inline` hash'iyle karşılaştır; en az 5 şablon adı, iptal/expired testleri ve Playwright download event'i.

**Test:** Paylaşım API/unit/UI testleri + owner modal E2E indirme + public viewer indirme + revocation sonrası 410 + response filename.  
**PASS:** Her iki ekranda `.pdf` gerçek dosya doğru; iptal/expired bypass yok; form düzenlenebilir export korunuyor.  
**Hata:** Native download işleyişinde tarayıcı kısıtı kanıtlanmadan sessiz başarısızlık kabul etme.  
**Dur:** STATE + kısa rapor.

### ASAMA_07 — Yazdırma, toolbar son hali, mobil, erişilebilirlik

**Giriş:** ASAMA_01–06 PASS.  
**Dosyalar:** Public adapter, `PdfJsStudio` toolbar, shortcuts modal/strings, gerekli dar print error handling; mobil CSS yalnız bu bileşenlerde.  
**Sıralı işler:**
1. **Yazdır** butonunu desktop görünür; mobil `⋯` tek dokunuşla ulaşılır. Mevcut `printPdfBytes` kullan; çıktı ekran screenshot'ı değil kaynağın **bütün sayfaları ve özgün A4/diğer sayfa boyutları**. 2 sayfalı sözleşmede print preview fiziksel doğrulama.
2. `Ctrl/Cmd+P` reader odaklıyken PDF print; eski tüm pencere `Ctrl+P/S` yakalayıcısı kalmamalı. iOS'ta yeni sekme/popup engeli için doğru kullanıcı-gesture flow; hata geri bildirimi. Yazdırma 410/404 gelirse fallback olarak süresi dolmuş token'ı zorla açmaya çalışma.
3. Kontrol matrisi bölüm 1.1'i tek tek uygula. `⋯` altında görünmeyen İndir/Yazdır yok; sadece public izinli eylemler. `Bağlantıyı kopyala` clipboard yazma başarılı/hatalı toast; gereksiz `navigator.share` yok.
4. Başlıkta `Salt okunur` + gerçek `expiresAt`; `initialExpiresAt` geçersizse uydurma tarih yazma. Form verisini ve kişisel tanımlayıcıları başlık dışında fazla gösterme.
5. Responsive: **320 / 360 / 390 / 430 / 768 / 1024 / 1366 / 1920** px; portrait/landscape, light/dark. `100dvh`, safe-area, PDF scroll, toolbar `min-width:0`, kırpılmayan menü, gerektiği kadar kompakt. 320px üst çubukta yatay overflow sıfır; PDF scroll doğal.
6. A11y: ikon `aria-label`, tooltip/title, görünür focus, klavye tab sırası, Esc menü kapama ve focus restore, dokunmatik hedefler yaklaşık **44×44px**, contrast, en az 200% browser zoom ile fonksiyon erişimi; `user-scalable=no` yok.
7. Kısayol yardımından public'ta olmayan dosya yönetimi/paylaşım kısayollarını çıkar, desteklenen arama/print/zoom yönergelerini doğru göster. Gece modu metni ve PDF seçimi etkileşimini manuel kontrol.
8. İç/dış sayfa zoom'unu birbirine karıştıran `select-none` vb. CSS varsa text layer seçimi için kapsam içinde düzelt; PDF'de metin seçimine engel olma.

**Test:** `tests/site-audit/belgeler-share-e2e.spec.ts` yeni indirme/yazdır pozitif senaryolarıyla; mobil Playwright viewport, zoom 200% responsive, erişilebilirlik mevcut axe altyapısı varsa onu kullan; print iframe/modal tetiklenmesini otomatik kanıtla, gerçek cihaz testini `MANUAL_PENDING` bırakılabilsin.  
**PASS:** Matrix bütün gerekli öğeleri içeriyor, yasak komut yok, print/doğru sayfa, 320px ve a11y kritik/ciddi yeni ihlal sıfır, mobil kontrol erişimi.  
**Hata:** Widget'ın responsive görünümü bozuluyorsa yalnız public varyantı düzenle, global stüdyo toolbar'ını geriletme.  
**Dur:** STATE + kısa rapor.

### ASAMA_08 — Tam regresyon, güvenlik ve yerel production kabul (**yalnız hata düzeltme**)

**Giriş:** ASAMA_01–07 PASS.  
**Kapsam:** Tüm değişen dosyalar, test ve performans gözlemleri, durum kanıtları. Yeni özellik ekleme yok.  
**Sıralı kontroller (gerçek komutları, dosya yollarını yerelde teyit et):**
1. `npx tsx --test tests/belgeler/*.test.ts` — özellikle share API/viewer/client/server/UI ve 5 template.
2. `npm run check:belgeler-pdf`, `npm run check:belgeler-inline-mobile` — varlık/bağımlılıkları teyit ederek.
3. `npm run check:pdf-v3:unit`, `npm run check:pdf-v4:unit`.
4. `npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/s01-open.spec.ts tests/pdf-v4/s02-keyboard-zoom.spec.ts tests/pdf-v4/s03-ctrl-wheel.spec.ts tests/pdf-v4/s05-pinch.spec.ts tests/pdf-v4/s16-public-share-contract.spec.ts tests/pdf-v4/s17-share-readonly-zoom.spec.ts` — **yalnız var olan dosyaları** seç; yeni dosyanın adı farklıysa gerçek adı kullan. Eklenen testler dahil.
5. `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-share-e2e.spec.ts tests/site-audit/belgeler-mobile-studio.spec.ts` — proje isimleri ve koşullarının varlığını kontrol et.
6. `npx tsc -p tsconfig.next.json --noEmit --incremental false`; `npm run lint`; `npm run build` (prebuild asset/cad senkronu atlama).
7. Mevcut `npm run check:smoke`; uygun `/belgeler`, `/b`, `/dokumantasyon` local production smoke. Browser dev console `error`, unhandled rejection/hydration, 404 asset/worker hatası kontrolü.
8. Matrisi gerçek fixture ile tekrar uygula: geçerli token, 90 günün sınırı, iptal, bilinmeyen, henüz hazır değil, server hatası; noindex/no-store; `GET inline`=`GET attachment` SHA; `HEAD` no body, method 405, `fileId`/manageToken UI sızıntısı yok; 5 farklı docId indirmesi.
9. Kullanıcıların örnek verisi/PII/gerçek token loglara veya test artifact'lerine yazılmamış olmalı; token'ın Referer ile üçüncü taraf kaynağa taşınmasını engelle; kaynak/CSP mevcut politikasını gözden geçir.
10. 1 sayfa + 2 sayfa, 100/150/200/400% (desteklenirse), zoom/pan/rotate/fit, search/select/copy, print/download, 320px/390px/1366px; 10 ardışık zoom aksiyonunda event leak, rendering hang, ikili indirme / memory resource leak yok.
11. Performans: ilk PDF sayfasının görünme zamanı, PDF/worker ağ boyutu, memory ve dev vs production farkı ölç. Tek subjektif “hızlı” kararı verme; eski viewer ile aynı makinede aynı fixture üzerinden baseline karşılaştır. Küçük PDF'de **2 sn hedefi** yalnız ölçüm hedefi; ağ/cihaz koşulu sabit değilse sabit garantili eşiğe dönüştürme. Büyük JS artışı belgelenir; gerekirse `next/dynamic` iyileştirmesi.
12. **Manual pending listesi:** gerçek Android Chrome pinch, iPhone Safari pinch/print/download/popup, sistem tarayıcı zoom 200%. Test yapılamıyorsa `MANUAL_PENDING` ve ayrıntılı test tarifi yaz, **PASS** demeden bırak. Otomatik kritik hatalar blokerdir; fiziksel cihaz yokluğu tek başına sonsuz onay döngüsü yaratmaz.

**PASS:** Otomatik zorunlu kontroller geçer veya önceki dış kapsam hatası baseline ile kanıtlı ayrılır; **bu görevin getirdiği hiçbir test hatası, gizli token sızıntısı veya işlev regresyonu yok**. Blokajlar düzeltilmeden ilerleme yok. Test atlandıysa neden + manual status açık. Hedefli testler gerçeği doğrular; sadece kod metni `includes` kontrolü final güvence sayılmaz.  
**Hata/geri dönüş:** Yalnız kanıtlı regresyonun ilgili uygulama bölümünü düzelt, ilgili testleri tekrar çalıştır. Test silme, test gevşetme, `any`, `@ts-ignore`, eslint kapama yok. `ENGELLI` gerekçesiyle dur.  
**Dur:** STATE + kısa rapor.

### ASAMA_09 — Yaşayan doküman, tek release, canlı smoke ve kesin kapanış

**Giriş:** ASAMA_01–08 **kanıtlı PASS**, hiç kritik blocker yok; mevcut `AGENTS.md` release kuralını yeniden kontrol et.  
**Kapsam:** `docs/BELGELER_SISTEMI.md` ve gerekiyorsa `PROJECT.md` doğru yeni mimariyi özetle; değişen görev dosyalarını finalle.  
**Sıralı işler:**
1. Son onay kapısında test edilen kodla push edilecek dosya listesini birebir karşılaştır; ilgisiz kirli dosyaları stage etme. Plan/state ve yaşayan belgeyi güncelle. `git diff --check`, typecheck/smoke sonuçları halen geçerli mi kontrol et.
2. `release_status=READY_FOR_DEPLOY`, `execution_status=DEVAM_EDIYOR` olarak kaydet. **Deploy öncesi `TAMAMLANDI` YAZMA.**
3. Yerel geliştirmede tek anlamlı atomik checkpoint commit ile repo kurallarına uygun `main` push. Bu yol Vercel'in olağan tek production deploy'unu tetiklemelidir. Genel yasak yok; ASAMA_01–08'de gereksiz push yok. `force push`, sürekli deneme commit'i, ilgisiz dosya push yok.
4. Gerçek deployment ID / commit SHA / Vercel production `READY` durumunu doğrula, **sadece trigger yapıldı diye yayın başarılı sayma**. Eğer kod+Vercel ortamı uyuşmuyorsa kanıtlanmış release engelini ayrıştır ve raporla.
5. Yayında `/belgeler` beş şablon akışı; gerçek test paylaşımı `/b/token`, canvas+textlayer, zoom, search, print/download, 200 PDF/attachment, HEAD; sonra test linki revoke ederek 410'ı doğrula. Canlı hassas verileri, test token'ını log/rapora çıkarma. `/dokumantasyon` PDF önizleme smoke ve genel navigation kontrolü.
6. Vercel canlı build/crash/runtime loglarını ve Playwright canlı smoke çıktılarını gözden geçir. Çalıştırılması güvenli mevcut `scripts/verify-production-smoke.mjs` ya da `npm run check:smoke` kullan; script gerçek path/arg ve yan etkileri teyit et.
7. Bütün production smoke **PASS** olunca STATE `execution_status:TAMAMLANDI`, `active_stage:null`, `next_stage:null`, `deploy_done:true`, `production_sha`, `deployment_id`, `production_smoke_status:PASS` yaz. Gerçek telefon listesi varsa `MANUAL_PENDING` ayrı ve şeffaf. Push sonrası state kaydının uzakta kalması gerekiyorsa gereksiz ikinci production deploy üretmeden repo kurallarına uygun kayıt stratejisi uygula; state yalnız yerelde güncellense de açıkça belirt.
8. Canlı kritik problemde `ENGELLI`/`DEPLOYED_BUT_FAILED` işaretle; otomatik tekrar tekrar deploy yapma. Önceki başarılı Vercel sürümüne kontrollü rollback veya revert seçeneklerini hazırla, proje politikası ve mevcut yetkiyi teyit et.

**PASS:** Tek anlamlı release, Vercel production READY, canlı `/b + download + print + token revoke` kontrolleri, `/belgeler` ve `/dokumantasyon` smoke, STATE ancak şimdi `TAMAMLANDI`.  
**Hata:** Hatalı üretimi kullanıcıdan gizleme; açık kapsamda derhal güvenli rollback/onarım yoluna geç, başkasının işini resetleme.  
**Dur:** En fazla 6 satırlık son rapor, başka aşama ekleme.

---

## 5. DİĞER PLANLARDAN DEVREDİLEN KİLİTLER

1. 5 belge türü, editable belge stüdyosu ve `src/lib/belge-filename.ts` mevcut akışı korunur.
2. Public PDF sunucuda `flatten:true` oluşturulur; düzenlenebilir AcroForm paylaşılmaz. 90 gün sabit; expired/revoked erişim her istekte 410, cron Blob temizliği ayrı.
3. `viewToken` yalnız public okuma/indirme/print yetkisidir; `manageToken` yalnız owner link-iptal için ve public UI/network'e geçmez.
4. WhatsApp, QR, `navigator.share`, native dosya paylaş, e-posta eklenmez. İndirme **bu yasağın dışındaki yeni açık kullanıcı talebidir**.
5. `PdfJsStudio`'nun default variant'ı ve Dokümantasyon `/p` her aşamada korunur. `fileId` verilmez, token storage/debug yazılmaz.
6. Sitedeki genel browser zoom'u/viewport meta zorlanarak kapatılmaz; a11y kabiliyetleri korunur.
7. CAD/DXF/DWG motoru, PDF form generator, private Blob auth ve veri yaşam döngüsü değiştirilmez.
8. `git reset --hard`, `git clean`, `force push`, kullanıcının diğer değişikliklerini silme, izin verilmemiş Vercel yayın döngüleri yasaktır.

---

## 6. DURUM DOSYASI VE KESİN "BAŞLA / DEVAM / DUR" PROTOKOLÜ

`PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_STATE.md` ilk aşamada şu iskeletle oluşur (örnek değerleri kanıt olmadan PASS yapma):

```yaml
plan_id: INSA-BELGELER-PUBLIC-READER-V4-20261024
plan_revision: 4
plan_file: PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_PLAN.md
planning_status: PLAN_HAZIR
execution_status: BASLAMADI      # BASLAMADI | DEVAM_EDIYOR | ENGELLI | TAMAMLANDI
release_status: NOT_STARTED      # NOT_STARTED | READY_FOR_DEPLOY | DEPLOYED | DEPLOYED_BUT_FAILED | VERIFIED
active_stage: null
next_stage: ASAMA_01
completed_stages: []
stages:
  ASAMA_01: { status: PENDING }
  ASAMA_02: { status: PENDING }
  ASAMA_03: { status: PENDING }
  ASAMA_04: { status: PENDING }
  ASAMA_05: { status: PENDING }
  ASAMA_06: { status: PENDING }
  ASAMA_07: { status: PENDING }
  ASAMA_08: { status: PENDING }
  ASAMA_09: { status: PENDING }
local_head: null
real_share_viewer_file: null
source_drift: null
share_test_fixture_method: null
evidence: []                    # [{stage, check, status, sha_or_worktree, evidence_path?}]
manual_checks: []               # [{device, scenario, status: PASS|FAIL|MANUAL_PENDING}]
blockers: []
deploy_done: false
production_sha: null
deployment_id: null
production_smoke_status: NOT_RUN
updated_at: null
```

**Planın kaydedilmesi uygulamayı başlatmaz.** Kullanıcı "başla" veya ilk "devam" deyince ASAMA_01. **Her "devam" en çok bir aşamayı** tamamlar; kısmi aşama varsa onu sürdürür, sonraki aşamaya otomatik geçmez. Aşama sonu hedeflenen test gerçekten çalışmış ve PASS gösterilmiş olmalı; başarısız test varsa `ENGELLI`, neden + tekrar üretim + çözüm kaydı, bir sonraki aşamaya geçme. Aşamanın ilerleme ve bulgularını STATE'te sakla. Başka oturumda STATE + yerel diff'e bakarak kaldığın yerden sürdür. Yeni kullanıcı kapsam eklemedikçe planı genişletme.

ASAMA_09 sonunda tüm zorunlu kabul tamam, production READY ve smoke PASS ise `TAMAMLANDI`. **Bu durumdayken yalnız "devam" denirse** tam olarak `Plan tamamlandı; uygulanacak başka aşama yok.` de; kod, dosya, commit, CI, build, test, deploy veya yeni aşama yapma. ChatGPT planlayıcı sohbetine "devam" dendiğinde de bitmiş planı uygulatmaya kalkma.

Aşama raporu kullanıcıya en fazla 6 kısa satır: `ASAMA_XX PASS/ENGELLI`, somut değişiklik, yürütülen test/sonuç, varsa engel, sıradaki aşama. Teknik kanıtlar dosyada kalır.

### Final kabul matrisi (mutlaka kanıt)

- [ ] Paylaşım linki sahibi, oluşturma modalında **Paylaşılan PDF'yi indir** ve **Bağlantıyı aç** görüyor; görüntüleyici linki `/b`.
- [ ] Public viewer'da **İndir** ve **Yazdır** çalışıyor; kaydedilen dosya gerçek `application/pdf`, özgün flatten snapshot baytları, doğru dosya adı.
- [ ] Süresi dolan veya iptal edilen link `GET inline`, `?download=1`, `HEAD` ve viewer yüklemesinde güvenli 410; management token public'ta yok.
- [ ] Gerçek PDF text layer ve arama, en az bir kelime seçimi, 2 sayfalı gezinme, doğru page count.
- [ ] PDF iç zoom 100/150/200 (desteklenirse 400); toolbar boyutu değişmez; fit width ve rotated page doğru; all edges scroll.
- [ ] PDF dışında global browser zoom yasaklanmadı; `user-scalable=no`, `maximum-scale=1` eklenmedi; 200% zoom a11y.
- [ ] Ctrl+P PDF yazdırma; iOS popup/fallback fiziksel olarak testlenmediyse `MANUAL_PENDING` olarak şeffaf.
- [ ] `/b` HTML'de düzenleme/silme/yeniden adlandır/paylaş yönetimi yok; backend yazma API'sine erişim yok; noindex/no-store.
- [ ] 320/360/390/430/768/1024/1366/1920 mobil/desktop uyumu, görünür menü/buton, önemli a11y ihlali yok.
- [ ] 5 belge stüdyosu/editable download, eski paylaşım linkleri, Dokümantasyon viewer ve `/p` akışı çalışıyor; CAD protected core değişmedi.
- [ ] İlgili otomatik test, lint, typecheck, build, yerel production smoke başarıyla geçti; yeni hidden error yok.
- [ ] **Tek** final main push + production READY + canlı smoke **sonrasında** durum TAMAMLANDI.

---

## 7. KAYNAKLAR VE PLANIN İLK UYGULAMA MESAJI

**İncelenen kaynaklar:**
- [GitHub mühendislik sitesi](https://github.com/smitelagwar/muhendislik-site), `main` commit `04048e50fd02e50c1c9ea783acec2d7383f516b4`.
- Repo dosyaları: `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/dokumantasyon-kurallari.md`, `src/app/b/[token]/page.tsx`, `src/components/belge-paylasim/*`, PDF route, `pdfjs-studio.tsx`, PDF toolbar, PDF zoom helpers, belirtilen testler.
- Önceki planlar: ChatGPT `BELGELER_PAYLASILAN_PDF_OKUYUCU_GEMINI_3_8_FLASH_NIHAI_PLAN.md`; Sonnet 5.5 `BELGELER_PAYLASIM_VIEWER_V3_PLAN.md`.
- [Gemini 3.8 Flash resmî model kartı](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash): kimlik `gemini-3.8-flash`, `low/medium/high` thinking.
- [W3C Understanding WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text): 200% büyütmede içerik/fonksiyon kaybı olmamalı.
- [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag): `user-scalable` ve `maximum-scale` sınırlarının kullanıcı zoom'una etkisi.

**Gemini'ye gönderilecek ilk tek mesaj:**

> Bu V4 nihai planı mühendislik sitemin Windows yerel proje klasöründe uygula. Önce `PLAN/BELGELER_PAYLASIM_PDF_OKUYUCU_V4_PLAN.md` dosyasını ve varsa `...V4_STATE.md` durum kaydını, `PROJECT.md`, `AGENTS.md`, `GEMINI.md` ve göreve ilişkin kuralları oku. Plan referansı ile yerel HEAD/dirty worktree farkını incele; kullanıcı değişikliklerine dokunma. **Şimdi yalnız ASAMA_01'i uygula.** Gerçek kök nedeni ve POC'u kanıtla, ilgili testleri çalıştır, kalıcı STATE'i güncelle, kısa sonuç yaz ve **DUR**. Sonraki aşamaya yalnız yeni bir `devam` mesajımla geç. Her `devam` en fazla bir aşamadır. Planı tamamladıktan sonra yeni aşama icat etme. Production yayını yalnız final aşamasında tek doğrulanmış release olarak yap; deployment READY ve canlı smoke PASS olmadan `TAMAMLANDI` yazma.

