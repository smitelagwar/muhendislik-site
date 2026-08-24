# CAD Upstream Migration — Aşama 8 Production Release, Security ve Rollback

Tarih: 24 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

Durum: **devam ediyor**. Bu belge release kapısını tanımlar; tüm CI, Vercel preview ve security kontrolleri PASS olmadan migration merge/production release yapılmaz.

CI notu: `CAD upstream Stage 8 release gate` main'de aktiftir ve final release evidence bu branch head üzerinden yeniden üretilir.

Final gate retrigger notu: bot tarafından üretilen lockfile senkronizasyonundan sonra PR workflow'larının kullanıcı-tokenlı branch olayıyla yeniden çalıştırılması için bu kayıt eklendi.

Exact-preview retrigger kaydı: `0661b83fbc3db89b4d498c623cffa11627ebbf7f` üzerinde Stage 8 release gate ve `cad-runtime-production` Chromium dahil PASS oldu; ancak Vercel branch alias bir önceki `efba7b779007c5fcc2d75fa3dd41a2d293ddcb43` deployment'ında kaldı. Bu doküman commit'i yalnız final Git-integrated Vercel Preview'ı yeni exact head üzerinde yeniden üretmek içindir; runtime kodu veya release kriteri değiştirmez.

## Önkoşul

Aşama 7 final cleanup gate:

- run `32669281379`
- job `97267444425`
- Stage 6 contract PASS
- Stage 7 ownership PASS
- targeted lint PASS
- site-wide TypeScript PASS
- production build PASS
- Stage 7 application scope allowlist PASS

Stage 7 sonrası production DWG ownership tek yerde: `cad-runtime-orchestrator.tsx`.

Canlı fallback zinciri korunur:

`Fast cached DXF → direct upstream MLightCAD → legacy browser DWG→DXF + current DXF viewer → APS-only final`

## Release exact paketleri

- `@mlightcad/cad-simple-viewer` `1.6.2`
- `@mlightcad/data-model` `1.14.2`
- `@mlightcad/libredwg-converter` `3.14.2`
- transitive `@mlightcad/libredwg-web` `0.7.10`

`latest`, caret veya floating CAD upstream sürümü release kabul edilmez.

## Lisans / dağıtım kaydı

MLightCAD viewer/data-model MIT lisanslıdır. Browser DWG parser hattında dağıtılan `@mlightcad/libredwg-converter 3.14.2` paket metadata'sı GPL-3.0 olarak kayıtlıdır.

Release repository'sinde:

- `THIRD_PARTY_NOTICES.md` exact sürümleri,
- upstream corresponding-source commit `e3198a391b5c8599a94f1f1da285426443371451`,
- source snapshot adresini,
- dağıtılan Worker/WASM asset'larını

kaydeder.

Build sırasında ayrıca `/cad-upstream/GPL-NOTICE.txt` üretilir. Bu kayıt hukuki görüş veya tek başına hukuki uygunluk iddiası değildir; dağıtılan üçüncü taraf bileşenin lisans/kaynak izlenebilirliğini release artifact'ına dahil eder.

## Runtime timeout bütçeleri

Hiçbir CAD motoru sonsuz bekleyemez:

- Fast cache: `5 s`
- legacy source fetch: `15 s`
- legacy conversion worker: `25 s`
- direct upstream total: `35 s`
- APS status/start request: `15 s`
- APS translation total: `180 s`
- APS viewer load: `45 s`

Bu sayılar `scripts/check-cad-upstream-stage8.mjs` ile release contract'a sabitlenir.

## Security kapısı

`npm ci` sırasında görülen bütün dependency audit sayısı tek başına production blocker olarak yorumlanmaz; devDependency ve transitive toolchain bulguları ayrıştırılır.

Final gate:

1. `npm audit --omit=dev --json` çıktısı artifact olarak saklanır.
2. Production dependency graph'ta **critical** severity varsa release FAIL olur.
3. High severity bulguların package/path/advisory kaydı çıkarılır; CAD migration tarafından yeni getirilen dependency ile ilişkiliyse çözülmeden release yapılmaz.
4. `npm audit fix --force` otomatik uygulanmaz; breaking upgrade ile fidelity/runtime kanıtı bozulamaz.
5. Persistence/auth/storage isolation checker PASS olmalıdır.

## Production browser gate

Current production-runtime workflow artık silinen `aps-dwg-viewer.tsx` yerine güncel:

- orchestrator,
- upstream host,
- legacy conversion fallback,
- APS-only final fallback

üzerinde lint/typecheck/build çalıştırır.

Browser smoke:

- native DXF production smoke,
- synthetic invalid DWG'nin bounded şekilde Fast/Upstream/current fallback zincirini geçip APS-only terminal UI'a ulaşması,
- APS yapılandırılmamış durumda kontrollü hata,
- retry + download eylemleri,
- persistence test izolasyonu

doğrulanır.

Gerçek private DWG browser fidelity kanıtı için Aşama 6'daki private parser corpus ve public real-DWG Chromium matrisi kullanılır; private DWG release CI'ya yüklenmez.

## Vercel Preview kapısı

Final branch head için Vercel deployment:

- `READY` olmalı,
- Git commit SHA final Stage 8 head ile eşleşmeli,
- `/dokumantasyon` erişilebilir olmalı,
- build failure bulunmamalı,
- preview runtime error sorgusunda migration kaynaklı yeni fatal/5xx cluster bulunmamalı.

Production'a deploy/alias değiştirme bu draft PR kabul sürecinde otomatik yapılmaz.

## Rollback

Release öncesi bilinen production rollback candidate:

- deployment: `dpl_9wMB1usdHAKdfU6PxrhpshKjDWF2`
- production main commit: `bf94c077eccb9266119bb4b737cc77db87c946da`
- Vercel state: `READY`
- Vercel metadata: rollback candidate

Ek olarak Git rollback sınırı migration PR/merge commit'i seviyesinde tutulur. Storage/persistence/auth schema Stage 7/8'de değiştirilmediği için CAD runtime rollback'i veri geri dönüşümü gerektirmemelidir.

Rollback burada yalnız kayıt altına alınır; şu anda production rollback çalıştırılmaz.

## Aşama 8 kabul kapısı

Planın tamamlanması için:

1. Stage 6 gate PASS,
2. Stage 7 gate PASS,
3. Stage 8 static release contract PASS,
4. exact Worker/WASM + GPL notice asset sync PASS,
5. targeted lint PASS,
6. site-wide TypeScript PASS,
7. persistence/auth isolation PASS,
8. production Next build PASS,
9. production-only npm audit'te critical = 0,
10. migration kaynaklı unresolved production high/critical dependency blocker bulunmaması,
11. production Chromium CAD smoke PASS,
12. final branch Vercel preview `READY`,
13. preview runtime/build kontrolü PASS,
14. rollback deployment ve Git rollback noktası belgelenmiş olmalı,
15. PR draft/unmerged kalmalı; merge/production cutover kullanıcı tarafından ayrıca istenmeden yapılmamalı.

Bu 15 kriter PASS olduğunda Aşama 8 tamamlanır ve 8 aşamalı migration planı teknik olarak bitmiş olur.
