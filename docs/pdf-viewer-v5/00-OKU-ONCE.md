# PDF Studio V5 — Hata Giderme Planı (UYGULAYICI: Gemini 3.8 Flash)

> Hazırlayan: Claude (denetçi). Kaynak: `main` @ `75dbf79` kod okuması + yerel Playwright keşif ölçümleri (kanıtlar §3).
> Kapsam: `/dokumantasyon` PDF v4 motoru (zoom, tuşlar, sayfa geçişi, dokunmatik, bellek, konum kaydı).

## 0. Altın kurallar (pazarlık yok)

1. **Karar verme, uygula.** Seçenek sunma, kullanıcıya soru sorma. Plan belirsizse **dur, blokajı yaz**.
2. **Aynı anda yalnız BİR aşama.** Bitince rapor yaz, dur. Kullanıcı `devam` yazmadan sonraki aşama dosyasını **açma**.
3. **Yeniden yazma / refactor yok.** Yalnız aşama dosyasındaki cerrahi değişiklikler. Dosya bölme, "temizleme", yeniden adlandırma yok.
4. **Dokunma listesi:** CAD/DXF dosyaları (`GEMINI.md` §3), `pdfjs-dist` sürümü (6.3.289 sabit), `/belgeler` içerikleri, `public/vendor/**`.
5. **Kod kuralları:** UI metni ve yorumlar Türkçe; yeni kodda `any` yok; `console.log` yok; mevcut yorumları silme; light/dark tema bozulmaz.
6. **Git:** Aşamalar arasında commit/push YOK. Tüm değişiklikler çalışma ağacında birikir. Push kararı yalnız A6 sonunda kullanıcıya aittir (`AGENTS.md`).
7. **Doğrulama dürüstlüğü:** Exit code 0 ama hata basan komuta PASS deme. Çalıştıramadığını "çalıştırılamadı + neden" yaz.
8. **Önce kırmızı:** Her aşamanın yeni testi değişiklikten ÖNCE çalıştırılır ve kırmızı görülür. Kırmızı olmayan test hatayı kanıtlamaz → nedenini rapora yaz.
9. **Geri alma:** Aşama 2 denemede yeşile dönmezse yalnız o aşamanın dosyalarını `git restore <dosya>` ile geri al, blokajı raporla.

## 1. TOKEN TASARRUFU kuralları (kaliteden ödün vermeden)

- `pdfjs-studio.tsx` 2558 satırdır: **asla baştan sona okuma.** `Select-String -Pattern <fonksiyon adı>` ile satır bul, `view_file` ile yalnız ±40 satır oku.
- Aşama dosyasında verilen **fonksiyon/değişken adlarıyla** ara; satır numaraları kayabilir.
- Yalnız aşama dosyasının "Dosyalar" listesindeki dosyaları aç. Başka dosya gerekiyorsa önce `Select-String` ile doğrula.
- Testi her düzenlemeden sonra değil, **aşamanın tüm değişikliği bitince** koştur (kırmızı kanıtı + yeşil kapı = 2 koşu; tek istisna: 2. deneme gerekirse).
- Tüm test paketini çalıştırma. Yalnız aşamadaki "Kapı" komutları. `--reporter=line` kullan, çıktıyı `Select-Object -Last 60` ile kes.
- Büyük dosyayı `write_to_file ile baştan yazma`; `replace_file_content` ile tek bloklu düzenle.
- Rapor kısa: şablondaki başlıklar, gereksiz anlatı yok.

## 2. Aşama haritası

| # | Dosya | Amaç | Risk |
|---|-------|------|------|
| A1 | `A1-bellek-sekme-render-dayanikliligi.md` | Sekme değişince beyaz ekran, görünür tuvallerin silinmesi, "Maximum update depth", sessiz render hatası | yüksek |
| A2 | `A2-zoom-yerlesim-tile-rotasyon.md` | Zoom'da sayfanın kaybolması (karışık boyutlu belge), tile seçimi, döndürmede konum kaybı, rotasyon cache hatası | **yüksek** |
| A3 | `A3-klavye-gezinme-konum.md` | Tuş haritası (Ctrl+Shift+-, PageUp/Down, Space, oklar), scrubber, konum kaydı, geçmiş, aramada eşleşmeye kaydırma | orta |
| A4 | `A4-dokunmatik-jest.md` | Kaydırınca arayüzün gizlenmesi/yanlış çift dokunma, lastik bant, tekerlek/animatör çakışmaları | orta |
| A5 | `A5-performans-bellek-uyum.md` | Sayfa temizliği, büyük belge maliyeti, fit-width karışık boyut, DPR değişimi, yazdırma | orta |
| A6 | `A6-kapanis.md` | Tam regresyon, dokümantasyon, push kararı | düşük |

Sıra bağlayıcıdır (A2, A1'in koruma altyapısını kullanır).

## 3. Kanıtlı hata kaydı (özet — ayrıntı aşama dosyalarında)

| ID | Önem | Hata | Kanıt |
|----|------|------|-------|
| H1 | P0 | Sekme gizlenip geri gelince `governor` bütçesi **kalıcı 0** kalır; görünür tuvaller `width=0` (beyaz), yeni sayfalar da anında silinir ama `data-page-state="rendered"` yalan söyler | Ölçüm: dönüşte `sharpBudget:0`, görünür tuval `zeroW:1`, sayfa 20'ye gidince yine `zeroW:1` |
| H2 | P0 | `Governor.setVisible` hiçbir yerde çağrılmıyor → bütçe aşılınca ekrandaki tile'lar da silinir | Kod: `setVisible(` yalnız tanım; ölçüm: 500% zoomda 165 tile'ın 106'sı `width=0` |
| H3 | P0 | Karışık boyutlu belgede (A4+A3) zoom-in'de sayfa yatayda ekran dışına çıkar → **boş ekran** | Ölçüm: 267%'de `viewRectInPage.w=19px`, 400%+ `viewRectInPage=null`; ekran görüntüsü tamamen boş |
| H4 | P0 | `viewRect` null iken tüm sayfa tile'lanır (165 tile/110 MB) ve sayfa içi kaydırmada yeni tile istenmez (efekt scroll'a bağlı değil) | Kod: `pdf-page-host.tsx` efekt 6; ölçüm `tilesInView:0` |
| H5 | P0 | `Maximum update depth exceeded` (tile başına `setGenerations([...prev])`) | Konsol hatası, Next "1 Issue" balonu |
| H6 | P1 | Döndürünce **motor yeniden yaratılır** (efekt bağımlılığı `rotation, toolbarHeight, isMobileLayout`) → okuma konumu 1. sayfaya sıfırlanır, tüm önbellek gider | Ölçüm: sayfa 10'da döndür → `cur:1, scrollTop:0` |
| H7 | P1 | Tile/backdrop anahtarında `rotation` yok → rotasyon sonrası eski yönün görüntüsü cache'ten gelebilir | Kod: `tileKey`, `backdropKey` |
| H8 | P1 | `Ctrl+Shift+-` (saat yönü tersi döndürme) çalışmıyor: `e.key` `"_"` gelir | Ölçüm: tuş sonrası `rot` 90 kaldı |
| H9 | P1 | v4'te `document.getElementById("pdf-page-N")` yok (id yalnız v3'te) → scrubber sürüklerken sayfa kaymaz, okuma konumu kaydında `offsetRatio` hep 0 | Kod: `handleScrubMove`, `performSave` |
| H10 | P1 | Arama "sonraki eşleşme" sayfa başına gider, eşleşmenin kendisine değil; aynı sayfadaki eşleşmelerde hiç kaymaz. `scrollToRect` hiç kullanılmıyor | Kod: `handleNextMatch` |
| H11 | P1 | Arama efekti `scrollToPage`'e bağlı → kenar çubuğu/gece modu/el aracı değişince arama yeniden başlar ve ilk eşleşmeye atlar | Kod: bağımlılık zinciri `scrollToPage→triggerDebouncedSave→performSave` |
| H12 | P1 | Geri/ileri geçmişi ham `scrollTop` saklar; zoom/döndürme sonrası yanlış yere gider | Kod: `handleNavigateBack/Forward` |
| H13 | P1 | Dokunmatik: tek/çift dokunma yalnız `touchend`'e bakar, **kaydırma hareketi de dokunma sayılır** → her kaydırmadan sonra araç çubuğu açılıp kapanır; iki ardışık kaydırma yanlışlıkla zoom yapar | Kod: `input-controller.ts` dokunma efekti (hareket eşiği yok) |
| H14 | P2 | Lastik bant (rubber) ölü kod: `setLiveScale` içindeki `clampScale` aşımı keser | Kod: `engine.setLiveScale` |
| H15 | P2 | Space tuşu sayfa kaydırmaz (el aracına ayrılmış); PageUp/PageDown/↑/↓ yalnız scroller odaktaysa çalışır; Home/End var ama Ctrl+Home yok | Kod: `handleKeyDown` |
| H16 | P2 | Klavye zoom (imleç belge üzerindeyken) `animate:false`; imleç dışındayken animasyonlu → tutarsız | Kod: `handleZoomIn/Out` |
| H17 | P2 | `PdfPageHost` unmount'ta `page.cleanup()` çağırmıyor → büyük belgede bellek sızıntısı | Kod |
| H18 | P2 | Tile/backdrop render hatası sessiz yutulur; sayfa kalıcı boş kalır | Kod: boş `catch` blokları |
| H19 | P2 | `maxScaleForHeight` (40×N) her `clampScale` çağrısında hesaplanır; `computeLayout` her zoom karesinde O(N) | Kod |
| H20 | P2 | `visibleRange` sayfa sayısı sınırsız: %20 zoomda yüzlerce `PdfPageHost` mount olabilir | Kod |
| H21 | P2 | v4'te `pageDimensions` dolmaz → fit-width/fit-page karışık boyutlu belgede hep 1. sayfa boyutunu kullanır | Kod |
| H22 | P3 | Pencere başka monitöre taşınınca/tarayıcı zoom değişince `devicePixelRatio` yeniden okunmaz | Kod |
| H23 | P3 | Yazdırma: gizli (0×0, `visibility:hidden`) iframe bazı tarayıcılarda boş sayfa basar; blob 5 dk sonra siliniyor | Kod; **doğrulanacak** |
| H24 | P3 | İki yazıcı kanalı: `engine.onScroll` zamanlayıcısı jest sırasında scheduler'ı `idle`'a çeker → pinch/zoom sırasında render başlar | Kod: `engine.onScroll` vs `ScrollTracker` |

## 4. Standart akış (her aşama)

1. Aşama dosyasını baştan sona oku.
2. Yeni testleri yaz → **koş → kırmızıyı gör**.
3. Cerrahi değişiklikleri uygula.
4. `npx tsc --noEmit --incremental false` → hatasız.
5. Aşamanın "Kapı" komutları → hepsi yeşil.
6. Rapor yaz (aşağıdaki şablon) ve **dur**.

## 5. Test altyapısı (ortak)

- Config: `playwright.pdf-v4.config.ts` (dev sunucusunu kendisi başlatır, ~40 sn ilk derleme). Yeni testler `tests/pdf-v4/` altında, **gate/bütçe fonksiyonlarını (`assertServerMode`, `recordAndGate`) kullanmaz** (onlar production sunucu ister).
- Masaüstü testleri: `tests/pdf-v4/v5-*.spec.ts` → proje `desktop`.
- Mobil testleri: `tests/pdf-v4/v5m-*.spec.ts` → A1'de `playwright.pdf-v4.config.ts` içinde mobil projenin `testMatch` listesine `"**/v5m-*"`, masaüstü projenin `testIgnore` listesine `"**/v5m-*"` eklenir.
- Fixture: `openPdf(page, "karisik-60" | "karisik-boyut" | "uzun-300" | "metin-1000" | ...)` → `tests/pdf-v4/helpers/viewer.ts`. `.test-data/pdf-v4-fixtures` yoksa `node scripts/generate-pdf-fixtures-v4.mjs`.
- Testler `.agents/rules/test-ve-otomasyon-standardi.md`'ye uyar: `data-testid`, en çok 8 sn eleman bekleme, asılı süreç yok, geçici dosyalar silinir.
- Ortak yardımcı `tests/pdf-v4/helpers/v5.ts` A1'de yazılır; sonraki aşamalar kullanır.
- Dev sunucusunun ürettiği `Maximum update depth` gibi konsol hataları testlerde `page.on("console")` ile toplanıp **0 olması** doğrulanır (A1'den itibaren).

## 6. Rapor şablonu (her aşamada kullanıcıya aynen bu başlıklarla)

```
## A<N> Raporu
Değişen dosyalar: <liste + her biri için +/- satır>
Eklenen testler: <dosya: test adları>
Kırmızı kanıtı: <değişiklikten ÖNCE hangi test neden kırmızıydı>
Kapı sonuçları: <komut → geçti/kaldı sayıları>
Plandan sapma: <yok | madde + neden>
Çalıştırılamayanlar: <yok | madde + neden>
Açık blokaj: <yok | madde>
Sonraki aşama için "devam" bekliyorum.
```
