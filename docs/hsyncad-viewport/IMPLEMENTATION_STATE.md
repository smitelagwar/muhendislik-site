# hsynCAD — Uygulama durumu

> Bu ilerleme kaydı ilk planın tamamlanmış aşamalarını izler. `PLAN.md` orijinal plan kopyasıdır. ASAMA_01–ASAMA_06 tamamlandı. Production yayın kanıtı bu çalışma dalında deployment tetiklemeyen ayrı belge checkpoint'idir.

```yaml
plan_id: HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages: [ASAMA_01, ASAMA_02, ASAMA_03, ASAMA_04, ASAMA_05, ASAMA_06]
evidence:
  - stage: ASAMA_01
    check: main_HEAD
    result: PASS
    sha: b60c61b03d49b3c4c1d65d38346f308ed57b7b3a
  - stage: ASAMA_01
    check: production_baseline
    result: PASS
    deployment_id: dpl_G3RdFhu88WTZU7TBND8NagvqfpqJ
    deployment_state: READY
    source_sha: b60c61b03d49b3c4c1d65d38346f308ed57b7b3a
  - stage: ASAMA_01
    check: work_branch
    result: PASS
    branch: internal-hsyncad-viewport
    base_sha: b60c61b03d49b3c4c1d65d38346f308ed57b7b3a
  - stage: ASAMA_01
    check: project_repo_rules_and_sources
    result: PASS
  - stage: ASAMA_01
    check: local_build_and_browser_test
    result: NOT_RUN
    reason: "Runtime container has Node and Python Playwright but no repository checkout or network access for Git clone."
  - stage: ASAMA_02
    check: isolated_component_route_render
    result: PASS
    detail: "CAD path hides Navbar/Footer; other routes including /b/ preserve existing route behavior."
  - stage: ASAMA_02
    check: global_overlay_isolation
    result: PASS_SOURCE
    detail: "BottomNav/BackToTop suppressed on CAD, DeferredCommandPalette and overlay root preserved."
  - stage: ASAMA_02
    check: tsx_syntax_and_mock_logic
    result: PASS
    detail: "Compiled TSX using TypeScript transpileModule; isolated SiteShell mock assertions passed."
  - stage: ASAMA_02
    check: playwright_browser
    result: NOT_RUN
    detail: "New shell.spec.ts tests authored; no accessible complete Next project checkout to execute them in this stage."
  - stage: ASAMA_02
    check: preview_or_production_deployment
    result: NOT_RUN
    detail: "No deployment permitted in ASAMA_02."
  - stage: ASAMA_03
    check: source_layout_contract
    result: PASS_SOURCE
    detail: "Root height 100%, flex body min-height 0, inner inspector and axis scrolling, desktop shell viewport."
  - stage: ASAMA_03
    check: scene_resize_contract
    result: PASS_SOURCE
    detail: "Removed 320px/260px minimum height floors; kept existing Three.js ResizeObserver."
  - stage: ASAMA_03
    check: real_desktop_browser_matrix
    result: NOT_RUN
    detail: "New viewport-desktop.spec.ts authored, full Next checkout/build unavailable. Real application E2E must pass at ASAMA_05."
  - stage: ASAMA_03
    check: preview_or_production_deployment
    result: NOT_RUN
    detail: "No deployment in ASAMA_03."
  - stage: ASAMA_04
    check: mobile_single_pane_source_contract
    result: PASS_SOURCE
    detail: "2D and 3D remain mounted in one cell; switching uses CSS visibility and pointer-events without model remount."
  - stage: ASAMA_04
    check: inspector_a11y_source_contract
    result: PASS_SOURCE
    detail: "Compact drawer modal, inert closed state, backdrop, focus return, Escape and Tab loop."
  - stage: ASAMA_04
    check: keyboard_and_responsive_source_contract
    result: PASS_SOURCE
    detail: "visualViewport keyboard constraint, ribbon/workspace internal scrolling and compact landscape rules."
  - stage: ASAMA_04
    check: mobile_playwright_regression
    result: NOT_RUN
    detail: "Updated existing mobile spec and added compact viewport spec; complete local Next install and browser harness not available."
  - stage: ASAMA_04
    check: vercel_deployment
    result: NOT_RUN
    detail: "No preview or production deploy in stage 04."
  - stage: ASAMA_05
    check: targeted_eslint
    result: PASS
    proof: "GitHub Actions 40331196927; Chromium regression job"
  - stage: ASAMA_05
    check: deployable_typescript_and_production_build
    result: PASS
    proof: "GitHub Actions 40331197236; validate job succeeded"
  - stage: ASAMA_05
    check: playwright_chromium
    result: PASS
    tests: 12
    passed: 12
    failed: 0
    proof: "https://github.com/smitelagwar/muhendislik-site/actions/runs/40331196927"
  - stage: ASAMA_05
    check: preview_deployment_final
    result: PASS
    deployment_id: dpl_87nXJYKGu8wPzvbKRjhDcnA5Wp18
    source_sha: 051d81e1aa8fdcaccdedcdda512d8d58eb72074e
    state: READY
    minimum_observation_seconds: 180
  - stage: ASAMA_05
    check: preview_server_route_smoke
    result: PASS
    detail: "hsyncad, tools, donati-hesabi HTTP 200; hsynCAD app shell without site header; other routes retain navbar"
  - stage: ASAMA_05
    check: repo_wide_health_informational
    result: FAIL_BASELINE
    detail: "Existing unrelated test/script typechecking debt; no hsynCAD runtime typecheck errors"
  - stage: ASAMA_06
    check: github_squash_merge
    result: PASS
    pull_request: 47
    merge_sha: bc625a0ccc35489191cb20644b5aad3eec2aaeda
    original_main_sha: b60c61b03d49b3c4c1d65d38346f308ed57b7b3a
    detail: "Single-parent squash commit; merge tree identical to tested PR head"
  - stage: ASAMA_06
    check: vercel_automatic_production_deployment
    result: PASS
    deployment_id: dpl_EQaXAazyvb5dvhRoVYwpFs7QYPvL
    deployment_commit: bc625a0ccc35489191cb20644b5aad3eec2aaeda
    target: production
    state: READY
    minimum_observation_seconds: 180
    observed_seconds: 333
    public_alias: muhendislik-site.vercel.app
  - stage: ASAMA_06
    check: live_browser_acceptance
    result: PASS
    checks: 18
    reported_pass: 18
    url: https://muhendislik-site.vercel.app/kategori/araclar/hsyncad
    detail: "Desktop fullscreen, 2B/3B, no global bar/footer or document scrollbar, sample model net 8.089 / formwork 83.80 / overlap 0.632, normal tools route restores global chrome and scrolling. Live agent navigated via URL; prior CI independently clicked internal back arrow."
  - stage: ASAMA_06
    check: production_runtime_error_scan
    result: PASS_NO_ERRORS_OBSERVED
    detail: "Vercel production deployment filtered error/fatal logs over 20m had no matches, not proof of absence of all client errors"
blockers: []
updated_at: "2026-10-26T16:49:46+03:00"
```

## Kaynak ve erişim tabanı

- Repo: `smitelagwar/muhendislik-site` / main SHA `b60c61b03d49b3c4c1d65d38346f308ed57b7b3a`.
- Production `dpl_G3RdFhu88WTZU7TBND8NagvqfpqJ` READY, SHA eşleşti.
- GitHub repo yazma yetkisi doğrulandı, `internal-hsyncad-viewport` oluşturuldu.
- `vercel.json` internal/chatgpt dallarında otomatik deploy'u kapatıyor. Ara commit mesajları `[skip ci]` ile tutulur, `main` değiştirilmez.
- `PROJECT.md`, `AGENTS.md`, `.agents/rules/vercel-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `docs/hsyncad-test.md`, `docs/hsyncad-inceleme.md` incelendi.
- Bağımsız hsynCAD motoru Dökümantasyon CAD/DXF motorundan ayrı; hesap/veri modeline dokunulmaz.
- `src/app/kategori/araclar/hsyncad/page.tsx`, `src/components/site-shell.tsx`, `src/components/hsyncad/workbench.tsx`, `workbench.module.css`, `plan2d.tsx`, `scene3d.tsx`, `tests/hsyncad/workbench.spec.ts`, `playwright.hsyncad.config.ts` kaynakları değerlendirildi.
- Mevcut root CSS dış margin/max-width, body clamp ve mobil 2B/3B dikey istiflenme yeni hedefe aykırı. `plan2d.tsx` hâlihazırda ResizeObserver ve wheel zoom kullanıyor.
- `docs/hsyncad-test.md` 26 Ekim'de önceki yerel testlerin başarılı olduğunu raporluyor, **bu oturumda testler yeniden çalıştırılmadı**.
- Uzak bağlantılar: GitHub ve Vercel erişilebilir. Bu sohbet konteynerinde Node ve Python Playwright var ancak repository checkout yok; GitHub alan adı çözülmedi. Sonraki aşamalarda uygun CI/uzak tarayıcı veya izole repo checkout testi gerekiyor.
- Kullanıcı ekran görüntüsündeki genel üst navbar, dış CAD kart boşlukları ve sayfa scrollbarı gözlendi.

## ASAMA_01 kararı

Yalnız bu iki plan/durum belgesi tek dokümantasyon checkpoint'inde kaydedilir; uygulama kaynaklarına hiç dokunulmaz. Preview/Production deploy yapılmaz. ASAMA_02 yalnız ayrı kullanıcı talimatıyla başlatılır.

## ASAMA_02 — CAD rota izolasyonu (2026-10-26T14:52:51+03:00)

- `SiteShell` için **tam yol** eşitliğiyle hsynCAD'e özel `main` dalı eklendi; normal Navbar/Footer üretilmiyor, `/b/` ve diğer rotaların dalı korunuyor.
- `src/components/hsyncad/immersive-shell.module.css` yalnız CAD uygulama kabuğunda 100vh → 100dvh ve overflow:hidden kullanıyor. İç CAD panel ve mobil sahne boylandırması **ASAMA_03/04'te** tamamlanacak; bu ara aşama final tam-ekran UI değildir.
- `GlobalOverlays` CAD'de mobil `BottomNav`/boşluk ve `BackToTop` render etmiyor; komut paleti ve overlay root kalıyor.
- `tests/hsyncad/site-shell.spec.ts` masaüstü/mobil, geri/ileri/refresh, toolbar, normal rota geri dönüş regresyon testlerini içeriyor. Testler henüz Playwright ile çalıştırılmadı.
- İzole route render testi ve TSX sözdizimi kontrolü bu oturumda **PASS**; gerçek tarayıcı ve tam production build henüz doğrulanmadı, ASAMA_05 release kapısında zorunlu.
- Bu aşamada yalnız uygulama kabuğu ve ilgili test/durum değiştirildi. Geometri, metraj, CAD model, CSS iç çalışma yüzeyi, Vercel yapılandırması ve `main` değişmedi.
- Uygulama burada durur. ASAMA_03 için yeni `devam` gerekir.

## ASAMA_03 — Masaüstü viewport/flex yerleşimi (2026-10-26T15:20:19+03:00)

- `workbench.module.css`: dış kart marjin/radius/max-width/gölge ve `height:clamp(...)` kaldırıldı. CAD çalışma alanı `flex:1 1 0`, `min-height:0`; 2B/3B bölmeler viewport'ta kalıyor, inspector/araçlar kendi içinde kayabilir.
- `scene3d.tsx`: yalnız minimum yükseklik 320px ve 260px yerine 0 kullanıldı; 3B motor, kamera/fit, ResizeObserver ve geometri state'i korunuyor.
- `workbench.tsx`: Aks seçenekleri `hcad-axis-options-slot` içinde kısıtlı yükseklikte bağımsız kaydırılıyor; tüm komutlar korunuyor.
- `immersive-shell.module.css`: yalnız hsynCAD'de `100dvh` ve overscroll sınırlandırması; global `html/body` CSS'i yok.
- 1000px altında önceki istifli 2B/3B düzeni, dış document'ı büyütmek yerine geçici olarak yalnız `.hcad-body` içinde kayıyor. Gerçek mobil panel değiştirme `ASAMA_04` kapsamındadır.
- `tests/hsyncad/viewport-desktop.spec.ts`: altı masaüstü çözünürlük, document scroll/overflow, 2B wheel zoom, 3B/plan görünürlüğü, alt komut/durum, koşullu Aks seçenekleri ve internal inspector scroll senaryoları yazıldı; **çalıştırılmadı**.
- Bu aşamanın kaynak kod sözleşmesi statik olarak doğrulandı. Gerçek Chromium/Next tarayıcı E2E, build, typecheck ve detaylı viewport ölçümleri henüz yapılmadı; geçerli PASS iddiası yok. AŞAMA_05 kalite kapısı zorunludur.
- `main` ve Vercel Production korunuyor; deploy yok.
- Durma noktası: AŞAMA_04 için yeni `devam` beklenecek.

## ASAMA_04 — Mobil ve tablet tek-sahne arayüzü (2026-10-26T15:28:19+03:00)

- `workbench.tsx`: 1000px ve altında görünüm değiştirme `2B | 3B` ve `Metraj/Özellikler` tetikleyicisi eklendi. Model, 2B/3B bileşenleri ve geçmiş state'i anahtarla geçişte yeniden mount edilmiyor.
- Inspector, dar ekranda modal panel olarak görüntüleniyor. Kapalı durumda `inert`, görünürlük kilidi, arka plan perdeleme; açık durumda Escape, Tab/Shift+Tab odak döngüsü, kapanışta tetikleyiciye odak geri dönüşü ve role/aria sözleşmesi var.
- Koordinat kutusu mobilde X/Y tuşuyla açılıp kapanıyor; mevcut koordinat ve nokta oluşturma mantığı korunuyor.
- `workbench.module.css`: 1000px altındaki dikey yığılma yerine iki görünüm aynı grid hücresini paylaşıyor; gizli görünüm visibility/pointer-events ile erişilemez. Inspector `hcad-body` içi overlay; ana document scroll yok, inspector/ribbon/kat seçimleri kendi içinde kayabiliyor. 844×390 gibi kısa yatay ekranlar için kompakt kurallar eklendi.
- `visualViewport` yalnız klavye açık olduğunda CAD root yüksekliğini görsel viewport'a indiriyor; global body/html stilleri değişmiyor.
- `tests/hsyncad/workbench.spec.ts`: eski `3B, 2B'nin altında` beklentisi yeni 2B/3B anahtarına çevrildi. Mobil odak/drawer ve pinch/touch temelli senaryolar korundu. Ayrı kompakt viewport matrisi test dosyası eklendi.
- Kod ve seçici seviyesinde statik kontroller yapıldı. **Tam TypeScript build, gerçek Playwright, mobil kamera/viewport ve fiziksel klavye kabulü bu oturumda yapılmadı.** Bunlar AŞAMA_05 kalite kapısında zorunlu. Bu aşamanın başarı iddiası branch'e kod yerleştirilmesidir, gerçek cihaz kabulü değildir.
- `main` değiştirilmedi; Vercel deployment başlatılmadı. AŞAMA_05 yeni `devam` gerektirir.

## ASAMA_05 — CI kalite kapısı açıldı

- Vercel Preview `dpl_9oGY3QdT3vp7zLXxesyyBk6Y85qM`, SHA `761dff5602fdb628a7002c7ed50126e7bd6d6180`, `READY`; üretim TypeScript ve `npm run build` başarıyla tamamlandı; 180 saniyelik minimum aralık beklendi.
- TinyFish canlı tarayıcı incelemesi ilk Preview'de 17 PASS / 1 NOT TESTED raporladı; geri dönünce site headerının yeniden görünmesi doğrudan tıklamayla doğrulanmadı; Playwright kanıtı bunun yerine geçmez.
- CI atlama notu: önceki ara commitlerin `[skip ci]` etiketleri PR #47'de otomatik workflow tetiklemedi. Bu aşamada GitHub PR QA'yı başlatmak için, değişmeyen Production ve deployment-disabled `internal-*` koruması altında, gerçek erişilebilirlik düzeltmesi (mobil JSON düğmelerinin açık aria-label'ları) ile beraber tek kontrollü **QA tetikleyen commit** oluşturuldu. Bu QA checkpoint'te `[skip ci]` bulunmaması Vercel'e yeni otomatik preview başlatmaz; Vercel dal kuralı bunu kapatmıştır.
- `.github/workflows/hsyncad-viewport-validation.yml` hsynCAD pull request'lerinde hedefli ESLint, TypeScript ve 12 civarı Playwright Chromium kontrolünü çalıştıracak. Asıl repo `vercel-preflight` ayrıca Next production build kontrolünü sürdürür.
- CI sonuçları bekleniyor. `main` ve Production değişmedi. CI yeşil olmadan `execution_status: TAMAMLANDI` yazılmaz.

- AŞAMA_05 CI düzeltmesi: `tests/hsyncad/viewport-desktop.spec.ts:43` için `prefer-const` ESLint hatası `const m` ile düzeltildi. Kaynak çalışma ağacında hata veren 1 satır dışında test mantığı değişmedi. GitHub Actions yeniden koşturuluyor; sonuç PASS ilan edilmedi.

- QA runner iyileştirmesi: Playwright `--with-deps` dış Chromium kurulumu çok uzun sürdüğünden, `playwright.hsyncad.config.ts` yalnız `HSYNCAD_BROWSER_CHANNEL=chrome` durumunda GitHub Ubuntu runner'ın ön yüklü Google Chrome'sunu kullanacak şekilde değiştirildi. Yerel testlerde varsayılan Playwright Chromium korunur. Bu çözüm yeni Vercel deployment değil yalnız GH Actions yeniden çalıştırma gerektirir.

- CI Chromium koşusu 40326360859 (commit 544b704) 3 PASS / 9 FAIL buldu: dört mobil viewport'ta document overflow; 768x1024 ve 844x390'da drawer focus görünürlük geçişi; eski fonksiyonel testlerde default Aks tek-tıklama ve 3B rendered mesh sayısının eksenleri de sayması. Bunlar gizlenmedi. Bu checkpoint'te CAD'e route-scoped html/body overflow:clip ve drawer görünürlük geçişinden sonra odak düzeltmesi eklendi, eski test varsayımları güncellendi. Yeniden CI test sonucu bekleniyor. Üretime dokunulmadı.

- CSS Modules derleme güvenliği: route-scoped html/body `:has([data-testid="hsyncad-app-shell"])` scroll kilidi saf global seçici olduğundan CSS Module'den çıkarılarak `src/app/globals.css` içine taşındı; seçici yalnız CAD rotası yüklüyken etkin. Diğer sayfalar etkilenmez.

- CI Chromium 40328466456 = 7 PASS / 5 FAIL: dört küçük mobil ölçüde tarayıcının 469px minimum layout width'e genişlemesi nedeniyle document overflow, bir adet hacim düşümü 0,6315 değerinin floating point sınırında yanlış 0,631 gösterilmesi. Bu checkpoint'te root flex-column doğrudan çocukların `min-inline-size:0`, `inline-size/max:100%` ve shell layout/paint containment uygulandı; CAD sayısal metin gösteriminde yalnız half-step FP toleransı eklendi. Yeniden Playwright kanıtı bekleniyor; tamamlandı raporlanmadı.

- Chromium 40329477958: **11/12 PASS**, mobil viewport kayması dahil düzeldi. Son kalan örnek hacim düşümü `0.6315` yarım ondalık sınırına ilişkin gösterimdir. Hesap motoru `calculateQuantities` / `resolveJunctions` korunarak sadece `number()` metinsel yuvarlama sekiz basamak ara ondalık sabitlemesi ve signed half-up ile düzeltildi. Yeni CI henüz sonucu vermedi.

- QA görsel inceleme: Başarılı 12/12 testin masaüstü ekran görüntüsünde mobil 2B/3B/Metraj butonları yanlışlıkla görünüyordu (CSS `.hcad-workspace-bar > div` özgüllük üstünlüğü). Yalnız mobilde görünür olacak yüksek özgüllüklü selector eklendi; masaüstü Chromium testinde görünmezlik denetimi eklendi. Yeniden 12/12 testi koşulacak.

## ASAMA_05 — Gerçek CI, Preview ve kabul (2026-10-26T16:37:51+03:00)

- Nihai **uygulama/test kodu SHA**: `051d81e1aa8fdcaccdedcdda512d8d58eb72074e` (bu durum dosyası için yazılan dokümantasyon-only `[skip ci]` commit'i bu SHA'nın üzerine gelebilir; kod nesneleri değişmez).
- **Hedefli lint PASS:** GitHub Actions hsynCAD responsive viewport gate: https://github.com/smitelagwar/muhendislik-site/actions/runs/40331196927.
- **Chromium Playwright PASS 12/12:** SiteShell masaüstü/mobil rota dönüşü, 320×568/360×740/390×844/430×932/768×1024/844×390 mobil görünüm, masaüstü 1920×1080 dahil çoklu viewport, CAD çizim/metraj/JSON/persistence/3B orbit/touch ve drawer focus/scroll. Test çıktısı ve ekran görüntüleri aynı GitHub Actions artifact içinde.
- **Production build ve TypeScript PASS:** GitHub Actions `vercel-preflight`, `validate` job: https://github.com/smitelagwar/muhendislik-site/actions/runs/40331197236. Ayrı `repository-health` bilgilendirme kontrolü eski repo-geneli script/test TypeScript borcu nedeniyle FAIL (yeni hsynCAD runtime hatası değildir). Eski bağımsız `Deprem Content Infrastructure` ve `dok-mobile-plan-validation` işleri bu görevden ayrı değerlendirildi.
- **Preview bütçesi:** 3 kontrollü Preview oluşturuldu (maksimum plan kotası 4): 
  1. İlk SHA `761dff5`: `dpl_9oGY3QdT3vp7zLXxesyyBk6Y85qM`, READY, ilk canlı kullanıcı akışı incelemesi; önce 180 saniye kuralı uygulandı.
  2. Ara SHA `583228a`: `dpl_3g9yFoVDL7yWHDNPVEMMBrsLJZFx`, READY, 180 saniye kuralı uygulandı.
  3. **Nihai SHA `051d81e1aa8fdcaccdedcdda512d8d58eb72074e`**: `dpl_87nXJYKGu8wPzvbKRjhDcnA5Wp18`, READY ve `t0+193s` anında yeniden kontrol; **minimum 180 saniye doğrulandı**.
- **Nihai Preview URL:** https://muhendislik-site-q1n2jx7r2-huseying5713-2819s-projects.vercel.app/kategori/araclar/hsyncad (Vercel authentication koruması altında olabilir; Vercel bağlantısı hesabına ait share URL oluşturabilir).
- **Sunucu smoke PASS** (nihai Preview): `/kategori/araclar/hsyncad`, `/kategori/araclar`, `/kategori/araclar/donati-hesabi` hepsi HTTP 200; sadece CAD'de genel navbar HTML'i yok, diğer iki rota onu render ediyor.
- **Tarayıcıda Preview incelemesi:** İlk Preview sürümünde bağımsız tarayıcı ajanı 17 PASS / 1 NOT TESTED raporladı. Bu nihai commit'e ait değildir; nihai commit'in 12/12 Chromium CI sonuçları bağımsız regresyon kanıtıdır. Son uygulama ekran görüntüleri incelendi; masaüstünde mobil 2B/3B/Metraj anahtarı gizli, mobilde görünüyor.
- Kalan kesin sınırlamalar: Edge/Safari gerçek browser matrisi çalıştırılmadı; mobil sanal klavye dış cihaz kabulü ayrıca yapılmadı. Tam depo script/test baseline borcu devam ediyor.
- `main` ve Production hiç değiştirilmedi. PR #47 **draft** kalacak. **ASAMA_06 için yeni `devam` gereklidir**; o aşamada tek squash merge / tek production ve yeniden 180 saniye gözlem uygulanır. Bu aşamada asla production deploy tetiklenmeyecek.


## ASAMA_06 — Final Production ve kapanış

- **Durum:** TAMAMLANDI. Yalnızca `internal-hsyncad-viewport` çalışma dalına bu yayın-sonrası belge checkpoint'i `[skip ci]` ile eklendi; `main` dalına yeni commit ve ikinci Production deployment **oluşturulmadı**. Bu nedenle `main` üzerindeki aynı adlı dosya AŞAMA_05'te kalır; nihai kanıt burada, PR #47 ve sohbet release raporundadır.
- **Merge:** PR https://github.com/smitelagwar/muhendislik-site/pull/47 squash merge, SHA `bc625a0ccc35489191cb20644b5aad3eec2aaeda`, ana dal önceki SHA `b60c61b03d49b3c4c1d65d38346f308ed57b7b3a`; tek parent/tek commit. PR head ve merge commit Git tree SHA `45b2e7fadacb0fe702c14c2e7eba2b97200de134` birebir aynı.
- **Tek Production:** Vercel otomatik `dpl_EQaXAazyvb5dvhRoVYwpFs7QYPvL`, `READY`; SHA doğru; `muhendislik-site.vercel.app` alias bağlandı. Başlangıç `2026-10-26T13:42:28.211Z`; `t0+333s` anındaki gözlemde READY, istenen 180sn minimumun üzerinde.
- **QA:** Chromium Playwright `12/12 PASS`, Github Actions 40331196927; vercel-preflight/Next.js build ve deployable TypeScript PASS, 40331197236. Canlı desktop browser acceptance `18 PASS` (tarayıcı ajanı); `8,089m³` net, `83,80m²` kalıp, `0,632m³` çakışma düşümü. Canlı Araçlar sayfasında normal header ve kaydırma geri geldi. Otomatik CI testi sol ok linkini tıklayarak geçti, canlı ajan ise liste rotasına URL yoluyla gitti; canlıda doğrudan ok tıklaması ayrıca doğrulanmadı.
- **Runtime:** Son 20 dk error/fatal Vercel log sorgusu boş; yerel client errors / tüm browser versiyonları için garantili sıfır hata iddiası yoktur.
- **Bağımsız teknik borç:** Repo genelinde test/script TypeScript denetimi ve Deprem içerik/Document Mobile senaryolarında önceden mevcut kırmızı kontroller devam edebilir; hsynCAD hedefli gate'leri yeşildir. Gerçek Safari/Edge ve fiziksel cihaz sanal klavye matrisi ayrıca çalıştırılmadı.
- **Rollback dayanağı:** Önceki sağlam Production `dpl_G3RdFhu88WTZU7TBND8NagvqfpqJ` (`b60c61b03d49b3c4c1d65d38346f308ed57b7b3a`), bu aşamada rollback gerekmedi.
- **Durma:** Aşamalı plan bitti. Sonraki düz `devam` isteğinde iş yapılmayacak.
