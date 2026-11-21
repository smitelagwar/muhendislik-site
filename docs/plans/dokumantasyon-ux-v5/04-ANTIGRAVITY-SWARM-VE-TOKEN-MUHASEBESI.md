# 04 — Antigravity Swarm Orkestrasyonu & Gerçek Token Muhasebesi Protokolü

> **ZORUNLU MİMARİ:** Bu plan **Antigravity Native Swarm** (`swarm` + `swarm_pane`) üzerinde çalışır.  
> **Kesin Model Kuralı (Kullanıcı Emri):**
> - **Kodlayıcılar (`coder-1`, `coder-2`):** `gemini-4-hydrogen-medium` (`Gemini 4 Hydrogen (Medium)`)
> - **Supervisor & Tüm Denetçiler (`supervisor`, `critic-code`, `critic-ux`):** `gemini-4-hydrogen-high` (`Gemini 4 Hydrogen (High)`)
> - **Başka model (`XHigh`, `Argon`, `Claude`, `Flash`) KULLANILMAZ.** (Kota tükenirse `swarm{action:"model"}` ile kullanıcıya bildirilerek karar alınır.)

---

## 1. Swarm Kadrosu ve Kesin Sorumluluk Sınırları

| Swarm Adı | Grup (Token Raporu) | Model (`swarm`) | Workspace | Yetki & Sınır |
|---|---|---|---|---|
| `coordinator` *(Ana sohbet)* | Koordinatör *(raporda ayrı satır + toplamda görünür)* | Oturum modeli (`gemini-4-hydrogen-medium`) | `inherit` | **Kod yazmaz, `src/` veya ham log okumaz.** `swarm{action:"title"}` ve `swarm_pane` `plan.json` dosyasını kurar, `supervisor`'ı ekler, yalnız `@coordinator` çağrıldığında kullanıcıya kısa ilerleme özeti ve finalde **Coder'lar vs Denetçiler Token Raporunu** sunar. |
| `supervisor` | **Denetçiler & Supervisor (`High`)** | `gemini-4-hydrogen-high` | `inherit` | Dalga yöneticisi & son hakem. İşleri `coder-1`/`coder-2`'ye böler, `critic-code` ve `critic-ux`'i sırayla çağırır, ping-pong 2 turda bitmezse bağlayıcı karar verir, `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` dosyasını ve **final token muhasebesini** üretir. Kendisi uzun kaynak kod yazmaz. |
| `coder-1` | **Coder'lar (`Medium`)** | `gemini-4-hydrogen-medium` | `inherit` *(ayrık dosya kümesi)* | Asıl kodlama, bileşen çıkarımı, entegrasyon ve test yazımı. Yalnız kendisine atanan dosya listesine dokunur. Kısa (≤12 satır) yapılandırılmış rapor döner. |
| `coder-2` | **Coder'lar (`Medium`)** | `gemini-4-hydrogen-medium` | `inherit` *(ayrık dosya kümesi)* | Paralel ayrık dosya kümesi (W1, W2, W4) kodlayıcısı. `coder-1` ile **sıfır ortak dosya** paylaşır. İşi bittiğinde `waiting` kalır (0 token); W5 bitiminde `kill` edilir. |
| `critic-code` | **Denetçiler & Supervisor (`High`)** | `gemini-4-hydrogen-high` | `inherit` | **Salt-okunur (kod yazmaz).** Diff, mimari kalite, CAD koruma, Stage 8 CSS, tip güvenliği (`any`/lint/tsc), test assert gerçekliği ve regresyon denetimi yapar. `ONAY` veya `RED (max 5 somut düzeltme)` döner. |
| `critic-ux` | **Denetçiler & Supervisor (`High`)** | `gemini-4-hydrogen-high` | `inherit` | **Görsel & UX Denetçisi (kod yazmaz).** Playwright ile üretilen gerçek Light + Dark + Mobil ekran görüntülerini `read_file` ile gözle inceler; seçim estetiği, başlık kesilmesi, hizalama, kontrast, taşma, boşluk ve animasyon kalitesini denetler; `Screenshot:` kanıt satırlarını doğrular. |

> **Neden `workspace: "inherit"` + Matematiksel Ayrık Dosya Sahipliği?**  
> Her paralel dalgada (`W1`, `W2`, `W4`) `coder-1` ve `coder-2`'nin dosya listeleri %100 ayrıktır. Bu sayede `git worktree` / `share` merge çatışması, ek disk kopyalaması ve merge token israfı sıfırlanır; `supervisor` tek çalışma ağacında doğrudan kapı testlerini koşabilir. *(Eğer herhangi bir dalgada aynı dosyaya dokunmak gerekirse, o dalgada yalnız tek `coder-1` çalışır — ör. W3 `file-manager.tsx`.)*

---

## 2. Swarm UI (`swarm_pane`) Kurulumu

Ana sohbet (`coordinator`) ilk adımda:
1. `swarm{action:"title", title:"Dokümantasyon UX V5 — Zanaatkarlık & Güç-UX"}` çağırır.
2. `supervisor`'ı ekler (`model: "gemini-4-hydrogen-high"`, `workspace: "inherit"`).
3. `plan.json` dosyasını `<appDataDir>\brain\<conversation-id>\.system_generated\swarm\plan.json` yoluna yazar:

```json
{
  "goal": {
    "title": "Dokümantasyon UX V5 Craftsmanship Overhaul",
    "line": "Fix selection visuals, add power-UX features, verify with screenshots."
  },
  "tasks": {
    "supervisor": "Manage W0-W5 waves, gates, and token report",
    "coder-1": "Build core UI, power-UX modules, and integration",
    "coder-2": "Build sidebar tree, drawer, cockpit, and V5 tests",
    "critic-code": "Audit diff, CAD guard, types, and test rigor",
    "critic-ux": "Inspect real Light/Dark/Mobile screenshots visually"
  },
  "threads": [
    {
      "id": "t-visual-selection",
      "title": "Selection, Toolbar & Cockpit Visuals",
      "goal": "Calm row selection, filled checkboxes, floating dock, zero header clip.",
      "tasks": ["coder-1", "coder-2", "critic-ux"]
    },
    {
      "id": "t-power-ux",
      "title": "Power-UX & Modular Architecture",
      "goal": "Quick Look, inline rename, undo toast, Ctrl+K palette, thumbnails, URL sync.",
      "tasks": ["coder-1", "coder-2", "critic-code"]
    },
    {
      "id": "t-verify-tokens",
      "title": "Visual Proof, E2E Suite & Token Report",
      "goal": "Pass all V3/V4/V5 suites and produce Coder vs Auditor token accounting.",
      "tasks": ["supervisor", "critic-ux", "critic-code"]
    }
  ]
}
```

4. Görsel kanıt alan ajanlar (`coder-2` / `critic-ux`) ekran görüntülerini **kendi `<appDataDir>\brain\<kendi-conversation-id>\`** klasörüne kaydedip board mesajında her kareyi ayrı satırda bildirir:
   `Screenshot: <tam_dosya_yolu> | Dark tümü seçili sakin satır şeridi ve yüzen dock`

---

## 3. Çakışmasız Dalga & Dosya Sahipliği Haritası (`W0` → `W5`)

### W0 — Başlangıç & Taban (Yalnız `supervisor`)
- `npm run check:dok-drive-v3:static` ve `npx tsc -p tsconfig.next.json --noEmit --incremental false` taban doğrulaması.
- `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` başlangıç kaydı.
- `coder-1`, `coder-2`, `critic-code`, `critic-ux` işçilerini `swarm{action:"add"}` ile kurar.

### W1 — Temel Görsel Yapı Taşları & Filtre/Kategori Motoru (`coder-1` ∥ `coder-2` → `critic-code`)
- **`coder-1` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `src/components/dokumantasyon/dok-workspace.module.css` (`.virtualRowSelected` / `.virtualCardSelected` ayrımı, Warm Amber marquee, Stage 8 %100 uyumlu)
  - `src/components/dokumantasyon/drive-v3/drive-checkbox.tsx` *(yeni)*
  - `src/components/dokumantasyon/drive-v3/selection-dock.tsx` *(yeni)*
  - `src/components/dokumantasyon/drive-v3/explorer-toolbar.tsx` *(yeni)*
  - `src/components/dokumantasyon/drive-v3/workspace-status-bar.tsx` (dock açıkken mükerrer seçim hapını gizleme)
- **`coder-2` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `src/lib/dokumantasyon/file-categories.ts` (`document` kategorisi ekleme)
  - `src/app/api/dokumantasyon/items/route.ts` (`categoryCounts.document` + `type="document"` desteği)
  - `src/components/dokumantasyon/drive-v3/query-client.ts` (`document` kategori tipi)
  - `src/components/dokumantasyon/drive-v3/explorer-derive.ts` (`document` filtresi uyumu)
  - `src/components/dokumantasyon/drive-v3/filter-chips-bar.tsx` (`week`/`month` bug fix + `document` etiketi)
  - `src/components/toast-provider.tsx` (opsiyonel `actionLabel` / `onAction` / `durationMs` Undo desteği)
  - `src/components/dokumantasyon/drive-v3/use-undo-toast.ts` *(yeni)*
  - `tests/dok-drive-v3/explorer-derive.unit.test.ts` (yeni `document` + `week/month` birim testleri)
- **W1 Kapısı (`critic-code`):** `tsc-next` + `explorer-derive.unit.test.ts` + `check:dok-drive-v3:static`.

### W2 — Güç-Kullanıcı Bileşenleri, Cockpit & Sidebar Ağaç/DnD (`coder-1` ∥ `coder-2` → `critic-code`)
- **`coder-1` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `src/components/dokumantasyon/drive-v3/explorer-row-card.tsx` *(yeni — saf CSS, Framer Motion YASAK!)*
  - `src/components/dokumantasyon/drive-v3/quick-look-modal.tsx` *(yeni)*
  - `src/components/dokumantasyon/drive-v3/command-palette.tsx` *(yeni)*
  - `src/components/dokumantasyon/drive-v3/shortcuts-modal.tsx` (yeni kısayollar: `Space`, `Ctrl+K`, `Ctrl+Z`, `Alt+←/→`, `F2`)
- **`coder-2` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `src/components/dokumantasyon/admin-shell.tsx` (tek ekran cockpit yüksekliği, kompakt header, sıfır kesilme)
  - `src/components/dokumantasyon/drive-sidebar.tsx` (`Belgeler & Tablolar` + `Diğer`, tıklanabilir depolama dilimleri, katlanabilir klasör ağacı, Sidebar DnD drop hedefleri: Klasör / Yıldız / Çöp)
  - `src/components/dokumantasyon/drive-details-drawer.tsx` (görsel mini önizleme, link kopyala, sürüm rozeti, çoklu seçim tür dağılımı, tıklanabilir etkinlik)
  - `src/components/dokumantasyon/workspace-filter-sheet.tsx` (`Belgeler & Tablolar` tür seçeneği)
- **W2 Kapısı (`critic-code`):** `tsc-next` + `check:dok-drive-v3:static` + 0 CAD dokunuşu + 0 Framer Motion on virtual rows/cards.

### W3 — `file-manager.tsx` Modüler Entegrasyon (`coder-1` → `critic-code` + `critic-ux`)
> **Tek Sahip Kuralı:** `file-manager.tsx` üzerinde yalnız `coder-1` çalışır.
- **`coder-1` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `src/components/dokumantasyon/file-manager.tsx` (tüm W1 + W2 bileşenlerinin bağlantısı, inline rename, `Space` Quick Look, `Ctrl+K` Command Palette, `Ctrl+Z` Undo Toast, `Ctrl+V` pano dosya yükleme, `Alt+←/→` klasör geçmişi, URL deep-link + `localStorage` tercihleri, yoğunluk modu, Tersine Çevir, Warm Amber marquee `+N` sayaç, Sidebar DnD handler'ları)
  - `src/components/dokumantasyon/drive-v3/context-menu.tsx` (`Hızlı Bakış (Space)` + `Tersine Çevir` entegrasyonu)
  - `src/components/dokumantasyon/drive-v3/command-registry.ts` (yeni komutlar varsa senkron)
- **W3 Kapısı:** `tsc-next` + `check:dok-drive-v3:static` + `npm run build` + mevcut `desktop-real-explorer.spec.ts` ve `file-card-visual.spec.ts` duman koşusu → `critic-code` + `critic-ux` ön görsel denetim.

### W4 — V5 Test Paketi & 8 Zorunlu Görsel Kanıt Karesi (`coder-1` ∥ `coder-2` → `critic-ux` + `critic-code`)
- **`coder-1` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `tests/dok-drive-v3/ux-v5-selection-visuals.spec.ts` *(yeni)*
  - `tests/dok-drive-v3/ux-v5-toolbar-sidebar-tree.spec.ts` *(yeni)*
- **`coder-2` (`gemini-4-hydrogen-medium`) — Sahiplik:**
  - `tests/dok-drive-v3/ux-v5-power-ux-quicklook-palette.spec.ts` *(yeni)*
  - `tests/dok-drive-v3/ux-v5-undo-inline-rename-url.spec.ts` *(yeni)*
  - 8 zorunlu ekran görüntüsünü (bkz. `05-GORSEL-VE-COKLU-SENARYO-TEST-MATRISI.md` §3) Playwright ile gerçek uygulama üzerinden alıp `critic-ux`'e sunar.
- **W4 Kapısı:**
  1. `critic-ux` (`gemini-4-hydrogen-high`): **8 ekran görüntüsünün her birini `read_file` ile gözle inceler.** Turuncu kafes kalıntısı, kesik başlık, taşan metin, kötü kontrast veya hizalama kusuru görürse `RED + somut CSS/JSX düzeltme` verir (max 2 tur).
  2. `critic-code` (`gemini-4-hydrogen-high`): Tüm testlerin gerçekliğini ve exit code 0 koşusunu doğrular.

### W5 — Final Kalite Kapısı, Living Docs & Token Muhasebesi (`coder-1` → `supervisor`)
- **`coder-1` (`gemini-4-hydrogen-medium`):**
  - Final doğrulama zincirini koşar (`tsc-next`, `unit`, `static`, `eslint --quiet`, `npm run build`, `npm run check:dok-drive-v3`).
  - `PROJECT.md`, `DOK_CONTEXT_MAP.md`, `docs/DOK_DRIVE_V3_COMMAND_MATRIX.md` günceller.
- **`supervisor` (`gemini-4-hydrogen-high`):**
  - CAD koruma `git diff` 0-dokunuş teyidi yapar.
  - Aşağıdaki §5 Python scripti ile **gerçek Antigravity transcript verilerinden Token Tüketim Raporunu** hesaplar ve `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` dosyasına yazar.
  - İşi biten tüm işçileri kapatıp `@coordinator`'a final teslim + token raporunu gönderir.

---

## 4. Kota Tasarrufu & Ping-Pong Frenleri

1. **ASLA `@all` yazma:** Her board mesajı yalnız tek hedef `@isim` etiketler.
2. **Kısa Brifing (≤15 satır):** `supervisor`, her `coder` mesajında yalnız dosya listesi, ilgili plan bölümü ve doğrulama komutunu yazar.
3. **Max 2 Düzeltme Turu:** `coder` ↔ `critic-*` arası dalga başına en fazla 2 tur; 2. tur sonunda uyuşmazlık sürerse `supervisor` (`High`) bağlayıcı karar verir.
4. **Ucuz Kapı Önce:** W1 ve W2'de `npm run build` koşulmaz; yalnızca W3 ve W5'te tam build koşulur.
5. **Boştaki Ajan Bedavadır:** `waiting` durumundaki üye mesaj almadıkça 0 token tüketir.

---

## 5. Gerçek Token Tüketimi Muhasebesi Protokolü (ZORUNLU FİNAL ÇIKTISI)

Antigravity, her oturumun ve swarm üyesinin gerçek model çağrılarını şu yolda JSONL olarak kaydeder:
`C:\Users\hsyn\.gemini\antigravity\brain\<conversation-id>\.system_generated\logs\transcript.jsonl`

Her `type == "PLANNER_RESPONSE"` adımında kesin token alanları bulunur:
- `model` (ör. `gemini-4-hydrogen-medium`, `gemini-4-hydrogen-high`)
- `input_tokens` (yeni / taze girdi token'ı)
- `cache_read_tokens` (önbellekten okunan girdi token'ı)
- `output_tokens` (üretilen yanıt + düşünme çıktı token'ı)

### 5.1 Otomatik Token Hesaplama Komutu (`supervisor` W5'te çalıştırır)

`supervisor`, W5 sonunda swarm'daki **tüm üyelerin conversation ID'lerini** (kendi ID'si + `coder-1` + `coder-2` + `critic-code` + `critic-ux` + ana sohbet `coordinator` ID'si) `C:\Users\hsyn\.gemini\antigravity\brain\` altındaki swarm metadata/transcript kayıtlarından toplayarak şu Python komutunu çalıştırır:

```powershell
python -c "
import json, pathlib

# Supervisor, W5 sonunda bu eslestirmeyi aktif swarm uyelerinin gercek conversationId'leri ile doldurur:
AGENTS = [
    # (Grup, RolAdi, ConversationId)
    # ('CODER', 'coder-1', '<conv-id>'),
    # ('CODER', 'coder-2', '<conv-id>'),
    # ('AUDITOR', 'supervisor', '<conv-id>'),
    # ('AUDITOR', 'critic-code', '<conv-id>'),
    # ('AUDITOR', 'critic-ux', '<conv-id>'),
    # ('COORDINATOR', 'coordinator', '<conv-id>'),
]

root = pathlib.Path(r'C:\Users\hsyn\.gemini\antigravity\brain')
rows = []
for grp, name, cid in AGENTS:
    p = root / cid / '.system_generated' / 'logs' / 'transcript.jsonl'
    turns = inp = cache = out = 0
    models = set()
    if p.exists():
        for line in p.read_text(encoding='utf-8').splitlines():
            if not line.strip():
                continue
            d = json.loads(line)
            if d.get('type') == 'PLANNER_RESPONSE':
                turns += 1
                inp += int(d.get('input_tokens') or 0)
                cache += int(d.get('cache_read_tokens') or 0)
                out += int(d.get('output_tokens') or 0)
                if d.get('model'):
                    models.add(d['model'])
    total = inp + cache + out
    billable_non_cache = inp + out
    cache_pct = (cache / (inp + cache) * 100.0) if (inp + cache) > 0 else 0.0
    rows.append((grp, name, ','.join(sorted(models)) or '-', turns, inp, cache, out, billable_non_cache, total, cache_pct))

for grp_label in ('CODER', 'AUDITOR', 'COORDINATOR'):
    subset = [r for r in rows if r[0] == grp_label]
    if not subset:
        continue
    print(f'\n=== {grp_label} ===')
    for r in subset:
        print(f'{r[1]:14} | {r[2]:26} | turns={r[3]:3d} | in={r[4]:>9,d} | cache={r[5]:>10,d} ({r[9]:4.1f}%) | out={r[6]:>8,d} | non_cache={r[7]:>9,d} | total={r[8]:>10,d}')
    print('SUBTOTAL       | ' + f'turns={sum(r[3] for r in subset):3d} | in={sum(r[4] for r in subset):>9,d} | cache={sum(r[5] for r in subset):>10,d} | out={sum(r[6] for r in subset):>8,d} | non_cache={sum(r[7] for r in subset):>9,d} | total={sum(r[8] for r in subset):>10,d}')

grand_total = sum(r[8] for r in rows) or 1
coder_tot = sum(r[8] for r in rows if r[0] == 'CODER')
aud_tot = sum(r[8] for r in rows if r[0] == 'AUDITOR')
coord_tot = sum(r[8] for r in rows if r[0] == 'COORDINATOR')
print(f'\nGRAND TOTAL: {grand_total:,d} | CODER: {coder_tot:,d} ({coder_tot/grand_total*100:.1f}%) | AUDITOR+SUPERVISOR: {aud_tot:,d} ({aud_tot/grand_total*100:.1f}%) | COORDINATOR: {coord_tot:,d} ({coord_tot/grand_total*100:.1f}%)')
"
```

> **Swarm Üye ID Keşfi Notu:** Swarm üyelerinin `conversationId`'leri `C:\Users\hsyn\.gemini\antigravity\brain\<coordinator-id>\.system_generated\swarm\` altındaki roster/board JSON dosyalarından veya `brain/` altında oturum zaman aralığında oluşturulan `transcript.jsonl` dosyalarının ilk adımındaki ajan rol adından otomatik eşleştirilir. Hiçbir sayı tahmin edilmez; okunamayan bir ID varsa açıkça `UNAVAILABLE` olarak belirtilir.

### 5.2 Kullanıcıya Sunulacak Zorunlu Rapor Şeması

Final raporda kullanıcıya **mutlaka 2 ana bölüm + 1 karşılaştırma özeti** sunulur:
1. **Tablo 1 — Coder'lar (`Gemini 4 Hydrogen Medium`):** Her `coder-*` için Tur Sayısı, Taze Girdi (`input_tokens`), Önbellek Okuma (`cache_read_tokens` + `%`), Çıktı (`output_tokens`), Önbelleksiz Net (`in + out`) ve Toplam Token.
2. **Tablo 2 — Denetçiler & Supervisor (`Gemini 4 Hydrogen High`):** `supervisor`, `critic-code`, `critic-ux` için aynı metrikler.
3. **Tablo 3 — Özet Karşılaştırma & Verimlilik Analizi:**
   - Coder'lar toplam payı (`%`) vs Denetçiler+Supervisor toplam payı (`%`) vs Koordinatör payı (`%`)
   - Çıktı token oranı (`output_tokens` Coder vs Denetçi)
   - Ortalama önbellek isabet oranı (Cache Hit `%`)
   - En çok token harcayan tek ajan ve nedeni (kısa 2 cümlelik değerlendirme).
