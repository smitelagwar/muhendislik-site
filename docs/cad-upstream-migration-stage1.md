# CAD Upstream Migration — Aşama 1 Dondurma Kaydı

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

## Amaç

Mevcut DWG/DXF sistemini daha fazla custom CAD motoru geliştirerek genişletmeyi durdurmak ve MLightCAD tabanlı upstream transplant için geri alınabilir bir başlangıç noktası oluşturmaktır.

## Dondurulan mevcut yüzey

Aşağıdaki mevcut kodlar rollback ve baseline karşılaştırması için korunur; Aşama 1 sırasında silinmez veya yeni CAD özelliği eklemek amacıyla genişletilmez:

- `src/components/dokumantasyon/preview/cad-viewer.tsx`
- `src/components/dokumantasyon/preview/dxf-viewer-worker.ts`
- `src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts`
- `src/components/dokumantasyon/preview/aps-dwg-viewer.tsx`
- `src/lib/dokumantasyon/dwg/**`
- mevcut custom `dxf-*` modülleri ve bunlara ait fidelity/render testleri

## Bu noktadan sonra yasak

Upstream karşılığı araştırılmadan yeni custom:

- linetype engine,
- HATCH parser,
- wide/variable polyline renderer,
- DWG parser workaround,
- `dxf-viewer` monkey-patch

yazılmaz.

Mevcut kod yalnız kritik production regression düzeltmesi veya rollback güvenliği için değiştirilebilir. Böyle bir değişiklik migration branch'inde açıkça gerekçelendirilmelidir.

## Golden corpus

Aşama 1 kabul kapısı için `tests/private-dwg-corpus/` altında Git'e alınmayan en az 13 gerçek DWG kullanılacaktır:

- en az 5 `small`,
- en az 5 `medium`,
- en az 3 `large`.

Boyut sınıfı eşikleri burada keyfi MB sınırıyla türetilmez; her gerçek dosya `manifest.local.json` içinde temsil ettiği kullanım sınıfına açıkça atanır.

Mümkün olduğunca corpus; kalıp planı, kolon aplikasyonu, kiriş açılımı, mimari plan, HATCH, MTEXT, BLOCK/INSERT, DIMENSION, lineweight, linetype ve farklı kaynak renkleri kapsamalıdır.

## Baseline zorunlu alanları

Her DWG için mevcut sistemde şu gözlemler kaydedilir:

- açılıyor mu (`opens`),
- açılma/terminal sonuca ulaşma süresi (`durationMs`),
- hata (`error`),
- sonsuz loading (`infiniteLoading`),
- renk (`color`),
- linetype (`linetype`),
- lineweight (`lineweight`),
- text (`text`),
- block (`block`),
- hatch (`hatch`).

Baseline'ın amacı mevcut sistemi iyi göstermek değildir; başarısızlıklar da aynen kaydedilir.

## Gizlilik

Gerçek proje DWG'leri ve `manifest.local.json` public repoya commit edilmez. Yalnız anonimleştirilmiş/minimize edilmiş ve paylaşımı güvenli regresyon fixture'ları ileride public test fixture'ına dönüştürülebilir.

## Kabul kapısı

Aşama 2'ye yalnız şu koşullar birlikte sağlandığında geçilir:

1. migration branch mevcut,
2. rollback yüzeyi korunuyor,
3. en az 13 gerçek DWG yerel golden corpus'ta mevcut,
4. dağılım en az 5 small / 5 medium / 3 large,
5. her dosyanın baseline alanları eksiksiz,
6. `node scripts/check-cad-migration-stage1.mjs` `GATE: PASS` veriyor.

Gerçek DWG corpus'u ve baseline tamamlanmadan bu aşama **tamamlandı sayılmaz**.
