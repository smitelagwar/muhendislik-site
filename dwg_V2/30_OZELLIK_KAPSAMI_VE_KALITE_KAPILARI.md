# 30 — Temelden tam 2D kapsama özellik ve kalite kapıları

[Dizin](README.md) · [Sıra](19_GEMINI_ADIM_ADIM_UYGULAMA.md) · [Arayüz](21_ARAYUZ_TASARIM_SISTEMI.md) · [Kayıt](uygulama/ALT_KABUL_DURUMLARI.md)

**EXEC-2.** “Bütün özellikler” aşağıdaki salt okunur 2D görüntüleme kapsamıdır. Gemini özellik seçemez, zorunlu işi sonradan kapsam dışına alamaz. İlk dört gerçek dosyanın açılması bütün DWG/DXF sürümleri ve bütün entity'ler için kabul değildir.

## Sabit özellik listesi

| ID | Özellik / kesin davranış | Paket / ana gereksinim |
|---|---|---|
| F01 | Üç noktada dosya türüne uygun V2 aç; normal açılış legacy | G13 / R01,R02,R36 |
| F02 | Yetkili gerçek DWG ve ASCII/binary DXF hazırlama | G02,G11 / R03,R04 |
| F03 | Mouse sol/orta pan, wheel zoom ve trackpad | G04-B,G12 / R23 |
| F04 | Tek parmak pan, iki parmak pinch, iptal ve orientation | G04-B,G12 / R23,R30 |
| F05 | Görünür Yakınlaştır/Uzaklaştır/Sığdır ve klavye | G04-B,G12 / R23,R34 |
| F06 | Model/pafta seçimi, pafta başına kamera geri yükleme | G09,G12 / R13,R26 |
| F07 | Katman arama, görünürlük, kaynak frozen/locked açıklaması | G06,G09 / R12 |
| F08 | Kaynak renkleri/tek renk ve açık/koyu çizim zemini | G08,G16 / R11,R32 |
| F09 | Kaynak lineweight açık/kapalı; polyline width korunur | G08,G16 / R07,R11 |
| F10 | TEXT/MTEXT/SHX/Türkçe; eksik font görünür | G07 / R08 |
| F11 | Kaynak DIMENSION/LEADER ve override doğru görüntüleme | G07,G09 / R09 |
| F12 | Arc/ellipse/spline/bulge, block/instance/OCS ve hassasiyet | G06,G08 / R05–R07 |
| F13 | Solid/pattern hatch ve iç adalar/delikler | G08 / R10 |
| F14 | Painter order, wipeout, clip, alpha, dash phase | G08,G10 / R11 |
| F15 | Tek dosyada gömülü/bound kaynak + platform font çözümü; bulunmayan dış referans raporu; companion isteme yok | G09,G11 / R14,R15 |
| F16 | Hazırlanıyor/yükleniyor/kısmi/hazır/eksik/hata/iptal durumları | G04,G12,G16 / R25 |
| F17 | İptal/yeniden dene/explicit mevcut motorda aç | G11,G12 / R27 |
| F18 | Ağ kesilmesi/revoke/lease/servis kesintisi ve recovery | G11,G14 / R18,R19,R26 |
| F19 | Context loss ve tekrar açış bellek/listener temizliği | G05,G12 / R24,R26,R28 |
| F20 | Tema/tam ekran veya odak görünümü; erişilebilir mobile sheet | G04,G16 / R32–R35 |
| F21 | Public paylaşımda aynı V2; yetki ve expiry sınırları | G14 / R37 |
| F22 | Gerçek kaynak revision, kalite ayrıntısı ve tam dosya adı | G13,G16 / R16,R25,R42 |
| F23 | Yetkisi varsa mevcut indir/paylaş eylemlerine bağlanma | G13,G14 / R19,R36,R37 |
| F24 | Gerçek cihaz/doğruluk/hız kanıtı, kayıt ve Astra devri | G15–G17 / R29–R31,R39–R48 |

Underlay formatını seçilmiş decoder/compiler çözemiyorsa F15'te dosya/kapsam DEGRADED kalır; placeholder görsel üretip kabul edilmez. OLE/proxy içerik sessiz atılmaz, çalıştırılmaz. Destek iddiası her entity/version/fixture satırında ayrı tutulur. Bir özellik düğmesinin varlığı o özelliğin tamamlandığını göstermez.

## G04-B erken temel kapı

G00 sonrasında G04 iki alt parça olarak yürür: G04-A arayüz durumları, G04-B d3-zoom + Three kamera/renderer ile analitik input harness. G02 henüz bitmemişse bunlar ilerleyebilir. G04-B fixture'ı grid, sayısal koordinatları bilinen kare/daire, büyük origin ve görünür bbox seti içerir; CAD decode sonucu diye sunulmaz. N01–N23 otomasyona uygun kısımları gerçek browser'da, N24 erişilen gerçek cihazlarda çalıştırılır. Erişilmeyen fiziksel cihaz NOT_RUN; masaüstü testini telefon PASS diye kopyalama.

Bu kapı kamera, ±/fit, input lifecycle ve gerçek WebGL frame altyapısını erken doğrular. G05'in gerçek CAD zinciri yerine geçmez. G05 tamamlandı denmeden G04-B'nin otomasyon/masaüstü kritik koşulları geçmiş olmalı. Eksik fiziksel cihaz kabulü R30/N24'te açık kalır ve release'i engeller; decoder/geometri geliştirmesini durdurmaz.

## Sabit ayar sözleşmesi

| Ayar | Varsayılan / kalıcılık | Değişiklik etkisi |
|---|---|---|
| UI teması | Mevcut site tema tercihi | Yalnız UI; CAD source style değişmez |
| Çizim zemini | İlk açılışta siteye göre; sonra kullanıcı açık/koyu tercihi | Uniform/clear + ACI7 kuralı |
| Renk modu | Kaynak renkleri; tek renk isteğe bağlı kullanıcı ayarı | Tek renk zemine kontrast siyah/beyaz; alpha korunur |
| Çizgi kalınlığı | Kaynak kalınlıkları açık | Yalnız lineweight sunumu; source polyline width değişmez |
| Kamera/pafta/layer görünürlük override | Kaynak revision + layout bazında RAM | Yeni source veya logout ile silinir |
| Kaydır | Aktif | Mouse birincil pan; Space geçici pan |

Kişisel UI tema/zemin/renk modu/lineweight gibi **dosya içeriği taşımayan** tercihler mevcut tercih altyapısında cad-v2 namespace ile kalıcı tutulabilir. Bu, özel CAD sahnesini/katman adlarını/fontları diske yazma izni değildir. Kamera, layer listesi ve source bilgisi localStorage'a yazılmaz. Sayfa yenilemede kaynak kamera tercihleri kaybolabilir; bu sürüm için tanımlı davranıştır.

Kalite, renderer, decoder, worker sayısı, LOD seviyesi, “performans modu”, deneysel backend veya hassasiyet slider'ı son kullanıcıya açılmaz. Gerekli teknik ayarlar sabit konfigürasyondur; kullanıcıya seçim yükü verilmez. Yapılandırma yetersizse kanıt + CR.

## Sonraki genişleme sınırı

Mesafe/alan ölçme, nesne seçme/özellik inceleme, snap, işaretleme ve dışa aktarma bu uygulama turunda UI veya boş handler olarak eklenmez. İleride aynı 2D motor üzerinde bu sırayla ele alınacak: seçim/provenance → snap/ölçü birimi → mesafe/alan → ayrı annotation katmanı → export. Bu bir yetkilendirilmiş ikinci uygulama paketi değildir. Astra gerçek EXEC-2 denetiminden sonra her biri için bağımsız veri/izin/doğruluk planı çıkarır; Gemini kendiliğinden başlatmaz. 3D/orbit, kaynak DWG düzenleme ve “tüm CAD uygulaması” hedefe dahil olmaz.

Bu sınır gelecekteki özellikleri engellememek için handle/instance/units/geometry provenance'ın bugün korunmasını gerektirir. Ölçüm aracı yok diye canonical kaynak geometri veya units atılamaz.

## Kabul ve devir

F01–F24 özellik tamamlığını, N01–N24 giriş davranışını, V01–V18 çizimi, C01–C12 sözleşmeleri kontrol eder. Aynı RUN birden fazla satırı kanıtlayabilir ama otomatik hepsine PASS basılmaz. Ana R01–R48 paydası değişmez; ilgili alt koşul açıkken üst R kabul edilemez. Sonuçlar [alt kabul kaydına](uygulama/ALT_KABUL_DURUMLARI.md) gerçek SNAP/RUN/ART yollarıyla yazılır. Astra son denetimde sadece ana R metnini değil bu alt maddeleri de açar.

## U3 kapsam teyidi

Kullanıcı görünüş kalitesini birinci hedef, internetten tek DWG/DXF açılışını kesin akış olarak belirledi. Mesafe/alan araçları sonraya kalır; offline yok. Dosya hedefi genelde≤30 MB/en fazla70 MB. 32 U3 kaynak/font ve test profili bağlayıcıdır.
