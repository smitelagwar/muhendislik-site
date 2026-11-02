# CAD V1 R2 — Geri Dönüş ve Korumalı Yayın Runbook

**Durum:** Çalışma dalı henüz `main`e birleştirilmedi; ASAMA_11 kabulü ENGELLİ. Mevcut Production için yeni Stage11 rollback uygulanması gerekmiyor. Bu belge **çalıştırma komutu değil**.

## 1. Korunan sınırlar

- Kaynak DWG/DXF dosyalarını, revision JSON'larını, Neon kayıtlarını, Blob asset'larını veya eski review localStorage'ını silme.
- `main`, Production ve çalışan V1 görüntüleyici temel motoru üzerinde izinsiz komut/merge/redeploy yapma.
- Review verisinin source identity (`fileId + sourceVersionKey + gerçek SHA`) uyumu doğrulanmadan başka sürüme otomatik taşıma yapma.

## 2. Olası geri dönüş seçenekleri

**A — Mevcut durumda en düşük risk:** Hiç deploy/merge yapma. Bu aşamaların kodu yalnız `internal-cad-v1-pro-review-r2-20261102` dalındadır; `main` ve Production izole kalır. Kullanıcı talimatı olmadan prod müdahalesi yok.

**B — Yalnız Stage11 belge geri dönüşü (gelecekte gerekirse):** İlgili Stage11 commit'ini çalışma dalında `git revert <stage11-commit>` ile geri al, yeni commit + diff/HEAD teyidi yap; force-push yapma. Bu işlem yalnız audit dokümanlarını etkiler.

**C — Gelecekte review UI entegre edilip sorun çıkarsa:**
1. Yetkili kişi tarafından son çalışan Production commit/deployment kimliğini ve DB/Blob revision'larını belgeleyip mevcut durumun snapshot'ını al.
2. Kodda mevcut `NEXT_PUBLIC_CAD_REVIEW_V1=false` veya yalnız export için `NEXT_PUBLIC_CAD_REVIEW_EXPORT_V1=false` kullan. **Bu bayraklar build-time public env**, mevcut istemcide anında etkili olmaz; yeni onaylı build/deploy gerekir.
3. Flag altındaki çizim görüntüleyiciyi, orijinal DWG/DXF indirmeyi ve fallback'i smoke test et; veriyi silmeden read-only erişimi koru.
4. Etki V1 temel motoruna geçmişse yalnız **doğrulanmış** son çalışan Deployment'a, ayrı açık kullanıcı komutuyla rollback yapılabilir. DWG parser/worker'u varsayım üzerine değiştirme.

## 3. Deploy öncesi bağımsız asgari kontrol (henüz GEÇMEDİ)

- [ ] Gerçek yetkili DB preflight / 0 kayıt kaybı
- [ ] DWG cache-hit, cache-miss ve APS fallback
- [ ] Mobil pinch sonrası kamera zoom'u ve review overlay projeksiyonu
- [ ] 4 gerçek DWG/DXF; kaynak SHA-256 aynı
- [ ] iOS/Android gerçek cihaz (ve varsa stylus)
- [ ] Review JSON/DXF/PNG/PDF ve F5 + server sync
- [ ] `npm run check:cad-review:release` ve üretim derlemesi PASS
- [ ] Bir kez onaylı deploy; yayın sonrası kalite ve geri dönüş testi

## 4. İki dakikalık manuel kontrol

Bir DXF aç → 3-4-5 mesafe ölç → üç noktalı zincir ölç → küçük alan/çevre ölç → ESC ile taslağı iptal et → OSNAP mod değiştir → katman aç/kapat → pin/metin ekle → Undo/Redo → F5 ile aç → JSON/DXF/PDF indir → mobilde pan/pinch yap. Her adımın gerçek sonucu doğrulanmadan PASS yazma. Özellikle pinch-zoom şu anda FAIL.

**Sonuç:** ASAMA_11 release READY değildir, veri/deploy manipülasyonu yapılmamıştır. Geri dönüş işlemi kullanıcıdan ayrıca açık komut gerektirir.
