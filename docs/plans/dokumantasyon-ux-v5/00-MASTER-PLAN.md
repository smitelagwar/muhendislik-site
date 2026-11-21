# Dokümantasyon Modülü UX V5 — Zanaatkarlık, Görsel Mükemmellik & Güç-Kullanıcı Master Planı

> **Sürüm:** UX V5 (V4 üzerine görsel kusurların giderilmesi + güç-kullanıcı özellikleri + modüler mimari)  
> **Tarih:** 2026-11-21  
> **Uygulama Motoru:** **Antigravity Swarm** (`swarm` + `swarm_pane`)  
> **Kesin Model Dağılımı:**
> - **Kodlayıcılar (`coder-*`):** `Gemini 4 Hydrogen (Medium)` (`gemini-4-hydrogen-medium`)
> - **Supervisor & Tüm Denetçiler (`supervisor`, `critic-ux`, `critic-code`):** `Gemini 4 Hydrogen (High)` (`gemini-4-hydrogen-high`)
> - **Final Rapor Şartı:** Uygulama bitiminde gerçek Antigravity transcript verisinden **Coder'lar** ve **Denetçiler/Supervisor** olarak ikiye ayrılmış tam token tüketim raporu üretilir.

---

## 1. Neden UX V5?

UX V4 ile 22 fonksiyonel bug kapandı ve 247 otomatik test geçti; ancak canlı üretim ekranının (`https://muhendislik-site.vercel.app/dokumantasyon`) gözle denetimi ve kodun derinlemesine incelenmesi, yalnız "çalışan buton" seviyesinin üst sınıf bir mühendislik ürün deneyimi için yeterli olmadığını gösterdi:

1. **Seçim görselliği gürültülü ve yorucu:** Her seçili liste satırında 4 kenarlı parlak turuncu çerçeve + dış/iç glow (`dok-workspace.module.css:585-590`) üst üste binip ekranı turuncu ızgara kafesine çeviriyor; kutucuklar içi boş olduğundan okunması zor ve kısmi seçim (`indeterminate`) durumu yok.
2. **Görsel ve yapısal fazlalıklar:** Aynı anda 4 farklı yerde seçim sayısı/kaldırma tekrarı, üst araç çubuğunda 14 sıkışık kontrol, iki ayrı arama kutusu (`Listede süz...` + `Ara... /`), üstteki `Dokümantasyon Modülü` başlığının sticky navbar altında kesilmesine yol açan çift scrollbar düzeni, `.md`/ofis dosyaları için eksik sidebar kategorisi ve `FilterChipsBar`'da `"week"/"month"` etiket uyumsuzluğu.
3. **Eksik "Aklıma Gelmeyen" Güç-Kullanıcı Zanaatkarlığı:** Klasörden ayrılmadan `Space` ile **Quick Look** hızlı önizleme, `F2` **satır içi uzantı-korumalı yeniden adlandırma**, **Geri Al (Undo) Toast + `Ctrl+Z`**, **`Ctrl+K` Komut Paleti**, Grid'de **gerçek görsel küçük resimler**, Sidebar'da **katlanabilir Klasör Ağacı + Sürükle-Bırak hedefleri (Klasör / Yıldız / Çöp)**, **URL Deep-Linking** (F5 yapınca alt klasörü kaybetmeme), **Yoğunluk seçici + tercih kalıcılığı**, **`Ctrl+V` ekran görüntüsü/dosya yapıştırma** ve 3.664 satırlık `file-manager.tsx`'in temiz modüllere bölünmesi.
4. **Görsel Doğrulama Eksikliği:** V4'te yalnız DOM testleri koşulduğu için görsel karmaşa fark edilmedi. V5'te **`critic-ux` (`Gemini 4 Hydrogen High`)** her görsel dalgada Light + Dark + Mobil gerçek Playwright ekran görüntülerini gözle incelemeden `ONAY` veremez.

---

## 2. Belge Haritası (Zorunlu Okuma Sırası)

| Sıra | Dosya | İçerik |
|---|---|---|
| 1 | `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/dokumantasyon-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md` | Repo kırmızı çizgileri ve kuralları |
| 2 | **[00-MASTER-PLAN.md](./00-MASTER-PLAN.md)** | Genel mimari, 18 kalemlik kapsam, kırmızı çizgiler, dalga planı ve başlatma istemi |
| 3 | **[01-GORSEL-VE-UX-ADLI-DENETIM.md](./01-GORSEL-VE-UX-ADLI-DENETIM.md)** | Canlı ekran görüntüsü ve kaynak koddan çıkarılan `V5-01`..`V5-18` adli bulgu defteri |
| 4 | **[02-SECIM-TOOLBAR-VE-SIDEBAR-YENIDEN-TASARIMI.md](./02-SECIM-TOOLBAR-VE-SIDEBAR-YENIDEN-TASARIMI.md)** | Seçim sistemi, 3-durumlu checkbox, yüzen dock, temiz araç çubuğu, cockpit yüksekliği ve sidebar ağaç/DnD spesifikasyonu |
| 5 | **[03-GUC-KULLANICI-OZELLIKLERI-VE-MODULER-MIMARI.md](./03-GUC-KULLANICI-OZELLIKLERI-VE-MODULER-MIMARI.md)** | Quick Look, Inline Rename, Undo Toast, `Ctrl+K` Komut Paleti, Thumbnail, URL Deep-Link, `Ctrl+V` upload ve `file-manager.tsx` ayrıştırma haritası |
| 6 | **[04-ANTIGRAVITY-SWARM-VE-TOKEN-MUHASEBESI.md](./04-ANTIGRAVITY-SWARM-VE-TOKEN-MUHASEBESI.md)** | Antigravity Swarm organizasyonu (`Medium` Coder + `High` Supervisor/Critics), `swarm_pane` ve gerçek token tüketimi analiz scripti |
| 7 | **[05-GORSEL-VE-COKLU-SENARYO-TEST-MATRISI.md](./05-GORSEL-VE-COKLU-SENARYO-TEST-MATRISI.md)** | V5 Playwright test paketleri, 8 zorunlu görsel kanıt karesi ve kabul kriterleri |
| 8 | **[06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md](./06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md)** | Canlı ilerleme defteri (`W0`..`W5`), `V5-01`..`V5-18` kutucukları ve final token tüketim tablosu |

---

## 3. Kırmızı Çizgiler ve Koruma Kuralları (İHLAL YASAK)

1. **CAD/DXF Altın Motor Koruması (`IGNORE2`):**
   - `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`
   - `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
   - `src/components/dokumantasyon/preview/cad-viewer.tsx`
   - `src/components/dokumantasyon/preview/dxf-viewer-worker.ts`
   - `src/lib/dokumantasyon/cad-upstream/**`, `src/lib/dokumantasyon/cad-runtime/**`, `src/lib/dokumantasyon/dxf-*`, `src/lib/dokumantasyon/dwg/runtime-policy.ts`, `scripts/sync-cad-upstream-assets.mjs`
   - Bu dosyalara **0 satır dokunulur**. Quick Look içinde CAD dosyaları için yalnız metadata + Studio/V2 açılış kartı gösterilir.
2. **Stage 8 Sanal Liste/Kart Koruması (`scripts/check-dok-drive-v3-stage8-visuals.ts`):**
   - `.virtualRow` ve `.virtualCard` öğelerinde `framer-motion` ve `will-change: transform, opacity;` **KESİNLİKLE YASAKTIR**.
   - `dok-workspace.module.css` içinde `.virtualCardSelected` kuralı `border-color: rgba(245, 158, 11, 0.8)` değerini korur (kartlarda zarif çerçeve olarak kalır), ancak `.virtualRowSelected` kuralı ayrılarak 4 kenarlı kutu/kafes kaldırılır.
   - `.virtualCard` yüksekliği `260px` (`h-[260px]`) ve `DRIVE_GRID_ROW_HEIGHT = 276` sözleşmesi korunur (`file-card-visual.spec.ts` uyumu).
3. **Mobil Sözleşme Koruması (`<=1023px`):**
   - Mobilde seçim yalnız açık `Seç` düğmesiyle başlar; touch/pen `contextmenu` asla menü açmaz veya seçim başlatmaz.
   - Minimum `44×44` CSS px dokunma hedefi ve mobil statik 3-eylemli (`Taşı`, `Paylaş`, `Sil`) seçim dock'u korunur.
4. **Sıfır Yeni NPM Paketi:**
   - Yalnız mevcut kurulu paketler (`framer-motion`, `lucide-react`, `radix-ui`, `sonner`, `@tanstack/react-query`, `@tanstack/react-virtual`, `@atlaskit/pragmatic-drag-and-drop`) kullanılır.
5. **Tema, Dil, Tip Güvenliği & Test Hijyeni:**
   - Light + Dark tam eşlik, `prefers-reduced-motion: reduce` uyumu, doğal Türkçe (`latin-ext`), TypeScript `strict` (`any` yasak), `console.log` yasak, `window.confirm()` yasak.
   - Windows PowerShell'de çıplak `curl` yasak (`curl.exe` kullanılır); Playwright'ta `waitUntil: "networkidle"` yasak (`domcontentloaded` + `data-testid` + ≤8 sn timeout).
6. **Deploy / Push Yasağı:**
   - Kullanıcı açıkça istemeden `git push` veya Vercel deploy yapılmaz. Tüm test ve görsel doğrulamalar yerelde tamamlanır.

---

## 4. Kapsam Özeti — 18 Kalem (`V5-01` .. `V5-18`)

| Grup | Kalemler | Ana Hedef |
|---|---|---|
| **A. Görsel & Seçim Yeniden Doğuşu** | `V5-01` .. `V5-04` | Sakin seçili satır şeridi, 3-durumlu dolu `DriveCheckbox`, yüzen masaüstü seçim kapsülü + Tersine Çevir, sıfır başlık kesilmesi / tek ekran cockpit |
| **B. Araç Çubuğu & Sol Panel Zanaatkarlığı** | `V5-05` .. `V5-08` | 14→7 sadeleştirilmiş toolbar, Breadcrumb `←/→` + tıklanabilir `…` menüsü, `Belgeler & Tablolar` kategorisi, katlanabilir Sidebar Klasör Ağacı + Sidebar DnD hedefleri, `FilterChipsBar` `"week"/"month"` bug fix |
| **C. Güç-Kullanıcı ("Aklıma Gelmeyenler")** | `V5-09` .. `V5-15` | `Space` Quick Look galeri önizleme, `F2` uzantı-korumalı satır içi adlandırma, `Ctrl+Z` / Undo Toast, `Ctrl+K` Komut Paleti, Grid lazy görsel thumbnail + zengin liste kolonları, Yoğunluk + `localStorage` + URL Deep-Link, `Ctrl+V` pano ekran görüntüsü yükleme |
| **D. Detay Çekmecesi, Marquee & Mimari** | `V5-16` .. `V5-18` | Warm Amber Marquee + canlı `+N` sayaç, zenginleştirilmiş Detay Çekmecesi (mini önizleme, link kopyala, sürüm bilgisi, tıklanabilir etkinlik), `file-manager.tsx` modüler ayrıştırma |

---

## 5. Dalga Yol Haritası (`W0` → `W5`)

| Dalga | Odak | Çalışan Ajanlar (`Swarm`) | Kapı & Denetim |
|---|---|---|---|
| **W0** | Taban ölçüm + Swarm kurulumu + `plan.json` | `supervisor` (`High`) | Mevcut test/statik taban teyidi, `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` başlangıç kaydı |
| **W1** | Çekirdek tasarım & bileşen yapı taşları: `DriveCheckbox`, `.virtualRowSelected` CSS, `file-categories` (`document`), `FilterChipsBar` fix, `SelectionDock`, `ExplorerToolbar`, `UndoToast` | `coder-1` (`Medium`) ∥ `coder-2` (`Medium`) → `critic-code` (`High`) | `tsc-next`, `explorer-derive.unit.test.ts`, `check:dok-drive-v3:static` |
| **W2** | Güç-Kullanıcı bileşenleri + Sidebar Ağaç/DnD + Detay Çekmecesi + Cockpit Header | `coder-1` (`Medium`: `QuickLookModal`, `CommandPalette`, `ExplorerRowCard`) ∥ `coder-2` (`Medium`: `admin-shell`, `drive-sidebar` tree/DnD, `drive-details-drawer`) → `critic-code` (`High`) | `tsc-next`, `check:dok-drive-v3:static`, sıfır CAD dokunuşu |
| **W3** | `file-manager.tsx` Modüler Entegrasyon (inline rename, URL deep-link, `localStorage`, `Ctrl+V` upload, Warm Amber Marquee, tüm W1+W2 bağlantısı) | Tek `coder-1` (`Medium`) → `critic-code` (`High`) + `critic-ux` (`High`) | `tsc-next`, `check:dok-drive-v3:static`, `npm run build`, masaüstü + mobil duman & ilk görsel kontrol |
| **W4** | V5 Çoklu Senaryo Playwright Testleri + 8 Zorunlu Görsel Kanıt Karesi | `coder-1` (`Medium`: S1–S2 testler) ∥ `coder-2` (`Medium`: S3–S4 + görsel kanıt scripti) → `critic-ux` (`High`, **ekran görüntülerini gözle onaylar**) + `critic-code` (`High`) | Tüm mevcut + yeni `ux-v5-*.spec.ts` %100 PASS, `critic-ux` 8/8 görsel `ONAY` |
| **W5** | Final Kalite Kapısı, Living Docs & **Gerçek Token Muhasebesi Raporu** | `coder-1` (`Medium`: final doğrulama + docs) → `supervisor` (`High`: Python token analiz raporu + final özet) | Tüm final komutlar exit 0 + Coder'lar vs Denetçiler gerçek token raporu `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` içinde |

---

## 6. Final Teslim Kriteri (Hepsi Exit Code 0)

1. `npx tsc -p tsconfig.next.json --noEmit --incremental false`
2. `npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts`
3. `npm run check:dok-drive-v3:static`
4. Değiştirilen tüm dokümantasyon dosyalarında `npx eslint --quiet`
5. `npm run build`
6. `npm run check:dok-drive-v3` (tüm mevcut V3/V4 + yeni `ux-v5-*.spec.ts` testleri)
7. `critic-ux` (`Gemini 4 Hydrogen High`) tarafından 8 zorunlu ekran görüntüsünün gözle `ONAY`lanması
8. `PROJECT.md`, `DOK_CONTEXT_MAP.md`, `docs/DOK_DRIVE_V3_COMMAND_MATRIX.md` ve `06-UYGULAMA-DURUMU-VE-TOKEN-RAPORU.md` güncellenmesi
9. **Gerçek Token Tüketim Raporu:** Coder'lar (`Gemini 4 Hydrogen Medium`) ve Denetçiler/Supervisor (`Gemini 4 Hydrogen High`) olarak ikiye ayrılmış kesin token tablosu.

---

## 7. Swarm'ı Başlatmak İçin Hazır Tek Mesaj (Kullanıcı İçin)

Yeni veya mevcut sohbette `Gemini 4 Hydrogen (Medium)` seçiliyken aşağıdaki istemi yapıştırarak tüm V5 planını Antigravity Swarm üzerinde başlatabilirsiniz:

```text
docs/plans/dokumantasyon-ux-v5/ altındaki planı Antigravity Swarm (swarm + swarm_pane) ile uçtan uca uygula.
Önce yalnız şu 2 dosyayı oku:
1. docs/plans/dokumantasyon-ux-v5/00-MASTER-PLAN.md
2. docs/plans/dokumantasyon-ux-v5/04-ANTIGRAVITY-SWARM-VE-TOKEN-MUHASEBESI.md

Kesin kurallar:
- Ana sohbet (coordinator) ince kalır, kaynak kod yazmaz; swarm{action:"title"} + plan.json oluşturur ve supervisor'ı (model: "gemini-4-hydrogen-high") başlatır.
- Tüm coder-* işçileri kesinlikle model: "gemini-4-hydrogen-medium" olacak.
- supervisor, critic-ux ve critic-code kesinlikle model: "gemini-4-hydrogen-high" olacak.
- Her görsel dalga sonunda critic-ux gerçek Playwright ekran görüntülerini read_file ile inceleyip onaylamadan sonraki dalgaya geçilmeyecek.
- CAD altın motoruna 0 dokunuş, deploy/push yasak.
- Tüm dalgalar (W0→W5) ve final doğrulama bittiğinde, transcript.jsonl verisinden çıkarılan gerçek token tüketim raporunu "Coder'lar (Hydrogen Medium)" ve "Denetçiler & Supervisor (Hydrogen High)" diye ikiye ayırarak ayrıntılı tablo halinde bana raporla.
```
