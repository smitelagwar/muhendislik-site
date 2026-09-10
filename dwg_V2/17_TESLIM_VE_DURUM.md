# 17 — Teslim durumu ve uygulamaya başlangıç

[Dizin](README.md) · [Gemini başlangıcı](18_GEMINI_UYGULAMA_REHBERI.md) · [Güncel uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) · [Astra denetimi](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**06.09.2026 — EXEC-2 plan denetimi tamamlandı; geçerli kararlar güncellendi. Yeni motorun uygulaması başlamadı.**

## Yapılan iş

- Kullanıcının Sol teknik önerisi okundu; birebir kopyası ve SHA-256 kimliği saklandı.
- Repo bağlamı/kuralları, mevcut CAD route/host/adapter/worker/cache, ilgili test ve örnek dosyalar incelendi.
- 15 GitHub deposunun metadata ve HEAD kayıtları alındı; ürün/format/lisans/browser belgeleri araştırıldı.
- Üç DWG ve bir büyük DXF için yerel boyut/hash/format envanteri çıkarıldı. DXF'te group-code lexical sayım ve bütün dosyada geçerli UTF-8 kontrolü yapıldı.
- Alternatifli motor/decoder kararı, canonical/render scene, pafta/metin/geometri doğruluğu, performans/mobil, güvenlik/işletim ve iki motor entegrasyonu tasarlandı.
- İlk araştırmada ortak fazlar, alternatif yollar, 10 deney ve 22 iş paketi hazırlandı; bunlar teknik araştırma katmanı olarak korundu.

## Son kullanıcı talimatına göre düzenlenenler

- Kullanıcı Gemini'yi yalnız uygulayıcı olarak belirledi. Teknik seçimleri bağlayan [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) yazıldı; eski önerilerin Gemini'ye seçim hakkı vermediği bütün ilgili araştırma belgelerinde belirtildi.
- Seçilen sistem sabitlendi: Node hazırlama hizmeti, mevcut kilitten DWG/DXF adapter'ları, canonical/packed scene, Three.js WebGL2 altyapılı bağımsız CAD renderer ve d3-zoom 2D giriş, Neon job ve private Blob türevleri. Browser raw decode ve alternatif SDK seçimi bu turda yok.
- Source/scene kimliği, job/host protocol, manifest/index ve API yüzeyi sabitlendi. 2 MiB'ı aşmayan chunk yanıtları her istekte yetkilendirilecek; browser'a doğrudan Blob URL'si verilmesi bu sürümde yok.
- G00–G17 olarak 18 uygulama paketi; girişler, dosya sınırları, negatif testler ve somut çıkış kanıtları yazıldı.
- R01–R48 gereksinim kataloğu; boş paket/izlenebilirlik tabloları ve gerçek eylem/test/snapshot/görsel/engel geçmişi için kayıt düzeni hazırlandı.
- Modern/kaliteli/lüks arayüz hedefi, mevcut site tokenlarıyla sabit tasarım ve UI01–UI20 ekran kabulüne dönüştürüldü. Bu bir tasarım belgesidir; gerçek UI maketi veya çalışan ekran üretilmedi.
- Astra'nın tek tek denetimi, AUD/FIX kayıtları, Gemini'nin yalnız atanmış düzeltmeleri uygulaması ve Astra'nın yeniden kontrolü tanımlandı.
- Kurulu libredwg-web/data-model public API ve sürüm bilgileri ek olarak okundu. Node desteği belgede mevcut; gerçek server decode bu oturumda çalıştırılmadı. DXF dalının wrapper'da yorumda olması ve free pointer sınırı plana işlendi.

## Uygulama durum tablosu

| Alan | Durum |
|---|---|
| Araştırma/öneri dosyaları | Hazır |
| Bağlayıcı Gemini uygulama planı | EXEC-2 hazır; seçim yetkisi Astra/kullanıcıda |
| Gemini uygulama geçmişi | Boş başlangıç hazır; yapılmamış iş/test yazılmadı |
| Astra bağımsız motor denetimi | Yapılmadı; 48 gereksinim NOT_REVIEWED |
| Arayüz | Tasarım ve kabul şartları hazır; çalışan V2 ekranı yok |
| Mevcut motor | Bu çalışma tarafından değiştirilmedi |
| V2 menü/route/host | Tasarlandı, uygulanmadı |
| Yeni parser/renderer/scene | Tasarlandı, uygulanmadı |
| Decoder A/B benchmark | Yapılmadı |
| V2 hız ve doğruluk iddiası | Kanıtlanmadı; ölçüm programı hazır |
| Gerçek telefon/tablet kabulü | Yapılmadı |
| Runtime test/typecheck/build | Çalıştırılmadı; yalnız doküman ve araştırma çıktısı üretildi |
| SDK kurulumu/satın alma | Yapılmadı |
| Yeni servis/DB/production değişikliği | Yapılmadı |
| Git commit/push/deployment | Yapılmadı |
| Kullanıcı çiziminin harici hizmete yüklenmesi | Yapılmadı |

## Bu paketin kanıt sınırı

Dosya envanteri CAD decode veya görsel test değildir. UTF-8 geçerliliği Türkçe glyph yerleşiminin doğruluğunu kanıtlamaz. Repo kod incelemesi canlı production'ın davranışını garanti etmez. SDK README'si gerçek çizim uyumunu kanıtlamaz. Bu ayrımlar sonraki uygulama raporlarında korunabilir.

## Önerilen ilk sonraki adım

[18 numaralı Gemini talimatı](18_GEMINI_UYGULAMA_REHBERI.md) ile uygulama başlatılır. İlk iş G00: güncel repo snapshot'ı ve izole test başlangıcı. Ardından [19 numaralı sabit sıra](19_GEMINI_ADIM_ADIM_UYGULAMA.md) yürütülür. Decoder/mimari elemesi Gemini'ye bırakılmaz; mevcut karar uygulanamıyorsa CR açılır.

Mevcut “CAD Preview V2” ile bu yeni “DWG Motor V2” projesi farklıdır. Gelecekteki rapor aktif engine kimliğini açık yazmalı. Kullanıcı varsayılanı değiştirmedikçe iki motor birlikte erişilebilir kalır.

## Teslim doğrulaması

İlk araştırma teslimi 22 Markdown ve 5 JSON dosyasıydı; onun kontrolü [teslim-kontrol.json](arastirma/teslim-kontrol.json) içinde tarihsel olarak korundu. Düzenleme öncesi dosya hash'leri [plan-revizyon-oncesi.json](arastirma/plan-revizyon-oncesi.json) içinde.

EXEC-1 paketinin tarihsel dosya sayıları ve kontrolleri [gemini-devir-kontrol.json](arastirma/gemini-devir-kontrol.json) içinde: yerel belge bağlantıları, code fence/JSON, 18 G/48 R/20 UI kimliği, boş uygulama durumları, legacy/dependency/config fingerprint eşliği ve Sol byte kopyası. Bu rapor **belge/kayıt kontrolüdür**, yeni motorun runtime, görsel veya production kabulü değildir. Dış URL'ler için toplu HTTP erişilebilirlik testi yapılmadı.

## EXEC-2 araştırma ve düzeltme teslimi

[26](26_PLAN_DENETIMI_VE_EXEC2.md) 13 plan bulgusunu ve gerekçeli karar revizyonunu kaydeder. [27–31](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md) sabit GitHub kaynak kullanımı, D3/Three giriş/çizim sözleşmesi, kapsam, metadata/binary ve lease ayrıntılarını ekler. G04-B erken temel test kapısı; ± düğmeleri ve ayarlar; 78 alt kabul kaydı eklendi. Bütün gerçek motor sonuçları NOT_RUN.

Önceki 45 Markdown içerikleri/hash'leri [arşivde](arastirma/exec1-tam-belge-arsivi.json). Yeni incelemenin [yerel kaynak](arastirma/exec2-yerel-kaynak-kaniti.json) ve [public commit](arastirma/exec2-public-kaynak-kimlikleri.json) kimlikleri ayrı. [Güncel belge kontrolü](arastirma/exec2-plan-kontrol.json) yerel bağlantı, kimlik, durum ve korunan dosya eşliğini kaydeder. [Kamera denklem kontrolü](arastirma/exec2-kamera-matematik-kontrol.json) yalnız planın sayısal tutarlılığıdır; browser gesture/GPU/gerçek cihaz kabulü değildir.

İlk EXEC-2 teslim kontrolü (U1 öncesi): **52 Markdown, 13 JSON; 464 yerel bağlantı hedefi kontrol edildi.** 18 ana paket, 48 ana gereksinim ve 78 alt kabul kimliği tutarlı; eski motor/dependency/config ve diğer bekleyen öneri dosyasının dokuz başlangıç hash'i değişmedi. 31 kamera/fit matematik senaryosu geçti. Bu sayılar EXEC-2 belge teslimine aittir; 78 runtime alt kabul satırının tamamı NOT_RUN kalır.

## U1 — Kullanıcının gerçek kabul koşulları

[32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) eklendi. Bilgisayar/Poco X6 Pro, kaynak CAD görünüş eşliği ve belirlenmemiş sunucu bütçesi plan/devir kayıtlarına işlendi. [U1 belge kontrolü](arastirma/exec2-u1-plan-kontrol.json) günceldir; önceki raporlar tarihsel kanıttır. Motor kodu ve gerçek test durumları değişmedi.

## U2 — Lisans iş akışı sadeleştirmesi

D22'deki genel lisans kanıtı release kapısı kaldırıldı; lisans UI'ı veya ayrı hukuk raporu şartı yok. Teknik kabul ile ilgili dağıtım paketinin gerçek notice/kaynak sunumu işlemleri ayrıldı. Gemini'nin mimari seçim yetkisi değişmedi. [U2 belge kontrolü](arastirma/exec2-u2-plan-kontrol.json) son kontroldür; runtime kodu değişmedi.

## U3 — Tek dosya ve gerçek dosya boyutu

Kullanıcının dört cevabı 32 U3, ana kararlar, Gemini talimatı, G07/G09/G15, UI08 ve veri/iz kayıtlarına işlendi. Font manifestinin alias/exact gözlemi yalnız V2 planına kaydedildi; legacy dosyası değiştirilmedi. [U3 kontrolü](arastirma/exec2-u3-plan-kontrol.json) günceldir; motor henüz uygulanmadı.

## 08.09.2026 — U3 devrinin tamamlanması

Kesintiden sonra kaynak ağacı ve son değişiklikler yeniden okundu; 00/18/19/24/25/30/31/32 ile durum kayıtları tutarlılık kontrolüne alındı. 18 başlangıç talimatında EXEC-2 + U1/U2/U3 açıkça belirtildi. Sonuçlar [U3 raporunda](arastirma/exec2-u3-plan-kontrol.json). Uygulama başlatılmadı; mevcut motor, font manifesti ve paketler değiştirilmedi.
