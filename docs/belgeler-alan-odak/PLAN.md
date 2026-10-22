# BELGELER — FORM ↔ PDF ALAN ODAK VURGUSU | NİHAİ UYGULAMA PLANI

> **Revizyon:** 2 — ChatGPT ilk planı ile `BELGELER_ALAN_ODAK_VURGUSU_PLANI.md` (Claude) teknik olarak uzlaştırıldı.
> **Plan kimliği:** `BELGELER_FORM_PDF_FOCUS_V2`
> **Hazırlanma:** 22 Ekim 2026, Europe/Istanbul
> **Durum:** `PLAN_HAZIR` — *hiçbir uygulama aşaması bu planın yazılmasıyla tamamlanmış değildir.*
> **Hedef uygulayıcı:** Windows yerel çalışma alanında **Gemini 3.8 Flash**, API model kimliği `gemini-3.8-flash`; arayüzde destekleniyorsa `high` thinking, aksi hâlde kullanıcının seçili ayarı.
> **Hedef repo:** `smitelagwar/muhendislik-site`, yerel proje adı `muhendis-mimar-portali`; `main` son incelenen HEAD `e81f4c158bdce03a49e3fb058d648dbbfe9e2838` (22.10.2026). **Yerel çalışma ağacı bu commit'ten farklı olabilir.**
> **Ürün:** https://muhendislik-site.vercel.app/belgeler/beton-dokum-tutanagi
> **Plan ve durum hedefi:** `docs/belgeler-alan-odak/PLAN.md` ve `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md`. **Var olan aynı adlı plan/durumun üzerine yazma; çakışma varsa yeni görev dizini oluşturup gerçek yolu durum kaydında belirt.**

## 1. Kullanıcının istediği sonuç

Soldaki formda **Şantiye Yeri** alanına tıklandığında, sağdaki PDF'de **Yer satırının değer hücresi** açıkça ama zarifçe vurgulansın. Aynısı beş belge stüdyosundaki **56 düzenlenebilir alanın tamamı** için çalışsın. Kullanıcı hangi kutunun PDF'nin neresine yazıldığını anlasın; veri girişi ve PDF düzenleme deneyimi bozulmasın.

**Ölçülebilir son durum:**

- Odak (`click`, `Tab`, `Shift+Tab`) → doğru *AcroForm widget dikdörtgeni* üzerinde **tek mavi çerçeve**, düşük opaklıklı zemin; diğerleri işaretlenmez. Bir alanın ismi PDF'de geçiyor diye metin araması yapılmaz. Etiket, ince hücrelerde komşu içeriğe taşacaksa **gösterilmeyebilir**; doğru çerçeve zorunludur.
- Yazmaya devam etmek veya PDF'nin mevcut 250 ms debounce ile yeniden üretilmesi vurguyu yeni bir alana kaydırmaz; odak değişimi **PDF üretmez**. Kullanıcı formdaki caret'i, sol panel kaydırmasını ve seçilmiş PDF zoom oranını korur.
- Hedef başka sayfadaysa **yeni odak olayına bir kez** sayfa değişir; alan görünmüyorsa **yalnız gereken kadar** scroll edilir. Her karakterde sayfa/scroll sıçraması yapılmaz. Kullanıcı elle kaydırdıktan sonra sistem alanı tekrar zorla merkeze çekmez.
- PDF araç çubuğuyla zoom/fit yapılırken kullanıcı az önce seçtiği alanı görmeye devam edebilsin; odak ilgisiz bir yere taşınınca veya `Esc`/`Temizle`/`Sıfırla`/belge değişimi olduğunda seçimi temizle. Aynı belgenin PDF önizlemesindeki zoom, pan ve sayfa gezinme kontrolleri **seçimi koruyan istisna**dır. İstisna odak kurallarının üstüne körlemesine yapıştırılmayacak; testle doğrulanacak.
- Mobil/tablet (< masaüstü split eşik) form ve PDF ayrı yüzeylerdeyse **otomatik sekme değiştirme veya klavye kapatma yok**. Kullanıcı formdan kendi isteğiyle PDF görünümüne geçince **son alan 2,5 saniye** görünür; sonra söner. 2,5 saniye gösterimi yalnız görünür/başarılı PDF sayfası üzerinde başlar. Yeni form odağı yeni seçimdir.
- *“PDF Üzerinde Düzenle”* etkin olduğunda form rehberi gösterilmez; hotspot, mobil alt sayfa, popover, kirli taslak onayı ve düzenleme akışı eskisi gibi çalışır. Moddan çıkınca yeni gerçek form odağına kadar eski rehberi kendiliğinden geri getirme.
- Eksik/bozuk annotation, geçmiş sayfanın canvas'ı, tamamlanmamış render veya değişmiş şablon koordinatı varsa **yanlış alanı işaretlemek yerine geçici olarak vurgusuz kal**. Geçerli eski canvas ile aynı şablon geometrisinde yeni PDF oluşturulurken işaret korunabilir; **sayfa/doküman karışıklığına asla izin verilmez**.
- Çerçeve **yalnız DOM'dadır**: üretilen, indirilen, boş veya yazdırılan PDF'nin byte'ları/AcroForm alanları değişmez; yeni pakete ihtiyaç yoktur.

**Kapsam dışı:** PDF alanına tıklayınca soldaki forma geri odaklanma; bağlı imza alanlarını aynı anda vurgulama; OCR/text-search ile koordinat tahmini; yeni PDF viewer; PDF engine/font/şablon/validasyon/hesaplama/mevzuat/dokümantasyon modüllerini değiştirme.

## 2. Kanıtlar, çelişkiler ve net mimari

### 2.1 Gerçek koddan doğrulananlar

- Beş stüdyo `BelgeStudioPdfPreview` kullanıyor: `src/components/{beton-dokum,insaat-ruhsati,istifa,sozlesme,taahhutname}-studio.tsx`. Form kimlikleri sırasıyla `beton-dokum-`, `insaat-ruhsati-`, `istifa-`, `sozlesme-`, `taahhutname-` önekiyle üretiliyor. `DOCUMENT_EDITABLE_FIELDS` alanları 10 + 8 + 10 + 14 + 14 = **56**.
- `src/lib/belge-studio-inline-field-map.ts` içinde `mapPdfAnnotationsToInlineFields()` var: PDF.js `page.getAnnotations({intent:'display'})` listesinden izinli widget adı, sayfa ve gerçek görünüm dikdörtgenini dönüştürüyor. İstifa'nın 3 PDF-only etiket alanı düzenlenebilir değildir.
- `src/components/belge-studio-pdf-preview.tsx` içinde `renderPage`, `pageRef`, `renderedToken`, `containerRef`, `frameRef`, `canvasRef`, pinch/pan/zoom ve inline-edit bulunuyor. **Mevcut annotation çıkarımı yalnız inline edit aktifken çalışır; bağımsız rehber bununla sınırlanamaz.** PDF sayfası `page.getViewport({scale:effectiveScale})` ile çizilir; raster bitmap ölçüsü ve CSS ölçüsü ayrı. Frame/canvas CSS ölçüleri render esnasında ve geçici zoom dönüşümlerinde değişiyor.
- `useBelgeStudioDocument()` form verisi değişiminde 250 ms debounce ile yeni `snapshot.revision`, blob URL ve bytes üretir. Form odağı burada bağımlılık değildir. `playwright.site.config.ts`: port 3005, `.next` varsa varsayılan production server; `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'` yerel dev sunucusunu zorlar.
- `AGENTS.md` yerel IDE yöntemi: **yerelde çalış/test et → son aşamada tek anlamlı `main` push → Vercel Production**. Sohbet/GitHub API yöntemi farklı korumalara tabi; bu plan doğrudan GitHub'a yazma izni değildir.

### 2.2 Claude'un dosyasından alınan ve yerelde yeniden doğrulanacak ölçümler

Claude'un aktardığı şablon ölçümlerine göre Beton `yer` widget'ı A4 sayfa üzerinde yaklaşık `[179,658,531.3,694]` pt, Sözleşme'nin `sozlesme_tarihi`, `santiye_sefi_imza_adi`, `muteahhit_imza_unvan` alanları **2. sayfada**, Taahhütname alan yükseklikleri yaklaşık **9,2–9,8 pt** ve satırlar birbirine çok yakın. Claude, her düzenlenebilir alanın tek widget'ı olduğunu bildiriyor. Bu sayılar **bu planlama turunda PDF örneklerini yeniden ölçerek bağımsız doğrulanmadı**; ASAMA_01'de mevcut PDF fixture'larından otomatik kanıt üret. Şablon değişmişse eski koordinatlara göre kod yazma.

### 2.3 Teknik kararlar — iki plandan seçilen nihai çözüm

| Kod | Seçilen yöntem | Gerekçe / ret nedeni |
| --- | --- | --- |
| D1 | **PDF.js annotation → mevcut `mapPdfAnnotationsToInlineFields` → normalize (0–1) sayfa dikdörtgeni.** | `snapshot.layouts` sayfa numarası garantisi vermez; OCR/manuel koordinat listesi güvenilmez. |
| D2 | **Yüzdeyle (`left/top/width/height`) `.belge-preview-frame` üzerinde overlay.** | Gerçek CSS frame ile birlikte büyüyüp küçülür. Bitmap px/DPR veya eski inline-edit `viewportRect` değerini doğrudan kullanma. |
| D3 | **Stüdyo oturumu başına, belge kimliği ve kanıtlanmış şablon geometrisi kapsamında bir geometri önbelleği / single-flight çıkarım.** | Her PDF revision'ında annotation taramayı önler. **Yalnız `documentId` anahtarlı sınırsız modül Map kullanma:** farklı şablon/oturumda eski veri sızabilir. Belge ve şablon uyumsuzluğu görülürse invalidation; extract hatasında sınırlı retry. |
| D4 | **Form kabında `onFocusCapture`/`onBlurCapture` delegasyonu + `DOCUMENT_EDITABLE_FIELDS` allowlist.** | 56 kontrole ayrı handler yok. `id.split('-').pop()` ile anahtar tahmin etme; her stüdyonun gerçek önekiyle güvenli eşleştir. |
| D5 | **Olay kimliği (`focusEventId`) ve ayrı mobil `lastFocusedFieldKey`.** | Odak değişimi bir kez işlenir; her formData/render güncellemesinde tekrar sayfa/scroll yok. Zoom toolbar'ında kısa bağlamsal seçim korunabilir, ilgisiz odağa geçince temizlenir. |
| D6 | **Mavi kontur (`#2563eb`, beyaz zemin karşısında hesaplanan yaklaşık 5.17:1); düşük alfa dolgu; overlay `pointer-events:none`, `aria-hidden=true`.** | Mevcut inline edit hotspot'ı amber; roller ayrılır. Renk dışında belirgin kenar çizgisi var. Etiket isteğe bağlı, yoğun alanlarda taşma yaratmamalı. |
| D7 | **Görünür olan canvas sayfası + render isteği/revision doğrulaması.** | Sayfa değişimi veya gecikmiş `getAnnotations` sonucu eski canvas'a yanlış halka bindirmesin. Stale async sonuçları iptal/ignore et. |
| D8 | **Mobil 2,5 sn geçici seçim**, kullanıcının önizlemeye *isteyerek* geçişinden sonra. | Mobil özelliği son anda ayrıca izin isteyip belirsiz bırakma; aynı kullanıcı hedefinin doğal parçası. |
| D9 | **Mevcut edit mode hotspot katmanı üstte, form rehberi altta ve pasif**; edit modu açıkken rehber hiç gösterilmez. | Kirli taslak, popover, sheet, tıklama ve focus çatışmaz. |
| D10 | **Ölçülü kabul kapıları: 56/56 alan, ≤2 CSS px konum hatası, canlı yeniden üretim, sıfır ek odak-kaynaklı PDF üretimi, indirilen dosyada sıfır işaret.** | Kontroller yalnız CSS görünürlüğüne değil gerçek hizaya ve mevcut davranışa bakar. |

**Önemli doğruluk ayrımı:** Yüzde tabanlı dikdörtgen, zoom sırasında ancak frame/canvas'ın *aynı* sayfayı/aynı ölçeği temsil ettiği anlarda doğrudur. Canvas anlık `transform: scale()` yaparken `frame` boyutu da yeniden ayarlanıyor; ASAMA_04 bunların eşlenmesini ölçer. Eğer bir zoom yolu frame ile canvas'ı geçici olarak farklı ölçekliyorsa **gesturedaki vurgu geçici gizlenir ve kararlı render'dan sonra yeniden açılır**; geniş zoom refactor'u yapılmaz.

### 2.4 Önerilen sözleşmeler (mevcut API sanılmasın; uygulanacak yeni kod)

```ts
// YENİ: src/lib/belge-field-focus.ts
export type FieldFocusRect = {
  fieldKey: string;
  pageNumber: number;
  left: number; top: number; width: number; height: number; // 0..1
};
export type FieldFocusGeometry = {
  rects: Record<string, FieldFocusRect>;
  diagnostics: string[]; // test ve teşhis için; son kullanıcıya çöp hata gösterme
};

// YENİ: src/hooks/use-belge-field-focus.ts
export type FieldFocusSelection = {
  documentId: BelgeDocumentId;
  fieldKey: string | null;
  lastFocusedFieldKey: string | null;
  focusEventId: number; // gerçek yeni focus'ta artar, her harfte değil
};

// YENİ: src/components/belge-studio-pdf-preview.tsx prop'u
fieldFocus?: FieldFocusSelection;
```

`extractFieldFocusRects(pdf, documentId)` fonksiyonu her sayfayı `scale:1` viewport ile işler, **mevcut** `mapPdfAnnotationsToInlineFields` ile normalize eder. Girdilerde sınır/sayı/rotation/rect kontrolü yap; izinli olmayanlar diagnostic olarak atlanır. Bir sayfanın annotation hatası bütün sayfaları otomatik başarısız kılmaz; **tamamen kullanılamayan PDF belgesi** için açık başarısızlık dön veya üst katmana yakalanabilir hata bırak; kritik hatayı sessizce "56/56 hazır" sayma. Tekrar eden anahtar varsa yanlış rect seçme: tanımlı ve test edilmiş sözleşme dışındaki çakışmayı `diagnostics` ile reddet.

**Yeni dosyalar:** `src/lib/belge-field-focus.ts`, `src/hooks/use-belge-field-focus.ts`, `src/components/belge-studio-field-focus-layer.tsx`, `tests/belgeler/field-focus.test.ts`, `tests/site-audit/belgeler-field-focus.spec.ts`.

**Değişiklik gereken mevcut dosyalar:** ortak `src/components/belge-studio-pdf-preview.tsx`, beş stüdyo bileşeni, **yalnız `.belge-*` yerel kurallarıyla** `src/app/globals.css` (stiller yerelde başka belgeler stil modülündeyse onu tercih et), yaşayan `docs/BELGELER_SISTEMI.md`. Bunların dışında değişiklik ancak kanıtlı zorunlulukla kapsam/gerekçe kaydıyla yapılır.

**Varsayılan korunacak dosyalar:** `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/belgeler-pdf-layout.ts`, `src/lib/belgeler-pdf-profiles.ts`, `src/lib/belge-studio-inline-field-map.ts`, `src/components/belge-studio-inline-edit-layer.tsx`, `public/belgeler/*.pdf`, CAD/DWG/DXF ve `/dokumantasyon` modülleri. Bunları refactor etme; zorunlu ve dar bir düzeltme çıkarsa mevcut test/kuralları okumadan dokunma.

## 3. Çalıştırma ve kesin "DEVAM" protokolü

Bu belge **uygulama talimatıdır; yüklemek başlamayı gerektirmez**. Uygulayıcı `Başla`, ilk `devam` veya açıkça `ASAMA_00'ı uygula` mesajı aldığında tek aşama uygular. Sonraki her `devam` **en fazla bir tamamlanmamış aşamayı** gerçekleştirir; aşamanın kendi test/düzeltmeleri bunun içindedir. Test geçmeden aşama PASS sayılamaz. Engel varsa `ENGELLI` durumunu, gerçek log/kanıtı ve uygun geri dönüşü yazar; bağımlı aşamaya ilerlemez. Aşamanın sonunda kısa rapor verip **dur**. Başka aşamayı kendi kendine başlatma, arka planda periyodik görev açma.

**TAMAMLANDI sonrası salt `devam`:** sadece **“Plan tamamlandı; uygulanacak başka aşama yok.”** de; başka dosya/test/commit/deploy çalıştırma. Yeni görev ancak açık yeni istekle başlar. Tamamlanmış aşamayı otomatik tekrarlama; sonraki değişiklik önceki test kanıtını geçersiz kılıyorsa yalnız etkilenen doğrulamayı yeniden yap.

**Her aşama başı:** `PROJECT.md` → `AGENTS.md` → `GEMINI.md` → `.agents/rules/belgeler-kurallari.md` + `.agents/rules/test-ve-otomasyon-standardi.md` + `.agents/rules/yasayan-dokumantasyon-bakimi.md` (ilgili olduğunda) ve yerel alt dizin talimatlarını oku. İlk aşamada tamamını oku, her seferinde baştan geniş araştırma yapma. `git status --short --branch` ve mevcut durum dosyasını denetle. Yerel kullanıcı değişikliklerini asla `git reset --hard`, gizli stash, temiz checkout veya zorla `pull` ile silme. `ecc/` mevcut ve aktifse repo kuralları doğrultusunda gereken parçalarını kullan; sırf mümkün diye uzun, ilgisiz tarama yapma.

**Testlerde** `.agents/rules/test-ve-otomasyon-standardi.md` uyarınca gerçek kaynak seçicileri, makul timeout ve her koşulda browser/proses cleanup kullan. `PLAYWRIGHT_PRODUCTION_SERVER=0/1` ile hangi build'e karşı test edildiğini açık yaz; `.next` var diye eski derlemeye PASS verme. Başarısız assertion silme, sırf PASS olsun diye toleransı/timeout'u büyütme. Test sonuçları `PASS`, `FAIL`, `BEKLIYOR` olarak ayrı tutulur. Sadece bu görevin açtığı sunucu/tarayıcı kapatılır.

**Kalıcı durum yolu:** `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md` (işaretlenen gerçek dizinde). Başlangıç:

```yaml
plan_id: BELGELER_FORM_PDF_FOCUS_V2
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: BASLAMADI # BASLAMADI | DEVAM_EDIYOR | ENGELLI | TAMAMLANDI
active_stage: null
next_stage: ASAMA_00
completed_stages: []
skipped_stages: []
base_commit: null
tested_commit: null
dirty_tree: null
evidence: [] # [{stage, command_or_case, result, commit_or_worktree, path_or_summary}]
blockers: []
updated_at: null
```

`ASAMA_00` bittiğinde `next_stage=ASAMA_01`; ASAMA_08 bitince `next_stage: null`. Mevcut aktif GSD plan/durum formatı uyuşmuyorsa çakışmasız ayrı hedef kullan ve bağlantıyı kaydet. Her aşamada ayrı uzun rapor dosyası oluşturma; kanıtları makul sayıdaki test çıktısı/ekran görüntüsü ve tek durum kaydında tut. **Bu plan nedeniyle şimdi GitHub'a push veya deploy yapılmaz.** Yayın aşağıda açıkça kapsam içindedir.

## 4. Aşama haritası

| Aşama | Sonuç | Yayın |
| --- | --- | --- |
| `ASAMA_00` | Yerel repo/talimat/test başlangıç çizgisi | Yok |
| `ASAMA_01` | PDF annotation geometrisi, 56 alan saf test | Yok |
| `ASAMA_02` | Olay delegasyonu, stabil seçim/odak state'i | Yok |
| `ASAMA_03` | Bağımsız PDF vurgu katmanı ve Beton pilotu | Yok |
| `ASAMA_04` | Zoom, PDF revision ve performans pilot testleri | Yok |
| `ASAMA_05` | Çok sayfa Sözleşme + diğer 3 belge + 56/56 e2e | Yok |
| `ASAMA_06` | Mobil, edit-mode çatışmaları, yoğun alan ayarı | Yok |
| `ASAMA_07` | Tam regresyon, a11y ve yerel release kapısı | Yok |
| `ASAMA_08` | **Tek** `main` push → Vercel Production → canlı smoke | **Tek final deploy** |

### ASAMA_00 — Baseline ve uygulama sözleşmesi

**Giriş:** Kullanıcı başlattı; proje yerelde mevcut. **Kapsam:** plan, repo/talimatlar/test ortamı; kaynak kod değişmez.

1. `git status --short --branch`, `git rev-parse HEAD`; çalışma ağacının kirli dosyalarını not et. GitHub `main` referansı ile farkları tespit et ama kullanıcı değişikliğini zorla eşitleme.
2. `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, konuya özel `.agents/rules/*.md`, PDF engine/viewer, form bileşenleri, Playwright config, package scripts, ilgili mevcut testleri oku. Yerelde var olan yakın geçmiş Belgeler işleriyle çakışma varsa yalnız bu planı etkileyeni değerlendir.
3. Başlangıç testlerini *ortama göre* çalıştır: `npm run check:belgeler-pdf`; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; mobil e2e ortamı hazırsa `npm run check:belgeler-inline-mobile`. Her sonucu/çalıştığı kaynak sürümü kayda geçir. Var olan fail bu görevden önce olduğu gibi kaydedilir; otomatik ilgisiz düzeltme yapma.
4. `playwright.site.config.ts` altında `.next`/`PLAYWRIGHT_PRODUCTION_SERVER` davranışını doğrula. Gerekirse sonraki geliştirme testlerinde `'0'` ile dev, final build sonrasında `'1'` ile production server kullanılacak. Her durumda doğru commit/değişiklikle eşleşsin.
5. Kullanıcının verdiği bu nihai dosyayı çakışmasız `PLAN.md` hedefine kopyala, tek `IMPLEMENTATION_STATE.md`'yi gerçek bulgularla oluştur. Önceki planı otomatik silme/üzerine yazma.

**Kabul:** baseline PASS/FAIL/BEKLIYOR kanıtı var; aktif proje sürümü, başlangıç farkları ve dosya yolları kesin; yeni üretim kodu yok. **Hata/geri dönüş:** çevre/kilit eksiğini `ENGELLI` yaz, kullanıcının çalışmalarını bozma. **Dur:** kısa rapor; `ASAMA_01` beklenir.

### ASAMA_01 — Saf alan geometrisi / şablon kontratı

**Giriş:** ASAMA_00 tamam. **Kapsam:** yeni `src/lib/belge-field-focus.ts` ve `tests/belgeler/field-focus.test.ts`; mevcut alan haritası *okunur ama değiştirilmez*.

1. TypeScript saf fonksiyon `extractFieldFocusRects(pdf, documentId)` oluştur. `pdf.numPages`, `getPage`, `page.getViewport({scale:1})`, `page.getAnnotations({intent:'display'})` kullan. `mapPdfAnnotationsToInlineFields()` ile **PDF-only ve allowlist dışı** alanları filtrele; `viewportRect`'i viewport genişlik/yüksekliğine böl. Sağlam `0..1` koordinat aralığı, pozitif ebat, finite ve sayfa numarası kontrolü yap. Tekrarlanan alanın sayfası/türü net değilse diagnostic ve eksik-öğe olarak işaretle; sonradan ilkini rastgele seçme.
2. `buildFieldIdMap(documentId, prefix)` ve `resolveFocusedFieldKey(map, target)` fonksiyonları: yalnız DOM `input/textarea/select` ve haritada kayıtlı gerçek `id`; `button`, bilinmeyen ID veya PDF-only alanlara `null`. Prefix'i mevcut stüdyo kodundan al. `getFieldId` callback referansını hook bağımlılığı yapıp her render'da yeniden kurma; string prefix veya sabit map üret.
3. Beş **gerçek PDF şablonunu** mevcut `tests/belgeler/inline-edit-field-map.test.ts` fixture okuma düzeniyle test et: 56/56 anahtar, doğru sayfa, `0..1` sınırları, dönük/bozuk/boş mock annotation, tekrarlanan widget, geçersiz rect. Beton `yer` değerini **yeniden ölçüp** Claude'un yaklaşık örneğiyle kıyasla; sabit sayıları kaynak yerine geçirme. Sözleşme'nin 2. sayfadaki alanlarını fixture'dan doğrula.
4. Gerekli ise geometri şablonlarının **iki farklı form metniyle üretilmiş PDF'de değişip değişmediğini** de kontrol et. Değişiyorsa tek oturum cache'i sabitmiş gibi tasarlama; revizyonlu invalidation kuralını ASAMA_03 öncesinde belirle.

**Test:** `npx tsx --test tests/belgeler/field-focus.test.ts`; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; değişen dosyalarda `npx eslint ...`. **Kabul:** gerçek şablonlarda tam alan sözleşmesi, doğrulanmış sayfa numaraları ve ≤1 geometrik hata yok; yalnız saf test dosyaları değişti. **Hata:** annotation şeması farklıysa mevcut harita kontratını tanı, sahte fixture/manuel koordinatla testi geçirme. **Dur:** kanıt + kısa rapor.

### ASAMA_02 — Form odak takibi ve state makinesi

**Giriş:** ASAMA_01. **Kapsam:** yeni `src/hooks/use-belge-field-focus.ts` ve saf tracker yardımcı/testleri. UI bağlantısı henüz yok.

1. `useBelgeFieldFocus({documentId, prefix, studioRootRef})` (imza adapte edilebilir) üret: `{fieldKey, lastFocusedFieldKey, focusEventId, containerProps, clearSelection}`. `containerProps` formun **tek scroll kabına** `onFocusCapture/onBlurCapture` olarak uygulanır; 56 alanı tek tek elle değiştirme.
2. Sadece valid yeni focus id'sinde `focusEventId` artır. Aynı alana her harf yazılması nonce'ı artırmaz. A→B Tab geçişinde `null` ara durumuna gerek olmasın: 120 ms blur gizleme penceresi, sonraki focus gelirse timer iptal. Bir alanın kendi `onBlur` (touched/validasyon) işleyicisi bozulmaz.
3. Fokus formdan preview toolbar/canvas gezinme kontrolüne geçtiyse **son seçimi bağlam olarak tut**; böylece zoom/fit sonrası halka görülebilir. Ancak alakasız butona (özellikle sol form reset) veya stüdyo dışına focus/pointer geçince gizle. `Esc`, `Sıfırla`, `Temizle` ve belge değişimi `clearSelection`. `relatedTarget === null` ve pointer ile dışarı çıkma senaryosu ayrıca test edilir. `lastFocusedFieldKey` mobil için ayrıdır; `clearSelection` sonrası mobilde eski kirli seçim geri dönmesin.
4. Hook SSR/hydration, unmount ve hızlı focus geçişlerinde timer cleanup yapar; seçim yalnız aktif stüdyoya ait, global window state'i değildir. Event handler referansları mümkün olduğunca kararlı.
5. Preview/inline editing hâlini hook'a doğrudan bağımlı kılma; parent `fieldFocus` prop ve önizleme bileşeni gerekli mod izolasyonunu sağlayacak.

**Test:** `field-focus.test.ts` mock clock ve sentetik hedeflerle A→B, 120 ms geçiş, blur dışarı, toolbar'a geçiş, Esc, reset/clear, unmount; typecheck/lint. **Kabul:** odak veriyle karışmıyor; bir yazma serisi yalnız tek seçim olayı; eski timer yeni odağı silemiyor. **Hata:** toolbar ayrımını gerçek DOM'da kanıtlayamazsa basit **odak-only** davranışa dön ve eksik UX'i ayrı not et; ilgisiz global focus yönetimi ekleme. **Dur.**

### ASAMA_03 — PDF overlay ve Beton Döküm pilotu

**Giriş:** ASAMA_02. **Kapsam:** yeni `belge-studio-field-focus-layer.tsx`, `belge-studio-pdf-preview.tsx` dar patch, `beton-dokum-studio.tsx` bağlantısı, kapsamlı olmayan `globals.css` stili.

1. `BelgeStudioFieldFocusLayer` sadece `FieldFocusRect` / label (gerekirse) alır. İçerik `.belge-preview-frame` üzerinde **yüzde konumlandırılmış** (`left/top/width/height`) pasif div. `pointer-events:none`, `aria-hidden=true`, `data-testid='belge-field-focus-highlight'`, `data-field-key`, `data-page`. `z-index` inline-edit hotspot/sheet'in altında. PDF DOM'da ayrı bir buton/odak alanı oluşturma.
2. Stil: ince mavi (`#2563eb`) 2 px border + hafif saydam dolgu; bir kez kısa giriş/pulse; `prefers-reduced-motion` → animasyon yok, `forced-colors` → `Highlight` kontur ve şeffaf dolgu, `@media print` → gizli. Komşu ince satırda inflate payı otomatik 0–2 px sınırında, tasarım ölçülerek nihai belirlenir. Tooltip/etiket komşu satırı kapatırsa **halka-only** mod; kullanıcı zaten solda odaklanan etiketin adını görüyor. **Yeni aria-live konuşması ekleme:** mevcut form input label'ları ekran okuyucuda yeterli, çift tekrardan kaçın.
3. Önizlemede **session-scoped metadata cache**: ilk hazır PDF.js doc'tan (veya kontrol edilmiş template kaynağından) `extractFieldFocusRects` ile sayfa haritası çıkar; **tek eşzamanlı çıkarım** (single-flight) ve en fazla sınırlı retry. Sonraki form revisions'da değişmeyen geometriyi yeniden tarama. `documentId` ile karıştırma; unmount'ta temizle. Yükleme, PDF revision, sayfa geçişi ve async çıkarım için `generationToken` / mounted kontrolüyle stale sonucu ignore et. Failed extraction preview veya download akışını bozmamalı.
4. `displayedPage` yalnız **gerçek `visibleContext.drawImage(...)` başarılı olduğunda** yenilensin. Overlay gösterimi sadece geometri belgesi, görünür canvas sayfası ve **güncel gösterim** uyuşuyorsa olsun; yeni sayfa beklenirken yanlış önceki sayfa üzerinde halka yok. Stale çizim dönerse `requestId` / pageRef geçerliliğini kullan. Aynı geometrili mevcut canvas PDF güncellemesi sürerken kalabiliyorsa çerçeve titreşmeden korunabilir; belirsizse gizle.
5. **Önemli:** `fieldFocus` prop değişimini `renderPage`/PDF loading/zoom effect dependency listesine koyma. Seçim state değişebilir ama yalnız overlay re-render olur. Aktif odak `snapshot`/PDF bytes üretimini tetiklemez.
6. Beton stüdyosunda tek form scroll kabına `containerProps`, önizlemeye `fieldFocus` bağla; mevcut `onBlur`/touched aynen kalsın. `getFieldId` ile id map güvenli olsun; yeni state'i `formData` objesine yerleştirme.

**Test:** hedef değişen dosyalarda lint; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; `npm run check:belgeler-pdf`; **gerçek dev sunucusunda** Beton `Şantiye Yeri` → PDF `Yer` hücresi, `Tarih` → kendi satırı, boş form, focus değişimi. **Kabul:** inline-edit varsayılan OFF ve DOM'da yok; vurgu tek, pasif ve doğru; yazı formdan çıkmadan sürüyor. **Hata:** yüzde/frame hizası tutmazsa raster pikselle el yordamı düzeltme değil, CSS frame–canvas farkını ölç; yanlış halka yerine gizle. **Dur.**

### ASAMA_04 — Pilotun gerçek zoom / performans / yarış testi

**Giriş:** ASAMA_03. **Kapsam:** öncelikle yeni `tests/site-audit/belgeler-field-focus.spec.ts`; yalnız ölçümlerin gerektirdiği dar ürün düzeltmeleri.

1. Playwright masaüstü `chromium-desktop-1366` ve `chromium-desktop-1920` projelerinde Beton'un **10 alanını** dolaş. Her gerçek `#beton-dokum-<key>` için PDF'den çıkarılan normalize rect ve `.belge-preview-frame` DOM kutusuna göre **overlay koordinatı ±2 CSS px** doğrula. `inflate` ve CSS border hesaba katılsın; tek `data-field-key` ve doğru sayfa şart.
2. `%100`, `%50`, `%150`, `%200`, `Sığdır`, `Ctrl/Cmd+wheel` ve imkan varsa dokunmatik pinch. Canvas CSS `transform` ile frame geçici ölçüsünü karşılaştır; birlikte hareket etmiyorlarsa gesture anında görünür vurgu gizlenir, render settled sonrası geri döner; **yanlış kaymış halka sıfır**. Toolbar'a odak geçerken tutulan bağlamsal seçim aynı alanı işaretliyor mu test et.
3. Uzun `yer` adresini ve olay metnini yazarken (PDF yeni revision alıyor) doğru vurgunun yalnız doğru sayfada kaldığını ölç. İlk geometri extraction henüz bitmemişken hızlı yazma → tamamlandığında doğru hedef, stale sayfa/rect yok. Hatalı PDF load/render, retry ve unmount sırasında state update hatası yok.
4. Yalnız **odağı değiştirirken** `URL.createObjectURL` ve canvas `drawImage` çağrılarının sayısı artmamalı. PDF metni yazılırken yeni PDF çizimleri zaten beklenir; o senaryoda sıfır çizim bekleme. Ek olarak `getAnnotations` çağrısı **her tuşta artmamalı**. `addInitScript` sayaçları ve test hookları yalnız gerek duyulan kapsamda, üretim kodunda kalıcı instrumentation yok.
5. `Tab` A→B titremesiz; `Shift+Tab`, `Escape`, form dışı click, sol reset butonu ve görünüm toolbar'ı; `prefers-reduced-motion`, varsayılan inline-edit kapalı; testte gerçek DOM seçicileri, timeout ve cleanup.

**Komut:** `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366 --project=chromium-desktop-1920` ve etkilenen mevcut `belgeler-inline-edit.spec.ts`. **Kabul:** 10/10 gerçek geometri, zoom/odak/perf/race senaryoları PASS, mevcut edit regresyonu temiz. **Hata:** geçici zoom mismatch varsa o anda overlay gizleyerek güvenli çözüm; render pipeline refactor'u yok. **Dur.**

### ASAMA_05 — Çok sayfa Sözleşme + kalan stüdyolar / 56 alan

**Giriş:** ASAMA_04. **Kapsam:** `sozlesme-studio.tsx`, `insaat-ruhsati-studio.tsx`, `istifa-studio.tsx`, `taahhutname-studio.tsx` bağlantısı; preview'de kontrollü sayfa/reveal; ilgili e2e genişletmesi.

1. **Önce Sözleşme:** `sozlesme_tarihi`, `santiye_sefi_imza_adi`, `muteahhit_imza_unvan` için gerçek sayfa **2** mi fixture ile doğrula. Yeni form focus olayı gelince hedef sayfa farklıysa **mevcut `handlePageChange` yolunu** çağır; kirli taslak/izin kontrolünü bypass etme. Alan mevcut sayfadaysa gereksiz page render tetikleme. Sayfa çizimi tamamlanana kadar önceki canvas'a yanlış halka ekleme.
2. Hedef kısmen/tamamen görünmezse `getInlineFieldRevealDelta` ile **en küçük dx/dy** scroll, yalnız yeni `focusEventId` başına bir kez. Eğer yeni sayfa canvas'ı henüz hazır değilse yeni render tamamlanınca **bekleyen tek reveal** yap. Auto-scroll sırasında form focus/caret ve zoom değişmez. Alan zaten görünürse `scrollTop/scrollLeft` değişmez. Kullanıcı manuel pan yaptıysa aynı seçimde sonraki revision pan'i geri almaz.
3. Diğer 4 stüdyoyu Beton'daki aynı ortak hook ile bağla; ayrı belgeye özgü koordinat kodu yazma. Her stüdyonun form ID önekini kaynakta doğrula. Görünürlük, isModal ve mevcut responsive koşulları korunur.
4. 5 belge × 56 alan için kalıcı e2e döngüsü: gerçek form input'larını `DOCUMENT_EDITABLE_FIELDS` allowlist'i ile odakla, ilgili PDF sayfasını ve highlight geometry'yi doğrula. Sözleşme 1→2→1 sayfa geçişi, İstifa PDF-only alanların hiçbir zaman vurgulanmaması, Taahhütname yoğun satırlar ayrı test.
5. Özellikle **aynı veri anahtarına bağlı diğer imza alanı** otomatik birlikte vurgulanmamalı; yalnız kullanıcı hangi input'u seçtiyse onun widget'ı. Güncelleme/undo değer kontratı değişmez.

**Test:** Yeni e2e her beş belge için `chromium-desktop-1366` + 1920 temsilî hiza; yoğun 56/56 döngüsü en az bir desktop viewport. `npm run check:belgeler-pdf`, typecheck ve değiştirilmiş dosyalarda lint. **Kabul:** 56/56, sayfa/reveal tek sefer, wrong-page flash sıfır; mevcut Sözleşme PDF dosyası/çok sayfa düzeni sağlam. **Hata:** bir alanın anahtarı eşleşmiyorsa source/fixture sapmasını bul, yanlış rect ile geçici maskeleme yapma; kabul kapısını düşürme. **Dur.**

### ASAMA_06 — Mobil, inline düzenleme ve görsel yoğunluk

**Giriş:** ASAMA_05. **Kapsam:** ortak preview'nin mobil görünürlük akışı, hook selection durumu ve gerekirse overlay CSS; mevcut PDF editing logic yalnız gerektiğinde dar entegrasyonla.

1. Mobil `form` görünümünde son odaklanan alanı tut. Kullanıcı kendi kontrolüyle `preview` görünümüne geçtiğinde **ilk geçerli canvas/render** için 2,5 s'lik görsel vurgu başlat; doğru sayfa ve görünür bölgeye gerekiyorsa tek reveal uygula. PDF zaten görünür değilken zamanlayıcıyı tüketme. Preview başlangıçta doğrudan açıldıysa önce formda seçim yapılmadığından gösterme.
2. Mobil sekme geçişinde klavye zorla kapanmaz; kullanıcı `form` alanında yazarken otomatik `preview` açılmaz. Yeni form alanı seçilirse önceki bekleyen mobile flash iptal olur. `320×720`, `360×800`, `390×844`, `430×932`, `768×1024` görünüm kontrolü (projede tanımlı olmayan viewport'lar mevcut Playwright projesinde geçici context ile, yeni proje kurulumu zorunlu değil).
3. Inline edit toggle açıkken form rehberi gizli. Aynı ekranda amber hotspot + mavi form halkası yarışması yok; düzenleme popover'ı ve mobil sheet, dirty draft uyarısı, `Uygula/Vazgeç`, sayfa gezinme, restoreFocus sağlam. Toggle OFF olunca eski form seçimi otomatik açılmaz; **yeni form odağı gerek**.
4. Taahhütname/Sözleşme'nin ince satırlarında border/inflate/etiketin komşu metne etkisini 1366 ve 1920 masaüstü, %100/%200 zoom'da ekran görüntüsüyle incele. Gerekirse **yüksekliği sabit etkilemeyen kontur** ve etiketsiz sürüm kullan; komşu satırı kapatan 7 px pulse yasak. Light/dark ve `forced-colors` görünümü aynı göreve dahil.
5. `prefers-reduced-motion`, `aria-hidden`, tab sırası, WCAG'nin non-text kontrastı ve ekran okuyucu tekrarını gözden geçir. Hover/tıklama gerektirmeyen overlay, yeni klavye tab durağı oluşturmaz.

**Test:** Yeni mobil e2e + `npm run check:belgeler-inline-mobile`, `tests/site-audit/belgeler-inline-edit-mobile.spec.ts`, relevant form-view/mobile-studio e2e. **Kabul:** mobil geçişte doğru 2,5 s vurgu; caret/klavye ve edit sheet bozulmadı; yoğun satır taşması yok. **Hata:** eksik telefona ait fiziksel cihaz kanıtını `BEKLIYOR` yaz, emülasyonu fiziksel telefon PASS diye sunma; otomatik sekme değiştiren çözümü reddet. **Dur.**

### ASAMA_07 — Yerel release adayı ve nihai regresyon

**Giriş:** ASAMA_06, zorunlu senaryolar PASS. **Kapsam:** kalite kapısı, test/doküman ve gerekirse çok dar düzeltmeler; **GitHub push/deploy yok**.

1. `npx tsc -p tsconfig.next.json --noEmit --incremental false`; değişen TS/TSX/test dosyalarında `npx eslint <somut dosyalar>`; `npm run check:belgeler-pdf`; `npm run build`. Gerektiğinde genel `npx tsc --noEmit --incremental false` ve diğer repo gates için mevcut baseline ile fark analizi yap; sadece exit code değil logu değerlendir.
2. **Doğru build'i test et:** `$env:PLAYWRIGHT_PRODUCTION_SERVER='1'` ile final `playwright.site.config.ts`: yeni `belgeler-field-focus.spec.ts`, var olan `belgeler-inline-edit.spec.ts`, `belgeler-inline-edit-mobile.spec.ts`, `belgeler-form-view.spec.ts`, `belgeler-mobile-studio.spec.ts`, `belgeler-stage05-native-zoom.spec.ts`, etkilenen PDF-quality/functional audit. Ortama uygun projeler/timeoutlar seç, gereksiz tüm site testlerini ezbere koşturma; `check:site-a11y`yi yeni ihlal kontrolünde kullan.
3. Karar matrisini gerçek kanıtla doldur: **56/56**, Sözleşme 2. sayfa, CSS hiza **≤2 px**, `%50–%400` destekli zoom aralığı ve test edilen kritik oranlar, klavye/toolbar/pinch, uzun metin/PDF revision, boş veri, hızlı focus geçişi, reset/clear/undo, inline edit ON/OFF, mobil 2,5 s, animation reduced, light/dark/forced-colors, gecikmiş async, missing annotation ve kontrollü recovery.
4. **İndirilen/yazdırılan PDF kontrolü:** aynı form girdisiyle eski üretim davranışını koru; DOM konturuna ait çizim PDF bytes/appearance stream'e yazılmamış. PDF kontrat/visual testleri buna yardım eder; gerçek print dialog fiziksel yazıcıyla çalıştırılmadıysa `BEKLIYOR` belirt, HTML ekran görüntüsünü PDF bayt kanıtı sanma.
5. Yeni React/hydration warning, console error, pageerror, başarısız önemli request, focus handler leak, yinelenen annotation okuması, PDF tekrar derlemesi, yüksek-DPI CSS/raster farkı, eski/boş highlight kalıntısı yok. Sistem testlerinde doğru commit/worktree sürümü kaydedilir.
6. `docs/BELGELER_SISTEMI.md` yaşayan dokümanına kısa **form odağı ↔ PDF alanı** bölümü ekle: mimari, 56 alan source'u, yeni şablon ekleme kontratı, cache invalidation ve test komutu. Plan durum kaydını/kanıtlarını tamamla. `git diff --check`, `git status` ve sadece kapsamdaki dosyaları listele; geçici screenshot/artifact/.env değişikliklerini otomatik commit'e sokma.

**Kabul:** zorunlu yeni testler + korunan mevcut akışlar yeşil; `npm run build` başarılı; açık kritik regresyon yok; kanıtlar ve doküman hazır. Eski unrelated baseline fail varsa durumunu **açıkça** ayır ama release güvenliğini etkileyen fail'i görmezden gelme. **Hata:** gerçek etki alanındaki fail'i aynı aşamada düzelt/test et; kullanıcı verisini stash/reset ile bozma; başarısız test için assertion silme. **Dur:** `ASAMA_08` beklenir.

### ASAMA_08 — Tek kontrollü Production yayını + canlı kontrol

**Giriş:** ASAMA_07 gerçekten PASS ve güncel yerel branch/izinler doğrulanmış. Bu plan **yerel IDE ajanı** için yazılmıştır; GitHub API üzerinden doğrudan yazım yapılıyorsa `AGENTS.md` remote branch ve skip-deploy kuralını ayrı uygula, `main`'e parça parça yazma.

1. Tekrar `git status`, `git diff`, `git rev-parse HEAD` ve remote tracking head kontrol et; başka görevlerin değişikliklerini ne sil ne kendiliğinden commit et. Gereken kapsamdaki dosyaları açık `git add <paths>` ile stage et. `git diff --cached --check`, dosya listesi ve hassas bilgi/fixture/rapor kontrolü yap.
2. Başarıyla test edilen worktree ile staged içerik aynıysa **tek anlamlı atomik commit**: `feat(belgeler): form alanını PDF üzerinde odakla`. `main` dalına **bir** push (force yok); Vercel otomatik Production deploy tetiklemeli. Gerekli credentials/permission yoksa `ENGELLI`, yetki varmış gibi gösterme.
3. Push sonrası **o commit için** Vercel Production deployment `READY`, site alias doğru mu doğrula. Windows PowerShell'de çıplak `curl` yok; repo `AGENTS.md` / test otomasyon standartlarına uy. Gereksiz tekrar deploy başlatma.
4. Canlı sitede gerçek tarayıcıyla **Şantiye Yeri → PDF Yer**, `Tarih → Tarih`, Sözleşme 2. sayfa, mobil form→preview ve PDF zoom için kısa fakat somut smoke test yap. Canlı deploy `READY` olmak tek başına UX testi değildir. Demo kişisel veri kullanma; indirme/print/inline edit'in bariz regresyonunu da kontrol et.
5. Canlı önemli sorun varsa **otomatik sonsuz hotfix döngüsü yok**: kanıtla, sürümü `ENGELLI`/release sorunu olarak kaydet; yalnız gerekiyorsa kontrollü ve yeniden test edilmiş hotfix/rollback için mevcut repo politikasını uygula. Başarı uydurma. Gerçekten problemsizse `execution_status:TAMAMLANDI`, `active_stage:null`, `next_stage:null`, sürüm/deploy URL ve smoke kanıtı yaz; sona er.

**Kabul:** doğru commit Vercel'de Production `READY`; canlı kullanıcı senaryoları PASS; zorunlu ilk aşamaların testleri geçerli; yeni gereksiz push yok. **Dur:** “Plan tamamlandı.”

## 5. Nihai kabul özeti

- [ ] Beton Döküm'de `Şantiye Yeri` odak → PDF'nin `Yer` değer kutusunda doğru mavi kontur; `Tarih`/`YİBF` başka doğru kutuda.
- [ ] Beş şablondaki **56/56 gerçek alan** birebir eşlenmiş; PDF-only alanlar ve yanlış sayfa asla yanlış vurgulanmıyor.
- [ ] Hiçbir focus değişimi PDF bytes üretmiyor / yeniden render tetiklemiyor; yazarken canlı üretim doğal akışında sürüyor ve highlight kaymıyor.
- [ ] Zoom, fit, pinch, pan, resize, çok sayfa, toolbar, Tab/Shift+Tab/Esc, reset/clear/undo regresyonsuz.
- [ ] Mobil kendi isteğiyle önizleme geçişinde **2,5 sn** doğru alan; klavye/dirty edit sheet bozulmuyor.
- [ ] PDF üzerinde edit ON/OFF normal; hotspot pointer olayları bloke edilmiyor.
- [ ] Vurgu DOM-only; indirilen PDF, şablon ve yazdırma çıktısına eklenmiyor.
- [ ] Erişilebilirlik, reduced-motion, forced-colors, yoğun satır okunurluğu doğrulandı.
- [ ] Yerel test/build ve final Vercel Production + canlı smoke kanıtları kayıtlı; yalnız **bir kontrollü release**.

## 6. Kaynaklar ve uygulayıcıya ilk mesaj

**Kod:**
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-studio-pdf-preview.tsx
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/belge-studio-inline-field-map.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/document-field-contracts.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/hooks/use-belge-studio-document.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/PROJECT.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/playwright.site.config.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/tests/belgeler/inline-edit-field-map.test.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/tests/site-audit/belgeler-inline-edit.spec.ts

**Süreç/protokol:** https://drive.google.com/file/d/1NTyZ9w46wfozM-HH7HQ6rHzE-7HTqhDy/view?usp=drivesdk
**Hedef model resmî bilgi:** https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ve https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8

**Bu plan ile birleştirilen iki girdi:**
- `BELGELER_FORM_PDF_ALAN_VURGULAMA_PLANI.md` (ilk ChatGPT taslağı): kapsam, kullanıcı davranışı, mobil, kapsamlı üretim/test/publish.
- `BELGELER_ALAN_ODAK_VURGUSU_PLANI.md` (Claude taslağı): normalize geometri, delegasyon, çok sayfa ve ince alan ölçümleri, performans/Playwright testleri.

### Gemini'ye yapıştırılacak ilk mesaj

> Windows'taki `muhendis-mimar-portali` projemde bu **`BELGELER_FORM_PDF_ODAK_VURGUSU_NIHAI_PLAN.md`** dosyasını uygula. Modelim **Gemini 3.8 Flash**; mümkünse `high` thinking kullan. Önce `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ilgili `.agents/rules` ve planın mevcut durum kaydını oku; yerel git/worktree farklarını doğrula. Bu planı repo içinde başka planların üzerine yazmadan kendine ait klasöre kaydet. **Şimdi yalnız ASAMA_00'ı uygula;** kontrollerini yap, kısa kanıt ve durum kaydı oluştur, sonra **dur**. Sonraki her `devam` en fazla bir aşamayı ilerletsin. Başarısız aşamada geçme; `TAMAMLANDI` sonrası salt `devam` için hiçbir işlem yapma. Kod yazarken önce gerçek kaynak ve seçicileri kontrol et. Son aşamadan önce push/deploy yapma; son aşamada tek kontrollü Production yayınını ve canlı smoke testini gerçekleştir.

---

**Planlayıcı notu:** Bu bir **plan dokümanıdır**; bu sohbet içinde sitenin üretim kodu değiştirilmedi, test çalıştırılmadı, GitHub'a yazılmadı ve Vercel deploy yapılmadı. Claude'un PDF geometri ölçümleri ayrıca doğrulanmaya muhtaçtır; bu gerçek uygulama aşamasına açık kabul testi olarak konmuştur.
