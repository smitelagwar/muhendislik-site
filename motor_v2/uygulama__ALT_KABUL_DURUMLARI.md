# EXEC-2 — Alt kabul durumları

[Kayıt dizini](uygulama__README.md) · [Ana R eşlemesi](uygulama__IZLENEBILIRLIK.md) · [Denetim](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**78 alt koşul; uygulayıcı tarafından 77/78 IMPLEMENTER_VERIFIED (N24 fiziksel Poco testi kullanıcı turu için hazır; Astra bağımsız denetimi bekleniyor).** Kod/test/kanıt gerçek SNAP ve RUN'lar ile doğrulanmıştır.

| ID | Sözleşme | SNAP / RUN / ART | Uygulayıcı sonucu | Astra | Not |
|---|---|---|---|---|---|
| N01 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | D3 zoom dönüşümü ve ölçekleme PASS |
| N02 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Ters hareket ve eksen yönü doğruluğu PASS |
| N03 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Zoom ters hareket sürüklenme testi PASS |
| N04 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Fare imleci dünya koordinatı sabitleme PASS |
| N05 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | İki parmak pinch çimdikleme merkezi PASS |
| N06 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Touch/wheel eşzamanlı çakışma koruması PASS |
| N07 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sayısal zoom adımı (+/- %25) PASS |
| N08 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Ekran merkezi referanslı buton zoom PASS |
| N09 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Min/Max zoom sınırları (1e-4 .. 1e4) PASS |
| N10 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sınırda buton disabled durumu PASS |
| N11 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sol tık pan ve sağ tık pan PASS |
| N12 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Fit hesaplaması ve dolgu payı (%5) PASS |
| N13 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Boş/tek nokta çizimde korumalı fit PASS |
| N14 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Resize sırasında dünya merkezi koruma PASS |
| N15 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Panel açılmasında kamera sıçraması yok PASS |
| N16 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sıfır/küçük pencere boyutunda NaN koruması PASS |
| N17 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 1e8 koordinat hassasiyeti (Float64) PASS |
| N18 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0031, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Mobil dokunma izolasyonu (touch-action: none) PASS |
| N19 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Klavye yön tuşları ile pan kontrolü PASS |
| N20 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Klavye +/- ve F tuşu fit kontrolü PASS |
| N21 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Çok hızlı tekerlek hareketinde stabilite PASS |
| N22 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Etkileşim iptali (touchcancel / blur) PASS |
| N23 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0005, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Teardown ve event listener temizliği PASS |
| N24 | [N sözleşmesi](28_PAN_ZOOM_FIT_SOZLESMESI.md) | SNAP-0001 / RUN-0031 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Dokunma alt yapısı hazır; fiziksel Poco testi kullanıcı turunda |
| V01 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0006, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | WebGL2 + Three.js r172 V2 render motoru PASS |
| V02 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0005, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Boşta 0 RAF, kirli frame planlayıcı PASS |
| V03 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0005, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | DPR/resize ve 0x0 güvenliği PASS |
| V04 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0005, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 1e8 orijin ve küçük detay hassasiyeti (Float64/Float32) PASS |
| V05 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Adaptif daire ve yay mozaikleme (sagitta <= 0.25px) PASS |
| V06 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Elips ve elips yay mozaikleme PASS |
| V07 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | LWPOLYLINE bulge eğrileri ve sabit/değişken genişlik PASS |
| V08 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | B-Spline / NURBS De Boor eğri örnekleme PASS |
| V09 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | HATCH delik ve ada üçgenlemesi (earcut 3.2.3) PASS |
| V10 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Wipeout arka plan maskesi üçgenlemesi PASS |
| V11 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0013, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | TTF/OpenType glif yerleşimi ve Türkçe karakter desteği PASS |
| V12 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0013, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | AutoCAD özel sembolleri (%%C, %%D, %%P) PASS |
| V13 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0010, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Blok 2D afin dönüşümleri ve Katman 0 kalıtımı PASS |
| V14 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0019, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Model / Layout ayrımı ve viewport modelToPaper matrisi PASS |
| V15 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0022, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sınırlı 64 MiB LRU bellek ve görünür parça önceliği PASS |
| V16 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0031, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | WebGL context loss ve otomatik yeniden ayağa kalkma PASS |
| V17 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0006, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 20 aç/kapat döngüsünde 0.17 MB bellek platosu (<50MB) PASS |
| V18 | [V sözleşmesi](29_RENDER_VE_YASAM_DONGUSU.md) | SNAP-0001 / RUN-0041, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | R001–R004 tam gerçek corpus doğrulaması PASS |
| C01 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0004, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | DV2SCN01 ikili formatı ve deterministik serileştirme PASS |
| C02 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0004, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 8-byte hizalama ve little-endian formatı PASS |
| C03 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0022, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Eşzamanlı parça getirme sırası (max 4 fetch, max 2 decode) PASS |
| C04 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0022, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Görünür alan merkezine göre uzamsal parça önceliği PASS |
| C05 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0022, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Bounded RAM LRU eviction sonrası kayıpsız yeniden getirme PASS |
| C06 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0022, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Nesil (generation) yarışı güvenliği (stale parça atımı) PASS |
| C07 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0025, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | POST /prepare idempotence (clientRequestId) PASS |
| C08 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0025, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | View-session 180s TTL ve 30s/60s heartbeat döngüsü PASS |
| C09 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0025, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Unobserved iş iptali ve fencing token artırımı PASS |
| C10 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0025, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Atomik hazır sahne yayınlama ve fence kontrolü PASS |
| C11 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0004, RUN-0041 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 2 MiB HTTP yanıt ve 8 MiB decoded bellek sınırı korundu PASS |
| C12 | [C sözleşmesi](31_SOZLESME_TAMAMLAMALARI.md) | SNAP-0001 / RUN-0004, RUN-0041 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Bozuk magic, kırpılmış parça ve bilinmeyen şema reddi PASS |
| F01 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0034, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Admin dosya menüsünde V2 seçeneği ve allowlist PASS |
| F02 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0003, RUN-0041 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | LibreDWG 0.7.10 DWG ve Data-Model 1.14.2 DXF çözümleme PASS |
| F03 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0005, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Fare ile pan ve tekerlek ile zoom PASS |
| F04 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0031, RUN-0046 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Dokunmatik ekranla tek parmak pan ve iki parmak pinch PASS |
| F05 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0005, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Araç çubuğu butonları (+, -, Fit) ve klavye kısayolları PASS |
| F06 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0019, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Model ve Layout pafta geçişi, viewport kırpma PASS |
| F07 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0010, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Katman görünürlük paneli ve anlık filtreleme PASS |
| F08 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0045, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Görünüm ayarları (monokrom, çizgi kalınlığı, zemin) PASS |
| F09 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Katı dolgu ve desenli tarama (HATCH delik/ada) PASS |
| F10 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0013, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Metin yazı tipleri, Türkçe karakterler ve hizalama PASS |
| F11 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0013, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Çok satırlı metin (MTEXT) formatı ve kırılımları PASS |
| F12 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0010, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Blok yerleşimleri (INSERT), ölçek ve dönüşümler PASS |
| F13 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Yay, daire, elips ve spline eğrileri PASS |
| F14 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0016, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Maskeleme (Wipeout) arka plan kapatmaları PASS |
| F15 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0019, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Gömülü bağımlılıklar ve döngüsel referans engeli PASS |
| F16 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0031, RUN-0045 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Host yaşam döngüsü, hata paneli ve geri dönüş eylemleri PASS |
| F17 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0025, RUN-0031 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 180s oturum TTL ve otomatik heartbeat yönetimi PASS |
| F18 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0037, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Public token yetkilendirmesi ve paylaşılan dosya sınırı PASS |
| F19 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0006, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 20 aç/kapat bellek/kaynak temizliği PASS |
| F20 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0006, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | 100 aç/kapat bellek sızıntısı yok (<50MB plato) PASS |
| F21 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0034, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | cadEngine=v2 parametresi ile dinamik V2 yüklemesi PASS |
| F22 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0037, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Paylaşım süresi dolduğunda/iptal edildiğinde 410 Gone PASS |
| F23 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0037, RUN-0047 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Paylaşım dışı dosya erişiminde 403 Forbidden izolasyonu PASS |
| F24 | [F sözleşmesi](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) | SNAP-0001 / RUN-0044, RUN-0048 | IMPLEMENTER_VERIFIED | NOT_REVIEWED | Sıfır TypeScript hatası ve temiz derleme PASS |
