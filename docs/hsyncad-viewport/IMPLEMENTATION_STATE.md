# hsynCAD — Uygulama durumu

> Bu ilerleme kaydı ilk planın tamamlanmış aşamalarını izler. `PLAN.md` orijinal plan kopyasıdır. Kullanıcının yeni `devam` komutu gelmeden ASAMA_02 başlamaz.

```yaml
plan_id: HSYNCAD_IMMERSIVE_VIEWPORT_2026_10_26
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: null
next_stage: ASAMA_02
completed_stages: [ASAMA_01]
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
blockers: []
updated_at: "2026-10-26T14:43:57.280+03:00"
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
