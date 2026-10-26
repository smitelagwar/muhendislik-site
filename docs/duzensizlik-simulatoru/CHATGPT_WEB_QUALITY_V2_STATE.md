# TBDY 2018 3B — ChatGPT Web Kalite V2 Uygulama Durumu

```yaml
plan_id: TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages: [ASAMA_01, ASAMA_02, ASAMA_03, ASAMA_04, ASAMA_05]
base_sha: 93d734042a2e9f47737898312d839c179cd9a746
working_branch: internal-tbdy3d-quality-v2
updated_at: 2026-10-26T20:52:47.447Z
evidence:
  - ASAMA_01: main SHA and Vercel production READY checked
  - ASAMA_01: GitHub sources / checks and desktop browser interaction reviewed
  - ASAMA_01: phase-2 risk register and acceptance baseline documented below
  - ASAMA_02: commit 456321f92b59ce8a1fd249247ecdfc7ac0e2389e, 13/13 geometry tests, lint/typecheck/build PASS
  - ASAMA_02: CI Playwright 30/30 desktop/mobile/WebKit PASS; reviewed 15 screenshot artifacts
  - ASAMA_03: source commit 38df78be78f259a0d712f68e077096b6ce59436c; 17/17 geometry and production build PASS
  - ASAMA_03: visual evidence from prior browser run 36/40 PASS, four failures from guide overlay in new E2E test; corrected in final source
  - ASAMA_04: commit 5a1a1b2b0efe55f5aa4dbedd30c86725957ac53f, 19/19 geometry and 50/50 browser tests PASS
blockers: []
```

## ASAMA_01 — Gerçekleşen denetim (2026-10-26)

**Durum: TAMAMLANDI — başlangıç denetimi, henüz ürün kodu değişikliği veya yeni sürüm testi değil.**

### Sürüm, yayın ve kaynak gerçeği

- GitHub `main` başlangıç HEAD: `93d734042a2e9f47737898312d839c179cd9a746` (26.10.2026 17:24:15 UTC; commit [kayıt](https://github.com/smitelagwar/muhendislik-site/commit/93d734042a2e9f47737898312d839c179cd9a746)).
- Vercel Production `READY`, deployment `dpl_DWfboMAui5nwq6Xr7AcXrGbTBv1c`; kaynak SHA aynı. Bu, **yayın hazır** demektir, tüm end-to-end testlerin başarılı olduğu anlamına **gelmez**.
- Eski `QUALITY_IMPLEMENTATION_STATE.md` hâlâ `DEVAM_EDIYOR / ASAMA_01` gösteriyor. Son ürün yayın commit'i ve Vercel READY kanıtı nedeniyle eski sürümün **yayınlandığı doğrulandı**; eski durum belgesine müdahale edilmiyor. Yeni V2 planı ve durum kaydı bağımsızdır.
- Yeni çalışmanın dalı `internal-tbdy3d-quality-v2`. `main` üzerine değişiklik yok. `vercel.json` içindeki `internal-*` / `chatgpt-*` deploymentEnabled=false kuralı ve `AGENTS.md` uzaktan yazım kuralları incelendi. Bu aşamada preview/production deploy yok.
- Okunanlar: `PROJECT.md`, `AGENTS.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md`, `.agents/rules/yasayan-dokumantasyon-bakimi.md`, `vercel.json`, simulator source, `tests/duzensizlik-simulatoru/motion.test.ts`, `tests/site-audit/irregularity-studio.spec.ts`, simülatör workflow'u ve mevcut teknik kayıtlar.

### Korunacak güçlü özellikler (kodla desteklenen)

- Ayrı rota + `SiteShell` tam viewport sayfası; `100dvh` / overflow kontrolü; üst site banner'ını dışlama.
- Saf `motion.ts` üzerinden ortak mafsal/düğüm hareketleri; A1/B1/B2 ayrımı; 3B sahne + 2B fallback.
- Three.js 0.172.0, tek `WebGLRenderer`/canvas yaklaşımı; ortak BoxGeometry ve malzeme paylaşımı; `OrbitControls` damping.
- RAF'in görünmez sekmede ve pasif görünümde durması; resize/visibility/context-loss yolu; `controls.dispose`, `renderer.dispose`, geometry/material cleanup.
- Senaryo seçimi; Serbest/Ön/Sağ/Sol/Üst önayarları; oynat/duraklat, hız, katman gösterimi; `Tanı → İzle → Anla`, klavye odağı, `prefers-reduced-motion`.

### Risk ve kusur haritası — kod, tarayıcı bulgusu ve hipotez ayrı

| Öncelik | Kategori | Kanıt ve değerlendirme | Sonraki iş |
|---|---|---|---|
| P1 | Öğreticilik/UX | `irregularity-studio-shell.tsx` yalnız senaryo rozeti + ayrı rehber sunuyor; istenen **“Neden Problemli?”** kartı yok. Canlı masaüstü tarayıcı otomasyonu da kart bulamadı. | ASAMA_03 |
| P1 | Geometri | `building-viewer.tsx` her kolonu/kirişi/perdeyi aynı `BoxGeometry`yi ayrı eksenlerde ölçekleyerek çiziyor; çapraz dönüş, köşe birleşimleri, yüzey örtüşmesi ve kalınlık sürekliliği yakından denetlenmeli. Görsel kusurların tek tek yerleri **henüz gözle doğrulanmış değil**. | ASAMA_02 |
| P1 | Görsel davranış testi | Mevcut Playwright bazı kamera/checkbox kontrollerinde `aria-pressed` veya checked durumunu denetliyor; gerçek 3B kamera / katman görüntü değişiminin doğrulanması yetersiz. | ASAMA_02/03/05 |
| P1 | Animasyon | Canlı otomasyon, başlat/durdur düğmesinin çalıştığını gördü fakat hareketi **algılayamadığını** bildirdi. `jointAt` ve RAF hareket yolu kodda mevcut. Dolayısıyla bu kesin bug değil; görsel ve zamanlı koordinat/screenshot testi gerekiyor. | ASAMA_02/04 |
| P2 | Teknik anlatım | `motion.ts` A2 sahnesinde orta aks kolonlarını tüm katlarda kaldırıyor; yalnız üçüncü katta açıklık var. Eğitimsel anlatımı ve yük yolu tutarlılığı teyit edilmeli. B3 aktarım kirişi ucu da yakından değerlendirilmeli. | ASAMA_02/03 |
| P2 | UX/kamera | Önayar seçimi ve görünüm düğmeleri tarayıcıda tıklandı; gerçek kamera matrisleri ölçülmedi. Sahne sığdırma, yakınlaştırma ve mobil çakışma doğrulaması gerekiyor. | ASAMA_04 |
| P2 | Kaynak yönetimi | Per-scene rebuild, RAF, unmount kaynakları koda göre düzenli; farklı senaryolarda 30+ değişimin bellek sonuçları ölçülmedi. | ASAMA_04/05 |
| P2 | Rehber konumu | Tarayıcı otomasyonu adım göstergesinin A1 kaldığını iddia etti, fakat kaynak `{scenario} · {SCENARIO_IDS.indexOf(scenario)+1}/6` biçiminde **dinamik**. Çelişkili bulgu; hata diye düzeltmeden önce bağımsız tekrar doğrulaması gerekiyor. | ASAMA_03 |

### A1–B3 başlangıç matrisi

| ID | Kodda model/gösterim | Canlı otomasyon | Açık kabul |
|---|---|---|---|
| A1 | Dönme + eksantrik perde | Senaryo geçişi ve farklı vurgular | Karşıt kenar hareket farkı, birleşim ve kart |
| A2 | Üçüncü kat döşeme boşluğu, çevresel outline | Boşluk çevresi vurgusu görüldü | Gerçek kat/diyafram sürekliliği, yük yolu ve kart |
| A3 | L plan uzantısı, iç köşe vurgusu | Farklı plan görünümü gözlendi | İç köşe ve birleşimlerin yakından görünümü, kart |
| B1 | Zayıf kat için küçük kesit; hareket büyütülmemiş | Senaryo değişimi çalıştı | Dayanım ≠ rijitlik ayrımı ve doğru vurgu |
| B2 | İlk katta görece yüksek ötelenme, üst kat perdeleri | Yumuşak kat açıklaması görüldü | Hareketin doğru katta yoğunlaşması, kart |
| B3 | Eksik alt kolon + aktarma kirişi | Turuncu kiriş vurgusu görüldü | Aktarma/kesinti yük yolu, kart |

**Mühendislik kısıtı:** Bu gösterimler sonlu eleman analizi değildir. Yönetmelik eşikleri TBDY 2018 resmî metninden ASAMA_03 kapsamında doğrulanmadan sayısal düzensizlik kararları üretilmez.

### Tarayıcı ve test imkânları — doğrulama sınırları

- Gerçek canlı **masaüstü browser automation** ile altı sekme, rehber aç/kapa, Ön/Sağ/Üst görünüm kontrolleri, 2B/3B mod geçişi ve oynatma düğmesi etkileştirildi. Altı senaryoda bağımsız açılan 'Neden Problemli?' kartı bulunmadı. Görünür scroll bar/spinner/hata ekranı bildirilmedi.
- Tarayıcı raporu bazı doğrulamaları yalnız **düğme/DOM değişimi** olarak yaptı; gerçek kamera geçişleri, 3B animasyon, katmanların sahnedeki görsel etkisi, tüm öğretici adımlar ve mobil görünüm **PASS** kabul edilmez. Tarayıcı raporunda “browser fullscreen değil” ifadesi işletim sistemi tam ekranına işaret edebilir; `100dvh` uygulama kabuğunun yokluğu olarak yorumlanmadı.
- `tests/duzensizlik-simulatoru/motion.test.ts` ve `tests/site-audit/irregularity-studio.spec.ts` **mevcut**. Bu aşamada saf Node testleri, production build ve Playwright suite **yeniden çalıştırılmadı**. Son release commit mesajındaki “30 browser tests passed” iddiası bağımsız test kanıtı yerine geçmez.
- Son `93d7340` check-run listesinde genel `validate` ve deploy runtime kontrolleri başarılı; fakat **ilgili olmayan** Document Drive mobil browser/repository-health job'larında başarısızlık var. Bunları simülatör testlerinin PASS/FAIL sonucu gibi göstermiyoruz. İlgili workflow: `.github/workflows/duzensizlik-simulatoru-e2e.yml`.
- Fiziksel mobil cihaz, fps, heap, WebGL resource, ekran görüntüleriyle bağımsız piksel analizi bu aşamada **ölçülmedi**. ASAMA_04/05 için açık test maddeleri.

### ASAMA_01 kabul ve devam sözleşmesi

- [x] Başlangıç SHA, eski dokümantasyon/release durum farkı ve canlı Production kaynağı doğrulandı.
- [x] Güncel kaynak, test ve repository/CI/deploy kuralları okundu.
- [x] Güvenli branch oluşturuldu; `main` korunuyor.
- [x] Altı senaryo ve korunacak işlevler kayıt altına alındı.
- [x] Risk haritası ve gözlem/doğrulanmamış ayrımı kaydedildi.
- [ ] ASAMA_02: geometriyi geliştir, geometri/görsel testleri uygula (**henüz başlamadı**).

**Durma:** Bu aşama sonunda yalnız ASAMA_01 tamamlandı; kullanıcı **“devam”** derse sadece ASAMA_02 uygulanır. Kalan aşamalar kendiliğinden başlatılmaz. Bu aşama için Production deploy yapılmaz.

## ASAMA_02 — 3B geometri ve birleşim kalitesi (2026-10-26)

**Durum: TAMAMLANDI.** Test edilmiş kaynak SHA: `456321f92b59ce8a1fd249247ecdfc7ac0e2389e`.
Yeni taslak PR: https://github.com/smitelagwar/muhendislik-site/pull/50 (henüz merge yok).

### Uygulananlar

- Kolon–kiriş ve B3 aktarma kirişi birleşimlerinde, gerçek dikey kolon düğümü olan uçlarda içe gömülen kısa mesafe payı; desteksiz düğümlerde keyfî uç kesimi yok.
- Döşemeler kirişlerin üst yüzeyine taşıdı, kalınlık `SLAB_THICKNESS` ile merkez-kenar uyumlu; paylaşılan kontur geometrisiyle kat sınırlarının okunurluğu artırıldı.
- A1'in slab yaw yönü `jointAt` floor rotation ile matematiksel olarak eşleştirildi; A1 köşe testinde farklı fazlarda 1e-5 tolerans.
- A1/B2 perdeleri iki aks arasındaki tam açıklığı kaplıyor; düz kutu olarak eğilmek yerine yalnız perdeye ait 24 köşe/face vertex'i iki katın aynı `jointAt` hareketinden güncelleniyor. Shared geometry/material diğer elemanlarda korunuyor; unique perde geometrileri rebuild/unmount sırasında dispose ediliyor.
- B2 ters yönde hareket ederken bounds'dan çıkmıyor. B1 dayanım ≠ B2 rijitlik farkı ve A2/B3 senaryo geometrileri korunuyor.
- E2E workflow sırası optimize edildi: geometri/lint/type/build kontrolleri Playwright tarayıcılarının ağır kurulumundan **önce** yapılır; tarayıcılar ancak erken gate başarılıysa kurulur.

### Kanıt

| Kontrol | Sonuç |
|---|---|
| Simülatör ESLint | PASS |
| `tsc -p tsconfig.next.json --noEmit --incremental false` | PASS |
| Saf TS geometri testleri, mevcut ve yeni test dosyaları | **13/13 PASS** |
| `npm run build` (Linux CI, Vercel üretim komutu) | PASS |
| Playwright desktop Chromium / 320-390 mobil / 768 tablet / WebKit mobile | **30/30 PASS** |
| Senaryo bazlı görsel artefaktlar | 15 ekran görüntüsü alındı; masaüstü, mobil ve üç senaryo yakın görselleri elle gözden geçirildi |
| Vercel Preview/Production deploy | YOK; `main` ilk SHA'da ve Production READY |
| Genel `quality`, `repository-health` workflow'ları | FAIL; bu hatlar simülatör odaklı gate değildir. Genel içerik kalite bağımsız borçları ayrı raporlanmalı, değişiklikten kaynaklandığı kanıtlanmadan simülatör hatası sayılamaz |

- Simülatöre özel CI run: https://github.com/smitelagwar/muhendislik-site/actions/runs/40381937165
- Ekran görüntüsü artefaktı: `irregularity-quality-evidence` (GitHub artifact `12678489995`).
- Fotoğraflar mevcut değişikliğin statik ekranlarını gösteriyor; eşdeğer kamera/ışık/viewport ile bir önceki sürümün piksel karşılaştırması **yapılmadı**. Donanıma özgü FPS, bellek ve gerçek mobil dokunma testleri **ASAMA_04/05** kapsamına bırakıldı.
- Otomatik testler buton fonksiyonlarını/sayfa davranışını doğruluyor. Bütün çizgilerin mikroskobik yüzey çakışmasını veya her olası animasyon açısında görüntünün kusursuzluğunu matematiksel olarak garanti etmez; kapsamın tamamlayıcı görsel regresyonu ASAMA_05'te tekrar değerlendirilecek.
- Çalışan render mimarisi korundu; ürün simülasyonu FEA/depreme göre hesap değildir.

### Sonraki aşama

`ASAMA_03`: A1–B3 teknik öğreticilik, sahneyle ilişkili kusur vurguları ve küçük **“Neden Problemli?”** bağlamsal kartı.

**Kesin durma:** ASAMA_02 tamamlandı. Kullanıcıdan yeni `devam` almadan ASAMA_03'ü başlatma; `main` push, PR merge veya Vercel deployment yapma.

## ASAMA_03 — Altı senaryo odağı ve “Neden Problemli?” kartı (2026-10-26)

**Durum: KODLAMA TAMAMLANDI / SON TARAYICI KABULÜ BEKLENİYOR.** Son ürün kodu SHA: `38df78be78f259a0d712f68e077096b6ce59436c`.
Taslak PR: https://github.com/smitelagwar/muhendislik-site/pull/50. `main` merge ve Vercel deploy YOK.

### Gerçekleşen değişiklikler

1. Resmî AFAD TBDY 2018 Tablo 3.6 ve 3.6.2.4 sayfaları incelendi: https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf (PDF dizininde s.40 ve 43; basılı s.20 ve 23). A1, A2, A3, B1, B2, B3 terminolojisi ve özellikle B1 dayanım / B2 rijitlik ayrımı doğrulandı; hiçbir senaryo gerçek bina hesabı/uygunluk sonucu olarak sunulmuyor.
2. `scenarios.ts`: 6 kısa ayrı `why` açıklaması, işaretlenecek gerçek geometriyle aynı `focusLabel`, güncel `observe` anlatıları.
3. `focus.ts`: her senaryoya özel pure koordinat sözleşmesi ve `focusAnchorAt`; A1'de iki karşıt slab kenarı, A2 3. kat boşluğu, A3 iç köşe, B1/B2 ilk kat, B3 kesilen orta kolon.
4. `building-viewer.tsx`: düşük mesh maliyetli paylaşılan sphere & malzeme ile 3B amber/turkuaz işaret; `jointAt` animasyonunu takip ediyor. Katman `showHighlights` kapatılınca gerçekten sahneden gizleniyor. Aynı gerçek mesh konum/sayısından `data-focus-count/visible/world` test telemetrisi üretiliyor; ek RAF veya React frame state eklenmedi. Shared kaynaklar unmount'ta dispose.
5. `irregularity-studio-shell.tsx`: kısa, kapatılıp açılabilen `Neden Problemli?` bilgi kartı; mobilde kamera dock üstünde, büyük ekranda sağ üstte; `Detay` ile `Anla` rehberine geçiyor. Rehber/kart/ayarlar etkileşimi ve erişilebilirlik dikkate alındı.
6. B3'ün eski uçta mesnetsiz gösterimi kaldırıldı. Yeni sahne alt orta kolonun kesilmesini, üst kolonun uçları kolonlara oturan iki mesnetli aktarma kirişine basmasını gösterir. Bu temsil 3.6.2.4(b)'ye bağlanır; düşey deprem hesabı yapılmamıştır. 2B B3 şeması aynı iki uçlu düzeni gösterir.
7. A3 2B L planı 3B uzantının yönüyle eşleştirildi.
8. `tests/duzensizlik-simulatoru/focus-stage3.test.ts` (+ 4 pure test), eski geometri testleri güncel B3 destek sözleşmesine göre uyumlu; Playwright'a yeni kart, odak sayısı, katman görünürlüğü ve mobil taşma testleri eklendi.

### Gerçek doğrulama

- `ESLint`, `tsc -p tsconfig.next.json --noEmit --incremental false`, `npm run build` ve **17/17 saf geometri testi:** PASS. Son CI commit `38df78b` üzerindeki simülatör workflow'u: https://github.com/smitelagwar/muhendislik-site/actions/runs/40385043572.
- Bir önceki çalışmanın 40 Playwright testinden 36'sı PASS, 4'ü FAIL: rehber açıldıktan sonra mobil/tablet görünümde alt 2B düğmesi rehber tarafından kapatıldı; **test** rehber kapanmadan düğmeye basmaya çalışıyordu. Son source commit `38df78b` testine `Escape` ile rehberi kapatma adımı eklendi. Önceki run: https://github.com/smitelagwar/muhendislik-site/actions/runs/40384865180.
- Bir önceki run'ın gerçek screenshot artefaktı `12679854551` indirildi, incelendi; altı senaryo görüntülerinde model ve kart masaüstü ve mobilde görünür. Screenshot statiktir; gerçek cihaz FPS ve çok uzun oturum sonucu değildir.
- Son sürümün 40 Playwright test sonucu **henüz bilinmiyor**: GitHub `Install browser runtimes` adımı gecikti. Bu sonuç PASS sayılmadığından aşama formel olarak kapatılmadı. `quality` ve `repository-health` genel test başarısızlıkları simülatör ürün testinden ayrı.
- `main` ve Vercel Production değişmedi. Fiziksel mobil cihaz testi, FPS/heap analizi ve piksel fark karşılaştırması ASAMA_04/05 kapsamındadır.

### Bekleyen kabul hareketi

1. SHA `38df78b` için `Build / geometry / desktop / mobile` job'u terminal olana kadar sonucunu kontrol et.
2. FAIL olursa gerçek hatayı log/screenshot ile düzelt ve yeniden test et. Tam PASS ise state dosyasında `completed_stages: [ASAMA_01, ASAMA_02, ASAMA_03]`, `next_stage: ASAMA_04`, `active_stage: null` yap.
3. Sonuç doğrulanmadan `ASAMA_04` başlatma veya `main`/Vercel üretim yayını yapma.

### ASAMA_03 nihai kabul ek kaydı

**Durum: TAMAMLANDI.** Tekrar edilebilir resmî Playwright 1.62.1 container ortamına geçildi, `mcr.microsoft.com/playwright:v1.62.1-noble`; GitHub runner'ın eksik WebKit sistem bağımlılıkları engeli ortadan kalktı.
- Test HEAD: `1249208f3fdb5ee6f1d8df6f2fecf520b7255b55`.
- Simülatör geometri: **17/17 PASS**.
- Playwright Chromium masaüstü / mobil 390 / mobil 320 / tablet 768 / WebKit mobil 390: **40/40 PASS**.
- Simülatör lint, TypeScript ve üretim build: **PASS**.
- CI: https://github.com/smitelagwar/muhendislik-site/actions/runs/40391024803
- Bunlar ürün kabul kanıtıdır. Ayrı genel site `quality` / `repository-health` hatları bağımsız borç olarak kalmaktadır.
- `main` ve Vercel Production değiştirilmedi, deploy yok.

**Durma ve sonraki aşama:** `ASAMA_04`, yalnız kullanıcıdan gelen son “devam” komutuyla bu A3 kabulü ardından açıldı; A4 dışında iş yapılmaz.

## ASAMA_04 — Kamera, tam ekran UX ve performans olgunlaştırma

**Durum: KODLANDI; CI KABULÜ DEVAM EDİYOR.**
- Kaynak commit: `f23bd717d2f76f51e03f31917be0345ccfed5bc0`.
- Kamera yatay/düşey izdüşüm ayrı hesaplanarak mobilde daha yakın fakat emniyet paylı fit sağlandı; kamera easing C2 smootherStep, kullanıcının drag/zoom hassasiyeti daha düşük ve damping daha doğal.
- Serbest sürükleme sonrası bir preset veya reset otomatik sığdırmayı geri açıyor; kullanıcı yeni manuel harekete başladığında tercihine karışılmıyor.
- RAF'teki gereksiz `THREE.Vector3` ayırımı paylaşılan scratch vektörle kaldırıldı; `matchMedia` kurma tekrarı kaldırıldı, WebGL/renderer cleanup ve tek canvas korunuyor.
- Gerçek kamera koordinatları ile WebGL geometri sayısı render'dan üretilen test telemetrisi olarak sunuluyor. Playwright'a gerçek pozisyon/animasyon hareketi ve kart/dock mobil çakışma testi eklendi.
- Mobil “Detay” rehber modalinde doğru klavye odağı sağlandı; Escape ve focus trap korunuyor.
- Test hattı: https://github.com/smitelagwar/muhendislik-site/actions/runs/40392212665. Simülatör lint, typecheck, saf test, build, Chromium/WebKit E2E kesin sonuçları henüz bekleniyor; PASS kaydı sonuca bağlı.
- Vercel Production ve GitHub `main` değişmedi; Aşama 4 boyunca deploy YOK.

### ASAMA_04 kabul kaydı — 26.10.2026

**Durum: TAMAMLANDI.** Son doğrulanmış ürün kaynak SHA'sı `5a1a1b2b0efe55f5aa4dbedd30c86725957ac53f`.
- GitHub Actions: https://github.com/smitelagwar/muhendislik-site/actions/runs/40393155141
- Simülatör ESLint: PASS.
- Next.js runtime TypeScript: PASS.
- Saf geometri + kamera hesabı / easing testleri: **19/19 PASS**.
- Üretim build: PASS.
- Chromium masaüstü, 390 mobil, 320 mobil, 768 tablet, WebKit mobil E2E: **50/50 PASS**.
- Gerçek kamera konumunda preset kaynaklı hareketin olması ve A1 odak hareketinin oynatma sırasında değişmesi tarayıcıda doğrulandı; yalnız `aria-pressed` sayılmadı.
- Mobil kart ve dock konum sınırları, rehber focus/escape, WebGL fallback ve reduced motion senaryoları tarayıcıda PASS.
- Görsel kalite: ilk A4 47/50 çalışmasının screenshot artefaktı `12686066159` indirildi ve masaüstü/mobil görüntüler elle gözden geçirildi. Son başarısız üç seçici testi `#irregularity-learning-panel button[aria-label="Paneli kapat"]` ile daraltıldı; güncel commit'te 50/50 başarı ile doğrulandı.
- Gerçek telefon/düşük donanım FPS/heap/etkileşim hissi laboratuvarı veya sayısal performans önce-sonra ölçümü **yapılmadı**. Küçük GPU tahsisi azaltması kodla doğrulandı fakat ölçülmüş yüzde hızlanma iddia edilmiyor.
- Kapsam dışı genel `quality` / `repository-health` kontrollerinde başarısızlık bulunuyor; simülatör özel kontrolün başarısını etkilemiyor, release gate için A5 incelemesinde ayrıca değerlendirilir.
- `main` ve Production değişmeden kaldı. Bu aşamada Preview/Production deployment başlatılmadı.

**Durma:** ASAMA_04 tamamlandı. Son aşama `ASAMA_05` yalnız kullanıcı sonraki “devam” komutunu verirse uygulanacak. Son aşamada bağımsız release QA, genel kontrol borçları, kontrollü main birleştirme, tek Production deploy ve canlı doğrulama yapılacak. Şimdilik yayın yok.

## ASAMA_05 — Son kabul ve tek seferlik Production release adımı

**Durum: TAMAMLANDI / CANLI PRODUCTION DOĞRULANDI.** Son test edilen ürün SHA: `f51d773c0348d8378bbf7888f7da4308ab8b336a`. Tek Production release commit'i squash merge sırasında oluşacaktır.

### Kabul kanıtı

- **GitHub Actions (nihai PASS):** https://github.com/smitelagwar/muhendislik-site/actions/runs/40396995823 — `Build / geometry / desktop / mobile` kontrolü `success`.
- **19/19** saf geometri, odak ve kamera hesabı testleri PASS. Simülatör ESLint, deployable TypeScript ve üretim build PASS.
- **65/65** Chromium masaüstü, mobil 320/390, tablet 768 ve WebKit mobil 390 Playwright testi PASS.
- Ek viewport matrisi: **320, 390, 430, 768, 1366, 1920, yatay 844×390**. Sayfa scroll ve sahne alanı kabulü PASS. Desktop→mobil ekran daralması sırasında açık rehberin kapatılması gerçek ürün hatası olarak düzeltildi.
- 36 ardışık senaryo değişiminde gerçek Three.js odak sayısı, tek canvas, sabit dönen senaryoda renderer geometri sayısı, JS runtime/console error ve 3B kamera/animasyon koordinatları PASS.
- A1–B3 sabit üstten ve animasyonlu perspektif görselleri ile standart desktop/mobil kareleri kontrol edildi. GitHub Actions **`irregularity-quality-evidence` artifact ID `12687955378`**, 27 görüntü. İncelemede kritik görsel kopma/taşma saptanmadı.
- Önceki `77167cc` üzerinde 64/65 koşusundaki fail gerçek responsive durumunu yakaladı; `f51d773` ile düzeltildi. Nihai `65/65` koşusu aynı hatanın giderildiğini doğruluyor.
- Fiziksel telefon, gerçek GPU FPS/heap benchmarkı veya kapsamlı tarayıcı uyumluluk laboratuvarı yapılmadı; bu sınırlama gizlenmiyor.

### Mevcut site geneli kalite borcu

Simülatöre özel testler ve genel runtime `validate` yeşildir. Genel `quality` ve `repository-health` kırmızı hatları proje kökünde mevcut, simülatörle ilgisiz iki kümeden kaynaklanır: `check-deprem-phase4` C1 görsel çakışması ve CAD/belge doküman testlerinde TS uyumsuzlukları. `main` bazında `repository-health` zaten fail. Yalnız simülatör kapsamındaki değişiklik nedeniyle bütün siteyi yeniden tasarlamak doğru olmadığı için bu teknik borç release notuna ayrı kaydedildi; tüm site CI'ının yeşil olduğu iddia edilmez.

### Tek yayın protokolü

PR #50, `main` tabanına göre bütünleşik; yalnız bir **squash merge** ve Vercel Git ile otomatik **tek Production** build yapılır. Merge SHA, deployment `READY` ve canlı URL smoke sonucu ayrıca doğrulanacaktır. Bu kayıt anında henüz merge/deploy **yapılmadı**. Doğrulama ardından uygulama durumu, kullanıcıya ve güvenli çalışma dalındaki son kayıt üzerinden tamamlandı olarak bildirilir.

### ASAMA_05 kapanış ve yayın gerçeği (2026-10-26)

**TAMAMLANDI: Bundan sonra `devam` için yeni aşama YOK.**

- PR #50 **tek squash merge** ile `main`e taşındı: https://github.com/smitelagwar/muhendislik-site/pull/50
- Production Git merge SHA: `c4fa59d134c027beeae60b928c4ef2a2fde9f965`. Canlı: https://muhendislik-site.vercel.app/kategori/araclar/duzensizlik-simulatoru
- Vercel Production deployment: `dpl_5zZ6sevKwj6QqgYLYbE8HnnwsEdi` — **READY**, commit SHA GitHub `main` ile aynı. Prod alias `muhendislik-site.vercel.app` bu deployment'a bağlı.
- Son kaynak simülatör testleri: **19/19 saf test, 65/65 Playwright, ESLint, TypeScript, build PASS**: https://github.com/smitelagwar/muhendislik-site/actions/runs/40396995823
- Canlı browser smoke: https://agent.tinyfish.ai/runs/10a54959-0132-49c3-ba26-3137a4fd7f27 — A1–B3, kart, sahne vurguları, B3 aktarma kirişi, kamera önayarları, oynatma kontrolü, 2B/3B ve rehber PASS; kritik görsel/erişim sorunu gözlenmedi. Browser otomasyonu her kamera matrisini bağımsız ölçmedi, fakat Playwright gerçek kamera telemetri testleri bunu ayrı doğruladı.
- Vercel proje runtime error ve deployment-specific `error/fatal` log taraması (son 30 dakika): **bulgu yok**; kullanıcı client-side WebGL sorunlarının tamamını bu ölçüm garanti etmez.
- Yayın sayısı: bu aşamada **tek** Production Git deployment. Preview/CLI ile tekrarlanan deployment YOK. Önceki çalışan Production sürümü Vercel geçmişinde geri dönüş adaylığına sahip.
- Genel sitede mevcut `quality`/ `repository-health` borçları ve fiziksel cihaz/grafik işlemcisi karşılaştırmalı benchmark eksikliği devam ediyor; simülatör görev kapsamı dışında.
- **Kapanış dosyası güvenli çalışma dalına işleniyor**: `main` üzerindeki release-öncesi state dokümanı kasıtlı olarak sonradan ayrı Production deployment oluşturmak için güncellenmiyor. `internal-*` dalı sadece nihai durum kaydıdır; ürünün yayınlanan source commit'i `c4fa59d134c027beeae60b928c4ef2a2fde9f965`.
