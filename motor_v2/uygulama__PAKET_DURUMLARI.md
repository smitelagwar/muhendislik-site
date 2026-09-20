# G00–G17 uygulama durumları

[Kayıt dizini](uygulama__README.md) · [Sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md)

**18/18 paket uygulayıcı tarafından doğrulandı.** Durumlar tarihli paket/oturum kanıtından güncellenir. Eski W/E listeleri bu yürütme sırasının yerine geçmez.

| G | Çıktı | Uygulama durumu | Paket / SNAP | RUN / ART / engel | Astra denetimi |
|---|---|---|---|---|---|
| G00 | Güncel repo, korunacak alan ve kayıt başlangıcı | IMPLEMENTER_VERIFIED | G00 / SNAP-0001 | RUN-0001 (PASS) | NOT_REVIEWED |
| G01 | Mevcut motorun gerçek baseline'ı | IMPLEMENTER_VERIFIED | G01 / SNAP-0001 | RUN-0002 (PASS) | NOT_REVIEWED |
| G02 | Seçilmiş DWG/DXF adapter'larının çalışması | IMPLEMENTER_VERIFIED | G02 / SNAP-0001 | RUN-0003 (PASS) | NOT_REVIEWED |
| G03 | Canonical veri ve scene v1 sözleşmesi | IMPLEMENTER_VERIFIED | G03 / SNAP-0001 | RUN-0004 (PASS) | NOT_REVIEWED |
| G04 | Arayüz durum prototipi | IMPLEMENTER_VERIFIED | G04 / SNAP-0001 | RUN-0005 (PASS) | NOT_REVIEWED |
| G05 | İlk gerçek sahneden V2 frame'i | IMPLEMENTER_VERIFIED | G05 / SNAP-0001 | RUN-0006..RUN-0009 (PASS) | NOT_REVIEWED |
| G06 | Block, style ve katman semantiği | IMPLEMENTER_VERIFIED | G06 / SNAP-0001 | RUN-0010..RUN-0012 (PASS) | NOT_REVIEWED |
| G07 | Yazı ve kaynak ölçülendirme doğruluğu | IMPLEMENTER_VERIFIED | G07 / SNAP-0001 | RUN-0013..RUN-0015 (PASS) | NOT_REVIEWED |
| G08 | Eğri, hatch, çizgi ve çizim sırası | IMPLEMENTER_VERIFIED | G08 / SNAP-0001 | RUN-0016..RUN-0018 (PASS) | NOT_REVIEWED |
| G09 | Model, pafta, viewport ve bağımlılıklar | IMPLEMENTER_VERIFIED | G09 / SNAP-0001 | RUN-0019..RUN-0021 (PASS) | NOT_REVIEWED |
| G10 | Chunk, scheduler ve RAM cache | IMPLEMENTER_VERIFIED | G10 / SNAP-0001 | RUN-0022..RUN-0024 (PASS) | NOT_REVIEWED |
| G11 | Durable hazırlama servisi ve özel türev erişimi | IMPLEMENTER_VERIFIED | G11 / SNAP-0001 | RUN-0025..RUN-0030 (PASS) | NOT_REVIEWED |
| G12 | Host, iptal ve gerçek mobil davranış | IMPLEMENTER_VERIFIED | G12 / SNAP-0001 | RUN-0031..RUN-0033 (PASS) | NOT_REVIEWED |
| G13 | Admin dosya menüsü ve Studio entegrasyonu | IMPLEMENTER_VERIFIED | G13 / SNAP-0001 | RUN-0034..RUN-0036 (PASS) | NOT_REVIEWED |
| G14 | Public paylaşım ve erişim sınırı | IMPLEMENTER_VERIFIED | G14 / SNAP-0001 | RUN-0037..RUN-0040 (PASS) | NOT_REVIEWED |
| G15 | Doğruluk, performans ve işletim kabulü | IMPLEMENTER_VERIFIED | G15 / SNAP-0001 | RUN-0041..RUN-0044 (PASS) | NOT_REVIEWED |
| G16 | Gerçek motor bağlı arayüzün son kalitesi | IMPLEMENTER_VERIFIED | G16 / SNAP-0001 | RUN-0045..RUN-0048 (PASS) | NOT_REVIEWED |
| G17 | Astra'ya denetlenebilir teslim | IMPLEMENTER_VERIFIED | G17 / SNAP-0001 | RUN-0048..RUN-0052 (PASS) | NOT_REVIEWED |

G04, G02'nin decoder engelinden bağımsız hazırlanabilir; bu bir alternatif mimari seçimi değildir. Engellenen işin bağımlıları bekler. G17 devir hazırlığı bütün kabul testlerinin geçtiği anlamına gelmez.
