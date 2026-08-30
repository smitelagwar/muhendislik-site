# CAD DWG/DXF — Gerçek Kullanıcı Testi ve İyileştirme Planı

> Tarih: 30 Ağustos 2026  
> Uygulayıcı model: Gemini 3.7 Flash — **High**  
> Başlangıç commit'i: `800ab8b` (`main` = `origin/main`)  
> Kapsam: `/dokumantasyon`, `/dokumantasyon/dosya/[fileId]`, DWG/DXF açma, görüntüleme, ölçüm, katman, mobil UX ve bunları kanıtlayan test altyapısı  
> Deployment: Git tabanlı Vercel deployment kapalı kalır; varsayılan Preview bütçesi **0**, plan genelindeki mutlak üst sınır **4**, Production üst sınırı **1 ve yalnız bütün plan bittikten sonra**

## 1. Bu planın statüsü

Bu dosya, aşağıdaki tarihsel planların ardından mevcut repo gerçeğinden devam eden yeni çalışma planıdır:

- `PLAN/CAD_ONIZLEME_GEMINI_3_7_FLASH_HIGH_NIHAI_UYGULAMA_PLANI.md`
- `PLAN/CAD_ONIZLEME_GEMINI_UYGULAMA_SONRASI_DUZELTME_PLANI.md`

Eski planlar mimari ve karar geçmişi olarak okunabilir; fakat görev listesi olarak yeniden uygulanmaz. Bu planın başlangıcında önceki çalışmaların tamamlandığını söyleyen Stage 9 kapısı bulunsa da gerçek kullanıcı testinde yeni açıklar bulunmuştur.

Bu planın temel kuralı:

> Bir aşama başlatıldığında o aşamanın bütün işleri, testleri, kanıtları ve dokümantasyon yükümlülüğü tamamlanır. `PARTIAL PASS` yoktur. Herhangi bir zorunlu kapı başarısızsa sonraki aşamaya geçilmez; aynı aşama `FAIL` veya gerçek bir dış engel varsa `BLOCKED` kalır.

## 2. 30 Ağustos 2026 doğrulanmış başlangıç durumu

### 2.1 Git ve çalışma ağacı

- `git fetch --prune origin` çalıştırıldı.
- `main` ve `origin/main` aynı committe: `800ab8b`.
- Vercel Git deployment kilidi açık: `vercel.json → git.deploymentEnabled: false`.
- Çalışma ağacında kullanıcıya ait kabul edilerek korunması gereken sekiz yerel CAD değişikliği vardır:
  - `scripts/check-cad-final-stage9.ts`
  - `src/components/dokumantasyon/preview/cad-distance-overlay.tsx`
  - `src/components/dokumantasyon/preview/cad-precision-overlay.tsx`
  - `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
  - `src/lib/dokumantasyon/cad-upstream/adapter.ts`
  - `src/lib/dokumantasyon/cad-upstream/distance-measurement.ts`
  - `src/lib/dokumantasyon/cad-upstream/precision-ux.ts`
  - `src/lib/dokumantasyon/cad-upstream/snap-engine.ts`

Bu dosyalar `reset`, `checkout`, `stash drop` veya körlemesine üzerine yazma ile kaybedilmeyecektir. Aşama 1'de diff envanteri alınacak ve mevcut yerel yama planın girdisi olarak ele alınacaktır.

### 2.2 Gerçek kullanıcı koşusu

Test edilen gerçek dosyalar:

| Dosya | Boyut | Yol | Motor/kaynak | Hazır olma süresi |
| --- | ---: | --- | --- | ---: |
| `gercek-proje (1).dxf` | 4,44 MB | gerçek DXF | upstream / original-dxf | yaklaşık **5,5 sn** |
| `SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg` | 7,67 MB | cache miss → gerçek DWG | upstream / original-dwg | yaklaşık **38,1 sn** |
| `bozuk (27).dxf` | 27 B | upstream fail → legacy terminal hata | legacy / original-dxf | yaklaşık **1,4 sn** |

Doğrulanan çalışan davranışlar:

- DXF ve DWG gerçek WebGL canvas üzerinde açıldı.
- Mouse wheel zoom canvas pikselini değiştirdi.
- Masaüstü mesafe ölçümü iki tıklamayla tamamlandı ve kalıcı overlay üretti.
- `T` kısayolu mesafe aracını başlattı; `Esc` iptal etti.
- Mobilde 500 ms'den uzun iki basılı tutma ile mesafe tamamlandı.
- Katman paneli gerçek DXF'te 18/18 katmanı listeledi.
- Alan ölçümü gerçek DXF'te dört nokta + `Enter` ile tamamlandı.
- Bozuk DXF sonsuz loading yerine retry ve indirme seçenekli terminal sonuca ulaştı.
- Mobil CAD viewport'unda yatay sayfa taşması oluşmadı.

Bu çalışan davranışlar korunacak; düzeltme sırasında geriye götürülmeyecektir.

## 3. Bulunan hatalar ve çözüm kararları

| ID | Öncelik | Doğrulanmış sorun | Kanıt | Çözüm yönü |
| --- | --- | --- | --- | --- |
| CAD-01 | P0 | Playwright testleri ortak `.data` deposuna yazar ve temizlemez. | Seçili 16 test PASS olurken dosya sayısı **1114 → 1132** oldu. Mobil listede 813 öğe ve yaklaşık 57.701 px doküman yüksekliği görüldü. | Her koşuya özel geçici veri dizini; worker/run izolasyonu; güvenli cleanup; kullanıcı `.data` dizinine sıfır yazma. |
| CAD-02 | P0 | Testler kullanıcı davranışını kanıtlamadan PASS veriyor. | `cad-preview-v2-contract` manifest matematiğini yeniden hesaplıyor; SHA'yı dosyadan üretmiyor. Area testi yalnız aracı açıp temizliyor. | Gerçek pointer, canvas, kamera, overlay, ağ ve dosya hash assertion'ları. Self-referential assertion yasak. |
| CAD-03 | P0 | “Known geometry” fixture'ı güvenilir bir render oracle'ı değil. | Fixture'daki uzak daire `Sığdır` sonucunu bozuyor; daire çıkarılınca bilinen line/polyline görünür render üretmedi. Buna rağmen test PASS. | Geçerli handle/entity içeren küçük fixture'ı yeniden üret; ekran koordinatı ve onaylı golden ile gerçek 5000/12.000.000 sonucu doğrula. |
| CAD-04 | P1 | Sol sürükleme pan yapmıyor; yalnız orta mouse sürükleme pan yapıyor. | Gerçek canvas hash'i sol drag sonrası değişmedi. `cad-readonly-contract` bunu bilerek “sol drag pan yapmamalı” diye sabitliyor. | Salt-okunur Pan modunda sol drag + middle drag + trackpad pan; ölçüm aktifken çakışmasız pointer sözleşmesi; seçim yine kapalı. |
| CAD-05 | P1 | Mobil ölçüm etkileşimi keşfedilebilir değil. | 450 ms dokunma nokta seçmedi; 750 ms seçti. Ekran metni yalnız “1. noktayı seçin” diyor. Touch cihazında `title` görünmez. | Kısa dokunmayla seçim veya açık “basılı tut” sözleşmesi. Önerilen: tap ile nokta koy, long-press ile hassas büyüteç/ince ayar. Mod bazlı Türkçe yönerge ve progress feedback. |
| CAD-06 | P1 | Mobilde görünüm kontrolleri kayboluyor. | `cad-studio-toolbar-slot` `max-sm:hidden`; mobil üç nokta menüsünde Gerçek Renk/S/B/Lineweight/arka plan seçenekleri yok. | Mobil quick rail'de veya topbar'da erişilebilir `Görünüm` popover/sheet; desktop ile özellik eşliği. |
| CAD-07 | P1 | Alan ölçümü İngilizce ve ham teknik UI gösteriyor. | Ekranda `Specify next point (or press Enter to finish)`; sonuç `5362957.1956²`. Üstte bağlamsız `0.70 mm / 13 px` native stil araçları açılıyor. | Native komutu React/Türkçe durum katmanıyla sar; `Alan: 5.362.957,20 çizim birimi²`; Enter/Esc/geri al yönergeleri; stil kontrollerini sadeleştir veya ikincil popover'a taşı. |
| CAD-08 | P1 | Yerel CAD yamasında kalite kapısı kırık. | Hedefli ESLint: `adapter.ts` içinde iki `no-explicit-any` error; `cad-precision-overlay.tsx` içinde eksik hook dependency warning. `git diff --check`, `distance-measurement.ts` ve `snap-engine.ts` için EOF boş satırı bildiriyor. | Tip güvenli, yalnız CAD context'ine scoped çözüm; hook dependency ve whitespace düzeltmesi; warning dahi gate'i kırmalı. |
| CAD-09 | P1 | Global canvas monkeypatch'i bütün uygulamayı etkiliyor. | `HTMLCanvasElement.prototype.getContext` değiştirilip tüm WebGL context'lerinde `preserveDrawingBuffer: true` zorlanıyor. | Global prototype değişikliği kaldır. Yalnız CAD renderer public context ayarı veya ayrı offscreen/vector magnifier yolu kullan. |
| CAD-10 | P2 | Büyüteç performans ve görünür alan riski taşıyor. | Desktop lens 240×264 px ile sağ üst çizimi kapatıyor; WebGL `ReadPixels` GPU stall uyarıları gözlendi. Stage 7 scripti hâlâ “152 px” PASS metni yazıyor. | Responsive maksimum boyut, pointer/toolbar/panel çakışma çözümü, RAF throttling, gerçek büyük dosyada frame-time/readback ölçümü. |
| CAD-11 | P2 | Mobil katman sheet'i canvas pusulasıyla çakışıyor ve hedefler küçük. | Pusula katman listesinin üzerinde kaldı; kapat 28×28 px, satır aksiyonları 24×24 px, quick tool etkin alanı yaklaşık 32×40 px. | Sheet açılınca canvas overlay'lerini bastır/inert yap; güvenli z-index; en az 44×44 touch target; focus trap ve safe-area. |
| CAD-12 | P2 | Statik Stage 6–9 scriptleri gerçek davranış yerine token arıyor. | Tüm scriptler PASS iken ESLint FAIL ve yukarıdaki UX sorunları mevcut. Stage 7 152 px raporlarken desktop 240 px. | Token testlerini destekleyici statik kontrol düzeyine indir; ana PASS gerçek Playwright assertion'ı ve ölçümden gelsin. |
| CAD-13 | P2 | Bozuk DXF mesajı kullanıcı için fazla genel, console ise gürültülü. | Kullanıcı `parse — Bilinmeyen bir hata oluştu` görüyor; console layer/EOF/Three.js hatalarıyla doluyor. | Güvenli hata sınıflandırması: eksik EOF/section, bozuk tablo/entity, desteklenmeyen içerik. Teknik ayrıntı debug/diagnostics'te; kullanıcıya sade neden + retry/download. |
| CAD-14 | P2 | DWG cold-open uzun ve faz bilgisi yetersiz. | 7,67 MB cache-miss DWG yaklaşık 38,1 sn bekletti. | Cache check, byte fetch, LibreDWG parse, scene build ve fallback fazlarını ölç; kullanıcıya faz/progress/cancel göster; tekrar açılışta gerçekten mümkünse warm cache kullan. |
| CAD-15 | P2 | Test adları yaptığı işi yanlış anlatıyor. | “Native measuredistance” testi gerçek ölçüm sonucu üretmiyor; mevcut mesafe yolu custom controller. “Pan sırasında zero mutation” testi pan hareketini doğrulamıyor. | Test adlarını gerçek sözleşmeyle eşleştir; bir test hem eylemi hem görünür sonucu ispatlamıyorsa PASS sayma. |

## 4. Ürün ve mimari kararları

1. Yeni bir CAD motoru veya özel DWG/DXF parser yazılmayacak.
2. Primary MLightCAD + LibreDWG ve doğrulanmış fallback zinciri korunacak; değişirse aynı aşamada yaşayan mimari belgeler güncellenecek.
3. Viewer salt okunur kalacak. Entity edit/save/version/mutation eklenmeyecek.
4. Pan/zoom/fit, mesafe, alan, katman ve görünüm kontrolleri desktop ve mobilde aynı capability sözleşmesine sahip olacak.
5. Ücretsiz ana kabul APS kapalıyken geçmek zorunda. APS yalnız mevcut terminal fallback rolünde kalabilir.
6. Kullanıcıya görünen bütün yeni metinler Türkçe olacak.
7. Test kolaylığı için production `window` backdoor'u, conditional assertion veya zorunlu fixture `skip` kullanılmayacak.
8. Test artefaktları repo commit'i değil CI artifact/screenshot/rapor olacak.
9. Mevcut kullanıcı `.data` içeriği otomatik temizlenmeyecek. Eski 1000+ test kaydını silmek ayrı ve kullanıcı onaylı bakım işidir.

## 5. Her aşamada zorunlu Gemini çalışma protokolü

Gemini her aşamada aşağıdaki sırayı eksiksiz uygular:

1. `PROJECT.md`, `AGENTS.md`, `.agents/rules/dokumantasyon-kurallari.md`, `.agents/rules/vercel-kurallari.md`, `DOK_CONTEXT_MAP.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` ve bu planı tamamen oku.
2. `git fetch --prune origin`, `git status --short --branch`, `git rev-list --left-right --count HEAD...origin/main` çalıştır.
3. Kullanıcıya ait mevcut değişiklikleri kaydet; silme/reset yapma.
4. Mümkünse yerel değişiklikleri koruyarak `internal-cad-real-user-hardening` çalışma branch'inde ilerle. Yeni branch/push davranışının Vercel deployment üretmediğini `vercel.json` üzerinden doğrula.
5. Yalnız istenen aşamada çalış; sonraki aşamanın kodunu erkenden ekleme.
6. Önce failing test veya ölçülebilir baseline üret; sonra en küçük genel çözümü uygula.
7. Bir testin adı ile gerçekten yaptığı assertion aynı olmalı.
8. Test/ESLint/typecheck/build hatasını gizleme. Warning için de gerekçesiz PASS yazma.
9. Aşamanın bütün zorunlu kapıları geçene kadar devam et. Bir dosyayı değiştirip “devam edelim mi?” diye yarıda durma.
10. Aşama PASS olduğunda tek anlamlı checkpoint oluştur. Kullanıcı istemeden remote push, PR, GitHub write veya Vercel deployment yapma.
11. Mimari/fallback/cache/timeout/test stratejisi değiştiyse aynı aşamada yaşayan dokümanı güncelle.
12. Aşağıdaki raporu ver ve dur:

```markdown
## AŞAMA X/8 SONUÇ RAPORU

- Durum: PASS / FAIL / BLOCKED
- Başlangıç HEAD ve branch:
- Başlangıçtaki kullanıcı değişiklikleri nasıl korundu:
- Değişen dosyalar:
- Uygulanan davranış:
- Çalıştırılan komutlar ve gerçek exit code'ları:
- Browser/ekran/ağ kanıtları:
- Test verisi önce/sonra sayısı:
- Bilinen açıklar:
- Yaşayan doküman güncellemesi:
- Deployment sayacı: Preview N/4, Production N/1
- Sonraki aşamaya geçiş şartı:
- Kalan zorunlu aşama: N
```

## 6. Uygulama aşamaları

---

## AŞAMA 1/8 — Güvenli baseline ve izole test veri düzlemi

### Amaç

Gerçek kullanıcı testlerinin kullanıcı `.data` deposunu kirletmediği, desktop ve mobilde doğru oturum algıladığı, fixture/hash oracle'larının kendi kendini doğrulamadığı güvenilir bir test tabanı kurmak.

### Yapılacaklar

1. Mevcut sekiz dirty CAD dosyasının diff özeti ve SHA/fingerprint raporunu üret; hiçbirini resetleme.
2. Yerel storage için yalnız non-production/test ortamında kullanılabilen açık bir test data root'u ekle. Önerilen isim: `DOK_LOCAL_DATA_DIR`.
3. Test data root'unu `process.cwd()` veya izinli test/scratch kökü altında resolve et; `/`, home veya belirsiz env hedefinde cleanup yapma.
4. Her Playwright run/worker için benzersiz geçici veri dizini oluştur; test sonrasında yalnız doğrulanmış o dizini kaldır.
5. `signInAdmin` helper'ını masaüstü `Yeni Dosya Yükle` butonuna bağlamaktan çıkar. Session endpoint, login formunun kaybolması ve Dokümantasyon workspace işaretiyle desktop/mobile çalışsın.
6. Upload helper'ları oluşturdukları file ID'leri takip etsin; izole run dışında kalıcı test kaydı bırakmasın.
7. Manifest testi fixture bytes'ından gerçek `size` ve SHA-256 yeniden hesaplasın.
8. Known-geometry fixture'ını geçerli DXF handle/entity verisi ve görünür geometriyle yeniden kur:
   - 3000×4000 dikdörtgen;
   - 3-4-5 mesafe çizgisi;
   - ölçüm alanından uzakta fit'i bozan entity yok;
   - `zoomToFit` sonrası bütün oracle noktaları viewport içinde.
9. “Gerçek render” adını taşıyan test gerçek canvas/golden/piksel veya gerçek engine state'i doğrulasın.
10. Eski `.data` içindeki 1000+ kaydı silme; yalnız yeni koşunun sıfır kalıcı iz bıraktığını kanıtla.

### Muhtemel dosyalar

- `src/lib/dokumantasyon/local-store.ts`
- `src/lib/dokumantasyon/runtime-mode.ts`
- `playwright.config.ts`
- `tests/document-studio/cad-test-helpers.ts`
- `tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf`
- `tests/fixtures/cad-preview-v2/manifest.ts`
- `tests/document-studio/cad-preview-v2-contract.spec.ts`
- ilgili test setup/teardown dosyaları

### Zorunlu kapılar

- Aynı seçili 16 test iki kez çalıştırıldığında kullanıcı `.data/dok_db.json` dosya sayısı değişimi: **0**.
- Pixel 7 ve Desktop Chrome login helper PASS.
- Fixture SHA/size dosyadan hesaplanıyor.
- Known geometry `Sığdır` sonrası dört köşe viewport içinde ve canvas boş değil.
- `npx tsc --noEmit --incremental false` PASS.
- Değişen dosyalarda ESLint warning/error: **0**.
- `git diff --check` PASS.

### Aşama sonu

Bu aşama PASS olmadan viewer koduna yeni UX özelliği eklenmez.  
**Kalan zorunlu aşama: 7.**

---

## AŞAMA 2/8 — Mevcut yerel yamanın tip, lifecycle ve render performansı hardening'i

### Amaç

Kullanıcının mevcut mesafe/snap/büyüteç yamasını kaybetmeden; global canvas etkisini, lint hatalarını, hook lifecycle açığını ve readback riskini gidermek.

### Yapılacaklar

1. `HTMLCanvasElement.prototype.getContext` global monkeypatch'ini kaldır.
2. `preserveDrawingBuffer` gerçekten gerekiyorsa yalnız CAD renderer oluşturulurken public/supported context seçeneğiyle scope et. Public yol yoksa:
   - büyüteci mevcut snap primitive/vector katmanından çiz;
   - veya ayrı offscreen CAD render/camera kullan;
   - bütün sayfadaki canvas context'lerini değiştirme.
3. `as any` kullanımlarını gerçek overload/type guard ile kaldır.
4. `useLayoutEffect` dependency listesini doğru tamamla; stale diameter/crop üretme.
5. Desktop 240 px lens kararını yeniden ölç. Lens boyutu viewport'un en fazla `%20` genişliği ve `%35` yüksekliğiyle sınırlandırılsın; toolbar, layer panel ve pointer hedefini kapatmasın.
6. Magnifier update'lerini `requestAnimationFrame` ile sınırla; her pointer move'da pahalı tam-canvas readback yapma.
7. `getNearbyPrimitives` sorgusunda radius/limit sabitleri açıklı ve benchmarklı olsun; bütün catalog fallback'i körlemesine dolaşmasın.
8. Adapter/magnifier teardown'unda listener, RAF, canvas, manager ve object URL kalmadığını test et.
9. Stage 7/9 scriptlerinin 152/240 gibi çelişkili sabit metinlerini gerçek runtime assertion'a dönüştür.

### Zorunlu kapılar

- Hedefli ESLint error/warning: **0**.
- TypeScript PASS.
- Global `HTMLCanvasElement.prototype` mutasyonu kaynak taramasında yok.
- 4,44 MB gerçek DXF'te 10 saniyelik pointer tracking sırasında bounded frame-time ve heap/canvas sayısı.
- Magnifier screenshot'ında gerçek yakın geometri, crosshair ve snap vurgusu görünür.
- Desktop ve mobile lens viewport/panel dışına taşmaz.
- Mevcut mesafe desktop/mobile acceptance testleri PASS.

### Aşama sonu

Mevcut dirty yama bu aşamada ya tam kalite kapısından geçer ya da aşama FAIL kalır; yarım entegrasyon bırakılmaz.  
**Kalan zorunlu aşama: 6.**

---

## AŞAMA 3/8 — Pan, zoom, fit ve görünüm kontrolü ürün sözleşmesi

### Amaç

Fare, trackpad ve dokunmatik kullanıcılarının CAD uygulaması bilgisi olmadan çizimde gezinebilmesini; mobilde kaybolan görünüm seçeneklerine erişebilmesini sağlamak.

### Yapılacaklar

1. Salt-okunur Pan modunda:
   - sol drag pan;
   - orta mouse drag pan;
   - wheel/trackpad zoom;
   - touch tek parmak pan;
   - iki parmak pinch zoom çalışsın.
2. Normal click entity selection/highlight/grip üretmesin; Delete/Backspace source'u değiştirmesin.
3. Quick rail'e açık bir Pan aracı ekle veya her zaman Pan olduğunu görünür şekilde anlat. Aktif ölçüm bitince Pan'a dön.
4. `cad-readonly-contract` içindeki “left drag pan yapmaz” assertion'ını yeni kullanıcı sözleşmesine göre değiştir.
5. “Pan sırasında zero mutation” testi hem kamera merkezinin/pikselin değiştiğini hem mutation olmadığını birlikte kanıtlasın.
6. `Sığdır` gerçek fixture'da bütün görünür extents'i viewport'a almalı; blank/sonsuz zoom üretmemeli.
7. Mobilde gizlenen Gerçek Renk, Siyah-Beyaz, Lineweight ve arka plan renkleri için `Görünüm` popover/sheet ekle.
8. Görünüm seçimi yalnız React attribute'u değil gerçek canvas piksel değişimiyle test edilsin.
9. Keyboard kısayolları input/textarea/contenteditable içinde tetiklenmesin; yardım tooltip/popover'ında gösterilsin.

### Zorunlu kapılar

- Sol drag sonrası kamera merkezi ve canvas hash/pixel değişir.
- Normal click sonrası selection/grip sayısı sıfırdır.
- Trackpad/wheel zoom pointer ankrajını korur.
- Pixel 7 pinch + pan ve Desktop Chrome left/middle drag PASS.
- Mobil görünüm menüsünde dört kontrol erişilebilir ve gerçek canvas'ı değiştirir.
- Kaynak hash/version ve mutation request sayısı değişmez.

### Aşama sonu

**Kalan zorunlu aşama: 5.**

---

## AŞAMA 4/8 — DWG/DXF açılış, cache, loading ve terminal hata UX'i

### Amaç

Cold/warm açılış sürelerini ölçmek, uzun DWG bekleyişini anlaşılır hale getirmek, cache/fallback davranışını doğrulamak ve bozuk dosyada güvenilir terminal sonuç vermek.

### Yapılacaklar

1. Telemetry fazlarını birbirinden ayır:
   - metadata/access;
   - fast cache check;
   - source byte fetch;
   - LibreDWG parse/convert;
   - scene build;
   - first meaningful paint;
   - fallback transition.
2. Kullanıcıya Türkçe faz metni, geçen süre ve güvenli iptal/geri dönüş göster. Sahte yüzde verme; gerçek ilerleme bilinmiyorsa determinate olmayan faz kullan.
3. Cache HIT/MISS istek sayısını ve object URL lifecycle'ını test et.
4. Primary yol kullanılabilir DXF derivative üretiyorsa warm cache'e kontrollü kaydet. Aynı DWG'yi sırf cache için ikinci kez dönüştürme.
5. Cache üretmek primary mimaride gerçekçi değilse bunu yaşayan dokümana yaz; cache varmış gibi telemetry üretme.
6. Route/file değişimindeki beklenen `AbortError` ile gerçek network/worker hatasını ayır; beklenen cancel console error sayılmasın.
7. 27 B bozuk DXF için kullanıcı mesajını sınıflandır:
   - eksik/yarım dosya;
   - parse edilemeyen tablo/entity;
   - desteklenmeyen içerik;
   - erişim/ağ hatası.
8. Kullanıcı mesajında teknik stack gösterme; diagnostics artefaktında error code, engine ve fallback geçmişi tut.
9. Retry aynı dosyada sonsuz fallback döngüsü kurmasın.
10. Büyük dosyada back/navigation manager, worker ve object URL'yi temizlesin.

### Performans kabul bütçesi

- 4,44 MB gerçek DXF local cold-open: başlangıç baseline'ı 5,5 sn; regresyon yok, hedef ≤ 8 sn.
- 7,67 MB gerçek DWG local cold-open: başlangıç baseline'ı 38,1 sn; terminal sonuç ≤ 45 sn.
- Gerçek warm cache oluşuyorsa ikinci açılış hedefi ≤ 8 sn.
- Bozuk küçük DXF terminal sonucu hedefi ≤ 5 sn.
- Süreler aynı makine/koşu profiliyle en az üç tekrar ve median/p95 olarak raporlanır.

### Zorunlu kapılar

- Gerçek DWG cache MISS ve mümkünse HIT kanıtı.
- Loading faz screenshot/timeline kanıtı.
- Bozuk DXF terminal error code + Türkçe metin + retry/download.
- Sonsuz loading/fallback yok.
- File switch sonrası eski worker/canvas/object URL bounded.

### Aşama sonu

**Kalan zorunlu aşama: 4.**

---

## AŞAMA 5/8 — Mesafe ölçümü: keşfedilebilir, hassas ve doğrulanmış UX

### Amaç

Desktop ve mobilde aynı zihinsel modele sahip, snap kullanan, sayısal olarak doğru ve çizimi gereksiz kapatmayan mesafe ölçümü sunmak.

### Etkileşim kararı

- Desktop: iki normal tıklama nokta koyar; hover snap/büyüteç önizlemesi verir.
- Mobil önerisi: kısa tap nokta koyar; long-press büyüteçli hassas seçim modunu açar. Pan yalnız aktif ölçüm dışındayken tek parmak drag ile çalışır.
- Eğer teknik nedenle tap commit seçilmezse, ekranda açık `Basılı tutarak 1. noktayı seçin` metni ve 500 ms progress feedback zorunludur.

### Yapılacaklar

1. Test ve kod adlarında `native measuredistance` yanlışını kaldır; mevcut custom controller gerçeğini doğru adlandır.
2. Pointer modality'ye göre Türkçe yönerge göster.
3. İlk nokta, live rubber-band, snap türü, ikinci nokta ve final sonucu ayrı görünür state'lerle sun.
4. Final sonucu `Intl.NumberFormat("tr-TR")` ile tutarlı formatla. Dosya birimi kesin değilse yanlış `mm/m` yazma; `çizim birimi` veya açık unitless açıklaması kullan.
5. Büyüteç pointer ve önemli geometriyi kapatmasın; layer/snap panel açıkken yeniden konumlansın veya küçülsün.
6. `Esc`, araç düğmesine tekrar basma, file switch, pinch başlangıcı ve unmount temiz iptal üretmeli.
7. Clear yalnız ölçüm overlay'lerini temizlesin; source/layer değişmesin.
8. OSNAP endpoint/midpoint/intersection/center/nearest gerçek geometry üzerinde test edilsin.
9. Bilinen 3-4-5 fixture sonucu UI overlay'inde **5000** olarak doğrulansın; testin kendi `Math.hypot` sonucu PASS kanıtı değildir.

### Zorunlu kapılar

- Desktop click ve mobile tap/precision akışı görünür overlay ile PASS.
- 5000 sonucu gerçek UI/canvas kanıtında tolerans içinde.
- Snap işaretçisi doğru entity noktasında.
- Pan/zoom sonrası tamamlanmış ölçüm geometriye bağlı kalır.
- Klavye ve touch açıklamaları Türkçe ve görünür.
- Source hash/version/mutation değişmez.

### Aşama sonu

**Kalan zorunlu aşama: 3.**

---

## AŞAMA 6/8 — Alan ölçümü: Türkçe komut akışı ve gerçek sayısal oracle

### Amaç

Bugün teknik olarak çalışan fakat İngilizce/native ve ham sayı gösteren alan ölçümünü son kullanıcı ürününe dönüştürmek.

### Yapılacaklar

1. MLightCAD public `measurearea` komutu korunabilir; fakat React host şu Türkçe durumu göstermeli:
   - `1. noktayı seçin`;
   - `Sonraki noktayı seçin`;
   - `Enter: bitir`;
   - `Esc: iptal`;
   - destekleniyorsa `Backspace: son noktayı geri al`.
2. `Specify next point...` gibi İngilizce kullanıcı metni görünmemeli.
3. Bağlamsız native stil toolbar'ı gizle, sadeleştir veya `Ölçüm görünümü` ikincil popover'ına al. Default değerler kullanıcıyı çizim düzenliyormuş gibi göstermemeli.
4. Alan sonucu başlıklı ve Türkçe formatlı olsun: `Alan: 12.000.000,00 çizim birimi²`.
5. Double tap/double click bitirme kararı varsa Enter ile birlikte test et; yanlışlıkla pan/zoom tetikleme.
6. Yarım polygon `Esc`, file switch ve tool switch ile tamamen temizlensin.
7. Alan overlay'i pan/zoom ile geometriye bağlı kalsın.
8. Known rectangle fixture gerçek pointer noktalarıyla 12.000.000 sonucunu üretmeli.
9. Mobilde polygon noktaları, CTA/yönerge ve sonuç ekran dışına taşmamalı.

### Zorunlu kapılar

- Dört gerçek pointer seçimi + Enter sonrası tool `none` ve görünür final overlay.
- UI sonucu 12.000.000 oracle'ıyla tolerans içinde.
- Kullanıcıya görünen İngilizce komut metni sıfır.
- Cancel/clear/file switch cleanup PASS.
- Desktop ve Pixel 7 gerçek pointer akışı PASS.

### Aşama sonu

**Kalan zorunlu aşama: 2.**

---

## AŞAMA 7/8 — Katman, mobil sheet, erişilebilirlik ve CAD dosyasına ulaşma UX'i

### Amaç

Katman yönetimini mobilde çakışmasız ve erişilebilir yapmak; çok dosyalı Dokümantasyon alanında DWG/DXF dosyasına gerçek kullanıcı akışıyla ulaşabilmek.

### Yapılacaklar

1. Mobil layer sheet açıldığında canvas pusulası, quick rail, snap label ve diğer overlay'ler sheet'in üstüne çıkmamalı; arka canvas pointer/focus açısından inert olmalı.
2. Sheet safe-area inset'lerine uysun; portrait/landscape'te viewport dışına taşmasın.
3. Kapat, layer toggle, isolate ve toolbar touch target'ları en az 44×44 CSS px olsun.
4. Focus sheet içine taşınsın; Tab döngüsü panelde kalsın; `Esc` kapatsın; kapanınca focus Katmanlar düğmesine dönsün.
5. `Tümünü Aç`, `Tümünü Kapat`, `Kaynağa Dön`, isolate ve toggle gerçek canvas değişimiyle doğrulansın.
6. Frozen/locked/current/on/off ayrımı yalnız ikonla değil erişilebilir metinle anlatılsın.
7. Mobil quick rail çizimin kritik alanını fazla kapatıyorsa alt araç çubuğu veya açılır kompakt rail tasarımını ölçerek uygula.
8. Dokümantasyon listesinde gerçek kullanıcı şu akışı tamamlasın:
   - AutoCAD (DWG/DXF) filtresi;
   - arama;
   - dosya satırını açma;
   - viewer'dan geri dönünce liste/scroll bağlamını koruma.
9. Yüzlerce öğeyi tek seferde DOM'a basma. Mevcut API sözleşmesine uygun pagination/virtualization seç; 800+ kayıtla DOM node ve ilk etkileşim süresi bütçesi koy.
10. Test fixture tekrarları gerçek kullanıcı listesine sızmamalı; Aşama 1 izolasyon kapısı korunmalı.

### Zorunlu kapılar

- Pixel 7 ve iPhone viewport'unda panel/pusula/rail çakışması yok.
- Touch target ölçümleri ≥ 44×44.
- Keyboard focus trap/restore PASS.
- Layer UI state'i ile canvas piksel/geometri state'i eşleşiyor.
- 800 öğelik sentetik veriyle listede bounded DOM ve kabul edilebilir etkileşim süresi.
- Dashboard → filtre/arama → gerçek DXF/DWG → geri dönüş kullanıcı akışı PASS.

### Aşama sonu

**Kalan zorunlu aşama: 1.**

---

## AŞAMA 8/8 — Gerçek corpus, release kapısı ve yaşayan dokümantasyon

### Amaç

Önceki yedi aşamayı gerçek DWG/DXF dosyaları, browser matrisi, clean build ve doğru kanıtlarla tek release kararına bağlamak.

### Zorunlu corpus

- 4,44 MB gerçek DXF.
- 7,67 MB gerçek DWG.
- Cache HIT ve cache MISS DWG senaryosu.
- 27 B bozuk DXF.
- 3-4-5 mesafe + 3000×4000 alan fixture'ı.
- TEXT 0/90/180/270, MTEXT, ATTRIB/INSERT ve Türkçe karakter fixture'ları.
- on/off/frozen/locked/current layer fixture'ı.
- Eksik font/XREF/proxy object davranışı için kontrollü fixture veya gerçek dosya.
- Hassas gerçek proje dosyaları private corpus'ta kalır; repoya kopyalanmaz.

### Yapılacaklar

1. Tek gerçek gate oluştur: örneğin `npm run check:cad-real-user-release`.
2. Gate yalnız alt scriptlerin varlığını/token'larını değil gerçek exit code ve artefaktlarını doğrulasın.
3. Zorunlu private corpus yoksa release gate `SKIP/PASS` değil **FAIL veya BLOCKED** versin.
4. Desktop Chrome, Edge/Chromium eşdeğeri ve en az Pixel 7 touch matrisi çalışsın. Destek sözü veriliyorsa WebKit/Safari de zorunlu olsun.
5. Gerçek kullanıcı ağ kaydı source/cache/worker isteklerini ve beklenmeyen mutation olmadığını kanıtlasın.
6. File switch/retry/context loss için manager, worker, listener, object URL, canvas ve heap trendi ölçülsün.
7. AutoCAD/GstarCAD/ZWCAD referans crop'larıyla metin yönü, renk, lineweight, layer ve görünür entity karşılaştırması yap.
8. Eksik font/XREF/proxy içerik sessizce kaybolmasın; kullanıcı uyarısı üret.
9. Aşağıdaki yaşayan belgeleri gerçek değişikliğe göre güncelle:
   - `DOK_CONTEXT_MAP.md`
   - `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
   - gerekiyorsa `PROJECT.md`
10. Release evidence içinde commit SHA, corpus hash/size, süreler, browser sürümleri, screenshot yolları ve her PASS'in assertion kaynağı yer alsın.
11. Preview yalnız local/CI kapıları tamamen yeşilken ve kullanıcı açıkça isterse manuel oluşturulsun. Aynı Preview üzerinde bütün smoke testleri bitir.
12. Production yalnız bütün plan PASS, kullanıcı açıkça onaylı ve tek kontrollü deployment olarak yapılabilir.

### Zorunlu kapılar

- Zorunlu corpus'un tamamı gerçek render ve kullanıcı etkileşimiyle PASS; mandatory SKIP sayısı sıfır.
- Desktop, touch ve destek sözü verilen browser matrisi PASS.
- Source hash/version ile mutation request sayısı değişmiyor.
- Lifecycle/performance ölçümleri tanımlı bütçeler içinde.
- TypeScript, hedefli ESLint, production build, gerçek release gate ve `git diff --check` PASS.
- Yaşayan doküman ve release evidence güncel.
- Kullanıcı istemediyse Preview/Production sayacı sıfır kalmış.

### Zorunlu komut matrisi

```powershell
npm ci
npm run prebuild
npx tsc --noEmit --incremental false
npx eslint "src/lib/dokumantasyon/cad-upstream/**/*.ts" "src/components/dokumantasyon/preview/cad-*.tsx" "tests/document-studio/cad-*.ts" "scripts/check-cad-*.ts"
npm run build
npm run check:cad-real-user-release
git diff --check
```

`npm ci` temiz/fresh doğrulama ortamında çalıştırılır; aktif kullanıcı çalışma ağacını gereksiz değiştirmez.

### Release FAIL koşulları

- Gerçek DXF veya DWG blank/terminal başarısız.
- Left drag/trackpad/touch pan çalışmıyor.
- Distance veya area sonucu yalnız test matematiğiyle kanıtlı.
- Mobil görünüm kontrolleri erişilemiyor.
- İngilizce measurement prompt görünüyor.
- Layer panel/pusula çakışıyor veya touch hedefi küçük.
- Testler kullanıcı `.data` deposunu büyütüyor.
- Zorunlu gerçek corpus SKIP.
- ESLint warning/error var.
- Global canvas prototype monkeypatch var.
- Kaynak hash/version veya mutation request değişiyor.
- Living docs güncel değil.
- Vercel URL/deployment id iddiası gerçek kanıtsız.

### Aşama sonu

Bütün kapılar geçerse `RELEASE READY`; aksi halde açıkça `FAIL/BLOCKED`.  
**Kalan zorunlu aşama: 0.**

## 7. Nihai bitti tanımı

- [ ] Testler kullanıcı `.data` alanına sıfır kalıcı kayıt bırakıyor.
- [ ] Fixture SHA/size ve geometry oracle dosyadan/render'dan doğrulanıyor.
- [ ] Gerçek DXF ve DWG açılıyor; blank canvas yok.
- [ ] Cold/warm süre ve loading fazı raporlu.
- [ ] Mouse left/middle, trackpad, touch pan ve zoom çalışıyor.
- [ ] Normal entity selection ve source mutation yok.
- [ ] Mobil görünüm kontrolleri erişilebilir.
- [ ] Mesafe gerçek UI'da sayısal oracle'yı geçiyor.
- [ ] Alan gerçek UI'da sayısal oracle'yı geçiyor.
- [ ] Measurement yönergelerinin tamamı Türkçe.
- [ ] Birim bilinmiyorsa yanlış fiziksel birim yazılmıyor.
- [ ] Snap ve büyüteç büyük gerçek dosyada akıcı ve çakışmasız.
- [ ] Katman paneli canvas ile senkron, mobil/klavye erişilebilir.
- [ ] 800+ kayıtlı listede CAD dosyasına ulaşma akışı kullanılabilir.
- [ ] Bozuk dosya hızlı, sınıflandırılmış terminal sonuç veriyor.
- [ ] Lifecycle/memory/object URL/worker/listener sayıları bounded.
- [ ] Hedefli ESLint, TypeScript, build ve gerçek release gate PASS.
- [ ] Zorunlu gerçek corpus testinde SKIP yok.
- [ ] Yaşayan mimari belgeler güncel.
- [ ] Remote write/deployment bütçesi ihlal edilmedi.

## 8. Gemini için başlangıç promptu

İlk kullanımda Gemini'ye şu prompt verilmelidir:

```text
PLAN/CAD_DWG_DXF_GERCEK_KULLANICI_TEST_VE_IYILESTIRME_PLANI.md dosyasını tamamen oku ve yalnız AŞAMA 1/8'i uygula. Gemini 3.7 Flash High olarak çalış. PROJECT.md, AGENTS.md, ilgili .agents/rules dosyaları, DOK_CONTEXT_MAP.md ve docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md talimatlarına uy. Mevcut sekiz dirty CAD dosyasını kullanıcı değişikliği kabul et; resetleme, stash drop yapma veya üzerine körlemesine yazma. Aşama 1'de test veri izolasyonunu, desktop/mobile login helper'ını, gerçek fixture hash/size kontrolünü ve görünür known-geometry oracle'ını tam bitir. Kullanıcı .data dosya sayısı önce/sonra değişimi 0 olmadan PASS deme. Aşama 2'ye geçme. Kullanıcı istemeden push, PR veya deploy yapma. Sonunda plandaki AŞAMA 1/8 SONUÇ RAPORU formatını eksiksiz ver ve dur.
```

Sonraki aşamalar için yalnız `AŞAMA X/8` sayısı değiştirilir; model planın ilgili aşamasındaki bütün kapıları tamamlar ve bir sonraki aşamaya kendiliğinden geçmez.
