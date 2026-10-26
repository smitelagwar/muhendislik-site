# TBDY 2018 3B — ChatGPT Web Kalite V2 Uygulama Durumu

```yaml
plan_id: TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: ASAMA_03
next_stage: ASAMA_03
completed_stages: [ASAMA_01, ASAMA_02]
base_sha: 93d734042a2e9f47737898312d839c179cd9a746
working_branch: internal-tbdy3d-quality-v2
updated_at: 2026-10-26T19:28:02.968Z
evidence:
  - ASAMA_01: main SHA and Vercel production READY checked
  - ASAMA_01: GitHub sources / checks and desktop browser interaction reviewed
  - ASAMA_01: phase-2 risk register and acceptance baseline documented below
  - ASAMA_02: commit 456321f92b59ce8a1fd249247ecdfc7ac0e2389e, 13/13 geometry tests, lint/typecheck/build PASS
  - ASAMA_02: CI Playwright 30/30 desktop/mobile/WebKit PASS; reviewed 15 screenshot artifacts
  - ASAMA_03: source commit 38df78be78f259a0d712f68e077096b6ce59436c; 17/17 geometry and production build PASS
  - ASAMA_03: visual evidence from prior browser run 36/40 PASS, four failures from guide overlay in new E2E test; corrected in final source
blockers:
  - ASAMA_03: final browser CI for commit 38df78b not yet terminal; cannot report PASS
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
