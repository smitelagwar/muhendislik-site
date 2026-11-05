# ideCAD dosya biçimi — doğrulanmış alanlar

5 Kasım 2026. Bu belge tam bir native yazıcı spesifikasyonu değildir. Önceki haritanın “nihai/doğrulanmış yazıcı” iddiaları geri çekildi; tarihsel metnin kopyası yerel REA inceleme arşivinde `IDE_FORMAT_MAP-previous-unverified.md` adıyla saklandı. Güncel kabul sonuçları ve kalan işler: [NATIVE_INTEROP_STATUS.md](NATIVE_INTEROP_STATUS.md).

## Taşıyıcı başlığı

`src/lib/hsyncad/ide-import/ide-binary-codec.ts` doğrulayıcısının gerçek örneklerle sınanan alanları:

| Ofset | Alan | Okuma / sınır |
|---|---|---|
| 0–73 | Sabit imza | `IDE BUILDING DESIGNER PROJECT FILE`, Ver 4/SubVer 00, Copyright IDE YAPI; CRLF ve son NUL dahil 74 bayt |
| 74–77 | Biçim sürümü | LE u32; gözlenen 201091, 201094, 211040, 211220, 211280 |
| 78 | Sayısal kodlama bayrağı | 0 veya 1; biçim sürümünden ayrı kontrol edilir |
| 79–82 | Toplam taşıyıcı boyutu | LE u32; gerçek dosya boyutuyla eşit olmalı |
| 83–86 | Raw CRC32 akümülatörü | 88. bayttan EOF'a; başlangıç 0xffffffff, polinom 0xedb88320, final XOR **yok** |
| 87 | Başlık sonu alanı | Anlamı için yeni bir iddia yok |
| 88–95 | Proje ön bilgileri | Tüm alanların anlamı eşlenmedi |
| 96–99 | Proje adı uzunluğu N | LE u32; son NUL dahil |
| 100… | Proje adı | CP1254; N bayt, son bayt NUL, erken NUL reddedilir |
| 112+N | Önizleme uzunluğu | LE u32; önizleme sonu sınır kontrolüyle hesaplanır |

CRC eşitliği iç arşivin doğru serialize edildiğini veya ideCAD'in projeyi açtığını kanıtlamaz. Hasarlı kullanıcı dosyası otomatik yeniden mühürlenmez. `sealIdeCarrierHeader` yalnız kontrollü test/araştırma kopyalarında kullanılır.

201091 kurulumun boş statik şablonunda, 201094 üç seçili özgün `.ide10` projede, 211040 üreticinin sıkıştırılmış `.cde` örneklerinde, 211220/1 ve 211280/1 incelenmiş trial kayıtlarda görüldü. Uzantı sayısal kodlamayı belirlemez. Trial biçimi yalnız dosya adı değiştirilerek ticari biçime dönüştürülmez. 211280 ticari taşıyıcı kabul örneği yoktur.

## Sayılar ve sıkıştırma

- İncelenen kodlama bayrağı 1 olan 211220/211280 dosyalarında float64 alanları yerel Blowfish bloklarıyla sarılıdır. `numeric-codec.ts` biçim başlığına göre okuma adaptörünü seçer. Raw u32, float32 ve flags alanlarına float64 adaptörü uygulanmaz. Ortak kayıtta nativeZ ve genişliğin ayrıca gözlenen ölçekleri vardır.
- REA kanıtı: sayısal yazıcı RVA 0x41bc20, okuyucu 0x419e20; ana belge okuyucusu VA 0x14098b600.
- 211040 üretici örneklerinde zlib gövdesi vardır. Kaynak CRC'si, sıkıştırılmış/açılmış uzunluklar ve Adler32 doğrulanır; açılan gövde 512 MB ile sınırlıdır. Destek, üç boş önek tablosu gözlenen aileyle sınırlıdır.
- `0x140bc6da0` sıkıştırılmış ortak nesne kaydında 16 baytlık önbellek sınır kutusunu okumadan ilerler. Raw ve sıkıştırılmış gövdede aynı sabit ofsetler varsayılmaz.

## Kat ve nesneler

Okuyucu tam archive tablosu yerine doğrulanan string/renk/ortak geometri grameriyle aday kayıtları tarar. Kayıt sayısı bütün dosyanın nesne envanteri değildir. Kat adı sonrasında kot/yükseklik, sıra/reference/marker, viewport ölçeği ve yinelenmiş görünüm sınırları kontrol edilir. IFC ile oluşan hiç açılmamış viewport, sekiz adet 1 sınır değeri saklayabilir; bu istisna yalnız sabit 1381 ofsetindeki uygun kat başlığı ve diğer başlık kontrolleriyle kabul edilir.

| Ortak primitive kodu | Okuyucudaki karşılık |
|---|---|
| 2 / 17 | Duvar / betonarme perde |
| 4 | Kolon |
| 5 | Kiriş |
| 6 | Aks |
| 7 / 13 | Döşeme / ilişkili döşeme boşluğu |
| 40 | Kayıtlı analiz ağı doğrulanan merdiven |
| 44 / 45 | Çizgi / döşeme kenarı |
| 123 / 128 | Kesit işareti / bant kiriş; plan gösterimi |

Ortak geometri kaydının değişken nokta ve ilişki listeleri isim alanına kadar hizalanmalıdır. Native kimlik, kat, noktalar, genişlik, yanal kaçıklık, dönüş ve ilişkiler ayrı alanlardır. Boş sınır noktalı type-7 döşeme gerçek IFC testinde görüldü; atlanmak yerine desteklenmeyen aday olarak sayılır.

Kiriş kesitleri ve bazı kolon/perde üst kotları yalnız incelenmiş style/tag ailelerinde okunur. TC8'de kolon üst kotu `0x140adba70` tarafından nesne+0x158'e yazılır ve `0x14059e0e0` tarafından okunur. Native daire işareti 0x200, yarıçap alanı ve saklanan çevre noktaları birlikte doğrulanır; daire bilgisi yalnız noktalara çember uydurularak üretilmez. Diğer aileler için tüm özel kotların çözümlendiği iddia edilmez.

## Native yazıcı sınırı

`0x140989c30` belge yazıcısı; kat yazıcısı `0x1409c8330`; koleksiyon yazıcısı `0x1408eb940`; tür fabrikası `0x1409441c0`. Koleksiyon her nesneyi tür kodu ve sınıfa özgü sanal yazıcıyla serialize eder. Bu akışta sürüme bağlı alanlar, iç içe tablolar ve nesne ilişkileri bulunur. Tüm zorunlu tablolar ve sınıf yazıcıları henüz eşlenmedi.

Eski `synthesizeIdeFile` bu akışın karşılığı değildir. Kendi okuyucusunda yeniden açılan kalıplar üretmek native kabul sağlamaz. Ürün yolu değiştirilmiş veya sıfırdan genel bir modeli native IDE diye indirmez. Aynı kaynağı değiştirmeden kaydetme tüm özgün baytları korur. Çizim modelinin çalışan ara aktarımı [IFC_INTEROP.md](IFC_INTEROP.md) belgesindedir; native kayıt ideCAD'in kendi yazıcısıyla, bu kurulumda `.ide11trial` olarak yapılır.
