# Aşama05 — Açık yük, kütle ve ön kontrol girdisi

6 Kasım2026. Bu teslim bağımsız hesap motoruna hazırlanacak **açık girdili, düzgün düşey prizma/doğrusal eleman ve sabit yük parçası profili** içindir. Bina çözümü, kapasite veya mevzuat onayı değildir. Native ve desteklenmeyen fiziksel model durumları başarıya çevrilmez; P01/P04 kapıları açık kalır.

## Modüller ve birimler

- `mass-properties.ts`: basit poligonun sınır integralleriyle gerçek alan, ilk moment, merkez ve dönel kütle; deliklerin çıkarılması, birleşik kütlede paralel eksen teoremi. Köşelerin ortalaması merkez kabul edilmez. Winding yönü ve büyük koordinat ötelenmesi sonucu değiştirmez. Dışarı taşan, temas eden/çakışan delikler, sıfır alan ve sayısal başarısızlık reddedilir.
- `load-ledger.ts`: açık fiziksel yük kimliği, G/Q/diğer kullanıcı durumları, dağılım, yön, birim, etki geometrisi ve her parçanın kendi kütle katılımı. Yüzey/çizgi/nokta/düşey prizma hacim yükü; öz ağırlık, ilave ölü/kaplama/duvar, hareketli, toprak/su/kar/rüzgâr veya diğer açık kuvvet girdileri saklanır. Yalnız üniform parça/dağılım hesaplanır; yerel iklim, hidrostatik profil veya normatif katsayı otomatik üretilmez.
- `preflight.ts`: doğrulanan CadModel/structural verisinden deterministik düğüm/eleman/yerel çerçeve, fiziksel malzeme, serbestlik/salım, mesnet, kat/diyafram ve yük paketini üretir. Sadece aynı açık mekanik kimlik birleştirilir; geometrik temas bağlantı değildir. Başarısız kapsam `blocked`, desteklenen açık veri profili `input_ready` olabilir. Her iki durumda `analysisApproved=false`, kararlılık `requires_solver_check` kalır.

Uzunluk m, kuvvet kN, hacim m³, kütle kg, dönel kütle kg·m², E MPa, yoğunluk kg/m³ olarak taşınır. Açık kullanıcı tf/m² girdisi9.80665 ile kN/m²'ye çevrilir; fiziksel ağırlıktan kütle aynı standart yerçekimiyle bulunur. Bu birim dönüşümü native alanın gerçekten o birimde olduğu kanıtı değildir. Yük yönü birim vektör olmalı; kütleye katılan parça açık düşey ağırlık olmalıdır. G/Q ayrı tutulur; her katın ayrı kütlesi/merkezi/dönel kütlesi ve genel fiziksel toplam kaydedilir. Bunlar FE tutarlı/yığılmış kütle matrisinin kurulması değildir.

Öz ağırlık ancak açık yoğunluk ve düzgün düşey prizma geometrisinden üretilir. Ön kontrolde malzeme yoğunluğu, hacim, dış poligon ve boşluklar fiziksel elemanla karşılaştırılır. Ortak hacimler için brüt değere dönülmez; net parça integralleri gerektiğinde durum engellenir. G'nin içinde öz ağırlık varsa ayrıca üretilmesi, aynı elemanın iki öz ağırlığı veya aynı fiziksel yükün kabuk/şerit gibi iki yoldan eklenmesi reddedilir. Her parçanın `physicalLoadId` sahibi tektir.

## Ön kontrolün sınırı

Bilinmeyen rol/malzeme/E/Poisson/yoğunluk, boşluk kapsamı, kat/diyafram, yerel eksen veya salım; eksik yük envanteri; yük/kat/eleman uyuşmazlığı; ortak kimlikte farklı koordinat; mesnetsiz bileşen; ayrı kimlikli çakışık düğümler ve sayı taşması açık diagnostic üretir. Nokta kuvveti gerçek XYZ düğümüne bağlanmalıdır. Mesnede yol bulunması kararlılık/singularite ispatı değildir.

Kabuk/döşeme/perde/radye/merdiven ağı, 3B boşluk derinliği, gerçek çember normal-kesiti, eğik/özel kiriş, sıfır dışı yerel dönüşün çözümlenmemiş birimi ve rijit kaçıklık doğrulanmadığında `unsupported` kalır. Veri atılmaz, dolu/rijit/bağlı varsayılmaz. Sıcaklık kaydı C birimiyle korunur; doğrulanmış termal gerinim/eşdeğer kuvvet yolu olmadığı için analize hazır gösterilmez. P06–13 bu alanları doğruladıktan sonra kabul profili genişleyebilir; mevcut dosya onların hesabını yapmış sayılmaz.

`oneWayUniformStrip` yalnız üniform, basit mesnetli şeridin **statik denge oracle'ıdır**: uygulanan kuvvet=aktarılan kuvvet=iki reaksiyon toplamı ve moment dengesi bağımsız testte karşılaştırılır. Bu, bina solver'ının reaksiyonu veya genel iki yönlü yük dağıtımı değildir. Doğrudan kabuk yoluna aynı şerit aktarımı eklenemez.

## Native G/Q sonucu

`asama-05/g-semantics/findings.json` gerçek kaynak hashleri, ham alan konumları ve fiziksel PDF sayfalarını içerir. Seçilmiş aynı kat/ad eşleşmelerinde:

| Kaynak | Native-labelled G/Q tf/m² | Basılı plan p1 G/Q tf/m² |
|---|---|---|
| MS1 D1, ASANSÖR MAK.DAİRESİ |1.5/0.5|1.5/1.0|
| MS2 D7,3.KAT |0.545/0.5|0.545/0.2|
| SK D01, ASANSÖR MAKİNA |1.5/0.5|1.5/1.0|

Basılı beton birim ağırlığı2.5tf/m³ ve fayans0.170tf/m² ile `.15×2.5+.170=.545` olağan15cm döşemede G'nin öz ağırlık içermesiyle uyumludur. Bu **çıkarımdır**, bütün native ailelerin alan/serializer sözleşmesini kanıtlamaz. İlk çatı kayıtları20cm'dir; G1.5 değeri60cm radye öz ağırlığı diye yorumlanamaz. Üç Q farkının parser alan anlamı, kimlik veya revizyondan hangisine ait olduğu çözülmedi; kesin revizyon farkı iddia edilmez. Bu nedenle `native_decoded` yükler yeni ledger'a otomatik kabul edilmez. Açık kullanıcı girdisiyle doğrulanmış semantik, ham native gözleminden ayrıdır.

## Kullanım ve doğrulama

`node --import tsx scripts/hsyncad/export-analysis-input.ts --model <proje.hsyncad> --loads <parcalar.json> --output <yeni-mutlak-yol.json>`

Çıktı girdi hashlerini, geometri/çerçeve/malzeme/ayar/yük/kütle ve bütün engelleri saklar. Kaynak hashleri provenans içindir; yalnız başlık değişimini de yakalayan bu hashler sayısal analiz önbellek anahtarı diye kullanılmaz. Aynı girdinin iki çıktısı byte düzeyinde eşleşir. Exit0 yalnız giriş profili hazır, exit2 engelli diagnostic, exit1 geçersiz veri/çıktı hatasıdır. Var olan dosya üzerine yazılmaz. UI/eski motor bu aşamada yeni hattı kullanıyor diye sunulmaz; P06 bağımsız numerical backend, P17 uçtan uca kullanıcı bağlama aşamasıdır.

13 domain testi geçti, atlanan0. İlgili lint geçti. CLI hazır/tekrar0, eksik malzeme2, üzerine yazma1 senaryoları beklenen sonuç verdi; iki hazır JSON aynı. Genel tsc552mevcut tanıyla başarısız, yeni hata imzası0; build/browser/bina solver'ı/kurum PDF yapılmadı. Ayrıntı TASKS/TEST_MATRIX ve `asama-05` kanıtındadır. Özgünler korunur; commit/push/deploy yok. P06 ancak sonraki kullanıcı devam komutuyla başlar.
