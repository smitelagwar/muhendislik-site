# A6 — Kapanış: tam regresyon, dokümantasyon, push kararı

**Önce oku:** `00-OKU-ONCE.md`. **Ön koşul:** A1–A5 yeşil. Bu aşamada **yeni özellik/kod değişikliği yok**; yalnız doğrulama, kırmızı çıkan regresyonun düzeltilmesi (en fazla 2 deneme) ve dokümantasyon.

## 1) Statik ve birim kapılar
```powershell
npx tsc --noEmit --incremental false
npx tsc -p tsconfig.next.json --noEmit --incremental false
npm run check:pdf-v2:unit
npm run check:pdf-v3:unit
npm run check:pdf-v4:unit
npm run lint -- --max-warnings=9999 2>&1 | Select-Object -Last 30
```
`lint` yalnız **bu planda değişen dosyalarda** yeni hata üretmemeli (eski hatalara dokunma). Çıktı hata basıp exit 0 dönerse PASS deme.

## 2) Production derleme + gate (bütçeli testler production ister)
```powershell
npm run build 2>&1 | Select-Object -Last 40
npm run check:pdf-v4:gate 2>&1 | Select-Object -Last 60
npm run check:pdf-v4:gate:mobile-slow 2>&1 | Select-Object -Last 60
```
Gate bütçesi (`tests/pdf-v4/budgets.json`) aşılırsa: hangi senaryo/metrik, önce-sonra değeri raporlanır; **bütçeyi gevşetme**. Nedenini A1–A5 değişikliklerinde ara (en olası: A3 klavye zoom animasyonu `anchorDrift`, A5 `React.memo`, A4 dokunma gecikmesi).
Sunucu/süreç asılı kalmamalı; iş bitince açık `next`/`node` süreçlerini kapat.

## 3) Tam e2e regresyonu (yalnız PDF)
```powershell
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v3-invariants.spec.ts tests/document-studio/pdf-viewer-toolbar-parity.spec.ts tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium --reporter=line 2>&1 | Select-Object -Last 40
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts tests/pdf-v4/v5-a5-uyum.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 40
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5m-a4-dokunmatik.spec.ts --project=mobile --reporter=line 2>&1 | Select-Object -Last 30
```
CAD testlerini **çalıştırma** (kapsam dışı).

## 4) Yaşayan dokümantasyon (kısa)
- `PROJECT.md` "Belgeler PDF Stüdyoları" bölümüne 4–6 satır: v4 motor koruma altyapısı (`setPageKeys`, `refresh`), sekme dönüşü kurtarma, scroll-tabanlı tile seçimi, motorun döndürmede yeniden yaratılmaması, `data-chrome-hidden`, yeni klavye haritası. **Mevcut satırları silme.**
- `.agents/rules/yasayan-dokumantasyon-bakimi.md` yönergesine uy: ilgili yaşayan belgeler (`Select-String -Path docs -Recurse -Pattern "pdf" -List` ile `DOK_CONTEXT_MAP.md` vb. kontrol) yalnız gerekiyorsa güncellenir.
- `docs/pdf-viewer-v5/06-sonuc.md` yaz: H1–H24 tablosu → durum (Çözüldü/Kısmen/Açık) + kanıt (test adı), kapı sonuçları, çalıştırılamayanlar, **elle doğrulanacaklar** (aşağıda).

## 5) Elle cihaz kontrol listesi (kullanıcı için, `06-sonuc.md` sonuna ekle)
1. Masaüstü Chrome: PDF aç → başka sekmeye geç, 30 sn sonra dön → sayfalar dolu mu; hızlıca kaydır.
2. A4+A3 karışık belgede Ctrl++ ile %500'e çık; sayfa ekranda mı; sayfa içinde kaydır.
3. Sayfa 10'dayken Ctrl+Shift++ / Ctrl+Shift+- → konum korunuyor mu.
4. Boşluk, PageUp/Down, oklar, Home/End; Boşluk basılı tutup sürükle (el aracı).
5. Arama: aynı sayfada birden çok eşleşme → Ctrl+G ile eşleşmeye kayıyor mu; arama açıkken F4.
6. Telefon (Android + iPhone Safari): kaydır → araç çubuğu titremiyor mu; tek dokunma gizle/göster; çift dokunma zoom; pinch sınırda lastik.
7. Yazdır (Chrome masaüstü): önizleme boş değil mi. (H23 başsız ortamda doğrulanamaz.)
8. Windows'ta farklı DPR'li ikinci monitöre pencere taşı → bulanıklık/keskinlik.

## 6) Temizlik ve push kararı
- `git status` incele: `tests/pdf-v4/v5*`, `docs/pdf-viewer-v5/**`, planda adı geçen kaynak dosyalar dışında **hiçbir** dosya (özellikle `scratch-*`, `test-results/**`, `playwright-report/**`, `.test-data/**`) stage'lenmez; bunlar `.gitignore` dışındaysa **silme/stage'leme**, raporda listele.
- **Commit/push YAPMA.** Kullanıcıya şunu öner: tek atomik commit, mesaj `fix(pdf-v5): sekme dönüşü, zoom yerleşimi, tile seçimi, klavye ve dokunmatik düzeltmeleri` ve `AGENTS.md` (A) modu gereği `main`'e push (Production deploy normaldir). Karar kullanıcıda.

## 7) Rapor
`00-OKU-ONCE.md` şablonuna ek olarak: H1–H24 durum tablosu (kısa), gate sayıları (önce `report-baseline.md` ile karşılaştır: `docs/pdf-viewer-v4/report-baseline.md`), açık kalan maddeler.
