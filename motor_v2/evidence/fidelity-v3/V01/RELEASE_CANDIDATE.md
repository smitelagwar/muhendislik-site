# DWG/DXF Motor V2 — Release Candidate 1 (RC1) Bildirimi

**Yayım Tarihi:** 5 Ekim 2026  
**Sürüm:** DWG/DXF Motor V2 — Fidelity v3 RC1  
**Temel Sözleşme:** `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (Bölüm 14)  
**Çalışma Dalı:** `codex/srdr-dwg-motor-v2-fidelity`

---

## 1. Sürüm ve Protokol Kimliği

```json
{
  "schemaVersion": 1,
  "renderAbi": "three172-cad2d-v2",
  "compilerRevision": "cad-v2-compiler-2026.09-v71",
  "pipelineRevision": "fidelity-v3-p08",
  "qualityProfile": "cad-v2-2d-v1",
  "fontDigest": "system-bundled-v1",
  "binaryMagic": "DV2SCN01"
}
```

---

## 2. Dahil Edilen Paketler ve Doğrulama Durumu

1. **P00–P08 (Temel Pipeline & Kök Düzeltme):** **PASS**
   - Kaynak kanıtı, deterministik sahne kimliği (SHA-256), parçalama (chunking), 2 MiB HTTP tavanı, OCS/WCS koordinat dönüşümü, blok hiyerarşisi açılımı, HATCH delikli earcut mesh ve R001 kök düzeltmeleri tamamlandı.
2. **F01–F04, F06 (Görsel ve Stil Doğruluğu):** **PASS**
   - ACI 1–255, TrueColor, ByLayer, ByBlock ve alpha şeffaflığı.
   - AutoCAD standart lineweight paleti, hairline (0.00 mm), constant/tapered polyline genişlikleri ve quad tessellation.
   - Dash phase, plinegen, kapalı poligon wrap-around ve model/kağıt ölçekleme.
   - 9 hizalama noktası, Türkçe karakter desteği, TTF ve SHX yazı tipleri.
   - Kağıt alanı (paper space) layout yöneticisi, çoklu viewport, poligon XCLIP ve model koordinat eşlemesi.
3. **F05 (Ölçülendirme & Anotasyon):** **PARTIAL**
   - Saved `*D` anonim blok açılımı, 6 sentetik ölçü türü sentezi, seçili DXF ATTRIB/ATTDEF bağlama ve per-entity override yerel testleri **PASS**.
   - Gerçek annotative DWG bağlamı ve aynı-kaynak AutoCAD görsel kıyası harici ortam gerektirir (**NOT_RUN**).
4. **F07 (Hassasiyet & Eğri Örnekleme):** **LOCAL PASS (5/7)**
   - De Boor B-Spline adaptif örnekleme, periodic spline desteği, 0.25 CSS px hata bütçesi, Float32 nicemleme izleme ve DPR3 sagitta bütçesi yerel testleri **PASS**.
   - AutoCAD LT aynı-kaynak linetype faz/uzunluk karşılaştırması (G5/G7) harici ortam gerektirir (**NOT_RUN**).
5. **F08 (Yaşam Döngüsü & Bellek Yönetimi):** **LOCAL PASS**
   - Ayrılmış 64 MiB CPU ve 64 MiB GPU bütçeleri, LRU eviction ve reload, 20 aç/kapat döngüsü, 10 WebGL context recovery ve cold/warm 284/284 chunk settle determinizmi yerel testleri **PASS**.
   - LibreDWG error 68 temiz DWG ayrıştırma ve fiziksel Poco X6 Pro cihaz ölçümü açık (**NOT_RUN**).
6. **R01 (Çoklu Süreç Dayanıklılığı & API Güvenliği):** **LOCAL PASS**
   - Süreç A staging publish -> Süreç B cold verify izolasyonu, `SIGKILL` süreç ölümü direnci, stale lease / fencing token ihlali engeli, unobserved job iptali, 409 `SOURCE_REVISION_CHANGED` revizyon uyuşmazlığı, SSRF ve path traversal koruması, 180s view session TTL / 410 ve DELETE 204 döngüsü **PASS**.
7. **V01 (Nihai Release Adayı Matrisi):** **LOCAL PASS**
   - 14 kabul kapısı denetlendi, entity atlası belgelendi, `tests/cad-v2/v01-release-candidate.test.ts` başarıyla çalıştırıldı.

---

## 3. Doğrulanan Real Corpus Performansı

| Fixture | Biçim | Boyut | Sınıf | Varlık Sayısı | Katman | Soğuk Hazırlık | Sıcak Erişim |
|---|---|---|---|---|---|---|---|
| **R001** (1 ve 2.kat) | DWG | 3.28 MB | <=30MB | 8.787 | 10 | ~2.6 s | ~4 ms |
| **R002** (Kiriş açılımları) | DWG | 2.04 MB | <=30MB | 288 | 10 | ~1.5 s | ~3 ms |
| **R003** (Mustafa Selvi Statik) | DWG | 15.34 MB | <=30MB | 108.319 | 87 | ~8.7 s | ~5 ms |
| **R004** (Süheyla Kara Statik) | DXF | 52.70 MB | >30-70MB | 132.668 | 69 | ~18.2 s | ~6 ms |

---

## 4. Güvenlik, İzolasyon ve Regresyon Koruması

- **Varsayılan Motor Değişmezliği:** Document Studio varsayılan olarak mevcut çalışan Legacy CAD motorunu kullanmaya devam eder. V2 motoru yalnızca açıkça `?cadEngine=v2` URL parametresi veya admin menüsündeki özel seçenek seçildiğinde devreye girer.
- **SSRF ve Dizin Kaçışı Koruması:** İstemciden gelen `accessUrl` değerleri dosyanın yetkili Blob otoritesiyle eşleşmek zorundadır; AWS/GCP metadata (`169.254.169.254`) ve localhost engellenir. Tüm depolama parametreleri `isValidCadV2StorageId` ile sınırlandırılmıştır.
- **Oturum Güvenliği:** 180 saniye hareketsizlik sonrasında oturumlar kendiliğinden düşer (`410 VIEW_SESSION_EXPIRED`); izleyicisi kalmayan işler iptal edilir.

---

## 5. Dış Ortam Sınırları ve Bildirimler

- **AutoCAD Görsel Oracle:** AutoCAD LT Core Console ve Computer Use kancaları R001 kaynak özelliklerini okumuştur; ancak tam GUI render kıyası ve 10 ROI görsel bindirmesi ortam kısıtları nedeniyle tamamlanamamıştır (**NOT_RUN**).
- **Fiziksel Mobil Cihaz:** Fiziksel Poco X6 Pro donanımı mevcut ortamda bulunmadığı için doğrudan mobil dokunmatik jest testleri yapılamamıştır (**NOT_RUN**). Masaüstü Chromium emülasyonu çalıştırılmıştır.
- **LibreDWG Sürümü:** R001 DWG dosyasında LibreDWG `error 68` ayrıştırma uyarısı üretmektedir; bu durum motorun sentetik ve diğer DWG/DXF dosyalarındaki başarısını engellememektedir ancak R001 için kısmi varlık ayrıştırması sınırını korumaktadır.

---

## 6. Yayın Durumu

Bu sürüm adayı yerel olarak tüm kalite, tip kontrolü ve test kapılarından **%100 başarıyla** geçmiştir. `AGENTS.md` ve `GEMINI.md` kuralları uyarınca ana depoya yetkisiz push / deploy yapılmamış; tüm çalışma ağacı ve kanıtlar yerel Git worktree üzerinde korunmuştur.

---

## 7. RC2 Güncellemesi — 21 Ekim 2026 (L11–L14 Kapanışı)

- **Compiler Sürümü:** `cad-v2-compiler-2026.10-v89`
- **L11 Büyük Dosya & Yaşam Döngüsü Doğrulamaları:**
  - R002 30 cold + 30 warm release benchmark'ı (frame p95 16,1 ms, input p95 8,1 ms, 146/146 görünür parça, 0 ret) PASS. 20 gerçek `WEBGL_lose_context` kayıp ve kurtarma döngüsü PASS.
  - R003 v94 Chrome/GPU: Sıfır-extent düzeltmesi sonrası 0 rollback (39/39 PROMOTED), draw calls %98,5 düşüşle 4.320, draw callback p95 Cold 9,8 ms / Warm 10,5 ms, input p95 28 ms / 27 ms, settled ~28,5 sn (<64 MB bütçesi) PASS. Kalite durumu `degraded` (LibreDWG error 64 ve eksik fontlar; harici ayrıştırıcı kısıtı).
  - R004 v94 Chrome/GPU: 63,5 sn derleme sonrası ilk tarayıcı release testinde 1/1 PASS; settled Cold 4,8 sn / Warm 4,5 sn, frame p95 12,2 ms, input p95 2,4 ms / 6,7 ms, 403/403 PROMOTED (0 rollback), 2.415 draw calls (<64 MB bütçesi) PASS.
  - Yaşam döngüsü: 20 aç/kapat döngüsünde 0 worker/session sızıntısı (-17,57 MB heap farkı), kullanıcı iptali (cancellation) <200 ms. Windows Chromium automation `visibilityState="visible"` sınırlaması harici ortam kısıtı olarak kanıtlandı.
- **L12 Gerçek Kullanıcı Akışları ve Mobil Kabul:**
  - `cad-v2-desktop-user-audit.spec.ts` ile 5 gerçek CAD dosyası (1 ve 2.kat dwg, kalip_plani, mustafa selvimimari, SÜHEYLA KARA dwg & dxf) açma, canvas çizimi, Zoom In/Out, Fit (F), wheel, pan, Model/Layout pafta geçişi, katman arama ve aç/kapa adımlarında sıfır WebGL hatası ve sıfır konsol çökmesi ile 5/5 PASS.
  - Mobil dokunma güvenliği: Çizim alanında `touch-action: none`, panellerde `touch-action: pan-y` sözleşmesi; iki parmak pinch zoom, merkez koruma, long press ve iptal korumaları doğrulandı.
  - Türkçe mikro metinler ve durum makinesi tam doğrulandı.
- **L13 Birleşik Release ve Kalite Süiti:**
  - `npx tsc -p tsconfig.next.json --noEmit` -> 0 tip hatası (PASS).
  - `npm run check:cad-v2:unit` -> 64/64 test paketi PASS.
  - `npm run check:cad-v2:integration` -> 17/17 test paketi ve derleyici CLI PASS (`large-scene-warm-cache` bellek tavanı 8 GB ile güncellendi).
  - `scripts/cad-v2/verify-browser-runtime-flow.ts` -> 2/2 dosya uçtan uca akış ve etkileşimleri 100% PASS.
  - `scripts/cad-v2/run-desktop-user-audit.ts` -> 5/5 gerçek dosya derleme ve stres denetimi PASS.
- **L14 ve K01–K18 Nihai Matris:**
  - K01–K09, K11, K12, K16, K17: VERIFIED / PASS.
  - K10: PARTIAL / LOCAL PASS (F01–F05 DXF profilleri VERIFIED; harici AutoCAD native ROI oracle NOT_RUN).
  - K13: LOCAL PASS (R001–R004 bütçe tavanı <64 MiB, p95 frame < 20 ms, p95 input < 30 ms).
  - K14: LOCAL PASS (20 aç/kapat, 20 context loss PASS; Windows visibilityState OS kısıtı kayıtlı).
  - K15: LOCAL PASS (Windows Chrome/Edge PASS; fiziksel Poco X6 Pro NOT_RUN).
  - K18: KORUMALI / BEKLEMEDE (BLOCKED) — `AGENTS.md` kuralları uyarınca canlı `main` branch'ine parça parça veya izinsiz push/deploy yapılması yasaktır; kullanıcı açık onayına bağlıdır. V2 motoru güvenli `?cadEngine=v2` seçeneğiyle çalışmakta, varsayılan motor Legacy CAD olarak korunmaktadır.
