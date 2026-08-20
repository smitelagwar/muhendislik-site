# Ruhsat Ön Fizibilite — Uygulama Durumu

Bu kısa kayıt, aşamalar arası teknik devir noktasıdır. Ürün ve hesap kuralları için kaynak belgeler esas alınır; bu dosya yalnız uygulama durumunu ve kilit kararları izler.

## CURRENT_STAGE

- Aşama 8 — tamamlandı; sekiz aşamalı plan kapatıldı.
- Kapsam: adversarial teknik denetim, bulunan release kusurlarının onarımı, yeniden hesap/stale-result koruması ve lint/typecheck/unit/integration/build/PDF release kapısı.

## LOCKED_DECISIONS

- Üretim rotası `/hesaplamalar/tahmini-insaat-alani` olarak kalır; Aşama 5'te aynı rota yerinde dönüştürülür. Paralel bir üretim rotası açılmaz.
- Mevcut rota ve mevcut `tahmini-insaat-alani` motoru Aşama 1–4 boyunca değiştirilmeden çalışır; yeni alan modülü eski motoru import etmez.
- Eski `arsa`, `taks`, `kaks`, `kat`, `bodrum`, `bodrumKat`, `bodrumAlan` ve `profil` sorgu parametreleri Aşama 5'te yeni forma taşınmaz. Yeni istemci bu parametreleri okumaz ve rotayı kanonik, parametresiz URL'ye getirir.
- Yeni deterministik hesap alanı `src/lib/calculations/modules/ruhsat-on-fizibilite/**` altında tutulur. UI mevcut rota dizininde, rapor üretimi `src/lib/reports/ruhsat-on-fizibilite/**` altında geliştirilir.
- V1 istemci tarafında ve bellek içi çalışır; URL, `localStorage`, veritabanı, backend ve yeni bağımlılık eklenmez.
- V1 geometri kapasitesini yalnız manuel girdi olarak kabul eder. Geometri çiziminden otomatik kapasite çıkarmaz.
- PDF/yazdırma çıktısı Aşama 7 kapsamındadır.
- Eksik sayısal alanlar `unknown` kalır; `null`, boş değer ve sıfır birbirine dönüştürülmez. Geçersiz alanlar kısmi normalize sonuçta `INVALID` olarak korunur.
- `DOCUMENT`, `MEASUREMENT`, `LOCAL_RULE` gibi güçlü provenance statüleri izlenebilir `sourceId` olmadan kabul edilmez.
- Güven seviyesi katı zincirdir: güncel/okunaklı imar belgesi yoksa `BELOW_A`; belge → A, ayrıca plan notu + koordinatlı parsel → B, ayrıca mimari ön plan → C, ayrıca ruhsat hesabı + DWG → D.
- Sayı normalizasyonu virgül veya nokta ondalığı ile gruplu `1.234,56` / `1,234.56` girişlerini kabul eder; iç hassasiyet 6 ondalık basamaktır.
- Yürütülebilir snapshot yalnız `01.07.2026` ve sonrası yeni ruhsat başvurularını ve konut senaryolarını destekler. Eski tarih veya farklı kullanım için motor kesin kural seçmez.
- Senaryo hedef net/kapalı brüt alanları, çekirdek ve teknik rezervler motora açık `HEURISTIC` assumption set olarak verilir; sabit çekirdek yüzdesi veya gizli net→brüt katsayısı yoktur.
- Üç canonical senaryo sırası `COMPACT_MAX_UNITS`, `BALANCED`, `COMFORT_FEWER_UNITS` olarak kilitlidir; hedef kapalı brüt alanları kesin artan olmalıdır.
- Geometri kapasitesi yoksa TAKS yalnız teorik üst sınır olarak kullanılır, QA `GEOMETRY_UNVERIFIED` üretir ve hiçbir senaryo exact placement iddiasında bulunmaz.
- İterasyon BB/kat, toplam BB, kritik trigger ve darboğaz fixed-point'ini arar. Cycle veya maksimum iterasyon durumunda `finalTotalUnits = null`; son iterasyon keyfî sonuç yapılmaz.
- Otopark sayısı, kesin yangın çözümü, sığınak net alanı, merkezi ısıtma ve yerel kurallar gerekli proje verisi olmadan kesinleştirilmez.
- TAKS/KAKS ve efektif oturum sonuçları formül, input statüleri, sourceId'ler ve ruleId'lerle hesap izi taşır.
- Güncel mevzuat oracle'ı yalnız `CURRENT_LAW_SYNTHETIC_ORACLE` rolündeki sentetik fixture'lardır. `CASE_01`–`CASE_10`, `HISTORICAL_REGRESSION_NOT_CURRENT_LAW_ORACLE` rolündedir ve güncel eşik sonucu üretmez.
- Motor çalışma zamanı zarfını, normalize veri bütünlüğünü, confidence/provenance tutarlılığını, varsayım setini ve manuel teknik kapasiteyi fatal diagnostic ile doğrular; bozuk payload'da istisna veya sayısal sonuç üretmez.
- Snapshot yalnız sürüm kimliğiyle değil canonical içeriğiyle de doğrulanır. Aynı kimlikli değiştirilmiş snapshot hesap üretemez.
- Üretim rotası artık yeni domain motorunu doğrudan kullanır; legacy `tahmini-insaat-alani` motoru korunur fakat yeni route client'ı tarafından import edilmez.
- Yeni istemci URL sorgusu veya `localStorage` kullanmaz. Eski query parametreleri okunmaz; rota parametresiz kanonik URL'ye geri döner.
- Başlangıç senaryo ve teknik rezerv değerleri `createDefaultScenarioAssumptionSet()` ile açık `HEURISTIC` değerler olarak sağlanır; tümü gelişmiş form alanında kullanıcı tarafından değiştirilebilir.
- PDF/print/report kontrolleri kasıtlı olarak Aşama 7 kapsamındadır; Aşama 5 route kabuğu bunları yeniden eklemez.
- Aşama 6, motor çıktısına yeni hesap, yuvarlama veya mevzuat kuralı eklemez; yalnız mevcut senaryo, bottleneck, trigger, QA ve trace sözleşmesini sunar.
- İlk görünüm üç aday senaryoyu ve seçili senaryonun ana darboğazını gösterir. Teknik ayrıntılar ile kaynak/provenance verisi açılır bölümlerdedir; ekran bir debug dökümü değildir.
- Mobil hiyerarşide hesaplanmış sonuçlar input flow'dan önce gelir. Senaryo kartları yerel state ile seçilir, `aria-pressed` ile durumunu bildirir ve klavye ile etkinleştirilebilir.
- PDF/print yalnız `CALCULATED` analizde kullanılabilir. Rapor, mevcut `PdfExportSnapshot` altyapısıyla üretir; dört özet metrik, yasal haklar, üç senaryo, teknik inceleme, QA notları ve dört sürüm izini taşır.
- PDF/report kodu kullanıcı eyleminde `import()` ile yüklenir; jsPDF ilk hesap ekranının başlangıç bundle'ına eklenmez.
- JSON dışa aktarımı açık kullanıcı eylemidir; `rawInput`, analiz ve `ruhsat-on-fizibilite-export@1` şemasını indirir. V1 JSON import, `localStorage`, URL state, otomatik taslak/kayıt, backend ve hesap/proje hesabı eklemez.
- Raporlar tarayıcıda üretilir. Proje verisi URL, localStorage, ağ isteği, analytics veya server log'a bu özellik tarafından yazılmaz; indirilen dosyanın saklanması kullanıcının yerel tercihi ve sorumluluğundadır.
- Yazdırma popup'ı kullanıcı tıklaması sırasında senkron olarak ayrılır; lazy rapor import'u tamamlandıktan sonra aynı pencereye yazılır. Böylece popup engelleyici kaynaklı sessiz başarısızlık önlenir.
- PDF kullanıcı metni ham teknik enum göstermez; teyit durumu Türkçe sunulur ve PDF/JSON aynı analiz snapshot'ından türetilir.
- Release kararı yalnız yukarıdaki dört sürüm kimliği ve açık V1 kapsamı için geçerlidir. Denetim kanıtı `docs/ruhsat-on-fizibilite/RELEASE_AUDIT.md` dosyasındadır.

## VERSION_IDS

- `ANALYSIS_SCHEMA_VERSION = 0.3.0`
- `ENGINE_VERSION = 0.4.0`
- `RULE_SNAPSHOT_VERSION = tr-ruhsat-rules@2026-08-20`
- `ASSUMPTION_POLICY_SNAPSHOT_VERSION = manual-scenario-v1`
- Kaynak: `src/lib/calculations/modules/ruhsat-on-fizibilite/versions.ts`

## CHANGED_FILES

- `src/lib/calculations/modules/ruhsat-on-fizibilite/versions.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/index.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/types.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/number-parsing.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/normalization.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/confidence.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/rules.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/engine-types.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/technical-triggers.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/engine.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/default-assumptions.ts`
- `src/lib/calculations/modules/ruhsat-on-fizibilite/reporting.ts`
- `scripts/check-ruhsat-on-fizibilite-domain.ts`
- `scripts/check-ruhsat-on-fizibilite-engine.ts`
- `scripts/check-ruhsat-on-fizibilite-fortress.ts`
- `scripts/check-ruhsat-on-fizibilite-reporting.ts`
- `scripts/check-ruhsat-on-fizibilite-release.ts`
- `scripts/fixtures/ruhsat-on-fizibilite-fixtures.ts`
- `src/app/hesaplamalar/tahmini-insaat-alani/ruhsat-form-state.ts`
- `src/app/hesaplamalar/tahmini-insaat-alani/ruhsat-on-fizibilite-client.tsx`
- `src/app/hesaplamalar/tahmini-insaat-alani/components/RuhsatInputFlow.tsx`
- `src/app/hesaplamalar/tahmini-insaat-alani/components/RuhsatShellSummary.tsx`
- `src/app/hesaplamalar/tahmini-insaat-alani/components/RuhsatResultsExperience.tsx`
- `src/app/hesaplamalar/tahmini-insaat-alani/components/RuhsatReportActions.tsx`
- `src/app/hesaplamalar/tahmini-insaat-alani/page.tsx`
- `src/app/hesaplamalar/page.tsx`
- `src/lib/calculation-pages.ts`
- `src/lib/calculations/reporting.ts`
- `scripts/check-estimated-construction-area-route.mjs`
- `package.json`
- `docs/ruhsat-on-fizibilite/IMPLEMENTATION_STATE.md`
- `docs/ruhsat-on-fizibilite/TEST_MATRIX.md`
- `docs/ruhsat-on-fizibilite/RELEASE_AUDIT.md`
- `PROJECT.md`

## TEST_STATUS

- `npm run check:ruhsat-domain`: geçti; locale decimal, null/partial/impossible input, provenance, precision, determinism ve A–D geçişleri doğrulandı.
- `npm run check:ruhsat-engine`: geçti; legal rights, eşik altı/tam/üstü, üç farklı senaryo, trigger feedback, bottleneck, provenance, determinism, cycle ve max-iteration doğrulandı.
- `npm run check:ruhsat-fortress`: geçti; 75 test grubu ve sabit seed ile 128 generated geçerli girdi doğrulandı. Unit, boundary, invariant, golden, tarihsel regresyon, malformed, failure, version ve generated kategorilerinin tümü dolu.
- `npm run check:ruhsat-report`: geçti; current-law fixture ile üç sayfalık PDF üretimi/render sonrası içerik doğrulaması, PDF özet/senaryo/sürüm izi, JSON şeması ve privacy notu doğrulandı.
- `npm run check:ruhsat`: domain/motor/fortress/report paketini tek komutta çalıştırır.
- `npm run check:estimated-area`: Aşama 8 browser smoke geçti; canonical URL, metadata/canonical/JSON-LD/sitemap, empty/invalid/partial state, Türkçe ondalık, üç senaryo, seçili darboğaz, klavye ile senaryo seçimi, senaryo yeniden hesabı, stale-result temizliği, “neden?” teknik tetikleri, kaynak izi, local PDF/print/JSON export, URL/localStorage privacy, progressive disclosure, theme toggle ve 360 px taşmasız/mobil sonuç-öncelikli layout doğrulandı.
- `npm run check:ruhsat-ui` ve `npm run check:ruhsat-full`: UI veya tam domain+UI paketi için eklendi.
- `npm run check:ruhsat-audit`: geçti; eşik/float, false certainty, yeniden hesap, cycle, source/version/provenance, PDF/JSON eşliği, privacy ve deferred-scope kontrollerinde 0 kritik açık.
- `npm run check:ruhsat-lint`: geçti; yeni domain, route ve test kapsamı temiz.
- `npx tsc --noEmit --incremental false`: geçti.
- `npm run build`: Aşama 8 sonunda geçti; Next.js 16.1.6 üretim build'i 428 statik sayfayı ve dönüşen ruhsat ön fizibilite rotasını üretti.
- `npm run check:estimated-area-pdf`: legacy alan/PDF modülü bağımsız regresyon olarak geçti; üç fixture tek sayfalık PDF çıktı üretti.
- `npm run check:insaat-maliyeti-pdf`: mevcut maliyet raporu regresyonu geçti; iki sayfalık çıktı doğrulandı.
- `npm run check:ruhsat-release`: lint, typecheck, build, tam ruhsat paketi, adversarial audit ve iki mevcut PDF regresyonunu tek zincirde başarıyla tamamladı.

## BASELINE_EXCEPTIONS

- Global `npm run lint`, bu çalışma başlamadan önce var olan 266 bulgu (111 hata, 155 uyarı) nedeniyle başarısızdır.
- Aşama 1–8 global lint temizliği yapmaz; yalnız değiştirdiği TypeScript dosyalarında yeni lint ihlali üretmemelidir. Aşama 8 sonunda aynı 266 bulgu ölçülmüş, hedefli lint temiz geçmiştir.
- Aşama 5–8 smoke scripti, yalnız `/dokumantasyon?_rsc=...` `net::ERR_ABORTED` prefetch iptallerini açık ve dar bir filtreyle yok sayar; diğer ağ hataları test hatasıdır.

## KNOWN_RISKS

- Motorun yürütülebilir kapsamı şimdilik 01.07.2026 sonrası konut projeleridir; karma/ticari ve tarihsel rule packs sonraya kalır.
- Otopark ve bazı teknik çözümler kasıtlı olarak `REQUIRES_CONFIRMATION` kalır; sayısal kural eklemek için resmî konsolide metin ve proje sınıfı doğrulanmalıdır.
- PDF/report ve JSON dışa aktarımı kullanıcı cihazında oluşur; yerel dosya çıktılarını geri alma veya merkezi yaşam döngüsü V1 kapsamı dışındadır.
- PDF raporu mevcut generic export renderer'ını kullanır. V1'in sınırlı içeriği testlidir; gelecekte sınırsız serbest metin veya ek desteği gelirse yeni sayfa kırılımı/taşma testleri gerekir.

## PLAN_STATUS

- Sekiz aşamalı plan tamamlandı. Sonraki çalışma ancak yeni bir kapsam, rule snapshot değişikliği veya ayrı change request ile açılır.
