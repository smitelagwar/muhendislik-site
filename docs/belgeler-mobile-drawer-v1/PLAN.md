# Belgeler — Mobil PDF Stüdyosu: "Belge İşlemleri" Çekmecesi Planı (v1)

**Tarih:** 2026-10-24  
**Baz Commit:** `0cd44f8411b70e2a542e75556fcac3cc1746c1d2`  
**Referans Doküman:** `BELGELER_MOBIL_CEKMECE_ANTIGRAVITY_PLANI.md`  
**Kapsam:** Yalnızca UI katmanı (< 1024px mobil çekmece, üst bar sadeleştirme, yüzen zoom pill, köprü bağlamı). Masaüstü ve PDF/AcroForm/Paylaşım motorları korunur.

---

## 1. Mimari Kararlar Özeti
1. **D1 — Köprü:** `BelgeStudioMobileProvider` (React Context) ile header, preview ve actions arasında durum paylaşımı (openDrawer, closeDrawer, isInlineEditingActive, toggleInlineEditing, blobUrl).
2. **D2 — Çekmece:** `BelgeStudioMobileActionsSheet` (Radix DialogPrimitive tabanlı, alttan açılan accessible modal çekmece).
3. **D3 — PDF Üzerinde Düzenle:** Tek edit state (`isInlineEditingActive`). Çekmeceden kapatılırken `setInlineEditing(true)` çağrılır.
4. **D4 — Zoom Pill:** `BelgeStudioMobileZoomPill` (`− %100 + ⤢`, çok sayfalıda `‹ 1/2 ›`), sağ üstte yüzen ve etkileşim sırasında soluklaşan pill.
5. **D5 — Tema:** `useBelgeStudioTheme` hook'u ile hem masaüstü switch hem çekmece kartı senkronize çalışır.
6. **D6 — Header:** Mobilde tek satır, başlık `flex-1 min-w-0 truncate`, `⋮` çekmece butonu, toolbar slot ve tema mobilde gizli (`hidden lg:flex`).
7. **D7 — Alt Bar:** `⋯` (çekmece) + `Paylaş` (ikon) + `Formu Düzenle / PDF Önizle` + `PDF İndir`.

---

## 2. Aşamalar
- **A0:** Baseline ve Doğrulama (Tamamlandı)
- **A1:** Altyapı ve Bağlam Köprüsü (Provider, hook, 5 stüdyo entegrasyonu)
- **A2:** Üst Bar, Zoom Pill ve Genişletilmiş PDF Önizleme
- **A3:** Çekmece ("Belge İşlemleri") ve Alt Bar Düzenlemesi
- **A4:** Sertleştirme, Yeni Spec ve Yaşayan Doküman Güncellemeleri
- **A5:** Final Doğrulama (tsc, lint, playwright, build) ve Checkpoint Raporu
