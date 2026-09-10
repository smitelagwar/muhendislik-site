# Bilinen eksikler ve dış kanıt ihtiyacı

[Kayıt dizini](README.md) · [Gereksinimler](../24_GEREKSINIM_KATALOGU.md)

**Bunlar araştırma sonunda bilinmeyenlerdir; gerçekleşmiş bug veya test FAIL'i değildir.** Gemini gerçekten karşılaştığı ürün/teknik sorunları ayrı ID ile ekler. Eksiklerin planlanmış olması çözülmüş oldukları anlamına gelmez.

| ID | Alan | Güncel durum / etki | Kapanış kanıtı |
|---|---|---|---|
| GAP-001 | Seçilmiş server decoder'lar | G02 Node uyumu ve gerçek corpus decode edilmedi | Gerçek RUN, hash ve semantics |
| GAP-002 | Bağımsız referans | AutoCAD ana görünüş hedefi; GstarCAD/ZWCAD ek referans. Kurulu/lisanslı program ve sürüm doğrulanmadı; tek source + platform font profiliyle referans ekranları hazır değil; kullanıcıdan companion istenmeyecek | Lisanslı referans ortamı/ayarları ve crop/numeric manifest |
| GAP-003 | Fiziksel cihazlar | Kullanıcı bilgisayarı ve Poco X6 Pro ile kontrol edecek; testler yapılmadı. iPhone/tablet erişimi doğrulanmadı | Gerçek cihaz RUN/ART |
| GAP-004 | Production compiler host | Bütçe henüz belirlenmedi; host/kimlik bilgileri doğrulanmadı. Önce yerel tüketim ölçümü; Gemini sağlayıcı seçmeyecek | Astra/kullanıcı tarafından dağıtım hedefi ve canlı kabul |
| GAP-005 | Paketleme TODO — teknik blok değil | Ayrı lisans raporu geliştirme/kabul önkoşulu olmaktan çıkarıldı (U2). Mevcut notices korunur; gerçek dağıtım koşulları ilgili artifact için ele alınır | Gerekli bildirim/kaynak sunumu işleminin kısa kaydı; genel hukuk raporu yok |
| GAP-006 | Hız/kalite hedefi | Hiçbir V2 runtime benchmark sonucu yok | G15 ham verisi ve hedef profiline göre sonuç |
| GAP-007 | Arayüz | Tasarım/kabul şartı hazır, çalışan V2 ekranı yok | G04 prototip ve G16 gerçek ekranlar ayrı |
| GAP-008 | Three/D3 entegrasyonu | Kaynak incelemesi var; G04-B/gerçek sahne çalıştırılmadı | N/V testleri ve gerçek source zinciri |
| GAP-009 | Metadata/binary/lease | EXEC-2 sözleşmesi hazır; endpoint/encoder uygulanmadı | C01–C12 gerçek uygulama kanıtları |

Gerçek cihaz veya production host yokluğu bağımsız yerel geliştirmeyi durdurmaz. Ancak ilgili R için kabul verilemez; Gemini “yerel çalışıyor, dolayısıyla her cihazda/canlıda tamam” diyemez.

## U3 kullanıcı bilgileri

Dosya profili ≤30 MB olağan / 70 MB üst kullanım; yalnız DWG/DXF, online, görünüş kalitesi öncelikli. Harici klasör/font/XREF sağlanması artık kullanıcıdan beklenen bir bağımlılık değildir. Platform font kataloğu, legacy alias'larının V2'de doğru sınıflanması ve eksik dış referansların gösterilmesi G07/G09 işidir. Büyük gerçek corpus ve görüntü eşliği henüz test edilmedi.
