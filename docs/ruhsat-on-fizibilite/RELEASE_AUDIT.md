# Ruhsat Ön Fizibilite — Aşama 8 Release Denetimi

**Denetim tarihi:** 21 Ağustos 2026  
**Karar:** V1'in tanımlı kapsamı için release'e hazır  
**Kritik açık:** 0

Bu kayıt, sekiz aşamalı planın adversarial teknik denetim, onarım ve release kapısını kapatır. Karar; `ANALYSIS_SCHEMA_VERSION = 0.3.0`, `ENGINE_VERSION = 0.4.0`, `RULE_SNAPSHOT_VERSION = tr-ruhsat-rules@2026-08-20` ve `ASSUMPTION_POLICY_SNAPSHOT_VERSION = manual-scenario-v1` birleşimi için geçerlidir.

## Denetimde bulunan ve giderilenler

1. Yazdırma penceresi lazy import tamamlandıktan sonra açılıyordu. Gerçek tarayıcılarda kullanıcı hareketi bağlamı kaybolup popup engelleyicisine takılabilirdi. Boş pencere artık tıklama sırasında senkron olarak ayrılıyor, rapor daha sonra aynı pencereye yazılıyor; hata halinde pencere kapatılıyor ve kontrollü Türkçe mesaj gösteriliyor.
2. PDF teknik özetinde `REQUIRES_CONFIRMATION` ham enum değeri kullanıcıya görünebiliyordu. Değer `teyit gerekli` olarak yerelleştirildi ve ham enum'un PDF'e sızmadığı teste bağlandı.
3. Senaryo değişikliğinde yeniden hesap ve geçersiz input sonrasında eski sonuç/rapor aksiyonlarının kaybolması tarayıcı seviyesinde doğrudan kanıtlanmıyordu. KAKS düşürme/geri alma ve invalid-state geçişleri smoke testine eklendi.

## Adversarial kontrol matrisi

| Risk | Sonuç | Kanıt / koruma |
|---|---|---|
| Sessiz varsayılan | Geçti | Eksik veri `unknown`; senaryo varsayımları açık `HEURISTIC` alanlar ve sürümlü assumption set olarak taşınıyor. |
| Yanlış eşik, off-by-one, float kenarı | Geçti | Asansör, yangın, nSEB ve yağmur suyu eşiklerinin altı/tamı/üstü ile kayan nokta komşulukları `check:ruhsat-audit`, Engine ve Fortress'ta testli. |
| Kaynaksız veya sürümsüz kural | Geçti | Yürütülebilir kuralların source kayıtları, sayısal trigger'ların canonical rule ID'leri ve dört sürüm izi doğrulanıyor. |
| HEURISTIC'in olgu gibi sunulması | Geçti | UI, rapor ve analiz sözleşmesi HEURISTIC niteliğini koruyor; kaynak kod denetimi görünür uyarıyı kontrol ediyor. |
| Geometri olmadan kesin bağımsız bölüm/yerleşim iddiası | Geçti | Sonuçlar “aday BB” olarak sunuluyor, `exactPlacementClaimed=false`, `GEOMETRY_UNVERIFIED` QA kaydı ve “Kesin yerleşim iddiası: hayır” görünür. |
| Senaryonun yeniden hesaplanmaması / eski sonuç | Geçti | Tarayıcı smoke'u KAKS 1,50 → 0,60 → 1,50 geçişinde sonuç değişimini ve geri dönüşünü; invalid inputta sonuç ile rapor aksiyonlarının kalkmasını doğruluyor. |
| Gizlenen iterasyon döngüsü | Geçti | Cycle/max-iteration sonucu `PARTIAL`, QA kaydı ve `finalTotalUnits=null`; son iterasyon keyfî final yapılmıyor. |
| Provenance kaybı | Geçti | Trace içindeki source/rule ID'leri snapshot kayıtlarıyla karşılaştırılıyor; PDF/JSON sürüm izi korunuyor. |
| Mobil taşma / dark tema regresyonu | Geçti | 360 px görünüm, sonuç-öncelikli mobil hiyerarşi ve tema değişimi browser smoke kapsamında. |
| Mevcut hesaplayıcı regresyonu | Geçti | Legacy tahmini alan PDF'inde üç fixture, inşaat maliyeti PDF'inde iki sayfalık çıktı ve 428 sayfalık production build geçti. |
| PDF/JSON uyuşmazlığı | Geçti | Aynı analiz snapshot'ından senaryo sayısı, değerler ve sürüm izi karşılaştırılıyor; PDF içerik/sayfa kontrolü ayrıca çalışıyor. |
| URL/gizlilik sızıntısı | Geçti | Yeni route query okumuyor; proje verisi URL, `localStorage` veya ağ isteğine yazılmıyor. Browser ve statik kaynak denetimleri birlikte çalışıyor. |
| Build/runtime | Geçti | Next.js 16.1.6 production build, TypeScript ve uçtan uca browser akışı temiz tamamlandı. |

## Release kapıları

`npm run check:ruhsat-release` tek komutta aşağıdakilerin tümünü başarıyla tamamladı:

- Ruhsat kapsamına özel ESLint.
- `tsc --noEmit --incremental false`.
- Next.js production build: 428 statik sayfa.
- Domain, engine, 75 grupluk Fortress ve raporlama testleri.
- UI entegrasyon/smoke: canonical URL, yeniden hesap, stale-result, klavye, tema, 360 px mobil, PDF/print/JSON ve privacy.
- Stage 8 adversarial denetimi: 8 kontrol grubu, 0 kritik açık.
- Legacy tahmini alan PDF ve inşaat maliyeti PDF regresyonları.

Depo genelindeki `npm run lint`, çalışma öncesinden devralınan ve bu kapsam dışında kalan 266 bulgu (111 hata, 155 uyarı) nedeniyle kırmızıdır. Sayı Aşama 8 sonunda değişmemiştir; ruhsat kapsamına özel `npm run check:ruhsat-lint` temizdir. Bu taban çizgisi ürün release kararından ayrılmış, gizlenmemiş bir depo borcudur.

## Açıkça ertelenen kapsam

- 01.07.2026 öncesi başvurular ve konut dışı kullanım türleri için ayrı yürütülebilir rule pack'ler.
- Belediyeye/plan notuna özgü yerel kurallar ve tam otopark hesabı.
- Otomatik parsel/geometri çizimi ve kesin yerleşim üretimi.
- Dosya yükleme, JSON içe aktarma, otomatik taslak, URL state, `localStorage`, backend/veritabanı ve hesap/proje hesabı.
- Gelecekte serbest metin veya eklerle genişletilecek sınırsız rapor içerikleri için ayrıca sayfa kırılımı/taşma testi.

Bu ertelenenler V1'de kesin sonuç gibi gösterilmez. Yeni bir kapsam veya kural snapshot'ı açılmadan sekiz aşamalı plan tamamlanmıştır.
