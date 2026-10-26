# TBDY 2018 3B — ChatGPT Web Kalite V2 Uygulama Durumu

```yaml
plan_id: TBDY3D_CHATGPT_WEB_QUALITY_V2_20261026
plan_revision: 1
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
active_stage: null
next_stage: ASAMA_02
completed_stages: [ASAMA_01]
base_sha: 93d734042a2e9f47737898312d839c179cd9a746
working_branch: internal-tbdy3d-quality-v2
updated_at: 2026-10-26T18:24:21.553Z
evidence:
  - ASAMA_01: main SHA and Vercel production READY checked
  - ASAMA_01: GitHub sources / checks and desktop browser interaction reviewed
  - ASAMA_01: phase-2 risk register and acceptance baseline documented below
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
