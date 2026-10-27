# TBDY 2018 3B Düzensizlik Simülatörü — Kalite yenileme

**Plan:** TBDY3D_QUALITY_REBUILD_2026_10_26 · ASAMA_01
**Alan:** /kategori/araclar/duzensizlik-simulatoru
**Başlangıç main:** 604b2286443010fcd1102761696b1aa8eec1aefd

## Teknik karar
- Mevcut bağımsız araç ve Next.js tam ekran kabuğu korunur.
- Model: saf TS motion.ts içinde kat düğümlerini üreten deterministik eğitim hareketi; kolon/kiriş uçları aynı düğümden konum hesaplar. Birleşim uzunluğu/yönü düğümlerden yeniden üretilir.
- A1 burulma; A2 yalnız 3. katta boşluk; A3 L plan; B1 dayanım kesiti vurgusu; B2 zemin katta göreli ötelenme; B3 üst kolonun aktarma kirişine bağlanması.
- Hareket, gerçek analiz değildir. B1 dayanım ile B2 rijitlik kavramı ayrıdır.
- 3B renderer sahne değişiminde ve 2B geçişinde yeniden oluşturulmaz; tek canvas, ihtiyaç temelli RAF, document.hidden duraklaması, reduced-motion ve 2B fallback.
- Mobilde panel başlangıçta kapalı, alt dock oynat/mod/ayar, kamera alan içinde. Sayfa kaydırması yok.

## Kabul kapısı
1. Altı senaryo için saf Node testleri ve düğüm uç tutarlılığı 1e-6 toleransında geçer.
2. Lint, runtime typecheck, production build, Playwright desktop, 320/390 mobil, tablet ve WebKit mobile testleri.
3. Tüm kontroller, error/retry, reduced-motion ve WebGL yok senaryoları test edilir.
4. Ekran görüntüsü ve üretimde çalışan arayüz incelenir; mobil emülasyon fiziksel cihaz yerine geçmez.
5. Main merge sonrası tek production deployment READY ve canlı rota/araç kartı kontrolü.

## Durum
- plan_id: TBDY3D_QUALITY_REBUILD_2026_10_26
- execution_status: DEVAM_EDIYOR
- active_stage: ASAMA_01
- evidence: ilgili CI ve deploy sonuçları finalde güncellenecek.

## Karşılaştırmalı 3B simülasyon — 2026-10-27 / Aşama 1
- Çalışma dalı: `internal-irregularity-comparison-stage1-20261027`; main/production bu aşamada değiştirilmez.
- Ayrı `reference-model.ts` geometrisi: A1 dengeli perdeler, A2 kesintisiz döşeme, A3 düzenli plan, B1 normal kolon kesiti, B2 sürekli perde, B3 temele devam eden kolon.
- Tek WebGLRenderer ve tek animasyon döngüsü korunur. İki THREE.Group, aynı zaman/şiddet ve kamera ile iki scissor viewport'ta çizilir.
- Tek bina modu önceki görüntüleme yoluyla çalışmaya devam eder. Senaryo açıklamaları Aşama 2, mobil karşılaştırma deneyimi Aşama 3, gerçek tarayıcı/geometri/build ve üretim dağıtımı Aşama 4 kapsamındadır.
- Referans binanın düzenli olması güvenlik onayı değildir; hareketler eğitsel, ölçeksiz ve hesap sonucu değildir.
