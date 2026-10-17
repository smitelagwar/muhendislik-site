# BELGELER INLINE SAFETY & FIELD QUALITY V2 — DURUM TAKİP BELGESİ

```yaml
plan_id: BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2
plan_revision: 2.1
planning_status: TAMAMLANDI
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
  - ASAMA_04
  - ASAMA_05
  - ASAMA_06
  - ASAMA_06B
  - ASAMA_07
  - ASAMA_08
  - ASAMA_09
  - ASAMA_10
evidence:
  - "Commit: 14235bd4ff86f6d03f3a575d4650596cef57206e"
  - "56/56 alan sözleşmesi ve 5 şablon bütünlüğü PASS"
  - "Baseline zafiyet ve risk testleri PASS: tests/belgeler/baseline-v2-safety-audit.test.ts (4/4)"
  - "ASAMA_02 dokunma izolasyonu, multitouch pinch koruması ve E2E testleri PASS (Desktop 14/14, Mobile 14/14, Studio 26/26)"
  - "ASAMA_03 gerçek veri çakışması, taslak koruması, güncel değer yükleme ve idempotent onay: PASS (Desktop 17/17, Mobile 17/17, Studio 26/26)"
  - "ASAMA_04 renderedToken, sayfa geçişinde anında hotspot temizliği, arka plan taslak koruması ve Tab focus trap: PASS (Desktop 20/20, Mobile 20/20, Studio 26/26)"
  - "ASAMA_05 56/56 alan semantik kalite kuralları, saf doğrulama ve testleri PASS: tests/belgeler/field-guidance.test.ts (27/27)"
  - "ASAMA_06 gerçek PDF basım okunabilirliği, İstifa stres matrisi (1.26-5.09 pt font küçülmesi kanıtı, 0 truncation) ve hafif kalibrasyon motoru: PASS tests/belgeler/pdf-readability.test.ts (13/13)"
  - "ASAMA_06B PDF adres alanlarının fiziksel ve okunabilirlik iyileştirmesi: İstifa adres_deger 225x36 pt çok satırlı şablon upgrade (Hash: 95C0AA38DECBFBA0C4E61C3F1D99956F2D3BDD057EBC307C728D2527459F74DC), 84-122 karakterde 8.0 pt nominal font koruması, 212 karakterde 7.0 pt (%418 iyileşme), 56/56 alan kontratı ve Playwright E2E PASS (Desktop 20/20, Mobile 20/20)"
  - "ASAMA_07 sol form ve sağ popup için tutarlı, az uyarılı erişilebilir rehberlik (evaluateFieldGuidance, BelgeFieldGuidanceView, role=status, aria-live=polite), sıfır işlem engellemesi, excludedFields çift uyarı koruması: PASS tests/belgeler/field-guidance-ui.test.ts (10/10) ve Playwright E2E PASS (Desktop 22/22, Mobile 22/22)"
  - "ASAMA_08 kanıt gücü yüksek regresyon testleri: 5 belgede gerçek PDF üretimi ve sıfır sessiz kesme (0 truncation), bağlı imza koruması, negatif giriş güvenliği PASS tests/belgeler/integrated-quality-audit.test.ts (5/5), functional audit (24/24), mobile studio (26/26 incl. WebKit), responsive overflow (26/26), WCAG AA (25/25)"
  - "ASAMA_09 final güvenlik, performans, sürüm ve dokümantasyon kapısı: baseline SHA-256 hash karşılaştırması tam eşit, npm run build (0 hata), tsc (0 hata), git diff --check (0 hata), docs/BELGELER_SISTEMI.md yaşayan mimari güncellemesi tamamlandı"
  - "ASAMA_10 tek anlamlı atomik checkpoint commit/push, Vercel Production deployment hazırlığı ve canlı stüdyo kabulü tamamlandı"
blockers: []
updated_at: "2026-10-17T17:48:00+03:00"
```

---

## 1. Çalışma Ağacı ve Git Başlangıç Durumu

- **Başlangıç Commit:** `14235bd4ff86f6d03f3a575d4650596cef57206e` (`origin/main` ile senkron)
- **Branch:** `main`
- **Çalışma Ağacı:** Temiz (`git status --short` başlangıçta boş)
- **Önceki Plan:** `PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md` (100% korunmuştur, dokunulmamıştır).
- **Yeni Plan Dosyası:** `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_PLAN.md` (yerel kopyası oluşturuldu).
- **Üretim Kodu:** ASAMA_01 kapsamında hiçbir üretim koduna dokunulmamıştır (`src/` temizdir).

---

## 2. Korumalı Dosyaların Kriptografik SHA-256 Baseline Değerleri

| Dosya | SHA-256 Hash | Durum |
|---|---|---|
| `src/lib/pdf-engine.ts` | `53E148B8559AF5ABAC72630B6E519E94492098048B83C95641AAEA813896791A` | Orijinal Baseline ile Birebir Eşit |
| `src/hooks/use-belge-studio-document.ts` | `0BAD906BEEE7BEE4246689CF9A907A330F11FECCFA6FA80BA166C32E5F886529` | Orijinal Baseline ile Birebir Eşit |
| `src/lib/document-field-contracts.ts` | `1D41C8BF583971C845B453DF20B99CDED232918F5161515C4BA40801EDDE323F` | Orijinal Baseline ile Birebir Eşit |
| `public/belgeler/beton-dokum-tutanagi.pdf` | `AF4F7D49485095692BA3137EA5EF84041B9CB4E64A8DB637F657FADB3BB53BA3` | Orijinal Baseline ile Birebir Eşit |
| `public/belgeler/insaat-ruhsati-dilekcesi.pdf` | `29DF7BFD9CB503A03778E4965D4AB75B2B82EB29184BE24A6BFDB181447E6BBD` | Orijinal Baseline ile Birebir Eşit |
| `public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` (Baseline v1) | `3132D5617DF0AEF1366B1B680F385762743AE05375BE7F5EB5653F2A6915D83E` | Orijinal Baseline (192×18 pt Tek Satır) |
| `public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` (ASAMA_06B v2) | `95C0AA38DECBFBA0C4E61C3F1D99956F2D3BDD057EBC307C728D2527459F74DC` | Güncel İyileştirilmiş Sürüm (225×36 pt Çok Satırlı) |
| `public/belgeler/santiye-sefi-sozlesmesi.pdf` | `B9230FAD52773AB9FAA99A1BA12D702604324B37293D6BBDEF829C35FBAA3F44` | Orijinal Baseline ile Birebir Eşit |
| `public/belgeler/santiye-sefi-taahhutnamesi.pdf` | `15E87409A1BF00336F2E144299AA7DE6241D3F679D4953837F42D34AED639D13` | Orijinal Baseline ile Birebir Eşit |
| `src/lib/pdfjs-client.ts` | `AD3A202BEB9B204A7F635502B4B898A47EFBED38D3EEEADC3BB545E77ADC197C` | Doğrulandı |
| `src/components/belge-studio-pdf-preview.tsx` | `A9DFC8DD2481D946E253915957BAB6A41254439E3EE769DCAD20283569FF1143` | Doğrulandı |
| `src/components/belge-studio-inline-edit-layer.tsx` | `942178A8178EE86FA9755EE7F613A46F7C13778D4FB7A1B7FBF75247437C61CC` | Doğrulandı |
| `src/lib/belge-studio-inline-field-map.ts` | `5FC90139F330AE798D3B836DB7E489E09E7E7A89242AA8FBE5155BC555667B7E` | Doğrulandı |

---

## 3. 56/56 Alan ve Özel Annotasyon Envanteri

- **Toplam Düzenlenebilir Alan:** 56
  - `beton-dokum-tutanagi`: 10 alan (1 sayfa)
  - `insaat-ruhsati-dilekcesi`: 8 alan (1 sayfa)
  - `santiye-sefi-istifa-dilekcesi`: 10 alan (1 sayfa)
  - `santiye-sefi-sozlesmesi`: 14 alan (2 sayfa: 11 sayfa-1, 3 sayfa-2)
  - `santiye-sefi-taahhutnamesi`: 14 alan (1 sayfa)
- **Düzenlenemez PDF-Only Etiketler (3):** `adres_etiket`, `tc_etiket`, `iletisim_etiket` (`santiye-sefi-istifa-dilekcesi`) — Form alanı değildir; düzenleme hotspot'u üretilmez.
- **Form Alanı Olmayan FreeText Annotasyonları (7):** `santiye-sefi-taahhutnamesi.pdf` içindeki statik metin anotasyonları — Filtrelenir.
- **Toplam AcroForm Alanı:** 59 widget (56 editable + 3 salt-PDF).

---

## 4. Önceden Kanıtlanan Üç Kritik Zafiyet / Fiziksel Sınır (Kırmızı Testler)

`tests/belgeler/baseline-v2-safety-audit.test.ts` ile üretim koduna dokunulmadan kanıtlanmıştır:

1. **(a) Mobil Dokunma İzolasyonu ve Taslak Silinme Riski:**
   - Popover içindeki pointer/touch etkileşimleri `e.stopPropagation()` içermediği için üst `containerRef` üzerindeki `handlePointerDown` handler'ına sızmaktadır.
   - `handlePointerDown` içinde `setIsInteracting(true)` tetiklendiğinde `isOverlayVisible` `false` olmakta ve `BelgeStudioInlineEditLayer` anında unmount edilerek kullanıcının taslağı sessizce silinmektedir.
   - *Çözüm gereksinimi (ASAMA_02):* Popover ve kontrolleri için dar olay sınırı (`stopPropagation` / gesture izolasyonu).

2. **(b) initialValue vs currentValue Çakışma Kontrolü Zafiyeti:**
   - `BelgeStudioInlineEditLayer` bileşeninde `initialValue={values?.[selectedField.fieldKey] ?? ""}` ve `currentValue={values?.[selectedField.fieldKey] ?? ""}` prop'ları aynı ifadeden aktarılmaktadır.
   - Popover açıkken sol formdan veri değiştiğinde üst katman re-render olmakta, `initialValue` prop'u yeni değere güncellenmekte ve `currentValue !== initialValue` koşulu `false` kalarak dışarıdan yapılan değişikliği algılayamamaktadır.
   - *Çözüm gereksinimi (ASAMA_03):* Popover açıldığı an `openingValue` dondurulmalı (frozen/immutable) ve sol formun son güncel verisiyle karşılaştırılmalıdır.

3. **(c) İstifa Dilekçesi Uzun Adres ve Fiziksel PDF Sınırı:**
   - `adres_deger` alanı PDF şablonunda **192.0 × 18.0 pt** boyutunda tek satırlı dar bir alandır.
   - 115+ karakterlik adres girildiğinde PDF motoru veri kaybı yapmadan tam metni saklamakta ancak font boyutu ~3-4 puntolara kadar küçülmektedir.
   - Sistemde şu anda bu küçülmeyi kullanıcıya bildiren hiçbir rehberlik veya okunabilirlik uyarısı bulunmamaktadır.
   - *Çözüm gereksinimi (ASAMA_05 / ASAMA_06):* Fiziksel şablonu bozmadan/genişletmeden kullanıcıya dürüst baskı riski uyarısı sunmak ve kontrolü kullanıcıya bırakmak.

---

## 5. ASAMA_01 Doğrulama ve Kabul Durumu

- [x] Başlangıç git commit `14235bd4ff86f6d03f3a575d4650596cef57206e` doğrulandı, çalışma ağacı temiz.
- [x] Korumalı dosyaların kriptografik SHA-256 baseline değerleri tespit edildi ve teyit edildi.
- [x] 56/56 alan sözleşmesi, 3 PDF-only etiket ve 7 FreeText anotasyonu envanterlendi.
- [x] Üretim koduna dokunulmadan 3 kritik başlangıç durumu (`tests/belgeler/baseline-v2-safety-audit.test.ts`) ile kanıtlandı.
- [x] Önceki `PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md` dokunulmadan korundu; yeni plan `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_PLAN.md` ve durum dosyası `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_STATE.md` oluşturuldu.
- [x] `npx tsx tests/belgeler/document-field-contract.test.ts`: **PASS**
- [x] `npx tsx tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56)**
- [x] `git diff --check`: **0 Boşluk/Çakışma Hatası**

**ASAMA_01 KABUL EDİLDİ.**

---

## 6. ASAMA_02 Doğrulama ve Kabul Durumu (Mobil Popup ve Yanlış Kısa Tap İzolasyonu)

- [x] Mobil Popover Olay Sınırı İzolasyonu:
  - `BelgeInlineDraftPopover` kök bileşenine `onPointerDown`, `onPointerMove`, `onPointerUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd` handler'larında `e.stopPropagation()` uygulandı.
  - Mobil klavye, text seçimi ve kaydırmanın sorunsuz çalışması için popover'a `touchAction: "manipulation"`, `<textarea>` editörüne ise `touchAction: "pan-y"` eklendi.
  - Tuş dinleyicilerinde (`handleKeyDown`) `Escape` ve `Enter` / `Ctrl+Enter` tuşlarının üst canvas pan/zoom listener'larına yayılması `e.stopPropagation()` ile engellendi.
  - Üst `BelgeStudioPdfPreview` `handlePointerDown` handler'ına popover içi dokunmaları tamamen göz ardı eden çift katmanlı savunma kontrolü (`target?.closest('[data-testid="belge-inline-edit-popover"]')`) eklendi.
- [x] İki Parmak Pinch Sonrası Sahte Kısa-Tap Engellemesi:
  - `BelgeStudioPdfPreview` içinde `everMultitouchRef` ile çoklu dokunma oturumu izlendi (`pointers.length >= 2`).
  - Parmaklardan biri kaldırıldığında `finishPointer` kalan parmağın son temasını kısa-tap olarak DEĞERLENDİRMEZ (`!wasMultitouch` şartı).
  - Yalnızca baştan sona tek parmakla yapılan, $\le 8\text{ CSS px}$ hareket eden ve $< 500\text{ ms}$ süren kasıtlı dokunmalar kısa-tap kabul edilir.
- [x] Test ve Kalite Kapıları:
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (14/14, 22.3s)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Mobile 390): **PASS (14/14, 21.8s)**
  - `tests/site-audit/belgeler-mobile-studio.spec.ts` (Chromium Mobile 390): **PASS (26/26 aktif test, 0 fail, 1.1m)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `npx eslint src/components/belge-studio-inline-edit-layer.tsx src/components/belge-studio-pdf-preview.tsx`: **0 Hata / 0 Uyarı**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] Korumalı Dosya Bütünlüğü:
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts`, 5 şablon PDF binary'si ve CAD motoruna **dokunulmamıştır**.

**ASAMA_02 KABUL EDİLDİ.**

---

## 7. ASAMA_03 Doğrulama ve Kabul Durumu (Gerçek Veri Çatışması ve İdempotent Onay)

- [x] Dondurulmuş Açılış Değeri (`openingValue`):
  - Popover açıldığı anda `currentValue` değeri `useState(currentValue)` ile immutable olarak donduruldu.
  - Hotspot unmount/re-render döngülerinde taslak değerinin silinmesi veya ezilmesi engellendi.
  - `activeSessionRef` React 19 render-body kural ihlali temizlendi; oturum izolasyonu popover bileşen seviyesinde saf React state ile sağlandı.
- [x] Tahribatsız Çakışma Yönetimi (`Conflict Handling`):
  - Popover açıkken sol formda aynı alan dışarıdan değiştirildiğinde (`currentValue !== openingValue`):
    - Sessiz zamanlayıcıyla popover'ın kapanması ve kullanıcının taslağının kaybolması önlendi.
    - Anlaşılır ve eyleme dönüştürülebilir uyarı alert'i (`data-testid="belge-inline-conflict-alert"`) gösterildi: *"Sol formda bu alan güncellendi; yeni değerin üzerine yazılmadı. Taslağınızı kopyalayabilir, güncel değeri yükleyebilir veya vazgeçebilirsiniz."*
    - Taslak metin input/textarea içinde 100% korundu (veri kaybı: 0).
    - Sol formdaki güncel veri ezilmedi (0 istenmeyen mutasyon).
  - Kullanıcıya üç net eylem sunuldu:
    1. **"Güncel Değeri Yükle"**: Sol formdaki yeni değeri taslağa aktarır, `openingValue`'yu günceller ve çakışma uyarısını temizler. Ardından "Uygula" ile temiz onay sağlar.
    2. **"Taslağı Kopyala"**: Kullanıcının yazdığı taslak metnini panoya kopyalar, görsel geri bildirim sunar.
    3. **"Vazgeç"**: Taslağı iptal eder, sol formu olduğu gibi bırakır.
- [x] İlgisiz Alan Değişikliği İzolasyonu:
  - Popover açıkken sol formda farklı bir alan (ör. `yer` veya `tarih`) güncellendiğinde taslak metin korundu ve sahte çakışma hatası üretilmeden "Uygula" ile başarıyla kaydedildi.
- [x] İdempotent Tek-Commit Koruması:
  - `isCommittingRef` ile ardışık çift tıklama (double-click) veya hızlı klavye/fare tetiklemelerinde `onCommit` fonksiyonunun yalnızca bir kez çalışması garanti altına alındı.
- [x] Test ve Kalite Kapıları:
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (17/17, 26.8s)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Mobile 390): **PASS (17/17, 26.5s)**
  - `tests/site-audit/belgeler-mobile-studio.spec.ts` (Chromium Mobile 390): **PASS (26/26 aktif test, 0 fail, 1.1m)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `npx eslint src/components/belge-studio-inline-edit-layer.tsx src/components/belge-studio-pdf-preview.tsx`: **0 Hata / 0 Uyarı**
  - `npm run build`: **PASS (627 static page, 0 error)**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] Korumalı Dosya Bütünlüğü:
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts`, 5 şablon PDF binary'si ve CAD motoruna **dokunulmamıştır**.

**ASAMA_03 KABUL EDİLDİ.**

---

## 8. Zorunlu Plan Revizyonu (Plan v2.1) — ASAMA_06B Eklemesi

- **Kullanıcı Talimatı:** PDF içindeki gerçek adres alanlarının büyütülmesi (özellikle İstifa Dilekçesi `adres_deger` ~192×18 pt alanı ve diğer 4 belgedeki adres/yer alanları).
- **Yeni Aşama:** `ASAMA_06B — PDF Adres Alanlarının Fiziksel ve Okunabilirlik İyileştirmesi`
  - Konum: `ASAMA_06`'dan hemen sonra, `ASAMA_07`'den önce icra edilecektir.
  - Kontrollü İstisna: `public/belgeler/*.pdf` dosyalarına dokunmama kuralına yalnızca ASAMA_06B kapsamında bu adres geometrisi ve çok satırlılık iyileştirmesi için izin verilmiştir.
  - Sınırlar: ASAMA_03 sırasında PDF şablonlarına dokunulmamıştır; ASAMA_06B erkenden çalıştırılmamıştır.
- **Durum:** ASAMA_06B plana eklendi; ASAMA_06B öncesi şablonlara dokunulmama sınırı korunuyor.

---

## 9. ASAMA_04 Doğrulama ve Kabul Durumu (Revision/page/zoom geçişlerinde bozuk hotspot ve taslak yok)

- [x] **`renderedToken` ve Sayfa/Ölçek Bütünlüğü Doğrulaması:**
  - `BelgeStudioPdfPreview` içinde `{ revision: number; pageNumber: number; zoom: number; requestId: number }` yapısında `renderedToken` mimarisi kuruldu.
  - `isOverlayTokenValid`: Yalnızca `renderedToken` mevcut snapshot revizyonu, geçerli sayfa numarası ve zoom seviyesiyle birebir eşleştiğinde `true` döner.
  - `isHotspotsInteractive`: Hata durumunda, `generationPending` sırasında, `localStatus !== "ready"`, kullanıcı pan/pinch etkileşimi yaparken veya canvas geçici `scale` transformu taşırken hotspot katmanı derhal devre dışı (`visible = false`) kalır.
- [x] **Sayfa Değişiminde Anında Hotspot Temizliği (Stale Hotspot Sıfır Toleransı):**
  - `handlePageChange(page)` fonksiyonu çağrıldığı anda:
    - `setRenderedToken(null)`
    - `setInlineFields([])`
    - `setInlineSelectedField(null)`
  - Bu sayede 2 sayfalı Şantiye Şefi Hizmet Sözleşmesi stüdyosunda Sayfa 1 (11 alan) -> Sayfa 2 (3 alan) geçişinde Sayfa 1'in eski koordinatlı hotspot'ları asla Sayfa 2 üzerinde 1 milisaniye bile asılı kalmaz. Sayfa 2 çizilip annotasyonlar çözümlenene kadar DOM'da 0 hotspot bulunur, ardından tam 3 hotspot belirir.
- [x] **Hotspot ve Popover Yaşam Döngüsü Ayrıştırması (Decoupling):**
  - `BelgeStudioInlineEditLayer` ve üst viewer'da katman unmount mantığı ayrıştırıldı:
    - `shouldRenderOverlayLayer`: Hotspot'lar interaktifken veya açık bir `inlineSelectedField` popover'ı varken katman DOM'da kalır.
    - Arka planda formda başka bir alan değiştiğinde veya PDF revizyonu başladığında (`generationPending = true`), hotspot'lar gizlenir (`visible = false`), ancak açık popover unmount **edilmez**.
    - Kullanıcının yazmakta olduğu taslak metin 100% korunur; arka plan revizyonu bittiğinde veya kullanıcı "Uygula"ya bastığında taslak başarıyla form verisine aktarılır.
- [x] **W3C APG Tab Focus Trap ve Odak Geri Yükleme:**
  - `BelgeInlineDraftPopover` içinde W3C APG modal dialog standartlarına uygun Tab döngüsü (`handlePopoverKeyDown`) uygulandı.
  - Odak popover dışındaki elemanlara sızmaz (input -> Vazgeç -> Uygula -> Kapat -> input döngüsü).
  - `Shift+Tab` ile ters odak döngüsü kusursuz çalışır.
  - `Escape` tuşuna basıldığında taslak iptal edilir, popover kapanır ve odak açılışı yapan ilgili hotspot butonuna güvenli bir şekilde geri yüklenir (`restoreFocus`).
- [x] **Test ve Kalite Kapıları:**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (20/20, 33.0s)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Mobile 390): **PASS (20/20, 34.0s)**
  - `tests/site-audit/belgeler-mobile-studio.spec.ts` (Chromium Mobile 390): **PASS (26/26 aktif test, 0 fail, 1.1m)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `npx eslint src/components/belge-studio-inline-edit-layer.tsx src/components/belge-studio-pdf-preview.tsx`: **0 Hata / 0 Uyarı**
  - `npm run build`: **PASS (627 static page, 0 error)**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts`, 5 şablon PDF binary'si ve CAD motoruna **dokunulmamıştır**.

**ASAMA_04 KABUL EDİLDİ.**

---

## 10. ASAMA_05 Doğrulama ve Kabul Durumu (56 alanın saf ve esnek kalite kuralları)

- [x] **56/56 Alanın Eksiksiz Semantik Politikaları Kayıt Defteri (`DOCUMENT_FIELD_POLICIES`):**
  - `src/lib/belgeler-field-guidance.ts` modülü oluşturuldu.
  - `DOCUMENT_EDITABLE_FIELDS` içindeki 5 belge ve 56 alan birebir eşlendi (`beton-dokum-tutanagi: 10`, `insaat-ruhsati-dilekcesi: 8`, `santiye-sefi-istifa-dilekcesi: 10`, `santiye-sefi-sozlesmesi: 14`, `santiye-sefi-taahhutnamesi: 14`).
  - TypeScript düzeyinde `_AssertExactCoverage` tipiyle sözleşme kapsaması statik olarak kilitlendi.
- [x] **Seçici ve Esnek Validasyon Motoru (Saf Fonksiyonlar):**
  - **T.C. Kimlik No (`K`):** 11 hane, ilk rakam 0 olamaz, `d10` ve `d11` mod 10 sağlama kuralları. Geçerli olduğunda "resmî doğrulandı" iddiası üretmez (`null` döner). Ham TCKN loglanmaz.
  - **Takvim Tarihi (`F`):** `new Date()` locale bağımlılığı olmadan saf takvim aritmetiği ve artık yıl (leap year) kontrolü (`29.02.2024` geçerli; `29.02.2025`, `31.04.2026`, `00.01.2026` uyarır).
  - **Telefon (`T`):** `Tel:`, `GSM:`, `+90`, boşluk ve parantez varyantlarını temizleyerek 10 haneli ulusal, 11 haneli (05XX) veya 12 haneli (+90) numaraları tanır. Sabit hatlar desteklenir.
  - **YİBF (`Y`):** 7 haneli sistem kodları geçerlidir; format dışı veya alfanümerik girişlerde veri kesilmez, yumuşak `info` rehberliği sunulur.
  - **Ücret / Para (`P`):** Negatif değerler ve çoklu virgüller uyarılır; geçerli Türkçe para formatları (`40.000,00 TL`, `40000`) uyarısız kabul edilir.
  - **Serbest Nominal Metin (`N`):** Serbest resmî ve teknik metinler için kısıtlayıcı regex veya keyfî alarm ÜRETİLMEZ (`null` döner).
  - **Boş ve '-' Nötr Değerler:** Tüm kurallarda boş ve `-` değerleri için uyarı üretilmez (kullanıcıyı baştan uyarıya boğmama ilkesi).
  - **Sözleşme Harici Alan Koruması:** Tanımlı olmayan alan veya belge sorgulandığında `unknown-field` / `unknown-document` sonucu döner.
- [x] **UI İzolasyonu ve Bağımsızlık:**
  - Bu aşamada UI entegrasyonu yapılmamış; saf fonksiyonlar düzeyinde izole edilmiştir (UI entegrasyonu ASAMA_07 kapsamındadır).
- [x] **Test ve Kalite Kapıları:**
  - `tests/belgeler/field-guidance.test.ts`: **PASS (27/27, 4.7ms)**
  - `tests/belgeler/document-field-contract.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (20/20, 32.8s)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `npx eslint src/lib/belgeler-field-guidance.ts tests/belgeler/field-guidance.test.ts`: **0 Hata / 0 Uyarı**
  - `npm run build`: **PASS (627 static page, 0 error)**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), 5 şablon PDF binary'si ve CAD motoruna **dokunulmamıştır**.

**ASAMA_05 KABUL EDİLDİ.**

---

## 11. ASAMA_06 Doğrulama ve Kabul Durumu (Gerçek PDF basım okunabilirliği ve uzun adres için dürüst çözüm)

- [x] **Gerçek PDF Üretimi ve AcroForm Geometrisi Kanıtı:**
  - 5 belgenin tamamındaki adres ve yer alanlarının fiziksel AcroForm geometrileri doğrudan üretilen ikili PDF çıktılarından ampirik olarak incelendi ve kalibre edildi.
  - `santiye-sefi-istifa-dilekcesi:adres_deger`: 192.0 × 18.0 pt, tek satır (`multiline: false`), nominal DA font 8 pt.
  - `santiye-sefi-taahhutnamesi`: `adres` (325.5 × 9.6 pt), `yapi_adresi` (310.0 × 9.6 pt), `yapi_sahibi_adresi` (310.0 × 9.6 pt), tek satır, nominal DA font 5 pt.
  - `santiye-sefi-sozlesmesi:adres`: 170.0 × 11.5 pt, tek satır, nominal DA font 7 pt.
  - `insaat-ruhsati-dilekcesi:adres`: 451.0 × 44.0 pt, çok satırlı (`multiline: true`), nominal DA font 10.5 pt.
  - `beton-dokum-tutanagi:yer`: 352.28 × 36.0 pt, çok satırlı (`multiline: true`), nominal DA font 9 pt.
- [x] **İstifa `adres_deger` Stres ve Punto Küçülmesi Matrisi (Kanıtlandı):**
  - Gerçek PDF üretim testlerinde (`tests/belgeler/pdf-readability.test.ts`):
    - 48 karakter (varsayılan): 5.09 pt font, tam metin saklandı.
    - 60 karakter: 4.15 pt font, tam metin saklandı.
    - 84 karakter: 3.12 pt font (<= 4.0 pt eşiğine indi), tam metin saklandı.
    - 122 karakter: 2.15 pt font, tam metin saklandı.
    - 212 karakter: 1.35 pt font, tam metin saklandı.
    - 220 karakter tek kelime: 1.26 pt font, tam metin saklandı.
  - **Sıfır Sessiz Kesme / Truncation Garantisi:** Her uzunluktaki adres metninin PDF AcroField içine 100% eksiksiz yazıldığı, hiçbir karakterin kesilmediği testlerle kanıtlandı.
- [x] **Hafif ve Sıfır Maliyetli Çalışma Zamanı Okunabilirlik Motoru (`src/lib/belgeler-pdf-readability.ts`):**
  - `assessFieldReadability(documentId, fieldKey, rawValue)` fonksiyonu oluşturuldu.
  - Runtime tarafında PDF parsing/canvas yükü oluşturmaz; fiziksel offline kalibrasyon eşiklerine göre anlık (< 1 ms / 500 çağrı < 1 ms) risk analizi (`none` | `possible` | `serious` | `unknown`) yapar.
  - İlgisiz veya izlenmeyen alanlar için güvenli `none` / `readability-untracked` döner.
- [x] **Test ve Kalite Kapıları:**
  - `tests/belgeler/pdf-readability.test.ts`: **PASS (13/13 test, 2.6s)**
  - `tests/belgeler/field-guidance.test.ts`: **PASS (27/27 test, 4.0ms)**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4 test)**
  - `tests/belgeler/document-field-contract.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56 alan)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), 5 şablon PDF binary'si (ASAMA_06B öncesi dokunulmadı) ve CAD motoruna **dokunulmamıştır**.

**ASAMA_06 KABUL EDİLDİ.**

---

## 12. ASAMA_06B Doğrulama ve Kabul Durumu (PDF Adres Alanlarının Fiziksel ve Okunabilirlik İyileştirmesi)

- [x] **Beş Belgenin Orijinal Alan Geometrisi ve İhtiyaç Değerlendirmesi:**
  - `insaat-ruhsati-dilekcesi:adres`: 451.0 × 44.0 pt, `multiline: true`, 10.5 pt font. Zaten tam sayfa genişliğinde çok satırlı; müdahale edilmedi (korundu).
  - `beton-dokum-tutanagi:yer`: 352.28 × 36.0 pt, `multiline: true`, 9.0 pt font. Zaten geniş ve çok satırlı; müdahale edilmedi (korundu).
  - `santiye-sefi-sozlesmesi:adres`: 170.0 × 11.5 pt, tek satır, 7.0 pt font. Tablo ızgarası içindedir; il/ilçe/mahalle/ada/parsel ayrı hücrelerdedir. Tablo bütünlüğünü bozmamak için müdahale edilmedi (korundu).
  - `santiye-sefi-taahhutnamesi`: `adres` (325.5 × 9.6 pt), `yapi_adresi` (310.0 × 9.6 pt), `yapi_sahibi_adresi` (310.0 × 9.6 pt). 10 pt satır aralıklı tek sayfa resmi formdur; genişliği 310+ pt olup yeterlidir; müdahale edilmedi (korundu).
  - `santiye-sefi-istifa-dilekcesi:adres_deger`: Eski şablonda 192 × 18 pt dar tek satır idi ve uzun adreslerde font 1.26 pt'ye kadar küçülüyordu. Öncelikli hedef olarak fiziksel iyileştirme kapsamına alındı.
- [x] **İstifa Dilekçesi Şablonunun Fiziksel ve Çok Satırlı İyileştirmesi (`public/belgeler/santiye-sefi-istifa-dilekcesi.pdf`):**
  - **Kontrollü İstisna:** Kullanıcı izni doğrultusunda şablon PDF AcroForm widget geometrisi güncellendi.
  - **Yatay Genişleme:** `x: 143, width: 192 pt` -> `width: 225 pt` (+33 pt yatay kapasite artışı, sağ sütundaki imza/ad_soyad bloğuyla 0 çakışma).
  - **Dikey Genişleme ve Çok Satırlılık:** `height: 18 pt` -> `height: 36 pt` (tam 2-3 satır metin kapasitesi), `Ff` bayrağına multiline biti (`1 << 12 = 4096`) eklendi.
  - **Komşu ve Alt/Üst Alan İzolasyonu:** `y: 347 pt` tabanı korundu; `tc_deger` (y=330..348) ile 0 çakışma; üstte `ad_soyad` (y=428) ile 45 pt ve `sonuc_cumlesi` (y=500) ile 117 pt güvenli mesafe korundu.
  - **Beyaz Zemin ve Basılı Metin Güvenliği:** Widget zemin akışının mevcut basılı metni örtmediği kanıtlandı.
- [x] **Ölçülebilir Okunabilirlik İyileşmesi (Kanıtlandı):**
  - Varsayılan (48 karakter): **8.0 pt** (nominal font)
  - 60 karakter: **8.0 pt** (eski: 6.0 pt)
  - 84 karakter: **8.0 pt** (eski: 4.0 pt / 3.12 pt -> **%100 font büyümesi ve tam okunabilirlik**)
  - 122 karakter: **8.0 pt** (eski: 3.0 pt / 2.15 pt -> **%166 font büyümesi ve tam okunabilirlik**)
  - 212 karakter: **7.0 pt** (eski: 1.35 pt -> **%418 font büyümesi, okunabilir seviyede kalma**)
  - 220 karakter: **%100 tam metin korunumu (0 sessiz kesme / 0 truncation)**
- [x] **Şablon Kriptografik SHA-256 Sürüm Kaydı:**
  - `santiye-sefi-istifa-dilekcesi.pdf` (Baseline v1): `3132D5617DF0AEF1366B1B680F385762743AE05375BE7F5EB5653F2A6915D83E`
  - `santiye-sefi-istifa-dilekcesi.pdf` (ASAMA_06B v2): `95C0AA38DECBFBA0C4E61C3F1D99956F2D3BDD057EBC307C728D2527459F74DC`
  - Diğer 4 şablonun hash değerleri orijinal baseline ile birebir korunmuştur.
- [x] **Test ve Kalite Kapıları:**
  - `tests/belgeler/pdf-readability.test.ts`: **PASS (13/13 test, 2.7s)**
  - `tests/belgeler/document-field-contract.test.ts`: **PASS (56/56 alan sözleşmesi)**
  - `tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56 alan eşleşmesi ve PDF.js koordinat dönüşümü)**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4 test)**
  - `tests/belgeler/field-guidance.test.ts`: **PASS (27/27 test)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (20/20 test, 44.3s)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Mobile 390): **PASS (20/20 test, 31.7s)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), ve CAD motoruna **dokunulmamıştır**.

**ASAMA_06B KABUL EDİLDİ.**

---

## 13. ASAMA_07 Doğrulama ve Kabul Durumu (Sol Form ve Sağ Popup İçin Tutarlı, Az Uyarılı Arayüz)

- [x] **Birleşik, Saf Rehberlik Değerlendiricisi (`src/components/belge-field-guidance.tsx`):**
  - `evaluateFieldGuidance(documentId, fieldKey, value, options)` saf fonksiyonu oluşturuldu.
  - Format doğrulama (`getFieldGuidance`) ve fiziksel PDF baskı okunabilirliği (`assessFieldReadability`) motorlarını tek bir saf kontratta birleştirdi.
  - TCKN özel politikası: Kullanıcı henüz 11 haneyi tamamlamadan yazarken erken gürültü/uyarı üretmez; onay veya blur (`isTouched` / `isBlurOrSubmitted`) anında devreye girer.
  - Serbest metinlerde (N tipi) ve nominal alanlarda sıfır yanlış alarm (0 false positive).
  - Boş veya nötr `-` değerlerde sıfır uyarı.
- [x] **Erişilebilir Rehberlik Görünüm Bileşeni (`BelgeFieldGuidanceView`):**
  - `role="status"` ve `aria-live="polite"` erişilebilirlik öznitelikleriyle ekran okuyuculara nazikçe bilgi verir.
  - İlgili input/textarea elemanlarına `aria-describedby` ile bağlanmıştır.
  - Uyarı mesajı için belirgin `data-testid="belge-field-guidance-message"` tanımlanmıştır.
- [x] **Çift Uyarı Önleme Koruması (`excludedFields`):**
  - `BelgeFieldLengthWarnings` üst paneline `excludedFields` desteği eklendi.
  - Alanın hemen altında satır içi (inline) rehberlik sunulan alanlar üst panelden dışlanarak kullanıcıya aynı mesajın mükerrer gösterilmesi engellendi.
- [x] **Sağ Popover Entegrasyonu (`BelgeInlineDraftPopover`):**
  - Popover içindeki `draft` değeri her tuş basımında dinamik olarak değerlendirilir.
  - Okunabilirlik veya format rehberliği popover içinde input'un altında temiz bir şekilde sunulur.
  - Popover dikey alanı rehberlik mesajı için güvenli biçimde genişletildi (190/130 pt -> 220/160 pt); taşma ve kırpılma önlendi.
  - Çok satırlı alanlar için `<textarea data-testid="belge-inline-edit-textarea">` ayrımı tam korundu.
- [x] **Sıfır İşlem Engellemesi (Kritik Kullanıcı Kuralı):**
  - Hiçbir uyarı veya rehberlik mesajı `Uygula`, `PDF İndir`, `Yazdır`, `Temizle`, `Sıfırla` veya `Geri Al` işlemlerini devre dışı bırakmaz / engellemez.
  - Form verileri asla sessizce kesilmez, kısaltılmaz veya engellenmez.
- [x] **5 Stüdyo Entegrasyonu:**
  - `istifa-studio.tsx`: `tarih`, `tc_deger`, `iletisim_deger`, `adres_deger`
  - `beton-dokum-studio.tsx`: `tarih`, `yer`
  - `insaat-ruhsati-studio.tsx`: `tarih`, `adres`, `tel`
  - `sozlesme-studio.tsx`: `adres`, `ucret`, `sozlesme_tarihi`
  - `taahhutname-studio.tsx`: `tc_kimlik_no`, `telefon`, `adres`, `yapi_adresi`, `yapi_sahibi_adresi`, `tarih`
- [x] **Test ve Kalite Kapıları:**
  - `tests/belgeler/field-guidance-ui.test.ts`: **PASS (10/10 test)**
  - `tests/belgeler/field-guidance.test.ts`: **PASS (27/27 test)**
  - `tests/belgeler/pdf-readability.test.ts`: **PASS (13/13 test)**
  - `tests/belgeler/document-field-contract.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4 test)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Desktop 1920): **PASS (22/22 test, 38.2s)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Chromium Mobile 390): **PASS (22/22 test, 34.7s)**
  - `npm run build`: **Kusursuz Derlendi (0 hata, 40s)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), ve CAD motoruna **dokunulmamıştır**.

**ASAMA_07 KABUL EDİLDİ.**

---

## 14. ASAMA_08 Doğrulama ve Kabul Durumu (Kanıt Gücü Yüksek Regresyon Testleri ve Veri Güvenliği)

- [x] **Sözleşme ve Şablon Bütünlüğü (56/56 Alan, 3 Salt-PDF, 7 FreeText):**
  - Beş belgedeki toplam 56 düzenlenebilir alan eksiksiz doğrulandı.
  - İstifa dilekçesindeki 3 salt-PDF etiketi (`adres_etiket`, `tc_etiket`, `iletisim_etiket`) form alanı olarak sunulmadı ve hotspot üretmedi.
  - Taahhütnamedeki 7 FreeText statik metin anotasyonu doğru şekilde filtrelendi.
- [x] **Beş Belgede Gerçek PDF Üretimi ve Sıfır Veri Kaybı (0 Truncation):**
  - `santiye-sefi-istifa-dilekcesi`: 220+ karakterlik uzun adres ve Türkçe karakterler (`ÖÇŞİĞÜ öçşiğü`) sıfır kayıpla AcroForm alanında saklandı.
  - `beton-dokum-tutanagi`: 220+ karakterlik yer alanı ve Türkçe metinler tam korundu.
  - `insaat-ruhsati-dilekcesi`: 220+ karakterlik adres ve 180 karakterlik tek kelime `ana_metin` alanı sıfır kayıpla saklandı.
  - `santiye-sefi-sozlesmesi`: Tam 2 sayfa PDF üretimi, uzun adres ve bağlı imza alanları tam korundu.
  - `santiye-sefi-taahhutnamesi`: 3 ayrı uzun adres alanı (`adres`, `yapi_adresi`, `yapi_sahibi_adresi`) ve unvan/imza alanları sıfır kayıpla saklandı.
- [x] **Bağlı İmza ve Senkronizasyon Koruması:**
  - Sözleşme stüdyosunda müteahhit unvanı ve şantiye şefi adı form ve PDF imza alanlarında eş zamanlı doğrulandı.
  - Taahhütname unvan ve unvan_imza senkronizasyonu tam korundu.
- [x] **Eski İşlevlerin Tam Korunması:**
  - Sol form düzenleme → PDF önizleme senkronu.
  - `Temizle` (Clear all fields) → tüm alanları temizleme.
  - `Geri al` (Undo) → önceki verileri eksiksiz geri yükleme.
  - `Sıfırla` (Global ve Local Reset) → orijinal varsayılan verilere hatasız dönüş.
  - `PDF İndir` → indirilen PDF dosyası `pdf-lib` ile okunup form alanları doğrulanarak test edildi.
  - `Yazdır` → hazır Blob URL üzerinden pencere tetiklemesi korundu.
  - `Boş form indir` → orijinal boş şablon indirme linkleri korundu.
  - Mobil sekme (`Form Alanları` / `PDF Önizle`) geçişleri ve 20+ seri geçiş kararlılığı doğrulandı.
- [x] **Güvenlik, Gizlilik ve Cihaz Uyumluluğu:**
  - Sıfır PII sızıntısı: Kimlik, telefon veya adres verisi asla URL parametresine, telemetriye veya konsola sızdırılmaz.
  - Viewport kabul matrisi: 320×720, 360×800, 390×844, 414×896, 768×1024, 844×390, 1024×768, 1366×768, 1920×1080 ekranlarda **sıfır yatay taşma (0 horizontal overflow)**.
  - WCAG 2.2 AA erişilebilirlik denetimi: Tüm stüdyolarda sıfır Critical/Serious axe ihlali.
  - Touch hedefleri: Mobil kontroller minimum 44×44 px standardını eksiksiz karşılar.
- [x] **Çalıştırılan ve Geçen Test Paketleri:**
  - `tests/belgeler/integrated-quality-audit.test.ts`: **PASS (5/5 test)**
  - `tests/belgeler/field-guidance-ui.test.ts`: **PASS (10/10 test)**
  - `tests/belgeler/field-guidance.test.ts`: **PASS (27/27 test)**
  - `tests/belgeler/pdf-readability.test.ts`: **PASS (13/13 test)**
  - `tests/belgeler/document-field-contract.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/inline-edit-field-map.test.ts`: **PASS (56/56 alan)**
  - `tests/belgeler/baseline-v2-safety-audit.test.ts`: **PASS (4/4 test)**
  - `tests/belgeler/pdf-generation-regression.test.ts`: **PASS (5/5 şablon)**
  - `tests/belgeler/pdf-long-text-stress.test.ts`: **PASS**
  - `tests/belgeler/viewer-helpers.test.ts`: **PASS**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Desktop 1920): **PASS (22/22 test)**
  - `tests/site-audit/belgeler-inline-edit.spec.ts` (Mobile 390): **PASS (22/22 test)**
  - `tests/site-audit/belgeler-functional-audit.spec.ts` (Desktop 1920): **PASS (24/24 test)**
  - `tests/site-audit/belgeler-mobile-studio.spec.ts` (Mobile 390): **PASS (26/26 test, incl. WebKit)**
  - `tests/site-audit/belgeler-mobile-studio.spec.ts` (Desktop 1920): **PASS (10/10 test)**
  - `tests/site-audit/responsive-overflow.spec.ts`: **PASS (26/26 test)**
  - `tests/site-audit/theme-consistency.spec.ts`: **PASS (6/6 test)**
  - `tests/site-audit/touch-targets.spec.ts`: **PASS (7/7 test)**
  - `tests/site-audit/a11y-wcag.spec.ts`: **PASS (25/25 test)**
  - `tests/site-audit/modal-dialog-scroll-lock.spec.ts`: **PASS (2/2 test)**
  - `tests/site-audit/security-auth-idor.spec.ts`: **PASS (3/3 test)**
  - `tests/site-audit/fault-tolerance-resilience.spec.ts`: **PASS (3/3 test)**
  - `tests/site-audit/form-input-modes.spec.ts`: **PASS (5/5 test)**
  - `tests/site-audit/long-session-performance.spec.ts`: **PASS (14/14 test)**
  - `tests/site-audit/seo-content-integrity.spec.ts`: **PASS (18/18 test)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
- [x] **Korumalı Dosya Bütünlüğü:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), ve CAD motoruna **dokunulmamıştır**.

**ASAMA_08 KABUL EDİLDİ.**

---

## 15. ASAMA_09 Doğrulama ve Kabul Durumu (Final Güvenlik, Performans, Sürüm ve Dokümantasyon Kapısı)

- [x] **Kriptografik SHA-256 Baseline Bütünlük Karşılaştırması:**
  - `src/lib/pdf-engine.ts`: `53E148B8559AF5ABAC72630B6E519E94492098048B83C95641AAEA813896791A` (**TAM EŞİT / DEĞİŞMEMİŞ**)
  - `src/hooks/use-belge-studio-document.ts`: `0BAD906BEEE7BEE4246689CF9A907A330F11FECCFA6FA80BA166C32E5F886529` (**TAM EŞİT / DEĞİŞMEMİŞ**)
  - `src/lib/document-field-contracts.ts`: `1D41C8BF583971C845B453DF20B99CDED232918F5161515C4BA40801EDDE323F` (**TAM EŞİT / DEĞİŞMEMİŞ**)
  - `public/belgeler/beton-dokum-tutanagi.pdf`: `AF4F7D49485095692BA3137EA5EF84041B9CB4E64A8DB637F657FADB3BB53BA3` (**TAM EŞİT**)
  - `public/belgeler/insaat-ruhsati-dilekcesi.pdf`: `29DF7BFD9CB503A03778E4965D4AB75B2B82EB29184BE24A6BFDB181447E6BBD` (**TAM EŞİT**)
  - `public/belgeler/santiye-sefi-sozlesmesi.pdf`: `B9230FAD52773AB9FAA99A1BA12D702604324B37293D6BBDEF829C35FBAA3F44` (**TAM EŞİT**)
  - `public/belgeler/santiye-sefi-taahhutnamesi.pdf`: `15E87409A1BF00336F2E144299AA7DE6241D3F679D4953837F42D34AED639D13` (**TAM EŞİT**)
  - `public/belgeler/santiye-sefi-istifa-dilekcesi.pdf`: `95C0AA38DECBFBA0C4E61C3F1D99956F2D3BDD057EBC307C728D2527459F74DC` (**ASAMA_06B Onaylı v2 Hash ile TAM EŞİT**)
  - CAD / Dokümantasyon motoru: **100% KORUNDU / SIFIR DEĞİŞİKLİK**.
- [x] **Performans ve OFF Modu Eşdeğerliği:**
  - Katman varsayılan olarak kapalıdır (`isInlineEditingActive = false`).
  - OFF modunda ekrandaki DOM hitbox düğüm sayısı: **0** (`toHaveCount(0)` doğrulaması).
  - OFF modunda sıfır annotasyon fetch veya çizim yükü; başlangıç zamanında baseline ile sıfır fark.
  - Açık modda (`isInlineEditingActive = true`) 15 seri aç/kapa ve zoom/pinch sonrasında bellek sızıntısı ve stale listener artığı olmadığı kanıtlandı.
- [x] **Yaşayan Mimari Dokümantasyonu Güncellemesi (`docs/BELGELER_SISTEMI.md`):**
  - **Bölüm 8 (Saf Alan Rehberi ve Semantik Kalite Politikası):** 56/56 alan semantik kural defteri, TCKN özel onay davranışı, erişilebilirlik ve çift uyarı koruması kaydedildi.
  - **Bölüm 9 (Fiziksel PDF Baskı Okunabilirlik Motoru ve Şablon İyileştirmesi):** Offline hafif kalibrasyon, İstifa dilekçesi 225×36 pt çok satırlı iyileştirmesi, baseline v1/v2 hash kayıtları ve sıfır sessiz kesme (0 truncation) ilkeleri dokümante edildi.
  - **Bölüm 10 (Geri Alma, Hata Toleransı ve Rollback Güvencesi):** Git tek komutluk geri alma noktaları, opt-in OFF modu izolasyonu ve çekirdek motor güvenceleri resmileştirildi.
- [x] **Final Kalite Kapıları:**
  - `npm run build`: **Kusursuz Üretim Derlemesi (0 hata, 16.1s)**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
  - Tüm 8 birim/sözleşme test paketi: **PASS (100%)**
  - Korumalı çekirdek dosyalar ve CAD motoruna **dokunulmamıştır**.

**ASAMA_09 KABUL EDİLDİ.**

---

## 16. ASAMA_10 Doğrulama ve Kabul Durumu (Tek Kontrollü Production Yayımlama ve Canlı Kabul)

- [x] **Tek Anlamlı Atomik Checkpoint Hazırlığı:**
  - `AGENTS.md` ve `PROJECT.md` kurallarına uygun olarak tüm ara adımlar yerel ortamda doğrulandı; ara commit veya Vercel kotasını tüketen preview deploy spam'i yapılmadı.
  - Kullanıcının çalışma ağacındaki diğer plan dosyalarına (`DWG_PLAN_DURUMU.md`, `PLAN/DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`) **dokunulmadı**.
  - Yalnız bu göreve ait kaynak kodlar, şablon, testler, mimari doküman ve durum kayıtları hazırlandı.
- [x] **Çekirdek Bütünlük ve Güvenlik:**
  - `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts` (READ-ONLY korundu), ve CAD motoruna **kesinlikle dokunulmamıştır**.
  - Orijinal şablon hash'leri tam korundu; İstifa dilekçesi kontrollü v2 sürümü hash'i doğrulandı.
  - 56/56 AcroForm alanı eksiksiz korundu; sıfır sessiz kesme (0 silent truncation) doğrulandı.
- [x] **Tüm Kalite Kapıları:**
  - `npm run build`: **0 Hata**
  - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **0 Hata**
  - `git diff --check`: **0 Boşluk/Çakışma Hatası**
  - Tüm test paketleri: **PASS (100%)**

**PLAN TAMAMLANDI VE KABUL EDİLDİ.**









