# CAD / DXF Engine — AI Değişiklik Protokolü

Bu protokol çalışan motoru gelecekte Gemini/Codex/Claude/ChatGPT ile geliştirirken production baseline'ın kaybolmasını engeller.

## 1. İlk soru: görev gerçekten engine değişikliği mi?

### Engine değişikliği DEĞİL

Örnek:

- toolbar ikonları,
- panel yerleşimi,
- tooltip,
- button style,
- metin,
- responsive düzen,
- bağımsız review/annotation UI.

Bu işlerde protected core mümkün olduğunca değişmeden kalır.

### Engine değişikliği

Örnek:

- parser,
- renderer,
- worker protocol,
- engine routing/fallback,
- MLightCAD/LibreDWG/dxf-viewer upgrade,
- pan/zoom render modeli,
- readiness/lifecycle,
- source normalization'ın render anlamını değiştirmek.

Bunlar ancak kullanıcı açıkça engine değişikliği istediğinde yapılır.

## 2. Her engine çalışmasının başlangıcı

Önce:

```bash
git status --short --branch
git branch --show-current
git rev-parse HEAD
git fetch origin --prune
```

Ardından baseline manifesti okunur.

### Backup zorunluluğu

Mevcut çalışan state için geri dönüş noktası olmadan engine değişikliği başlatılmaz.

Tercih:

```text
backup/pre-cad-engine-change-YYYYMMDD-HHMM
```

AI remote çalışıyorsa `AGENTS.md` gereği `internal-*` veya `chatgpt-*` branch kullanır; doğrudan `main` üzerinde deney yapmaz.

## 3. Baseline fingerprint al

En az core dört dosyanın hash'i kaydedilir:

```bash
git hash-object src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx
git hash-object src/components/dokumantasyon/preview/cad-upstream-viewer.tsx
git hash-object src/components/dokumantasyon/preview/cad-viewer.tsx
git hash-object src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```

Engine değişikliği gerekmiyorsa bunların baseline'dan sapması STOP nedenidir.

## 4. Scope'u yazmadan kodlama yok

AI değişikliğe başlamadan önce hangi katmanı değiştirdiğini tek cümleyle sınıflandırır:

```text
ROUTING
UPSTREAM HOST
ADAPTER
FALLBACK VIEWER
DXF WORKER
FIDELITY/NORMALIZATION
VIEW/INTERACTION
UI ONLY
```

Bir görev `UI ONLY` ise parser/worker/routing değişemez.

## 5. Tek seferde engine rewrite yasak

Aşağıdaki yaklaşım yasaktır:

```text
"Mevcut motor karmaşık, daha temiz bir tane yazıyorum."
```

Çalışan production motoru yeni mimariye geçirmek gerekiyorsa:

1. Eski engine silinmez.
2. Yeni engine ayrı candidate/canary olarak eklenir.
3. Routing başlangıçta eski çalışan engine'de kalır.
4. Kullanıcı açıkça cutover kararı vermeden candidate primary yapılmaz.
5. Cutover sonrası bile IGNORE2 baseline restore referansı korunur.

## 6. Dependency değişikliği

Aşağıdakiler engine değişikliğidir:

```text
@mlightcad/cad-simple-viewer
@mlightcad/data-model
@mlightcad/libredwg-converter
dxf-viewer
three veya transitive render dependency davranışı
```

Version yükseltme "maintenance" etiketiyle gizlenemez.

Upgrade yapılacaksa:

- önce changelog/API etkisi okunur,
- tek başına ayrı scope yapılır,
- aynı committe renderer rewrite yapılmaz,
- rollback için eski lockfile/package state korunur.

## 7. Yasak optimizasyonlar

Kullanıcı açıkça istemedikçe:

- custom Canvas2D replacement,
- custom OffscreenCanvas replacement,
- her input eventinde full geometry redraw,
- global `HTMLCanvasElement.prototype` monkeypatch,
- Three.js internallerini global patch,
- parser prototype global override,
- source dosyayı pan/zoom sırasında yeniden parse etme,
- worker'ı kaldırıp parse/renderı main thread'e taşıma,
- failure timeoutlarını tamamen kaldırma,
- error durumunu ready'ye çevirme

yapılmaz.

## 8. Fallback güvenliği

DXF baseline:

```text
upstream → current/legacy fallback
```

DWG baseline:

```text
fast cache → upstream → current fallback → APS
```

Bir engine çalışıyor diye fallback "gereksiz" kabul edilmez. Fallback kaldırılması ayrı ürün kararıdır.

## 9. UI görevi sırasında protected core değişirse

AI şu kontrolü yapar:

```bash
git diff --name-only
```

UI görevi sırasında aşağıdaki dosyalardan biri değişmişse nedenini açıklayamıyorsa revert eder:

```text
cad-runtime-orchestrator.tsx
cad-upstream-viewer.tsx
cad-viewer.tsx
dxf-viewer-worker.ts
src/lib/dokumantasyon/cad-upstream/**
src/lib/dokumantasyon/dxf-*
```

## 10. Restore prosedürü

Engine kırılırsa AI yeni workaround zinciri ekleyerek problemi büyütmez.

Golden:

```text
909c59cb9dcac8e722b3bda4c66fd9d8a25755c8
```

Önce scope belirlenir, sonra ilgili dosyalar Git'ten restore edilir.

```bash
GOLDEN=909c59cb9dcac8e722b3bda4c66fd9d8a25755c8
git restore --source="$GOLDEN" --worktree -- <protected paths>
```

Restore doğrulaması:

```bash
git diff --exit-code "$GOLDEN" -- <restore scope>
```

Birebir restore görevinde AI kodu elle yeniden yazmaz.

## 11. Acceptance yaklaşımı

Gelecekte **bilinçli engine geliştirmesi** yapılırsa yalnız typecheck/build yeterli değildir. En az şu davranışlar korunmalıdır:

- gerçek DXF açılması,
- gerçek çizim görünmesi,
- finite bounds / Fit,
- pan/zoom sonrası çizimin kaybolmaması,
- layer visibility,
- background seçenekleri,
- source/monochrome,
- lineweight,
- worker failure'ın terminal error'a dönüşmesi,
- file switch/unmount cleanup,
- fallback geçişi,
- console/runtime fatal error olmaması.

Ancak kullanıcı yalnız **birebir restore** istediğinde davranış testinin yerine Git tree/blob equality kullanılabilir.

## 12. Yeni baseline kabul protokolü

Yeni engine production'da çalışıyor diye AI kendiliğinden IGNORE2'yi geçersiz ilan edemez.

Yeni baseline ancak kullanıcı açıkça:

```text
"Bunu yeni çalışan baseline olarak kabul et"
```

benzeri karar verirse eklenir.

Sonra:

- yeni deployment ID,
- commit SHA,
- core blob SHA'ları,
- dependency snapshot,
- neden değiştiği

`BASELINE_MANIFEST.md` içine yeni history kaydı olarak eklenir.

IGNORE2 kaydı **silinmez**.

## 13. AI için final kontrol listesi

Engine dosyasına dokunmadan önce:

- [ ] Koruma belgelerini okudum.
- [ ] Kullanıcı gerçekten engine değişikliği istedi.
- [ ] Backup/restore noktası var.
- [ ] Scope tek katmanda tanımlı.
- [ ] Çalışan fallback zincirini biliyorum.
- [ ] Dependency'leri rastgele yükseltmiyorum.
- [ ] UI işi için renderer yeniden yazmıyorum.
- [ ] Golden commit kimliğini koruyorum.

Engine değişikliğinden sonra:

- [ ] Değişen protected dosyaları listeledim.
- [ ] Neden her birinin değiştiğini açıklayabiliyorum.
- [ ] Eski engine'e dönüş yolu hâlâ var.
- [ ] Yeni candidate eski engine'i sessizce silmedi.
- [ ] Kullanıcı onayı olmadan baseline tarihini yeniden yazmadım.
