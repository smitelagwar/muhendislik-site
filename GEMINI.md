# GEMINI.md — Gemini CLI / Antigravity Çalışma Kuralları

> **ZORUNLU:** Bu repo üzerinde Gemini ile çalışırken önce `PROJECT.md` okunur. Bu dosya, Gemini için proje-özel ek koruma kurallarını tanımlar.

## 1. Genel başlangıç

Her oturumda:

1. `PROJECT.md`
2. `AGENTS.md`
3. görevle ilgili `.agents/rules/*.md`
4. ilgili yaşayan mimari belgeler
5. ancak sonra kaynak kod

okunur.

Gemini mevcut çalışan sistemi tahmin ederek yeniden kurmaz; önce repo gerçekliğini okur.

## 2. CAD / DXF / DWG / DWF görevi için ZORUNLU özel okuma

Görev CAD, DXF, DWG, DWF, CAD toolbar, CAD ölçüm, CAD viewer, parser, renderer, worker, MLightCAD veya LibreDWG ile ilgiliyse **kod değiştirmeden önce** şu sıra zorunludur:

1. `.agents/rules/cad-dxf-engine-koruma.md`
2. `docs/cad-dxf-engine/README.md`
3. `docs/cad-dxf-engine/BASELINE_MANIFEST.md`
4. `docs/cad-dxf-engine/ARCHITECTURE.md`
5. `docs/cad-dxf-engine/VISUAL_INTERACTION_CONTRACT.md`
6. `docs/cad-dxf-engine/AI_CHANGE_PROTOCOL.md`
7. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`

Bu okuma atlanamaz.

## 3. CAD/DXF motoru için varsayılan: DOKUNMA

Çalıştığı bilinen golden referans:

- Vercel Production deployment: `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`
- label / commit message: `IGNORE2`
- Golden Git commit: `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`
- Restore commit: `afbc121923f2de1313801f884f428535334a40cf`

Kullanıcı açıkça engine/parser/renderer/worker/routing değişikliği istemediyse Gemini şu core dosyaları değiştirmez:

```text
src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx
src/components/dokumantasyon/preview/cad-upstream-viewer.tsx
src/components/dokumantasyon/preview/cad-viewer.tsx
src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```

Aynı şekilde aşağıdaki alanlar da engine scope kabul edilir:

```text
src/lib/dokumantasyon/cad-upstream/**
src/lib/dokumantasyon/cad-runtime/**
src/lib/dokumantasyon/dxf-*
src/lib/dokumantasyon/dwg/runtime-policy.ts
scripts/sync-cad-upstream-assets.mjs
```

## 4. Gemini'nin kendi başına vermemesi gereken kararlar

Açık kullanıcı talebi olmadan:

- yeni CAD renderer yazma,
- Canvas2D/OffscreenCanvas replacement yapma,
- MLightCAD'i kaldırma,
- `dxf-viewer` fallback'ini kaldırma,
- parser/worker'ı sadeleştirme veya yeniden yazma,
- dependency sürümü yükseltme,
- fallback sırasını değiştirme,
- pan/zoom render modelini yeniden tasarlama,
- global prototype monkeypatch ekleme,
- "daha temiz mimari" gerekçesiyle çalışan engine'i refactor etme.

Bir UI görevi engine değiştirme izni değildir.

Örnek: kullanıcı toolbar, ikon, renk, panel veya responsive düzen isterse engine core'a dokunmadan çöz.

## 5. Belirsizlik varsa STOP

Aşağıdaki durumda Gemini kendi kararıyla ilerlemez:

- görev engine değişikliği mi UI değişikliği mi net değil,
- protected core dosya değişmeden görev çözülebilir gibi görünüyor,
- yeni çözüm çalışan golden davranışı kaldıracak,
- dependency upgrade gerekiyor,
- fallback kaldırmak gerekiyor,
- backup/restore noktası yok.

Bu durumda kullanıcıya blocker veya karar noktasını bildir.

## 6. Git/GitHub çalışma biçimi

`AGENTS.md` geçerlidir.

Gemini/uzak AI:

- `main` üzerinde deneme yapmaz,
- `internal-*` / `chatgpt-*` benzeri çalışma branch'i kullanır,
- ara commitlerde `[skip ci]` veya `[skip vercel]` kullanır,
- force push yapmaz,
- motor çalışmasını başka alakasız değişikliklerle karıştırmaz.

## 7. Golden restore

Motor bir AI çalışması sırasında bozulursa "benzerini" yeniden yazma. İlgili scope için golden Git tree kullan:

```bash
GOLDEN=909c59cb9dcac8e722b3bda4c66fd9d8a25755c8
git restore --source="$GOLDEN" --worktree -- <protected paths>
```

Birebir restore doğrulaması Git blob/tree equality ile yapılır.

## 8. Yeni baseline kararı

Gemini yeni bir sürümü kendi başına "artık baseline bu" ilan edemez.

Yeni baseline yalnız kullanıcı açıkça kabul ederse `docs/cad-dxf-engine/BASELINE_MANIFEST.md` içine yeni history kaydı olarak eklenir. IGNORE2 golden kaydı silinmez.

---

## Tek cümlelik kural

**CAD/DXF'de çalışan motoru koru; kullanıcı açıkça engine değişikliği istemedikçe engine'i geliştirmeye çalışma.**
