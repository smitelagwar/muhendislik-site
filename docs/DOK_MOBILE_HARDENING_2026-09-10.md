# Dökümantasyon Mobil Dosya Yöneticisi — Denetim ve Uygulama Kaydı

**Tarih:** 10 Eylül 2026  
**Kapsam:** `/dokumantasyon` Drive V3.1 dosya yöneticisi  
**İncelenen rapor:** `C:\Users\hsyn\Downloads\Dokumantasyon_Mobil_Dosya_Yoneticisi_Diger_AI_Denetimi_ve_Mukemmellestirme.md`  
**İlke:** CAD/DWG/DXF viewer motoru, backend, storage sözleşmesi ve hesaplama formülleri bu çalışma kapsamında değiştirilmedi.

## Karar

İncelenen önceki uygulama doğru bir temel kurmuştu, ancak “mobilde Seç düğmesiyle başlayan seçim” kuralı bütün event yollarına uygulanmamıştı. Aynı dosya satırının boşluğu, dosya adı bağlantısı, çift tıklaması, sağ tık/uzun basması ve checkbox'ı farklı davranabildiği için rapordaki 7.5/10 değerlendirmesi haklıydı.

Bu çalışma P0 etkileşim açıklarını kapattı, seçim politikasını tek kaynağa taşıdı, gerçek liste/ızgara ve cihaz testlerini genişletti, mobil viewport ile sabit alt gezinme çakışmasını giderdi ve yaşayan mimari belgeleri güncelledi.

## Denetimde doğrulanan sorunlar

### P0 — Seçim modunda dosya adı bağlantısı navigasyonu deliyordu

Önceki davranışta satır gövdesi seçim modunu kontrol ederken dosya adı ayrı bir `<Link>` olarak doğrudan önizleme rotasına gidebiliyordu. Böylece aynı öğenin birkaç pikseli farklı iş yapıyordu.

**Uygulanan çözüm:** `activateItem(file, "name", event)` artık satır ve kart dosya adında kullanılıyor. Normal mobil modda bağlantı navigasyonu korunuyor; mobil Seç modunda `preventDefault()` ile navigasyon duruyor ve yalnızca seçim tersine çevriliyor. Liste ve ızgara aynı davranışı kullanıyor.

### P0 — Normal mobil modda checkbox ve Tümünü Seç görünür/kullanılabilir kalıyordu

Bu, seçim modu kapalıyken `selectedIds` dolabilen çelişkili bir state üretiyordu.

**Uygulanan çözüm:** Normal mobil görünümde seçim kontrolleri ve Tümünü Seç gizli. Handler'lar da ikinci bir güvenlik katmanı olarak Seç modu kapalıyken mobil seçim başlatmıyor. Seçim modu yalnızca üstteki `Seç` düğmesiyle açılıyor; çıkışta seçim temizleniyor ve odak aynı düğmeye dönüyor.

Bu koruma yalnız görünür butonla sınırlı değil: command palette veya başka bir dispatcher `select-all` komutunu programatik çağırsa da strict mobil mod kapalıyken komut reddediliyor.

### P0 — Çift tıklama seçim modunu bypass ediyordu

`onDoubleClick` doğrudan klasöre/dosyaya gidiyordu. Hibrit cihazlarda iki hızlı dokunuş seçim yapıp hemen ardından dosya açabiliyordu.

**Uygulanan çözüm:** Çift tıklama yalnız mouse ve masaüstü modunda açma eylemi. Mobil, touch ve pen olayları yutuluyor. Çocuk düğmelerin/linklerin çift tıklaması da parent açma yoluna girmiyor.

### P0 — Touch-origin `contextmenu` uzun basma üzerinden seçim üretebiliyordu

Long-press timer'ı kaldırılmış olsa bile mobil tarayıcıların ürettiği `contextmenu` olayı sağ tık seçim reducer'ına gidebiliyordu.

**Uygulanan çözüm:** Context menu yalnızca masaüstü mouse pointer ile desktop selection reducer'ına gönderiliyor. Touch ve pen context menu olayları `ignore` ediliyor; uzun basma testinde URL ve seçim değişmiyor.

## Mimari iyileştirmeler

### Tek activation policy

`src/components/dokumantasyon/drive-v3/explorer-activation.ts` şu girişleri tek tabloda karara bağlıyor:

| Giriş | Normal mobil | Seçim mobil | Masaüstü |
|---|---|---|---|
| Satır/kart gövdesi | Aç | Toggle | Desktop seçim |
| Dosya adı | Aç | Toggle | Bağlantı |
| Çift tıklama | Yok | Yok | Mouse ile aç |
| Checkbox | Yok | Toggle | Toggle |
| Context menu | Yok | Yok | Mouse sağ tık seçimi |

Bu kaynak dört ayrı renderer'ın (klasör satırı, dosya satırı, klasör kartı, dosya kartı) zamanla birbirinden kopmasını önler.

### Tek mobil breakpoint kaynağı

`useMobileExplorer()` `matchMedia("(max-width: 1023px)")` ile responsive durumu React'in `useSyncExternalStore` sözleşmesine bağlar. `window.innerWidth` okumalarının renderer'larda tekrarlanması kaldırıldı. Breakpoint iki yönde geçildiğinde seçim modu ve seçim temizleniyor; masaüstü marquee ve sürükle-bırak korunuyor.

### Orphan gesture kodu temizliği

Long-press runtime üreticisi kaldırıldığı için artık üreticisi olmayan synthetic click suppression consumer/test çifti de kaldırıldı. Sadece elle token üretip geçen bir test yerine gerçek tarayıcı event'leriyle exactly-once davranış test ediliyor. `mobile-gesture-engine.ts` adı, içinde gesture motoru kalmadığı için `mobile-ui-contract.ts` olarak düzeltildi.

### CAD preload niyet koruması

Mobil `pointerdown` kaydırma başlangıcında CAD preload başlatmıyor. Preload masaüstünde mouse hover/focus, mobilde doğrulanmış açma eyleminde çalışıyor. CAD motorunun kendisine dokunulmadı.

## Mobil viewport ve layout düzeltmeleri

- Dosya yöneticisi mobil rotasında global sabit alt gezinme ve Başa Dön kapatıldı; bu iki overlay liste/dock'un alt satırını kapatıyordu.
- Navbar yüksekliği `ResizeObserver` ile ölçülüp `--dok-app-header-height` değişkenine yazılıyor. Shell yüksekliği `100dvh - ölçülen navbar` olarak hesaplanıyor; 4.5rem varsayımına bağımlılık azaltıldı.
- Mobil admin header'da kullanıcı rozeti, depolama rozeti ve açıklama dar ekranda gizleniyor; h1 ve durum bilgisi erişilebilir DOM'da kalıyor.
- 500px ve altı kısa yatay ekranlarda admin header görsel olarak yer kaplamıyor; erişilebilir başlık korunuyor.
- `DRIVE_LIST_ROW_HEIGHT = 56` ile gerçek mobil satır CSS yüksekliği 56px olarak korunuyor.
- Selection dock normal flex akışında viewport'tan sonra duruyor; fixed overlay veya `order: 50` workaround'u yok.
- Dock düğmeleri `nth-child` yerine `data-mobile-action` ile stilleniyor.
- 44×44 CSS px, projenin geliştirilmiş dokunma hedefi standardı olarak korunuyor. Bu değer “WCAG'nin her durumda zorunlu minimumu” diye etiketlenmiyor.
- Reduced-motion, safe-area, `touch-action: pan-y`, `user-select` ve iOS callout korumaları korunuyor.

## Test kapsamı

`tests/dok-drive-v3/mobile-real-explorer.spec.ts` aşağıdaki davranışları gerçek DOM ile doğruluyor:

- Liste ve ızgarada normal gövde/dosya adı/klasör açma.
- Seç moduna girmeden gizli checkbox ve Tümünü Seç sözleşmesi.
- Seç modunda dosya adı, gövde ve checkbox toggle; tekrar dokunmada deselect.
- URL'nin seçim modunda değişmemesi.
- More/işlem düğmesinin parent açmaması.
- Mobil çift tıklama ve touch/pen context menu koruması.
- 100 ve 500 öğede dock açık/kapalı son satır görünürlüğü.
- 320×568, 390×844 ve iPhone 13 WebKit profilleri.
- Yatay/dikey ve mobil/masaüstü breakpoint geçişi.
- Chromium CDP touch swipe/flick ve 800ms uzun basma.
- Açık/koyu tema altında 500 öğe ve Tümünü Seç/sıfıra dön.
- Taşı/Paylaş/Sil pencerelerinin mobilde açılması, iptalde seçimin korunması.

`tests/dok-drive-v3/desktop-real-explorer.spec.ts` masaüstü davranışının bozulmadığını doğruluyor:

- Mouse click, Ctrl, Shift ve sağ tık çoklu seçim.
- Liste ve ızgarada child double-click ayrımı.
- Mouse marquee görünürlüğü.
- Touch/pen context menu'nün masaüstü seçimine sızmaması.

`tests/dok-drive-v3/mobile-selection.spec.ts` ayrıca activation policy'nin table-driven 16 kombinasyonunu sınar. `tsconfig.dok-mobile.json` yalnız deploy edilebilir runtime ve mobil/desktop Drive regression kaynaklarını typecheck eder; repo genelindeki tarihsel CAD/test borcunu mobil gate'e karıştırmaz.

## Doğrulama sonuçları

| Kontrol | Sonuç |
|---|---|
| Hedefli TypeScript: `npx tsc --noEmit --incremental false -p tsconfig.dok-mobile.json` | PASS |
| Production build: `npm run build` (`next build --webpack`) | PASS; 715 rota derlendi |
| Tam Drive V3 kapısı: `npm run check:dok-drive-v3` | PASS; 190 test, 1 beklenen WebKit CDP skip |
| Desktop Drive V3 regression | PASS |
| Mobil Chromium 390 ve 320 acceptance | PASS |
| iPhone 13 WebKit acceptance | PASS |
| Gerçek swipe/flick/long-press | PASS |
| 500 öğe ve iki tema görünürlük testleri | PASS |
| Diff whitespace kontrolü | PASS |

Mobil dosyalarda ESLint hatası yoktur. `file-manager.tsx` içinde önceki koddan gelen 21 uyarı (kullanılmayan importlar, hook dependency ve PDD cleanup uyarıları) hâlâ teknik borç olarak raporlanır; bu değişiklikte işlevsel refactor'a dönüştürülmemiştir.

Repo-genel `npx tsc --noEmit` hâlâ CAD persistence/units/snap ve eski fixture/test kaynaklı hatalar veriyor. Bu sonuç mobil patch tarafından oluşturulmuş yeni hata değildir; baseline ile final karşılaştırmasında yeni hata kümesi `0` bulunmuştur. `vercel-preflight` bu nedenle deploy edilebilir runtime typecheck'ini required doğrulama, tüm repo sağlık typecheck'ini `continue-on-error` ile bağımsız bilgilendirici baseline olarak ayırır. Böylece bilinen eski borç mobil üretim release'ini maskelemez; log yine görünür kalır.

## Bilinçli kapsam dışı konular

- `main` branch protection GitHub hesap/ruleset ayarıdır; kod değişikliğiyle güvenilir biçimde kurulamaz.
- `npm audit` sonucu ve eski CAD test borcu ayrı bakım işidir; kör `npm audit fix --force` uygulanmadı.
- CAD/DWG/DXF/DWF viewer, worker/WASM, API, auth, Blob/Neon lifecycle ve hesaplama formülleri değiştirilmedi.
- `vercel.json` içindeki internal no-deploy branch koruması korunuyor; production deployment tetiklenmedi.

## Sonuç

Önceki planın ana yönü korunarak kalan P0 etkileşim açıkları kapatıldı. Mobilde artık tek ve anlaşılır sözleşme var: normal dokunuş açar, seçim yalnız `Seç` düğmesiyle başlar, seçim modunda ad/gövde/checkbox toggle eder, swipe kaydırır, uzun basma hiçbir gizli iş yapmaz. Liste ve ızgara bu sözleşmeyi aynı policy ve gerçek tarayıcı testleriyle paylaşır.
