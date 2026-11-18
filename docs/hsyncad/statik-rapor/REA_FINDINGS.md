# REA araştırması — Aşama 01

Somut REA kullanımı var; **native mühendislik kabul kapısı henüz geçmedi**. R1–R8 durumları [REA_UNKNOWN_LEDGER.json](REA_UNKNOWN_LEDGER.json) içinde. Altı soru kısmi, ikisi çözümsüz; hiçbiri tam cevaplı sayılmadı.

## Gözlenen kanıt

- Güncel ideCAD EXE: 223.081.544 bayt, SHA-256 `350d5a581417dec9cddac52b66e1a4b60ecdce227e70eb93cb909b6f660162f4`.
- Yeni REA Evidence `ev_6fe6dc7515c2714c073f4098a6e6e3c7bba19d773e370301dab15fc7a21027c5`: 9.259 directory girdisi / 4.621 kaynak. Portable bundle dış kanıt köküne yazıldı. Tool unknown=0 yalnız bu kaynak ağacı işleminindir; R1–R8 unknown sayısı değildir.
- Yerel REA repo HEAD `113679c9a6a1af4c77c1b546e466f4d490dc1095` kaynak parserı gerçek EXE üzerinde çalıştırıldı. 12 kaynak modülü yerel araştırma bundle'ına derlendi; 4.621 kaynağın kimliği, ofseti ve payload hash'i MCP ile tam eşleşti. Kesik PE ve yetersiz kapasite girdisi reddedildi. Bu, repo CLI/native provider kabulü değildir.
- 744 diyalog tam ayrıştırıldı; 176 mühendislik adayı diyalog ve 1.069 string seçildi, parse hatası yok. Türkçe Unicode korundu; ekranın canlı kontrol durumu gözlenmedi.
- Üç kaynakta 159/70/299 döşeme G/Q kaydı tekrar doğrulandı. Kaynak baytındaki tek G değişikliği yalnız ilgili elemanı değiştirdi; NaN metadata üretmedi, kesik taşıyıcı reddedildi. Özgünler değişmedi. Bu 528 alanın editöre taşınan yük sayısı hâlâ 0; ürün düzeltmesi yapılmadı. G'nin öz ağırlık içerme anlamı bilinmiyor.

## Alan/bağlantı sınırı

| Konu | Yeni kaynak kanıtı | Henüz kanıtlanmayan |
|---|---|---|
| Malzeme | Türkçe kaynak2708: fck/fct/E/G/Poisson/birim ağırlık ve donatı dayanım alanları | Native malzeme sınıfı, eleman ilişkisi, byte ofseti |
| Temel-zemin | Kaynak442: qt ve emniyet gerilmesi ayrı; negatif temas, etkileşim ve Winkler kontrolleri | DDX/serializer/gerçek hesap tüketicisi |
| Donatı | Kaynak346: sol/sağ/üst/alt ilave ve pilye bölgeleri | Native çubuk listesi, kanca/ek/kesim ve kimlik |
| Rapor | Kaynak30801: bütün proje/aktif kat/seçim kapsamı | Gerçek bölüm ekleme/çıkarma kod yolu |
| Metraj | Kaynak13740: tür/kat/eleman/çap ayrıntıları ve bileşen seçimi | Net/brüt ölçüm, ortak yüzey ve kesim sözleşmesi |

`native-field-map.json` statik kontrol kimliklerini ve tam kaynak ofsetlerini tutar. Statik label ID'si editable model alanı sayılmaz. Resource içinde eski/yeni seçeneklerin birlikte bulunması canlı ekranda hepsinin etkin olduğu anlamına gelmez. Kullanıcının ekran görüntüsü MS1 parametre girdisidir; başka projeye varsayılan yapılmaz. Yeni hiçbir native reader/writer fonksiyon eşlemesi uydurulmadı.

## Runtime ve başarısız denemeler

Repo Node24.22.1/npm11.16.0 ile `npm ci` geçti. `build:cached`, `native/windows/build/manifest.json` eksikliğinde exit1 verdi. Güvenlik kapısı değiştirilmedi, addon kopyalanmadı/derlenmedi. Mevcut global resmî6.7.0 runtime native addon manifest hash'i eşleşiyor; process-scoped doctor Ghidra12.1.4/JDK21 sağlayıcısını kullanılabilir buldu. Doctor genel exit1: Codex config drift; kalıcı MCP ayarı değiştirilmedi. Bu turda yeni Ghidra cold EXE analizi yapılmadı.

İlk kaynak-parser denemesi Evidence subject şeması yanlış varsayıldığı için düzeltildi. Doğrudan tsx kaynak importu 120s watchdog ile durduruldu (exit124, sahip olunan ağaç temizlendi); aynı koşulla tekrarlanmadı. Kaynak bağımlılıklarını araştırma bundle'ına almak 2,3s toplam koşuda başarı verdi; parserın gerçek EXE işlemi yaklaşık0,3s. İlk native probe Downloads bayt-eşit kopyasını dördüncü proje saydığı için reddetti; SHA-256 tekilleştirmesi sonrası üç ayrı kaynakla geçti. Başarısız loglar saklıdır.

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-01\rea`. `rea-identity-manifest.json`, `native-field-map.json`, `native-engineering-probe.json`, `native-resource-dialogs.json`, `source-parser-parity.json` ve `mcp-pe-resource-evidence.json` burada. Büyük/özel veri runtime/public ağacına taşınmadı; ürün modülleri REA veya bu yerel dosyalara bağımlı değildir.

## Aşama04 devamı —6 Kasım2026

Yerel REA repo parserıyla gerçek EXE üzerinde11odaklı RTTI adayı,13vftable ve292yöntem işaretçisi bayt kontrolü yapıldı. Bunlar yerel candidate kimlikleridir, REA Evidence ID veya serializer kanıtı değildir. PeResourceLayout kaynak hash'i ve EXE kimliği kapanışta eşleşti. Ghidra C25 cold araması600s timeout124; o çağrının süreç ağacı temizlendi, geçici analiz dosyalarının temizliği doğrulanmadı. Üç örneğin G/Q gözlemi ve tek alan mutasyonu IMPORT_COVERAGE kayıtlarına bağlandı; solver yükü kabul edilmedi. Ayrıntı P04_NATIVE_IMPORT.md ve asama-04/rea-research. R1–R8 kabul statüleri yükseltilmedi.
