# CAD Upstream Migration — Aşama 7 Cleanup ve Rollback Sınırı

Tarih: 24 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

Stage 7 başlangıç baseline head: `ca86b5d27971d97add065c506baea8f3ba62c6c9`

CI notu: Stage 7 cleanup, main'deki idempotent cleanup-sync workflow'u ile uygulanır; partial cleanup durumu fail-closed kabul edilir.

## Önkoşul: Aşama 6 PASS

Aşama 6 final Chromium run `32668649457`, job `97265957386` başarıyla tamamlandı.

Kanıt:

- 13/13 private gerçek DWG parser corpus PASS; private DWG'ler GitHub/CI'ya yüklenmedi.
- Stage 6 exact upstream pin contract PASS.
- 5/5 public gerçek DWG Chromium render PASS.
- source-color kanıtı PASS.
- gerçek mouse pan, zoom, fit, layer off/on PASS.
- native `LWDISPLAY` görsel farkı PASS.
- evidence artifact ID `9500770801`.
- artifact ZIP SHA-256 `c713ba51b5ef0cf4cb70e662a90653f9574c297993226f9d1bfcaaad7048db26`.

## Reachability sonucu

Stage 7'de dosya adı eski diye kod silinmez. Import/runtime reachability esas alınır.

### Canlı ve korunacak fallback yüzeyi

`cad-viewer.tsx` hâlâ canlıdır; yeni orchestrator üç ayrı durumda mevcut DXF viewer'a döner:

1. native DXF upstream başarısız olursa,
2. DWG Fast cache bir cached DXF döndürürse,
3. upstream DWG başarısız olup legacy browser DWG→DXF dönüşümü geçerli DXF üretirse.

Bu nedenle aşağıdakiler korunur:

- `cad-viewer.tsx` içindeki DXF renderer,
- `dxf-viewer-worker.ts`,
- DXF fidelity/layer/diagnostic altyapısı,
- `dwg-dxf-conversion-worker.ts`,
- `dwg-legacy-conversion-fallback.tsx`,
- `aps-only-dwg-viewer.tsx`.

### Kanıtlanmış dead edge

`aps-dwg-viewer.tsx` Stage 5 öncesi birleşik DWG hattıdır. Yeni production orchestrator DWG'yi bu dosyaya yönlendirmez. `cad-viewer.tsx` içindeki `.dwg → ApsDwgViewer` dalı da yeni orchestrator tarafından çağrılmaz; `CurrentCadViewer` yalnız DXF fallback olarak kullanılır.

Bu nedenle Stage 7'de yalnız:

- `cad-viewer.tsx` içindeki `ApsDwgViewer` importu,
- `cad-viewer.tsx` içindeki eski `.dwg` dalı,
- `aps-dwg-viewer.tsx`

kaldırılır.

Bu cleanup production DWG ownership'ını tek yerde bırakır: `cad-runtime-orchestrator.tsx`.

## CI borcu ve emeklilik

Migration'ın eski aşama workflow'ları ilerleyen aşamaları kasıtlı değişiklik olarak değil regresyon olarak görüyor.

Örnekler:

- eski Stage 3 gate, sonraki aşamalarda değişmesi gereken CAD/runtime yüzeyini hâlâ frozen kabul ediyor,
- eski Stage 4 gate FilePreviewShell'in hâlâ doğrudan eski viewer'a bakmasını bekliyor,
- eski custom DWG→DXF Stage 4–6 zinciri pre-upstream `aps-dwg-viewer.tsx` mimarisini canonical kabul ediyor.

Stage 7'de:

- upstream Stage 3/4/5 tarihsel gate'leri Stage 7 checker varsa güncel ownership sözleşmesine delege edilir,
- pre-upstream custom DWG Stage 4/5/6 workflow'ları emekli edilir,
- DWG→DXF Stage 2 core ve Stage 3 fidelity/cache fallback testleri korunur,
- `cad-runtime-production`, DXF fidelity ve upstream Stage 6 acceptance korunur.

Git geçmişi eski workflow'ların tarihsel kanıtını korur; workflow emekliliği test kanıtını silmez.

## Scope güvenliği

Stage 7 branch değişiklikleri baseline `ca86b5d27971d97add065c506baea8f3ba62c6c9` sonrasında yalnız şu application/migration dosyalarıyla sınırlıdır:

- `src/components/dokumantasyon/preview/cad-viewer.tsx`,
- `src/components/dokumantasyon/preview/aps-dwg-viewer.tsx` (silme),
- `scripts/check-cad-upstream-stage7.mjs`,
- `docs/cad-upstream-migration-stage7.md`.

Auth, storage, persistence, upload/download, share, PDF/image preview veya API veri modeli Stage 7 scope'unda değildir ve değiştirilmez.

## Aşama 7 kabul kapısı

Aşama 8'e geçmek için:

1. `aps-dwg-viewer.tsx` source tree'den kaldırılmış olmalı,
2. `ApsDwgViewer` referansı kalmamalı,
3. `cad-viewer.tsx` canlı DXF fallback olarak kalmalı,
4. `dxf-viewer-worker.ts` kalmalı,
5. `dwg-dxf-conversion-worker.ts` ve legacy conversion fallback kalmalı,
6. `aps-only-dwg-viewer.tsx` final APS fallback olarak kalmalı,
7. FilePreviewShell yalnız production orchestrator'a yönelmeli,
8. Fast → Upstream → current fallback → APS sırası korunmalı,
9. Stage 6 checker PASS olmalı,
10. Stage 7 checker PASS olmalı,
11. targeted lint, site-wide TypeScript ve production build PASS olmalı,
12. Stage 7 application diff'i allowlist dışına çıkmamalı; auth/storage/persistence değişmemeli.

Bu kapıların tamamı PASS olmadan eski fallback yüzeyi daha fazla küçültülmez ve Aşama 8'e geçilmez.
