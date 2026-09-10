# 20 — Uygulama geçmişi ve kanıt sistemi

[Dizin](README.md) · [Başlangıç kayıtları](uygulama/README.md) · [Denetim protokolü](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

Amaç Astra'nın haftalar sonra başka bir oturumda “ne yapılmış, hangi gereksinim gerçekten çalışıyor?” sorusunu kaynaktan cevaplayabilmesidir. Gemini'nin sohbet özeti tek kanıt değildir. İstenen kayıt; **eylem, değişiklik, kısa gerekçe, gözlem, test ve sonuçtur**. Gizli düşünce zinciri veya her token'ın günlüğü istenmez.

## Tek iş, üç durum

| Boyut | Değerler | Kim günceller? |
|---|---|---|
| Uygulama | NOT_STARTED, IN_PROGRESS, IMPLEMENTED, IMPLEMENTER_VERIFIED, BLOCKED | Gemini |
| Test sonucu | PASS, FAIL, DEGRADED, UNSUPPORTED, NOT_RUN | Gerçek çalıştırma sonucu; Gemini kaydeder |
| Bağımsız denetim | NOT_REVIEWED, FINDING_OPEN, RECHECK_REQUIRED, ACCEPTED | Astra |

NOT_RUN ve kanıt bulunamaması PASS değildir. IMPLEMENTER_VERIFIED, Astra kabulü anlamına gelmez. DEGRADED dosya kullanılabilir olabilir; hedef özelliğin doğruluğu geçmiş sayılmaz. Bir paketin engellenmesi bütün projeyi blocked yapmaz. Kapsam dışı maddeyi yalnız 00 veya sonraki karar revizyonu tanımlar; Gemini kendi kararıyla N/A yapamaz.

## Dosya düzeni ve kimlikler

Güncel indeksler önceden [uygulama](uygulama/README.md) içinde hazırlandı. Gerçek çalışma başlayınca şu alt kayıtlar oluşturulur:

| Yol / kimlik | İçerik |
|---|---|
| uygulama/DURUM.md | Geçerli plan revizyonu, en son snapshot, aktif/sonraki G, açık CR/FIX ve devir durumu |
| uygulama/PAKET_DURUMLARI.md | G00–G17 ilerleme ve ayrı denetim durumları |
| uygulama/IZLENEBILIRLIK.md | Her R → G → kaynak dosyası/sembol → test → RUN/ART → denetim eşlemesi |
| uygulama/OTURUM_GUNLUGU.md | Tarihli SES indeksleri; önceki satırlar silinmez |
| uygulama/KARAR_VE_ENGELLER.md | D revizyonları ve CR kayıtları; Gemini kararları onaylayamaz |
| uygulama/BILINEN_EKSIKLER.md | Açık ürün/teknik/kanıt eksikleri; testten ayrı takip |
| uygulama/DENETIM_DEVRI.md | Paket bitiminde Astra'nın okuyacağı somut teslim |
| uygulama/DENETIM_TURLARI.md | AUD/FIX/yeniden kontrol dizini; bağımsız kabul bilgisi |
| uygulama/oturumlar/SES-YYYYMMDD-NN.md | Oturum eylemleri, dosya listesi, sonuçlar ve sonraki adım |
| uygulama/paketler/GNN.md | Tek paketin ayrıntılı uygulama ve kabul kaydı |
| uygulama/kararlar/CR-NNN.md | Uygulanamayan karar ve somut engel |
| uygulama/denetimler/AUD-NNN.md | Astra'nın kapsamı, bulguları, bağımsız çalıştırmaları |
| uygulama/duzeltmeler/FIX-NNN.md | Astra'nın verdiği düzeltme + Gemini uygulaması + Astra yeniden kontrolü |

G/R/D numaraları yeniden kullanılmaz. SES oturum, RUN gerçek komut/test çalıştırması, ART kanıt artifact'ı, SNAP kod/varlık snapshot'ı, CR karar talebi, AUD denetim turu, FIX düzeltme kimliğidir. Bir başarısız çalıştırmanın RUN kimliği yeniden PASS sonucu için kullanılmaz.

Ham log, screenshot, video ve trace'ler uygulama/kanitlar altında veya özel yerel artifact alanında tutulur. Özel çizim görüntüleri, byte'lar, token/cookie/signed URL ve kullanıcı adları public Git'e konmaz. İndekste fixture ID, güvenli göreli yol ve hash tutulur. Bulunmayan/yetkiyle erişilemeyen kanıt açıkça yazılır; hayalî yol linki oluşturulmaz.

## Snapshot: commit tek başına yeterli değil

G00'da gerçek uygulama başlangıcı alınır. Araştırmanın [yerel başlangıcı](arastirma/yerel-baslangic.json) korunacak çekirdeğin tarihsel kimliğidir; yeni uygulamanın güncel başlangıcı yerine kopyalanmaz.

SNAP kaydı şu alanları taşır:

- UTC tarih/saat, branch, HEAD, git status ve önceki snapshot ID.
- Tracked diff; staged/unstaged ayrımı; untracked yeni uygulama dosyalarının listesi ve SHA-256 hash'leri. Commit olmayan değişiklikler de geri üretilebilir patch/özel arşiv ile saklanır.
- Mevcut ve yeni package/lockfile hash'leri; Node/npm, işletim sistemi, browser ve compiler image kimliği.
- Runtime worker/WASM/font dosyalarının hash'leri ve kullanılan gerçek build kimliği. Kaynak kod ile üretilmiş asset ayrı kaydedilir.
- Test fixture/font/XREF hash manifesti; gizli env değerleri yerine güvenli config profili ve redakte edilmiş alan adları.
- Korunan core hash'lerinin başlangıca eşliği ve ortak entegrasyon dosyalarının değişiklik gerekçeleri.

SNAP, testten **önce** alınır. Sonradan kod değişirse eski RUN yeni snapshot için geçerli diye kopyalanmaz. Paket kapanırken yeni SNAP gerekiyorsa ilgili testler o koda karşı tekrar çalıştırılır. Paylaşılan şema/worker değişikliği hangi R'leri etkilediyse o satırlar RECHECK_REQUIRED yapılır. Bütün testleri gerekçesiz tekrar etmek yerine etki haritası kullanılır.

Snapshot'lar remote push zorunluluğu yaratmaz. Büyük binary/özel corpus'u Git'e doldurmak veya her satırda commit atmak yerine yerel kanıt arşivi ve anlamlı checkpoint kullanılır. Şu kullanıcı talebinde Gemini son denetime kadar push/deploy yapmayacaktır.

## Her RUN için gerçek çalıştırma kaydı

Tam komut, cwd, güvenli config, snapshot, başlangıç/bitiş UTC, süre, timeout, PID/süreç sahipliği, exitCode, log yolu/hash, çalıştırılan/geçen/kalan/atlanan test sayıları yazılır. Ayrı browser/server süreçleri varsa hangisini başlattığı ve kapattığı kaydedilir. RUN sonucu hem exitCode hem assert/log içeriğinden çıkarılır.

Format/DWG testi ayrıca kaynak magic/hash, decoder sürümü ve decoder invocation; ürün testi aktif motor, source revision, gerçek route ve kullanılan cache durumunu kaydeder. UI ekranına bakan testin fixture/mocked API kullanıp kullanmadığı görünür alan olur.

Beklenen hata testi ile beklenmeyen process hatası ayrılır. “İptal testinde cancelled gördük” PASS olabilir; dış script'in timeout'a düşüp öldürülmesi otomatik PASS değildir. Scriptin kendisi timeout/finally/nonzero exit standardına uyar. Kontrol başarısızsa sonraki kayıt başarısızlığı silmez; yeni RUN ve düzeltme bağlantısı ekler.

## Görsel kanıt

ART kaydı: SNAP/RUN/G/R/UI kimlikleri; gerçek dosya veya sentetik örnek; source/layout/ROI; viewport CSS px, DPR, tema, zoom/kamera, panel durumu; browser/OS/fiziksel cihaz bilgisi; screenshot yolu/hash; incelenen kusurlar ve inceleyen kişi/model.

“Ekran görüntüsü alındı” ve “görsel olarak incelendi” ayrı alanlardır. Gemini her teslim ekranını gerçekten açıp inceler. Astra görselleri tekrar açar; Gemini'nin “lüks oldu” yorumunu kabul ölçüsü saymaz. Golden/reference resmi, aday V2 ekranı ve diff birbirinden ayrı artifact olur. UI mock screenshot'ı gerçek CAD fidelity kanıtı olamaz.

## Kayıt güncelleme zamanları

Oturum başı, G paketi giriş/çıkışı, başarısız test sonrası önemli düzeltme, karar engeli ve oturum sonu güncellenir. Her küçük tuşa basma günlüğü gerekmez. Bir paketin geçmişi değiştirilmeyecek şekilde oturum/RUN kayıtlarında kalır; güncel durum indeksleri son duruma göre yenilenebilir.

Yazım hatası düzeltilebilir; eski testin sonucunu veya snapshot kimliğini değiştirmek geçmişi tahrif eder. Hatalı PASS bulunursa yeni düzeltme notuyla geri çekilir; “önceki iddia yanlış, şu RUN geçersiz” bağlantısı bırakılır. Kayıtlar kendinden imzalı güvenlik kanıtı değildir: SHA içeriği eşlemeye yarar, Astra'nın bağımsız testinin yerini tutmaz.

## Uygulayıcı kapanış kontrolü

1. Her tamamlandı denen G'nin dosya ve test kanıtı var mı?
2. Her zorunlu R en az bir gerçek test/oracle ve SNAP'a bağlı mı?
3. NOT_RUN/FAIL/DEGRADED, açık CR ve eksikler finalde görünür mü?
4. UI sayfası ve gerçek motor aynı ürün dalında mı, demo kalmış mı?
5. Son değişiklikten önceki test yanlışlıkla son kodun kanıtı yapılmış mı?
6. Kanıt yolları var mı, hash'ler tutuyor mu, sırlar/özel çizimler yanlış yere taşınmış mı?
7. Astra bağımsız kabul alanları Gemini tarafından doldurulmuş mu? Doldurulmayacak.
8. Sonraki kişi yalnız dosyalardan işi devralabilir mi?

Yeni şablonlar: [paket teslimi](sablonlar/UYGULAMA_PAKETI.md), [test kanıtı](sablonlar/TEST_KANITI.md), [görsel kanıt](sablonlar/GORSEL_KANIT.md), [karar engeli](sablonlar/KARAR_ENGELI.md), [denetim/düzeltme](sablonlar/DENETIM_VE_DUZELTME.md).

## EXEC-2 alt kanıt kapsamı

Her RUN/SNAP ilgili N/V/C/F kimliklerini de listeler. [Alt kabul tablosu](uygulama/ALT_KABUL_DURUMLARI.md) satırında gerçek kanıt yoksa NOT_RUN kalır. Plan araştırmasındaki paket source hash'leri veya kamera matematik kontrolü, Gemini'nin sonraki runtime test geçmişine geçirilmez. SPEED_TARGET_MISSED ölçümün teknik olarak tamamlanmasından ayrıdır.
