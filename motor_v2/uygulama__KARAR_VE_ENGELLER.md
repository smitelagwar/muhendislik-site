# Karar ve engel indeksi

[Kayıt dizini](uygulama__README.md) · [Kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [CR şablonu](sablonlar__KARAR_ENGELI.md)

| Sürüm | Tarih | Karar sahibi | Durum |
|---|---|---|---|
| EXEC-1 | 05.09.2026 | Astra; kullanıcının “Gemini yalnız uygulayıcı” talimatıyla | Tarihsel; [tam arşiv](arastirma__exec1-tam-belge-arsivi.json) |
| EXEC-2 | 06.09.2026 | Astra; kaynak kod ve plan denetimi | Geçerli; [13 bulgu/karar](26_PLAN_DENETIMI_VE_EXEC2.md), uygulama başlamadı |
| **FIDELITY-V3** | 20.09.2026 | Kullanıcı / Gemini | **Geçerli Uygulama Rehberi**; kanıtlı kök neden ve AutoCAD görünüş doğruluğu v3 planı |

Gemini bu sürümü veya D kararlarını kendi başına onaylayamaz/değiştiremez. Teknik araştırma alternatifleri uygulamaya açık değildir. Aynı sözleşme içindeki normal bug fix için CR gerekmez.

| CR / Karar | G / P / R | Gerçek engel / kanıt | Bağımlı işler | Bağımsız işler | Karar / Durum |
|---|---|---|---|---|---|
| **ENGEL-01** | V01 / F01..F08 | AutoCAD LT 2027 ile R001–R003 kaynak census'i ve AutoCAD-authored decoder fixture'ı mevcut; ancak aynı kaynak için V2'yle karşılaştırılabilir golden render/vektör çıktısı henüz yok. R004 DXF AutoCAD LT Core Console'da erişim ihlali veriyor. | AutoCAD piksel/geometri eşitlik kapıları | Tüm yerel ayrıştırma, OCS, HATCH, units, visibility, block text ve compiler testleri | **BLOCKED (NOT_RUN)**; hayali golden üretilmez; yerel çalışmalar durdurulmaz. |
| **KARAR-V3-01** | P00 | **Kök Neden Ayrımı:** R001'de non-uniform scale=0, expansion=69.668 (<500.000), blok sızıntısı=0, paper sızıntısı=0. Bu hipotezler ana neden değildir. | P01..P08 | — | **KABUL EDİLDİ:** Ölçülen gerçek kusurlar: `isVisible` alanı ve block transformer child visibility, HATCH `boundaryPaths`, INSUNITS=4 eşleme hatası, -Z extrusion OCS ve blok içi TEXT/MTEXT kaybıdır. |
| **KARAR-V3-02** | P00 | **Test Çıktısı İzolasyonu:** Testler kullanıcının `.data/cad-v2-scenes` veya canlı Blob alanına yazamaz. | P00..V01 | — | **KABUL EDİLDİ:** `test-output/cad-v2-tmp` izole geçici dizini kullanılır. |
| **KARAR-V3-03** | P00 | **Legacy Dokunulmazlığı:** Legacy engine ve `check:cad-preview-v2` testleri korunur; V2 motoru yalnızca `check:cad-v2:*` scriptleri ile test edilir. | Tüm paketler | — | **KABUL EDİLDİ:** Legacy dosyalara dokunulmaz. |

## U1 — Kullanıcı hedef açıklaması / 06.09.2026

[32](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) klasik CAD görünüşü, bilgisayar/Poco gerçek kullanıcı kontrolü ve henüz belirlenmeyen sunucu bütçesini kaydeder. EXEC-2 teknik mimarisi korunur. Bu kayıt test veya satın alma onayı değildir.

## U2 — Kullanıcının lisans süreçlerini sadeleştirme talimatı / 06.09.2026

[00 D22/U2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) genel lisans evrakı kabul kapısını kaldırır. Gereksiz UI/rapor/onay yok; gereken gerçek bildirimler dağıtım paketinde. Teknik görevler devam eder; üçüncü taraf koşulları kaldırılmış sayılmaz. R39 ve G02/G07/G15/A6 buna göre güncellendi.

## U3 — Kullanıcının dört cevabı / 06.09.2026

[32 U3](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) görünüş önceliği, offline olmaması, 30/70 MB dosya profili ve tek dosya akışını bağlar. G07/G09 kaynak çözümü ve G15 test sınıfları güncellendi. Normal legacy açılış/V2 ayrı menü korunur. Bu kayıt gerçek dosya testi değildir.

## U4 — Kullanıcının Fidelity v3 Planı Talimatı / 20.09.2026

“DWG/DXF Motor V2 — Kanıtlı kök neden ve AutoCAD görünüş doğruluğu planı v3” belgesi bağlayıcı uygulama rehberi olarak kabul edildi. P00 başlangıç baseline'ı kuruldu. R001 üzerindeki görünmez blok içeriği, HATCH alanları, INSUNITS=4, OCS ve blok içi text kaybı başlangıç kanıtına alındı; doğrulanmayan ownership/expansion hipotezleri geri çekildi.
