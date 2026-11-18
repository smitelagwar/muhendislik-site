# Hsyncad’de ideCAD statik raporu — hızlı uygulama planı

**13 Kasım 2026 · 4 aşama · Windows’ta kişisel yerel kullanım**

Hsyncad’de orijinal bir `.ide10` aç. **Statik Rapor** ile ideCAD’deki bölüm ağacını, proje künyesini ve kapsam seçimini kullan. Sonuçlar eksik veya eskiyse aynı proje kopyasında **Analiz+Tasarım (F9)** çalışsın. Referans kurulum mevcut **ideCAD Statik 11.28 Deneme**. Bu kurulumun normal analiz, rapor ve metraj önizleme akışını doğrula. Hsyncad’in kendi PDF’sinde yalnız kaynak modelden doğrulanmış verileri kullan ve kapsamı belirt. ideRAPOR’un doğrudan PDF dışa aktarımı ayrı bir yetenektir ve bu kurulumda kapalıdır. Önceki 20 aşamalı motor planı duraklatılmıştır.

## Başlangıçta bilinenler

- MS1’in SHA-256 eşit test kopyası ideCAD Statik 11.28’de açıldı. **Seçmeli Raporlar → Tüm proje → Rapor Oluştur**, F9 çalıştırılmadan yeni bir ideRAPOR önizlemesi açtı. Aynı kopyada F9 ayrıca **2:21** sürdü ve ardından yeniden rapor üretildi. Sonlu eleman ağı uyarısı kaydedildi. İki koşu da aynı orijinal `.ide10` hash’iyle yapıldı.
- Çalışan Statik süreci `IDERPT FILE 11.00` başlıklı geçici raporu `ideRPTTrial.exe`ye dosya argümanı olarak verdi. Yerel REA kaynak kodu ve bağlı REA aracıyla kaynaklar incelendi. Canlı süreç kaydı ile iki hedefli Ghidra yordamı rapor teslim zincirini destekliyor. MS1 asansör makine dairesi D1 önizlemesinde 20 cm, G=1,5 ve Q=1 tf/m² görünür; native okuyucuda kalınlık ve G aynı olsa da Q=0,5 kaydı vardır. Q eşleşmesi doğrulanmamıştır; nedeni unknown. Bölümlerin bütün iç alanlarının üreticileri henüz çözümlenmiş değil. [Kanıt ve veri izi](D:/HsyncadHybridOS/idecad-rapor-hizli-2026-11-13/BULGULAR.md)
- Deneme sürümünde **Farklı Kaydet** engeli kaydedildi. **Raporlar → Metraj → Oluştur** ile yeni MS1 önizlemesinde kalıp, beton, donatı ve toplam sayfaları açıldı. Toplam sayfasında C25 beton **1.334,02 m³**, kalıp **6.681,91 m²**, B420C donatı **117,02 t** göründü. [Toplam metraj kanıtı](D:/HsyncadHybridOS/idecad-rapor-hizli-2026-11-13/gui/trial-only/metraj/sayfa-4.png)

## Aşama 1 — Deneme analizini, raporunu ve metrajını doğrula

**Sahip:** Tek masaüstü operatörü. Codex Desktop üzerinde ideCAD Desktop ve REA skill’lerini, [masaüstü kılavuzunu](IDECAD_DESKTOP_WORKFLOW.md) ve repo kurallarını uygula. Bu oturumun kanıtını yeniden kullan. Başlangıç için **MS1**, ikinci bağımsız dosya olarak **MS2** kullan. SK uzun rapor regresyonu için hazırdır.

**Kurulum:** Mevcut ideCAD Statik 11.28 Deneme ile çalış. Eldeki F9 ve yeni metraj kanıtını kullan. Deneme’de doğrudan PDF kaydetme yeteneğini `blocked` olarak kaydet. [Durum ve kanıt](D:/HsyncadHybridOS/idecad-rapor-hizli-2026-11-13/ASAMA1-DURUM-2026-11-13.md)

1. Kurulu EXE, sürüm, ürün dili ve normal rapor/PDF yeteneğini kaydet. Kullanıcı dosyasıyla bayt eşit kopya aç, doğru pencereyi başlık ve süreç kimliğiyle bağla. Rapor ayar ağacından sabit bir betonarme profil belirle. Bölüm adları ve sıra, kapsam, künye, birimler ve hangi metraj komutunun kullanıldığı kanıta girsin.
2. MS1’de önce kayıtlı sonuçla rapor iste. Kayıtlı sonuç yeterliliği belirsizse veya taze hesap seçildiyse F9 çalıştır. Analiz penceresindeki terminal durum ve uyarıları kaydet. Merdiven bağlantısı gibi modeli etkileyen sorularda kanıtlı profil seçimini kullan veya seçenek beklediğini bildir. **Seçmeli Raporlar → Tüm proje** ve **Raporlar → Metraj → Oluştur** önizlemelerinde görünür bölümleri, birimleri ve sayısal satırları kayda al. Kayıtlı model ile F9 sonrası sonucu ayrı tanımla.
3. Rapor izi için dört örneği seç. Künye/yerleşim, modal periyot, K301 kiriş donatısı ve metraj toplamı. Her örnek için UI veya analiz günlüğü, görünür rapor alanı, kaynak dosya hash’i ve varsa REA Evidence ID/ofsetini bağla. D1 eşlemesi başlangıçtır. REA’ya yalnız bu zinciri etkileyen en fazla iki yeni soru sor. Kaynak üretici doğrulanamazsa `unknown` yaz ve çalışır ideCAD çıktısıyla ilerle. Ara dosya formatını ürün bağımlılığı yapma.

**Kabul:** Doğru MS1 kopyasının analiz kanıtı, sabit seçmeli rapor profili, en az üç rapor bölümü ve sayısal satırları, kalıp/beton/donatı toplamları ve kaynak hash’i kayıtta olmalı. İzi çözülemeyen alanları `unknown` yaz. Bu kabul rapor/metraj önizlemesi içindir. Doğrudan ideRAPOR PDF durumu `blocked` ayrı kalır ve sonraki önizleme işlerinin önkoşulu değildir.

## Aşama 2 — Yerel rapor işini kur

**Sahip:** Windows çalıştırıcısı. Çıkış yolu Aşama 1’de doğrulanmış olmalı. Mevcut `scripts/idecad/desktop.py` hedef doğrulamasını kullan. Yeni kodu küçük bir rapor işi sarmalayıcısı ve Hsyncad’in yerel Node uç noktasıyla sınırla.

- Girdi `sourceFile + SHA-256 + modelRevision + reportOptions` olsun. Seçilen özgün dosyayı iş klasörüne kopyala. Açılan kopyanın kimliğini doğrula. Orijinal hash’ini iş sonunda yeniden ölç. Hsyncad’de düzenlenmiş model için sonuç, kaynak dosyanın revizyonuna aittir. Düzenleme varsa kullanıcıya hangi revizyonun raporlanacağını açıkça göster ve eşleşmeyen sonuç için indirmeyi kilitle.
- Akışı `açılıyor → sonuç kontrolü → gerekiyorsa analiz → rapor → doğrulama → hazır` durumlarıyla yürüt. Sonuç tazeliği belirsizse güvenli varsayılan yeniden analiz. Kullanıcı ayrıca **Kayıtlı sonuçları kullan** seçebilir ve kaynağını görür. Analiz hatası, iptal veya yanlış pencere yapılandırılmış sonuç üretir. ideCAD’in mühendislik uyarıları raporda korunur.
- Aynı Windows masaüstünde **bir rapor işi** çalıştır. Denemede görülen `iderpt.tmp` ortak isimli. Önizlemeyi zaman, süreç ve kaynak kimliğiyle doğrula. Analiz için başlangıçta 8 dk, rapor için 3 dk sınırla. Zaman aşımında yalnız işe ait oturumu temizle.
- Yerel Hsyncad’i aynı Windows kullanıcısında çalıştır. Rapor uç noktası varsayılan olarak kapalı olsun. Açık yerel modda loopback ve aynı origin üzerinden kullan. İstemciye mutlak dosya yolu veya çalıştırılabilir komut seçtirme. Kaynak ve raporlar iş klasöründe kalsın. Kullanıcı varsayılan olarak mevcut özgün `File` ile işlem yapabilsin. Model geri yüklenmiş ve kaynak baytları bulunamıyorsa aynı dosyayı yeniden seçip hash’i doğrulasın.

**Kabul:** Yerel iş çağrısı, kaynak kopyadan yeni ideRAPOR önizlemesi açar. Yanlış proje, eski görüntüleyici ve iptal denemeleri başarı dönmez. İş makbuzu kaynak ve ayar hash’lerini, önizleme durumunu, süreyi ve uyarıları içerir.

## Aşama 3 — Hsyncad arayüzüne bağla

**Sahip:** Arayüz ve PDF teslimi. Mevcut IDE açma akışını kullan. Giriş noktaları `src/components/hsyncad/workbench.tsx`, `analysis-dialog.tsx` ve `src/lib/hsyncad/ide-workspace.ts`. Bölüm ayarlarını küçük bir `ReportOptions` sözleşmesinde tut. Kullanıcı ileride bunları özelleştirebilsin.

- Ekran görüntüsündeki düzeni izle. Solda işaretli bölüm ağacı. Sağda dizayn/revizyon/tarih, proje künyesi ve **Tüm proje / Aktif kat / Seçili elemanlar**. İş durumu ve analiz uyarısı görünür. İlk varsayılan **Tüm proje**. Diğer iki seçenek gerçek ideCAD kapsamı ile doğrulanınca etkinleşir. Kat kimliğini kaynak kat adı/kotu ile doğrula. Eleman eşleşmesinde kat ve native kimliği kullan. Belirsiz eşleşmede doğrulanmış ideCAD seçimini kullan veya kapsamı açıkça kapalı göster.
- Varsayılan profil, açıklama/yerleşim, kat ve yük, modal, düzensizlik ve betonarme başlıklarını Deneme’nin yerel önizlemesinde açar. Birimleri ve başarısız kontrolleri koru.
- **Hsyncad PDF’si** için mevcut rapor altyapısını kullan. Özgün IDE dosyasından doğrulanmış model verilerini kullan ve desteklenen kapsamı belirt. Donatı, dinamik analiz ve net metraj gibi alanları kaynakları doğrulanınca dahil et. Hsyncad’in PDF’sinde üreticiyi ve kaynak revizyonunu göster. Tam içerik eşleşmesi bir doğrulama hedefidir.

**Kabul:** MS1 Hsyncad’de açılır. Kullanıcı rapor seçer ve gerektiğinde F9 sonrasında doğru önizlemeyi görür. Hsyncad PDF’si sunulan kapsamda tarayıcıda açılır. Seçenek ve kapsam değiştiğinde ilgili sayfalar değişir. Raporun üreticisi ve kaynak revizyonu ekranda görünür.

## Aşama 4 — Kısa kabul ve dur

**Sahip:** Uygulamayı yazmamış bir denetçi. MS1 için Hsyncad çıktısını aynı ideCAD sürümü, model revizyonu ve seçimle alınmış Deneme önizlemesiyle karşılaştır. Bölüm sırası, kat/eleman kapsamı ve Hsyncad çıktısında doğrulanmış sayısal değerleri kaydet. Künye, D1 yükü, modal periyot, K301 benzeri donatı, temel sonucu ve metraj toplamı örnekleri kullanılabilir. Eski PDF’leri ancak aynı ayar/sürüm biliniyorsa sayısal karşılaştırmada kullan.

MS2 ile bir kez daha yeni rapor üret. MS1’e özel veri kullanılmadığını ve mevcut uyarıların doğru taşındığını doğrula. Bir de eski/yanlış proje veya iptal senaryosu çalıştır. İlgili TypeScript ve tarayıcı kontrollerini kaydet. Son teslim, iki gerçek kaynak, PDF’ler, kısa karşılaştırma ve desteklenen sürüm/kapsam tablosudur. Geçen kapsamı teslim et ve dur. SK, ilave dosya sürümleri ve yerel tasarım özelleştirmeleri ayrı takip işidir.

## Paralel yürütme ve süre sınırı

| Hat | Uygun rol | Yazma alanı | Başlama koşulu |
|---|---|---|---|
| A — ideCAD ve yerel iş | Codex Desktop operatörü, gerektiğinde Terra | `scripts/idecad/` ve iş kanıtları | Aşama 1. Tek sahip, tek masaüstü oturumu. |
| B — Hsyncad arayüzü | Luna veya Gemini Flash | Rapor ayar bileşeni ve istemci entegrasyonu | A’nın girdi/çıktı sözleşmesi sabitlenince. A ile paralel. |
| C — Kaynak izi ve kabul | Flash/Luna, kritik REA sorusunda Terra | Kendi kanıt klasörü ve bağımsız kontroller | Aşama 1’de salt okunur izleme. A ve B birleşince gerçek kabul. |

Bir koordinatör yeterli. Aynı dosyayı iki ajana verme. UI oturumu ve aktif REA hedefi tek sahipli olsun. Her ajana bir çıktı, bir kabul ölçütü ve tek kısa kanıt paketi ver. İlk kabulde en fazla bir düzeltme turu. İkinci geçişteki aynı engeli açık kalem olarak kaydet. Eksik kapsamın yanında biten kapsamı teslim et. Ek araştırma ancak dört aşamadan birinin somut kabulünü ilerletiyorsa açılır. Hibrit çalıştırılacaksa mevcut Hybrid Agent OS skill’indeki kota ve modelsiz bekleme düzenini kullan. Repo çalışması yalıtılmış adayda kalsın. Ana repo için önceki commit, push ve deploy sınırları geçerli.

## Kaynaklar ve yeni sohbet başlangıcı

- [Bu sohbet ve canlı rapor incelemesi](codex://threads/01a1b762-f280-75c1-9680-94745729b794) · [Önceki planlama](codex://threads/01a1abd7-b882-7b90-9e17-7edfe17db98c) · [Önceki uygulama](codex://threads/01a1ac01-dd6f-7ee3-aff8-be0739e3d246) · [ideCAD masaüstü araştırması](codex://threads/01a1bc3a-5c02-7e22-a424-8ca3626f7927)
- [Canlı kanıt dizini ve REA başlangıç noktaları](D:/HsyncadHybridOS/idecad-rapor-hizli-2026-11-13/BULGULAR.md) · [Eski 855 satırlık bölüm/metraj kataloğu](D:/HsyncadHybridOS/rea-investigation/report-trace/REPORT_TRACE_MATRIX.json) · [Gerçek proje ve PDF envanteri](C:/Users/hsyn/Desktop/hsyncad/incelemeler/statik-rapor-plan-2026-11-05/source-inventory.json)
- [Önceki 20 aşamalı plan](STATIK_RAPOR_UYGULAMA_PLANI.md) · [Önceki duraklatma](D:/HsyncadHybridOS/resume-20261108/GRACEFUL_PAUSE_RECEIPT.json) · [Ortak çalışma kayıtları](C:/Users/hsyn/Desktop/hsyncad/calisma-kayitlari/README.md)

```text
Hsyncad’in dört aşamalı ideCAD rapor planını Aşama 1’den uygula.
C:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/hsyncad/IDECAD_STATIK_RAPOR_HIZLI_PLAN.md
Önce planı, bağlı BULGULAR.md dosyasını ve repo kurallarını oku. Eski 20 aşamalı planı yeniden başlatma.
MS1’in ayrı kopyasında mevcut ideCAD Statik 11.28 Deneme’nin normal rapor ve metraj önizlemesini doğrula. REA kanıtını tekrar kullan.
Rapor ve metraj önizleme kabulünü kaydet. Bu kurulumda doğrudan ideRAPOR PDF durumu blocked.
İstersem Luna/Terra/Gemini’yi A/B/C sahiplikleriyle paralel kullan. Tek masaüstü operatörü ve tek koordinatör olsun.
Hedef orijinal dosyadan Hsyncad içinde seçilebilir ideCAD raporu ve tek PDF. Aşama 4 kabulünde dur.
```
