# hsynCAD — Uygulama durumu

> Bu ilerleme kaydı ilk planın tamamlanmış aşamalarını izler. `PLAN.md` orijinal plan kopyasıdır. ASAMA_04 mobil/tablet panel geçişi kod checkpoint'i tamamlandı. ASAMA_05 yalnız yeni `devam` talimatıyla başlar.

```yaml
plan_id: HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: null
next_stage: ASAMA_05
completed_stages: [ASAMA_01, ASAMA_02, ASAMA_03, ASAMA_04]
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
blockers: []
updated_at: "2026-10-26T15:28:19+03:00"
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
