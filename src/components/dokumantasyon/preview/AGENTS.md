# AGENTS.md — Dokümantasyon CAD Preview Yerel Kuralı

Bu dosya `src/components/dokumantasyon/preview/` altında çalışan AI ajanları için yerel koruma talimatıdır.

## CAD/DXF dosyasına dokunmadan önce

Şunları oku:

1. `/.agents/rules/cad-dxf-engine-koruma.md`
2. `/docs/cad-dxf-engine/README.md`
3. `/docs/cad-dxf-engine/BASELINE_MANIFEST.md`
4. `/docs/cad-dxf-engine/ARCHITECTURE.md`
5. `/docs/cad-dxf-engine/VISUAL_INTERACTION_CONTRACT.md`
6. `/docs/cad-dxf-engine/AI_CHANGE_PROTOCOL.md`

## Protected core

Aşağıdaki dosyalar çalışan engine'in çekirdeğidir:

```text
cad-runtime-orchestrator.tsx
cad-upstream-viewer.tsx
cad-viewer.tsx
dxf-viewer-worker.ts
```

Kullanıcı açıkça engine/parser/renderer/worker/routing değişikliği istemediyse bu dört dosyayı değiştirme.

UI/toolbar/panel görevi motor değişikliği değildir.

## Golden geri dönüş

- Golden commit: `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`
- Restore commit: `afbc121923f2de1313801f884f428535334a40cf`
- Golden Vercel deployment: `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`

Bir AI çalışması engine'i bozarsa yeni renderer icat etmek yerine ilgili protected scope'u golden Git tree'den restore etmeyi değerlendir.

## Kesin yasaklar

Açık kullanıcı izni olmadan:

- custom replacement renderer,
- Canvas2D/OffscreenCanvas engine swap,
- parser/worker rewrite,
- engine routing değişimi,
- fallback kaldırma,
- MLightCAD/dxf-viewer dependency upgrade,
- global prototype patch,
- pan/zoom için source'u tekrar parse etme

yapma.

## Kapsam ilkesi

En dış katmanda çözülebilen bir problem için en iç engine katmanını değiştirme.
