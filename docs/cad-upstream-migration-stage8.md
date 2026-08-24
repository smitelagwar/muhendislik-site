# CAD Upstream Migration — Aşama 8 Production Release, Security ve Rollback

Tarih: 24 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

Durum: **TAMAMLANDI / PASS**. Teknik 8 aşamalı migration planı tamamlandı. PR draft ve unmerged bırakılmıştır; production merge/cutover kullanıcı ayrıca istemeden yapılmaz.

## Final kabul özeti

Final doğrulanmış runtime head: `65929191d99ce56d00b7679117db00ace7799628`.

Bu head üzerinde:

- `CAD upstream Stage 5 gate` run `32711917726`: PASS
- `CAD upstream Stage 6 Chromium render probe` run `32711917547`: PASS
- `CAD upstream Stage 7 cleanup gate` run `32711917678`: PASS
- `CAD upstream Stage 8 release gate` run `32711917867`, job `97385005972`: PASS
- `cad-runtime-production` run `32711917679`, job `97385029741`: PASS
- `dxf-fidelity-release` run `32711917828`: PASS
- `vercel-preflight` run `32711917601`: PASS
- `CAD real repository fixtures acceptance` run `32711917629`, job `97385023736`: PASS

Real-file evidence artifact:

- artifact ID: `9514604851`
- artifact SHA-256: `31ee026971fd10532d027d96ff79d2d16a0b33e86392b5fad6b48ee8a5895d85`
- head SHA: `65929191d99ce56d00b7679117db00ace7799628`

## Gerçek repo dosyaları kabulü

`main/eklediklerim/ornek_dosyalar` altındaki gerçek örnekler release kapısına dahil edildi.

Kabul matrisi:

- 3 gerçek DWG: pinned MLightCAD CLI + Chromium ile PNG render PASS
- büyük DXF: pinned MLightCAD CLI + Chromium ile PNG render PASS
- bütün DWG/DXF çıktılarında geçerli PNG, görünür piksel alanı ve çoklu renk kontrolü PASS
- DWF fixture: ayrı DWF structure/parser probe PASS; 1 renderable image page, 0 non-info diagnostic
- production Next build içinde Document Studio `upload → file route → cad-runtime-orchestrator → viewer canvas` entegrasyonu bütün gerçek DWG/DXF fixture'larında PASS
- terminal `CAD görünümü açılamadı` / `DWG açılamadı` / `DXF açılamadı` UI'sı acceptance sırasında görülmedi

Ölçülen pinned CLI render süreleri yaklaşık:

- 3.3 MB DWG: 16 s
- 16 MB DWG: 104 s
- 2.1 MB DWG: 20 s
- 53 MB DXF: 75 s

GitHub shared headless software-GPU zamanı production performans SLA'sı olarak kullanılmaz. Gerçek byte'ların çizilebilirliği aynı job'daki PNG/piksel kanıtıyla; site wiring'i ise Document Studio browser katmanıyla ayrı doğrulanır.

Ayrıca kullanıcı tarafından gerçek masaüstü Chrome'da doğrulanan Vercel Preview:

- deployment: `dpl_BpQCjE2kZuRXvGo8sCjsCCnYDdwd`
- commit: `87994720ae5c62dfe508180f21d2809cd676f19e`
- state: `READY`
- gerçek 3.3 MB DWG, upstream host `ready` durumuna ulaşarak çizildi; `Gerçek Renk`, `Siyah-Beyaz`, `Lineweight` kontrolleri görünür oldu
- deployment error/fatal/warning runtime kaydı bulunmadı

Çalışan `87994720...` runtime ile final doğrulanan `65929191...` arasındaki CAD runtime korunmuştur; son farklar kabul test/contract düzeltmeleridir.

## Exact final Vercel Preview kapısı

Final doğrulanmış head `65929191d99ce56d00b7679117db00ace7799628` için:

- deployment: `dpl_Hg44nHPuGkMFQK8xLdW2vWjL9s1j`
- state: `READY`
- Git commit SHA exact eşleşme: PASS
- `/dokumantasyon`: HTTP 200
- preview error/fatal log sorgusu: temiz
- preview 5xx log sorgusu: temiz

Production alias bu draft kabul sürecinde değiştirilmedi.

## Runtime sahipliği ve fallback

Stage 7 sonrası production DWG ownership `cad-runtime-orchestrator.tsx` üzerindedir.

DWG zinciri:

`Fast cached DXF → direct upstream MLightCAD/LibreDWG → legacy browser DWG→DXF + current DXF viewer → APS-only final`

DXF zinciri:

`direct upstream MLightCAD → current legacy DXF fallback`

Eski viewer rollback/fallback amacıyla yalnız hâlâ canlı olan yollar için korunur; yeni custom DWG/DXF parser veya renderer eklenmez.

## Release exact paketleri

- `@mlightcad/cad-simple-viewer` `1.6.2`
- `@mlightcad/data-model` `1.14.2`
- `@mlightcad/libredwg-converter` `3.14.2`
- transitive `@mlightcad/libredwg-web` `0.7.10`

`latest`, caret veya floating CAD upstream sürümü release kabul edilmez.

Security override'ları:

- `tar` `7.5.22`
- `lodash-es` `4.18.1`

Stage 8 release audit kapısı production dependency graph'ta critical=0 ve migration kaynaklı unresolved high/critical blocker bulunmamasını zorunlu tutar; final release gate PASS olmuştur.

## Lisans / dağıtım kaydı

MLightCAD viewer/data-model MIT lisanslıdır. Browser DWG parser hattında dağıtılan `@mlightcad/libredwg-converter 3.14.2` paket metadata'sı GPL-3.0 olarak kayıtlıdır.

Repository'de:

- `THIRD_PARTY_NOTICES.md` exact sürümleri,
- corresponding-source commit `e3198a391b5c8599a94f1f1da285426443371451`,
- source repository bilgisini,
- dağıtılan Worker/WASM asset'larını

kaydeder.

Build sırasında `/cad-upstream/GPL-NOTICE.txt` üretilir. Bu kayıt hukuki görüş değildir; üçüncü taraf bileşenin lisans/kaynak izlenebilirliğini release artifact'ına dahil eder.

## Runtime timeout bütçeleri

Motorlar bounded kalır. Upstream bütçesi gerçek dosya boyutuna göre kontrollü ölçeklenir:

- Fast cache: `5 s`
- legacy source fetch: `15 s`
- legacy conversion worker: `25 s`
- upstream default / küçük dosya: `35 s`
- upstream > 8 MiB: `120 s`
- upstream > 32 MiB: `180 s`
- APS status/start request: `15 s`
- APS translation total: `180 s`
- APS viewer load: `45 s`

Bu davranış `resolveCadUpstreamTimeoutMs()` ve Stage 5/8 release contract'larıyla kilitlidir.

## Production browser gate

Current production-runtime workflow güncel:

- orchestrator,
- upstream host,
- legacy conversion fallback,
- APS-only final fallback

üzerinde lint, full TypeScript, persistence isolation, production build ve Chromium testleri çalıştırır.

Final `cad-runtime-production` koşusunda production browser gate PASS olmuştur.

DXF release gate ayrıca upstream-primary yolu ve upstream kullanılamadığında legacy worker fallback'ini ayrı doğrular; final koşu PASS olmuştur.

## Rollback

Kabul sırasında doğrulanan mevcut production rollback candidate:

- deployment: `dpl_2nvG6V4GwyH39AbKASYoxQMQ5NLe`
- production main commit: `cb6230035c7ce1f5d58b35b623e120c34e9f4e9d`
- state: `READY`
- Vercel metadata: rollback candidate

Git rollback sınırı ayrıca migration PR/merge commit'i seviyesinde tutulur. CAD migration storage/persistence/auth verisini geri dönüşüm gerektirecek biçimde değiştirmez.

Rollback yalnız kayıt altına alınmıştır; production rollback çalıştırılmamıştır.

## Nihai kabul

Aşağıdaki kriterlerin tamamı PASS:

1. Stage 6 fidelity/parser/Chromium kapıları
2. Stage 7 ownership/cleanup kapısı
3. Stage 8 static release contract
4. exact Worker/WASM + GPL notice asset sync
5. targeted lint ve full TypeScript
6. persistence/auth isolation
7. production Next build
8. production audit critical=0 ve migration blocker kontrolü
9. production Chromium CAD smoke
10. DXF upstream-primary + legacy fallback browser gate
11. gerçek repo DWG/DXF render/piksel kabulü
12. gerçek repo Document Studio upload→viewer integration kabulü
13. final exact-SHA Vercel Preview `READY`
14. `/dokumantasyon` HTTP 200
15. preview error/fatal/5xx kontrolü temiz
16. rollback noktası belgeli
17. PR draft ve unmerged

Sonuç: **Aşama 8 tamamlandı; 8 aşamalı teknik CAD migration planı bitti. Production merge/cutover ayrıca istenmeden yapılmaz.**
