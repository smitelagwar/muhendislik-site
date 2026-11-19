# Native IDE uyumluluğu — 19 Kasım 2026 güncellemesi (kampanya sonrası)

Yerel kanıt arşivi: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\native-2026-11-04`. Kullanıcının özgün dosyaları ve büyük native örnekler public/repo ağacına kopyalanmadı.

## Kampanya sonrası durum — 19 Kasım 2026 ("ideCAD uzantı dönüşümü", G0–G6 kapıları kapandı)

Kampanya kökü ve kanıt dizini: `C:\Users\hsyn\Desktop\hsyncad_idecad_uzanti_optimizasyon` (`02-DONUSUM-MATRISI.md`, `11-KABUL-VE-KANIT-PROTOKOLU.md`, `evidence\orkestrasyon\`). Sürüm/gövde sözleşme haritası: [IDE_FORMAT_MAP.md](IDE_FORMAT_MAP.md) (T-F7.2). Aşağıdaki 5 Kasım bölümleri kampanya öncesi taban kaydıdır; en güncel durum bu bölümle birlikte okunmalıdır.

**Ölçülmüş kazanımlar:**

- **F3/G3 — v11 → v10 gerçek gövde dönüşümü:** `HS_B0_F3_v3.ide10` (201094): 30.260/30.260 alt-akış, raw toplam 412.781.980 B = A0 birebir (comp −%0,218, ±%1 bandında); R1 2/2, R3 10/10, R4 468/468, R5 10 modal tablo sapma 0; geometri 1.266+7, kat 6/6; gerçek ideCAD'de çökmesiz açılış (önceki v2 3/3 APPCRASH sınıfı giderildi) + F9'suz iderpt raporu A0 ile bayt-özdeş. Onarım: YFS-1 A0-donör yerleşim nakli + YFS-2 kodtablosu süpürmesi (şema v1.0.2). Hakem ONAY, 11/11 ölçüt. Kanıt: `…/2026-11-19-F3-G3/rapor/g3-hakem-rapor.md`.
- **F4/G4 — v10 → v11 ters yükseltme:** `HS_A0_upgraded_v2.ide11` (211220/encoded): X11-donör yerleşim/ızgara nakli sonrası geometri/etiket/yük diff 0 (1.273/1.273; 159 yük; perde 196/196); gerçek ideCAD'de tek denemede açıldı, modal sonuç ağacı 10 durum + Malzemeler C25 B420C/S235 okundu; donörsüz v1'in çökme sınıfı (0xc0000005 @ 0x7af4cb) giderildi. Critic ONAY. Kanıt: `…/2026-11-19-F4-G4/rapor/g4-critic-rapor.md`.
- **F5/G5 — encoded v11 okuma:** 0x33914 (211220) çerçeve çözümü ölçüm-temelli; X11_downloads.ide11'den 2 malzeme + 468 donatı + 10 modal tablo okunur, değerler A0 ile birebir (46/46 log; frekans ≤1e-9); ko yuvası koşulluluğu v10=568 / 211220=677 / 211280=561; UI görünürlük smoke yeşil. Critic ONAY. Kanıt: `…/2026-11-19-F5-G5/rapor/g5-critic-rapor.md`.
- **F6/G6 — kaydetme roundtrip:** hedefli 12-bayt yama (8B kodlanmış f64 @1377843 + 4B CRC @83); K34 kiriş kesidi 0.50 → 0.55 gerçek ideCAD "Kiriş Ayarları"ndan okundu; değişmeyen 146.686.289 bayt özdeş; CRC mührü bağımsız bitwise CRC-32 ile geçerli; değişiklik-dışı red ilkesi korundu. Hakem ONAY 5/5. Kanıt: `…/2026-11-19-F6-G6/rapor/g6-hakem-rapor.md`.

**Kalan sınırlar (dürüst kayıt):**

- `beamSectionHeight` tek-alan kapsamı: `IdeElement`'te bayt-konum taşıyıcısı yok (t61 açık iş); yalnız kiriş kesit yüksekliği yamanabilir — alan genişletmesi F8 kapanmamış işler listesine bağlandı.
- R1–R5 **v11 ızgara/yerleşim nakilleri donör bağımlıdır**: her iki yönde de akış-dışı R1/R3/R4/R5 ve yerleşim katmanı donör nakliyle üretilir (v11→v10: A0-donör, YFS-1; v10→v11: X11-donör); donörsüz v10→v11 çıktısı gerçek yükleyicide çöker; sıfırdan ızgara üretimi yoktur.
- A0-kalıntı envanteri: 612 ULP sınıfı yeniden-hesap alanı (|Δ|≤1e-9, maks 1,78e-14; v11 kazanır), 392 perde etiketi kanonik sapması (parse-eşit, labelDiff 0), 0 gerçek değer çatışması — şema alan-haritası takip görevine ve F8 listesine bağlı (`…/2026-11-19-F3-T3.3d/test-cikti/t33d-a0-kalanti-envanteri.log`).
- Encoded okuma kapsamı: v11 kolon donatısı korpus kanıtsız olduğundan bilinçli okunmadı; 211280 (B0/C1) donatı/F9 akışları görülmez (G5 taşınan sınırları).
- **MS2/SK opsiyonel genişleme kulvarı:** ana oracle MUSTAFA SELVİ 1.KISIM'dır; MS2 (46,5 MB) ve SK (70,9 MB) için ayrı akış-sayımı/metraj oracle tablosu gerekir, kampanya yüzdesine katkısı opsiyoneldir (11-KABUL §6).
- Sıfırdan Hsyncad modeli → native IDE sentezi hâlâ ürün yolu değildir; IFC ara aktarımı ([IFC_INTEROP.md](IFC_INTEROP.md)) geçerli yoldur. Bayt temizleme çıktısının ticari/lisanslı dosya olarak sunulması REA doğrulaması dışındadır (ürün sahibinin kararı; `02-DONUSUM-MATRISI.md` §4 etiket uyarısı).

---

## 5 Kasım 2026 taban kaydı (kampanya öncesi)

Bu bölümden sonraki başlıklar 5 Kasım tarihli özgün belgedir; F3–F6 kampanya kazanımları (yukarıdaki bölüm) yalnızca native dosya dönüşüm/okuma/yama kulvarını değiştirmiştir.

## Gerçek durum

Görev tamamlanmış değildir. Hsyncad'de sıfırdan çizilmiş genel bir modelin doğrudan .ide10/.ide11 olarak yazılması ve özgün ideCAD'de bütün bilgilerle kayıpsız açılması henüz sağlanmadı. IFC ara aktarımında ise bir katlı 11 ve üç katlı 33 katı elemanlı kontrollü örnekler ideCAD'de içe alındı, `.ide11trial` kaydedildi, yeniden açılıp kaydedildi ve geometrileri kaynakla eşleşti. Bu dar kabul, genel proje veya ticari native biçim kabulü değildir.

## Doğrulanan hatalar

- Önceki sentezleyici gerçek proje serializer'ı değildir; sezgisel okuyucunun aradığı kalıpları üretir. CRC ve kendi okuyucusunda yeniden açılma native uyumluluğu kanıtlamaz.
- `scripts/produce-real-working-ide-files.ts` önceki kullanıcı çalışmasıdır, düzeltilmiş üretim aracı değildir. 22 baytlık isim alanına 24 bayt yazar, NUL/önizleme alanını bozar ve CRC'ye yanlış final XOR uygular. Mevcut SON2 çıktıları yeniden kullanılmamalıdır.
- Bu script yeni 2583 m² modelini okumaz; Mustafa Selvi'nin altı katlı dosyasını değiştirir. Onu yeni projeymiş gibi adlandırmak doğru değildir.
- Önceki süreç/RAM ölçümleri proje yüklenmesini veya geometrinin doğruluğunu kanıtlamaz.
- Kat/eleman sayısından donor seçimi ilgisiz projeyi kopyalayabilir; ürün yolundan kaldırıldı.

## Uygulanan koruma ve aktarım

- Taşıyıcı imzası, desteklenen sürüm, sayısal kodlama bayrağı, boyut, isim sonlandırıcısı ve raw CRC doğrulanır; bozuk dosya otomatik mühürlenmez.
- Aynı biçimde native kayıt özgün tüm baytları korur. Model değişiklikleri veya sürüm dönüşümü sessizce atlanmaz, hata verir. Trial uzantısı ve işaretleri korunur.
- Genel native sentezleme kullanıcı indirmesi üretmez; tarihsel aday üretici yalnız araştırma kodudur.
- Çizim alanına IFC2x3 ve aktarım raporu çıktısı eklendi. Desteklenmeyen katı elemanlarda varsayılan davranış hatadır. Donatı, analiz sonuçları ve diğer eksikler raporlanır. Ayrıntı: IFC_INTEROP.md.
- Reader hâlâ seçili geometri kayıtlarını tarar. Aday kayıt kapsamı, dosyanın bütün nesnelerinin veya tüm mühendislik bilgilerinin okunduğu anlamına gelmez.

## Yerel ideCAD kabul kanıtı

Kullanıcıda ideCAD Statik 11 Deneme kullanıldı. Hsyncad ile oluşturulan bayt eşit `.ide10` kopyası kayıtlı dosya açma komutuyla yeni bir ideCAD oturumuna verildi. Dosya adı, aktif `1. BODRUM TAVANI` görünümü ve altı kat uygulamanın başlığı ile yapı ağacında doğrulandı. Bu kopya ideCAD'in kendi yazıcısıyla `mustafa-dogrulama-kopyasi.ide11trial` olarak kaydedildi. Kayıt iletişim kutusu yalnız `.ide11trial` gösterdi. Yeni dosya 146.672.987 bayt, başlık sürümü 211280, sayısal bayrak 1, geçerli raw CRC ve SHA-256 `1b5b0ca242d4a410c54359b210bc8e908c43302d80feaa60fb2bd558fa3c8a4c`.

Güncel trial sayısal kodlaması ve merdiven alt arşivinin 211280 sürümü gerçek dosyada doğrulandı. Okuyucu altı katı ve 1.273 tanınan elemanı kimlikleriyle özgün `.ide10` dosyasıyla eşledi. Ölçüler ve yükler karşılaştırma toleransı içinde eşleşti. Yedi merdiven ağı ve 159 döşeme yükü okundu. `HSYNCAD_IDE211280_FIXTURE` ile gerçek dosya regresyon testi çalıştırılır.

Güncel EXE'nin SHA-256 değeri `350d5a581417dec9cddac52b66e1a4b60ecdce227e70eb93cb909b6f660162f4`. Yerel REA/Ghidra arşivinde `140988cc0.c:198` ve `140989c30.c:40` sürüm `0x33950` (211280) yazımını, `1409889a0.c:46` ana okuyucuya (`0x14098b600`) çağrıyı gösterir. `0x140989c30` akışında sürüme göre koşullu alanlar, iç içe tablolar ve farklı nesne yazıcıları vardır. Bütün native arşiv grameri henüz çözülmedi. 211280 ticari taşıyıcı için örnek yok.

Otomasyon ekran yakalamasında `FrameArrived timed out` hatası verdi. Kaydetme diyaloğunun onayını kullanıcı yaptı. Hsyncad bu deneme kaydının bayt eşit ikinci bir kopyasını çıkardı. Ayrı yeniden açma oturumunda ideCAD deneme dosyalarının normal sürümde açılamayacağını bildirdi. Bilgi kapatıldıktan sonra yeniden açılan dosyanın adı ve aktif bodrum katı uygulama başlığında doğrulandı.

### Sıfırdan model → IFC → ideCAD kaydı: 11 eleman

Kaynak `hsyncad-4x4-paneller.hsyncad`; dört kolon, dört kiriş, bir betonarme perde ve iki ayrı kapalı döşeme paneli içerir. Body temsili Axis'ten önce yazılır. Kurulumun boş statik şablonunun ayrı kopyasına IFC içe alındı; kaynak projenin üzerine ekleme yapılmadı. Şablondaki C25 B420C kaynak modelden aktarılmış malzeme sınıfı değildir.

`hsyncad-paneller-ilk-kayit.ide11trial` 336.427 bayt, 211280/1, geçerli CRC, SHA-256 `7b63a5b1a9d3d263fe73914ea878b597985be9e09b09ca97dd20015f8b08c254`. `HSYNCAD_IFC_PANELS_FIXTURE` regresyonu bu sabit örneği okur. ideCAD'de yeniden açılıp Ctrl+S ile kaydedilen `hsyncad-paneller-test.ide11trial` 336.446 bayt; SHA-256 `2d836ac7ad325729fc5287330c97f1d1901f141bc1768ae0076698139baefb85`.

Her iki kayıtta 11/11 katı, bir kat (taban 0 m, yükseklik 3 m), plan konturları ve düşey aralıklar 1 mm toleransla eşleşti; fazladan katı ve tanınan gramerde desteklenmeyen aday yok. Kirişler 25/50, döşemeler 15 cm; perde native kayıtta taşıyıcı türündedir. Donatı, yükler, analiz ve malzeme dayanım sınıfı bu kabulün dışında. Genel okuyucu hâlâ seçili kayıtları tarar.

Eski tek döşemeli örnekte sonuç 9/10'dur: native yazıcı boş döşeme kaydetti ve yeniden açıp kaydederken kaldırdı. Üçlü test ayrıca iç perdesiz döşemenin kiriş/kolon yüzlerine kırpıldığını gösterdi. Ürün arayüzü artık taşıyıcı kapalı paneliyle eşleşmeyen döşemeyi ve native korunması sınanmamış boşlukları IFC indirmeden önce reddeder; kaynak konturu sessizce değiştirmez. **Proje → ideCAD için panelli örnek** doğrulanan 11 elemanlı modelin kaynağını açar.

### Üç farklı kat: 33 eleman

`fixtures-2026-11-05/hsyncad-tc33-3kat.hsyncad` kaynağında kat tabanları -3, 0 ve 3,5 m; yükseklikler 3, 3,5 ve 2,8 m; kiriş yükseklikleri 50, 65 ve 40 cm; döşeme kalınlıkları 15, 20 ve 18 cm. Model X=-5, Y=7 m ötelenmiştir. On iki kolon, on iki kiriş, üç perde ve altı döşeme bulunur.

İlk native kayıt `hsyncad-tc33-ilk-kayit.ide11trial`, 431.124 bayt, SHA-256 `5dcf547bbc5c00aa68eb4f2362222b7d6d615a4f1e6ca96628e18ec83f9bd296`. Ayrı kopyada yeniden açılıp Ctrl+S yapılan `hsyncad-tc33-yeniden-ac.ide11trial` 431.181 bayt, SHA-256 `c3b4c34514351577966982e4f8537ef838579e5f37935b2fa59389a5e79e3937`. Her iki kayıt 33/33 katı ve 3/3 kat ile kaynak geometriye eşleşir; geçerli CRC korunur. Native başlıkta Bodrum tavanı 0,00 kotu ve ağaçta üç kat görüldü.

Bu test ilk katın okunmamasını yakaladı: hiç açılmamış viewport sekiz sınır sayısını 1 olarak saklar. Ordinal/reference/marker, 0,3 ölçek, tam sekizli sentinel ve 1381 ofsetindeki native kat başlığıyla sınırlı destek eklendi. Yeniden kayıt başlığı `Birinci kat` yerine `Birinci kat TAVANI, 6.30 KOTU` yapar, sentinel hâlâ kalır. Her iki gerçek dosya `HSYNCAD_IFC_TC33_FIXTURE` ve `HSYNCAD_IFC_TC33_RESAVED_FIXTURE` ile test edilir; bozuk sentinel reddedilir. İlk denetimdeki 22/33 raporu eski okuyucunun sonucudur, native eleman kaybı değildir; düzeltilmiş ve yeniden kayıt denetimleri ayrı JSON dosyalarında saklanır.

### Özel kesit/kot ve çapraz perde: 8 eleman

TC8; 30° döndürülmüş dikdörtgen, kısa, daire ve L kesitli dört kolon; kaçıklıklı ve çapraz iki kiriş; kısa ve çapraz iki perde içerir. İlk incelemede 4/8 eşleşme çıktı. Kısa kolonun -0,5 m ve perdenin -1,5 m özel üst kotları native dosyada duruyordu. Gözlenen kolon/perde kayıt ailelerinde bu alanlar artık okunur. Kolon için `140adba70` sonZ−katTavanı değerini nesne+0x158'e yazar, `14059e0e0` aynı alanı okur. Perdenin alanı ortak member okuyucusunun `141fccbd0` akışındadır. Diğer kayıt ailelerinin özel kotları için genel destek iddiası yoktur.

Daire kolonda native işaret 0x200, saklanan yarıçap 0,3 m ve 25 çevre noktası birlikte doğrulanır. Kaynak noktaları değiştirilmez; ayrı `circleSection` metadata'sı ve yarıçaptan türetilmiş 64 noktalı görüntü konturu tutulur. Analitik daire, farklı örnekleme sayısındaki iki çokgenin kirişleriyle karşılaştırılmaz; merkez ve yarıçapı eşlenir.

Çapraz perdede gerçek konum farkı vardı: native importer dikdörtgen profilin 2B merkezini döndürmeden ekliyordu. IFC dünya geometrisini koruyarak profil merkezi sıfıra ve yerel yerleşim elemanın dünya merkezine alındı; Axis uçları ±L/2 olarak yazıldı. Düzeltilmiş native ilk kayıt `fixtures-2026-11-05-offsets-r2/hsyncad-tc8-r2-ilk-kayit.ide11trial`, 326.132 bayt, SHA-256 `8ee2d89d66e85767669d49831557eee117176e44e026c0eea90afde8bc209aa1`. Yeniden açılıp kaydedilen `hsyncad-tc8-r2-yeniden-ac.ide11trial` 326.151 bayt, SHA-256 `8013a89b61265fcabd8859f79a5a9e8bc599eba12240c9e45ec6a576d351b365`; ikisi de 8/8 eşleşir. Kısa kolon 0,2–2,5 m, kısa perde 0,3–1,5 m ve kaçıklıklı kiriş 2,15–2,8 m aralıklarını korur.

Eski TC8 native dosyası SHA-256 `b65c4f22d09e943066a30aa6a27539bf376e67cadc69522d6d175105e6ee1649` ile `HSYNCAD_IFC_TC8_FIXTURE` regresyonunda kot/daire alanlarını sınar; bu dosyanın çapraz perdesi yanlış konumdadır ve kabul çıktısı değildir. Düzeltilmiş dosya `HSYNCAD_IFC_TC8_R2_FIXTURE` ile tarayıcıda, özel kot ve daire çapı paneli ile görüntüleme anlık görüntüsünün kaydı üzerinden doğrulanır.

## Devam kabul ölçütleri

1. Kontrollü küçük model: dört kolon, dört kiriş, bir perde ve bir döşeme; bilinen metre ölçüleri.
2. IFC'yi yeni projeye al; tür, sayı, kat, koordinat, kesit, malzeme ve özel kotları özgün ideCAD'de doğrula.
3. ideCAD'in kendi izin verdiği formatta farklı kaydet; kapatıp yeniden aç ve aynı karşılaştırmayı yap.
4. Sıfırdan native yazıcı için gerçek archive gramerinin bütün zorunlu tablolarını, nesne türlerini, ilişkilerini ve sürüm farklarını çöz; her desteklenen özelliği native kabul örnekleriyle koru.
5. Yalnız deneme sürümü ile ticari .ide11/.ide10 davranışı doğrulanmış sayılmaz.

5 Kasım devam incelemesinde `0x140989c30` içindeki kat döngüsünden `0x1409c8330` ve `0x1408eb940` fonksiyonlarına ulaşıldı. Yazıcı, katın ve görüntü penceresinin alanlarını ayrı yazar. Ardından kaydedilebilir nesneleri sürüme göre seçer, sayıyı yazar ve her nesneyi 4 bayt tür kodu ile kendi sanal yazıcısı üzerinden kaydeder. `0x1409441c0` okuyucusu aynı tür kodunu sınıfa özgü kuruculara yönlendirir. Her nesne sınıfının yerleşimi henüz eşlenmedi. İnceleme çıktıları `native-2026-11-04/document-records`, `storey-entities` ve `entity-dispatch` klasörlerinde.

### Üreticinin 11.04 örnekleri

ideYAPI'nin yayımladığı iki 211040 `.cde` dosyasının sıkıştırılmış gövdesi çözüldü. Açılan ilk örnekte ideCAD başlığı `Architectural Template Project — BASE STORY` ve yapı ağacındaki iki kat görüldü. Hsyncad iki dosyada da `STORY 1` (3 m) ve `BASE STORY` (0 m) katlarını, toplam 135 geometri kaydını eşledi. Kayıtlar 24 kolon, 30 duvar, 31 kiriş, 19 döşeme, 17 aks, 12 döşeme kenarı ve 2 kesit işareti içeriyor. Kiriş yüksekliği, döşeme yükleri ve merdiven ağı bu sıkıştırılmış örneklerde çözümlenmedi. Kesiti çözümlenmemiş kirişler planda gösterilir. Kaynağın kopyası aynı `.cde` uzantısı ve baytlarla indirilir. [İlk üretici örneği](https://help.idecad.com/ideCAD/examine-the-structural-model), [ikinci üretici örneği](https://help.idecad.com/ideCAD/get-the-ideyapi-building-information-model).

REA akışı `0x14098b600` içinden `0x14073d3f0` ile zlib gövdesini açıyor. Kaynak başlığının CRC'si, sıkıştırılmış ve açılmış uzunluklar ile zlib Adler32 değeri kontrol ediliyor. `0x140bc6da0` sıkıştırma işaretine göre ortak geometri kaydındaki 16 baytlık sınır kutusunu okumadan ilerliyor. Destek üç boş önek tablosu gözlenen 211040 biçimiyle sınırlı. Gerçek örnek regresyonu `HSYNCAD_IDE211040_FIXTURE` ile çalışır. Dosyalar ve decomp çıktıları yerel `native-2026-11-04` arşivinde.

`Downloads/MUSTAFA SELVİ 1.KISIM.ide11` dosyasında sürüm `211220` ve sayısal kodlama bayrağı `1`. Bu örnek ticari `.ide11` kabul kanıtı olarak kullanılmaz. Okuyucu, başlık ve dosya uzantısı farklı biçim gösterdiğinde kullanıcıya bildirir.

Yeni kayıt geldiğinde `node --import tsx scripts/audit-hsyncad-native-roundtrip.ts --demo <native-dosya>` ile 4×4 örneğin katları, katı elemanları, plan konturları ve düşey aralıkları 1 mm toleransla karşılaştırılır. `--demo` yerine düzenlenebilir Hsyncad model dosyası da verilebilir. Denetim başka bir gerçek proje üzerinde sınandı. 10 beklenen elemanın sıfırı eşleşti ve işlem kodu 2 döndü. Bu denetim uygulamada yeniden açma, taşıyıcı sınıfı, malzeme, yük ve donatı kabulünün yerini tutmaz.

İlk araştırma checkpoint'inde remote push veya deployment yapılmadı. Özgün proje dosyaları değiştirilmedi. Aşağıdaki production kabulü sonraki açık kullanıcı talebiyle gerçekleştirildi.

## Son yerel doğrulama

Okuyucu/IFC/görüntüleme dosyası testleri 26/26; `tests/hsyncad/ide-exports.spec.ts` tarayıcı senaryoları 9/9 geçti. Uygulama TypeScript kontrolü `tsconfig.next.json --noEmit --incremental false` ile geçti. Önceki taşıyıcı/kaynak koruma paketi 34 geçti, o çağrıda seçilmemiş iki gerçek dosya fixture'ı atlandı; sonraki fixture'lı okuyucu çağrısı 22/22 geçti. Bunlar örtüşen çağrılardır, toplam benzersiz test sayısı diye toplanmaz. Native 11, 33 ve düzeltilmiş 8 eleman örneklerinin ilk kayıt/yeniden kayıt geometri denetimleri geçerlidir. Genel mühendislik verisi veya ticari native yazıcı kabulü değildir.

## Production ve yedi katlı kabul — 5 Kasım devamı

Kullanıcının açık production talebiyle `6ffc5050386fc2ae8d99da1c3325b3cfe065ee07` main'e tek push yapıldı. Canlıdaki `555b89ae` CAD değişiklikleri korunarak Hsyncad checkpoint'i onun üzerine rebase edildi. Birleşik production build, check:tools (30/30 araç browser smoke dahil) ve üç Hsyncad smoke senaryosu geçti. Vercel `dpl_2wuDXgKc1J9yx2mXuFWpBDqh8T5k` production READY; ana alan adı bağlandı. Bu deployment için 15 dakikalık error/fatal sorgusu boş döndü; sürekli izleme garantisi değildir.

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\seven-storey-2026-11-05`. `HSYNCAD-7K-KARSILASTIRMA.hsyncad` yedi farklı kat yüksekliği, 13 derece döndürülmüş plan, her katta açık atrium ve geri çekilen üst kat içerir. Canlı Hsyncad arayüzünde açılıp IFC indirildi: 406 katı, sıfır kapsam dışı eleman, sıfır pageerror. Native kayıt canlı Hsyncad'de de 7 kat/406 eleman olarak açıldı ve kaynak kopyası bayt eşit indirildi.

ideCAD'de ayrı boş şablona IFC alındı; yedi kat ağaçta görüldü. İlk native kayıt SHA-256 `e9484a3c70f4b2f74787a8b322da8853c69b947e6cea2fcb8dd14429d7359b60`. Ayrı oturumda `HSYNCAD-7K-YENIDEN-AC.ide11trial` açılıp Ctrl+S yapıldı; baytlar değişti, yeni SHA-256 `c3b8ad5254c410fc127eb66108acac73b3612743c6d2674c755dc5c080d750e0`. İki kayıtta 7/7 kat ve 406/406 katı, 1 mm kontur/kot toleransıyla eşleşti; fazladan katı ve çözümlenemeyen aday yok. `native-ilk-denetim.json`, `native-yeniden-kayit-denetim.json`, production UI raporları ve ekran görüntüleri aynı klasördedir. Bu sonuç geometri kabulüdür; analiz, donatı, yük ve ticari `.ide10/.ide11` yazıcı kabulü değildir.
