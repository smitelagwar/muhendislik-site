# CAD Upstream Migration — Aşama 5 Runtime Orkestrasyonu

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

## Amaç

Production CAD seçim zincirini bounded ve geri alınabilir biçimde upstream-first mimariye geçirmek; mevcut custom CAD viewer'ı silmeden fallback konumuna taşımak ve hiçbir motorun sonsuz loading durumunda kalmasına izin vermemek.

## Gerçek runtime sırası

### DWG

1. **Fast — cache-only**
   - `/api/dokumantasyon/files/:id/dwg-dxf` cached derivative kontrol edilir.
   - Süre sınırı: `5 s`.
   - Cache hit ise mevcut DXF viewer ile render edilir.
   - Bu adım yeni DWG parse/conversion başlatmaz.
2. **Upstream — direct MLightCAD/LibreDWG**
   - Orijinal DWG doğrudan stable upstream adapter'a verilir.
   - Toplam terminal süre sınırı: `35 s`.
3. **Current viewer fallback**
   - Upstream başarısız olduktan sonra eski browser DWG→DXF worker yolu bir kez denenir.
   - Source fetch sınırı: `15 s`.
   - Worker sınırı: `25 s`.
   - Dönüşen DXF mevcut `DokCadViewer` ile render edilir.
4. **APS — final fallback**
   - APS status/start istekleri ayrı ayrı `15 s` ile sınırlıdır.
   - Toplam translation deadline: `180 s`.
   - APS viewer mount/document load deadline: `45 s`.
   - Bu sürelerden sonra terminal hata ve retry/download UI gösterilir.

Bu yapı browser DWG→DXF conversion'ı hot path olmaktan çıkarır. Conversion yalnız direct upstream başarısız olursa fallback olarak çalışır.

### Native DXF

Native DXF için cached DWG derivative ve APS uygulanabilir değildir. Akış:

1. **Upstream MLightCAD** (`35 s` terminal deadline),
2. **mevcut DXF viewer** fallback.

Yeni bir "fast DXF parser" yazılmaz.

## Dosya sınırları

- `cad-runtime-orchestrator.tsx`: motor seçimi ve terminal geçişler.
- `cad-upstream-viewer.tsx`: upstream lifecycle + total deadline.
- `dwg-legacy-conversion-fallback.tsx`: eski browser dönüşümünün yalnız post-upstream fallback olarak izole edilmiş hali.
- `aps-only-dwg-viewer.tsx`: APS'nin yalnız final fallback hali ve toplam deadline'ları.
- `cad-viewer.tsx`: mevcut custom DXF viewer/rollback implementation; Stage 5'te yeniden yazılmaz.
- `file-preview-shell.tsx`: yalnız dynamic CAD import'u orchestrator'a yönlendirilir; download/share/fullscreen/persistence davranışları değişmez.

## Fast tanımı neden cache-only?

Eski `ApsDwgViewer` içinde "fast path" cache kontrolünden sonra browser DWG→DXF worker'ını da otomatik çalıştırıyordu. Bu durumda conversion her cache miss'te hot path oluyordu. Nihai plandaki `Fast → Upstream` ve `conversion hot path olmasın` koşullarını birlikte sağlamak için Fast yalnız hazır cached derivative erişimidir. Cache miss doğrudan Upstream'e geçer.

## Terminal hata ilkeleri

Her engine yalnız şu iki sonuçtan birine ulaşır:

- `ready`,
- terminal failure → sıradaki engine.

`loading` sınırsız bir sonuç değildir. Upstream timeout sonrası adapter destroy edilir. Legacy worker timeout sonrası terminate edilir. APS translation ve viewer load ayrı toplam deadline'lara sahiptir.

## Rollback

Eski `cad-viewer.tsx` ve eski `aps-dwg-viewer.tsx` bu aşamada silinmez. Production selector değişikliği tek dynamic import satırıdır. Gerekirse `FilePreviewShell` tekrar `./cad-viewer` import'una döndürülerek anında rollback yapılabilir.

## Aşama 5 kabul kriterleri

1. production CAD route `DokCadRuntimeOrchestrator` kullanır,
2. DWG Fast adımı cache-only ve `5 s` bounded'dır,
3. cache miss browser conversion'a değil upstream'e gider,
4. upstream total deadline `35 s` ve terminal failure callback'i vardır,
5. browser conversion yalnız upstream failure sonrası çalışır,
6. legacy source/worker süre sınırları korunur,
7. legacy conversion veya current DXF render failure sonrası APS'ye geçilir,
8. APS request, translation ve viewer load deadline'ları bounded'dır,
9. native DXF `Upstream → Current` akışındadır,
10. `cad-viewer.tsx` custom internalleri bu aşamada değiştirilmez,
11. FilePreviewShell'ın download/share/fullscreen/persistence sorumlulukları değişmez,
12. Stage 5 static contract gate `PASS`, targeted lint ve site-wide typecheck başarılıdır,
13. `npm run build` başarılıdır,
14. production preview/browser smoke testinde engine transition data attribute'ları terminal durumu gözlenebilir kılar.

Gerçek DWG fidelity kabulü hâlâ Aşama 1 private golden corpus sağlanmasına bağlıdır; burada sahte fidelity sonucu üretilmez.
