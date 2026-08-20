# Ruhsat Ön Fizibilite — Aşama 8 Test Matrisi

Bu matris domain, üretim rotası ve sonuç deneyimi kapsamının izlenebilir özetidir.

## Fixture rolleri

| Fixture sınıfı | Rol | Oracle olabilir mi? | Kaynak |
|---|---|---:|---|
| `CURRENT_LAW_SYNTHETIC_ORACLE` | Aktif snapshot ile kontrollü sentetik beklenti | Evet, yalnız aynı rule/assumption sürümü için | Aşama 3 yürütülebilir snapshot ve açık HEURISTIC varsayımlar |
| `HISTORICAL_REGRESSION_NOT_CURRENT_LAW_ORACLE` | Gerçek proje tutarsızlıklarını ve derslerini koruyan regresyon verisi | Hayır | Ana MD anonim `CASE_01`–`CASE_10` |

Tarihsel CASE kayıtları doğrudan `calculateRuhsatFeasibility` girdisi değildir. Güncel eşik veya mevzuat sonucu üretmek için kullanılamaz.

## Otomatik matris

| Alan | Kapsanan davranış | Test kaynağı |
|---|---|---|
| Unit | Tek konut asansör istisnası; karma BB tipinde sığınak kesinliği üretmeme | Fortress |
| Boundary | Asansör kat ve BB; sığınak BB; yangın 21,50 m; nSEB 2.000 m²; yağmur suyu parsel/çatı eşikleri için altı/tamı/üstü | Engine + Fortress |
| Normalization | Türkçe/İngilizce ondalık, gruplama, boş/sıfır ayrımı, tarih, aralık, provenance | Domain + Fortress |
| Golden | Temel, geometri kısıtlı ve emsal kısıtlı üç sentetik current-law fixture | Fortress |
| Invariant | Unknown veriden senaryo yok; geometri bilinmeden exact placement yok; HEURISTIC statü korunur; iz/provenance korunur | Engine + Fortress |
| Iteration | Stabilizasyon, trigger feedback, cycle ve max-iteration; başarısız yakınsamada final değer `null` | Engine + Fortress |
| Malformed | Geçersiz sayı payload'ları, tarih, istek zarfı, normalize veri, confidence, provenance, assumption ve kapasite | Fortress |
| Snapshot/version | Dört sürüm izi; stale şema/id; executable olmayan, null veya aynı-id değiştirilmiş snapshot | Fortress |
| Historical regression | CASE_01–CASE_10 sınıflandırması; CASE_08, CASE_09 ve CASE_10 aritmetik/ledger tutarsızlıkları | Fortress |
| Generated | Sabit seed ile 128 geçerli girdi; determinism, sonlu çıktı, convergence final sözleşmesi, false-certainty yasağı | Fortress |
| Route regression | Aşama 5'te üretim rotası yerinde yeni domain kabuğuna dönüşür; legacy motor import edilmez, eski query'ler kanonik URL'ye temizlenir | Build + `check:ruhsat-ui` |
| Aşama 5 UI shell | Kanonik parametresiz URL, empty/invalid/partial durum, Türkçe ondalık, disclosure, klavye odağı, tema ve 360 px layout | `npm run check:ruhsat-ui` |
| Aşama 6 results experience | Üç canonical senaryo, seçili kartın `aria-pressed` durumu, ana darboğaz, “neden?” teknik tetikleri, hesap/provenance izi ve QA notları | `npm run check:ruhsat-ui` |
| Aşama 6 mobil/a11y | Enter ile senaryo seçimi, native disclosure, 360 px taşmasız görünüm ve sonuçların input flow'dan önce hiyerarşisi | `npm run check:ruhsat-ui` |
| Aşama 7 PDF/report | Current-law fixture ile PDF snapshot, yasal haklar, üç senaryo, sürüm izi, privacy notu ve PDF sayfa/içerik doğrulaması | `npm run check:ruhsat-report` |
| Aşama 7 dışa aktarım / privacy | PDF indir, yazdırma sekmesi, JSON şeması/snapshot izi; ruhsat verisinin URL veya localStorage'a yazılmaması | `npm run check:ruhsat-ui` |
| Aşama 7 SEO / route | Türkçe metadata, canonical, SoftwareApplication JSON-LD ve sitemap kaydı | `npm run check:ruhsat-ui` |
| Aşama 8 eşik/float audit | Kritik eşiklerde altı/tamı/üstü ve kayan nokta komşulukları | `npm run check:ruhsat-audit` |
| Aşama 8 false certainty | HEURISTIC görünürlüğü, geometri olmadan exact placement yasağı ve “aday BB” dili | `npm run check:ruhsat-audit` + UI smoke |
| Aşama 8 recalc/stale state | KAKS değişiminde senaryo yeniden hesabı; invalid inputta eski sonuç ve rapor aksiyonlarının kalkması | `npm run check:ruhsat-ui` |
| Aşama 8 cycle/provenance | Cycle'ın `PARTIAL`/QA/`null` final üretmesi; rule/source/snapshot izinin korunması | `npm run check:ruhsat-audit` |
| Aşama 8 PDF/JSON/privacy | Rapor eşliği, ham enum yasağı, URL/localStorage/ağ sızıntısı olmaması | Audit + Report + UI smoke |
| Aşama 8 site regresyonu | 428 sayfalık build, legacy alan PDF ve inşaat maliyeti PDF çıktıları | `npm run check:ruhsat-release` |

## Çalıştırma

```text
npm run check:ruhsat
```

Alt komutlar:

```text
npm run check:ruhsat-domain
npm run check:ruhsat-engine
npm run check:ruhsat-fortress
npm run check:ruhsat-report
npm run check:ruhsat-ui
npm run check:ruhsat-full
npm run check:ruhsat-audit
npm run check:ruhsat-lint
npm run check:ruhsat-release
npm run check:estimated-area-pdf
npm run check:insaat-maliyeti-pdf
```

## Kabul kapısı

- Eşiklerin altı/tamı/üstü testlidir.
- Partial/unknown veri kesin sonuç üretmez.
- Aynı normalize girdi + aynı snapshot + aynı assumption set deterministiktir.
- Yakınsama yoksa son iterasyon keyfî final yapılmaz.
- Tarihsel CASE fixture'ları güncel mevzuat oracle'ı değildir.
- Snapshot kimliği kadar içeriği de canonical kayıtla eşleşmelidir.
- Core engine testleri UI entegrasyonundan bağımsız çalışır.
- Senaryo girdisi değiştiğinde yeni sonuç üretilir; geçersizleşen girdide eski sonuç veya rapor aksiyonu kalmaz.
- HEURISTIC veya geometri dışı aday sonuç kesin proje/yerleşim iddiası gibi sunulmaz.
- Release zinciri build, tarayıcı, rapor ve mevcut hesaplayıcı PDF regresyonlarını birlikte geçmelidir.
- Sürümlü V1 kapsamı dışındaki kurallar açıkça ertelenir; sessiz fallback uygulanmaz.
