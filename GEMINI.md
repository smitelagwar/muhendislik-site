# GEMINI.md — Gemini CLI / Antigravity Çalışma Kuralları

**Codex/ChatGPT CLI işi varsa ZORUNLU:** Komuttan önce [.agents/rules/codex-cli-kullanimi.md](.agents/rules/codex-cli-kullanimi.md) ve bağlantı verdiği `codex-cli/SKILL.md` okunur.

**Antigravity CLI (`agy`) işi varsa ZORUNLU:** Komuttan önce [.agents/rules/antigravity-cli-kullanimi.md](.agents/rules/antigravity-cli-kullanimi.md) ve orada bağlantısı verilen `antigravity-cli/SKILL.md` okunur.

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

ideCAD masaüstü işinde [kontrol kuralı](.agents/rules/idecad-masaustu-kontrolu.md) ve [güncel kılavuz](docs/hsyncad/IDECAD_DESKTOP_WORKFLOW.md) okunur. Codex Desktop'ta açık kullanıcı onayıyla doğrulanan `scripts/idecad/desktop.py`, Antigravity'nin izole masaüstünde GUI erişimi sağlandığı anlamına gelmez; yardımcı masaüstü sınırını aşmaz. Eski “kullanıcı malzeme diyaloğunu açsın” istemleri güncel çözüm değildir.

ideCAD dosya dönüştürme işinde (.ide11trial → .ide11 veya .ide10) [.agents/rules/hsyncad-ide-donusturme.md](.agents/rules/hsyncad-ide-donusturme.md) kuralı ve `hsyncad-ide-donusturucu` becerisi uygulanır. Dönüşüm için mühendislik portalındaki Hsyncad motoru (`scripts/hsyncad/convert_trial_to_native.ts`) kullanılır; üretilen dosyalar kaynak dosyanın yanına konur.

<!-- ECC_INTEGRATION_START -->
### 1.1 ECC (Everything Claude Code) Entegrasyonu ve Okuma Zorunluluğu

> **ECC DURUMU:** `AKTİF` <!-- ECC_STATUS:ACTIVE -->
> *(Kullanıcı "ecc github reposunu kullanma" veya "deaktive et" dediğinde bu durum `PASİF` yapılır; tekrar "ecc aktive et" dediğinde `AKTİF` yapılır. Komut satırından `npm run ecc:toggle` veya `node scripts/toggle-ecc.mjs` ile de değiştirilebilir.)*

**Gemini isen ecc github reposunu okumalısın:**
- Durum `AKTİF` iken: Gemini bu repodaki `ecc/` dizinini (`ecc/README.md`, `ecc/.gemini/GEMINI.md`, `ecc/agents/`, `ecc/skills/`, `ecc/rules/` vb.) okumak, buradaki mimari ve güvenlik prensiplerini uygulamak ve görevle ilgili becerileri (`ecc/skills/`) rehber almakla yükümlüdür.
- Durum `PASİF` iken: `ecc/` deposunu okuma zorunluluğu yoktur; standart repo kurallarına göre devam edilir.
<!-- ECC_INTEGRATION_END -->

### 1.2 Hakemli Hibrit Alt Ajan Sistemi (Gemini Odaklı)

Kullanıcı "hakemli alt ajan", "hakemli hybrit", "hakemli hibrit", "hakemli hybrid", "hakimli, savcılı, senaristli sistem", "mahkeme sistemi" veya benzeri bir ifade kullandığında `gemini-hakemli-hibrit` becerisi (`SKILL.md`) ve `C:\Users\hsyn\Documents\Notlar\Notlar\Hakemli Hibrit Mahkemesi.md` mimarisi devreye girer. Bu sistem:
- Süreç yöneticisi (kod ve araştırma yapmaz; yalnızca alt ajan dağıtımı ve aşama koordinasyonunu yürütür),
- Bağımsız araştırmacı alt ajanlar (odaklı, kanıt ve birincil kaynak zorunlu araştırma),
- Sistem Savcısı (en sert suçlamaları yapan, zafiyet, açık ve çöküş senaryolarını ortaya koyan iddia makamı),
- Senarist-1 (tarihsel sohbetleri ve kullanıcı profilini modelleyerek tuzak ve stres senaryoları üreten ajan),
- Senarist-2 (senaryoları ve savcılık iddialarını canlı ortamda simüle edip kırılma noktalarını tespit eden adli test ajanı),
- Hata arayan bağımsız denetçiler ve Çözüm Mimarı (açıkları kapatan, çözümü kodlayan ve canlıda uygulayan bilirkişi),
- Yüksek Baş Hakem (tüm aktörlerin dürüstlüğünü, kanıt kalitesini denetleyip nihai adli ilamı açıklayan bağımsız yargıç),
katmanlarından oluşur. Ajan sayıları sabit değildir; görevin kapsam ve karmaşıklığına göre dinamik belirlenir. Diğer hibrit sistemlerini (örn. `hybrid-agent-os`) silmez veya değiştirmez. Model ve akıl yürütme düzeyi (High/Medium/Low) seçiminde tam kimlik (`gemini-3.8-flash-high` vb.) ve CLI'da `--effort` korunur; Antigravity IDE alt ajanlarında ise tam düzeyi aktarmak için `Model: 'inherit'` kullanılır.

### 1.3 Obsidian İkinci Beyin ve Otomatik Hafıza Damıtma Sistemi

Yapay zeka, konuşmalardaki kullanıcı kararlarını ("bundan sonra böyle yap"), kişisel tercihlerini, projelerini/repolarını ve görev sonu özetlerini [.agents/rules/obsidian-otomatik-hafiza.md](.agents/rules/obsidian-otomatik-hafiza.md) doğrultusunda `C:\Users\hsyn\Documents\Notlar` (Obsidian Kasa) içine damıtır. Kasadaki `Kişisel Profil ve Tercihler.md`, `Çalışma Kuralları ve Kararlar.md`, `Projeler ve Repolar.md` ve `Günlük/YYYY-MM-DD.md` dosyaları güncellenir.

## 2. CAD / DXF / DWG / DWF görevi için ZORUNLU özel okuma

V1 viewer, ölçüm, OSNAP, toolbar, markup/inceleme, CAD parser/renderer veya worker görevi varsa koddan önce:
1. `.agents/rules/cad-dxf-engine-koruma.md`
2. **`.agents/rules/cad-v1-review-kurallari.md`** (V1 araç/etkileşim)
3. `docs/cad-dxf-engine/README.md`
4. `docs/cad-dxf-engine/BASELINE_MANIFEST.md`
5. `docs/cad-dxf-engine/ARCHITECTURE.md`
6. `docs/cad-dxf-engine/VISUAL_INTERACTION_CONTRACT.md`
7. `docs/cad-dxf-engine/AI_CHANGE_PROTOCOL.md`
8. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
9. `docs/cad-review-architecture-decisions.md` ve `docs/cad-review-tools.md` (V1 işi)
10. Güncel kaynak, route, feature flag, sabit paket sürümü ve testler.

V1 interaction/review düzeltmesi protected adapter/host'un sınırsız refactor'ı, parser/renderer/worker/fallback upgrade'i değildir. Korunan path'te zorunlu dar değişiklik ancak gerekçe, eski davranış testi ve rollback'le yapılır.

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
