# Referans kapsamı — Aşama 01

5 Kasım 2026. Bu dosya referans dosyalarının izlenebilir kapsamını gösterir; Hsyncad hesap/metraj eşdeğerliğinin kabulü değildir.

Üç kaynak raporun **içindekilerindeki bütün 515 başlık** ayrı satır kimliğiyle kataloglandı. Her başlığın hedefi rapor gövdesinin gerçek basılı sayfa altlığı üzerinden fiziksel sayfaya eşlendi; başlık metninin hedefte bulunması doğrulandı. MS1/MS2/SK'de basılı ve fiziksel sayfa eşlemesi sırasıyla 606/311/954 sayfanın tamamında bire bir. Aynı başlıklı modal alt setler ve merdiven aileleri tekilleştirilmedi. Gövdede olup içindekilerde bulunmayan tali tablo başlıklarının/captionların eksiksiz kataloğu iddia edilmez.

| Kaynak | İçindekiler başlığı / hedef eşleşmesi | Metraj satırı | Sayısal satır | Basılı aritmetik kontrolü |
|---|---:|---:|---:|---:|
| mustafa-1 | 192 / 192 | 107 | 89 | 192 |
| mustafa-2 | 164 / 164 | 90 | 75 | 159 |
| suheyla | 159 / 159 | 137 | 116 | 223 |

Bütün metraj kat başlıkları, eleman türleri, çap hücreleri, ince/kalın grupları, kat/genel toplam ve beş özet satırı kaynak sayfa/satır kimliği ve özgün metinle korunur. 334 satırın 280'i sayısaldır; her sayısal kaynak satırının tam bir kez aktarımı ayrı testle denetlenir. Hücrede basılı sayı ile boş hücre ayrıdır. Birimler m²/m³/kg olarak kaynak incelemesinin ölçüm anlamına dayanır; kaynak tablolarda birim etiketinin her satırda yazılı olduğu iddia edilmez.

Basılı rakamlar `Decimal` ile toplanır; bir sayının son basamağının yarısı kadar yuvarlama aralığı saklanır. Aralıkların uyuşması sadece basılı tablo aritmetiğini açıklayabilir; gerçek ham native toplamın veya yapısal hesabın doğruluğunu kanıtlamaz. Toplamı tutturmak için hiçbir geometri/donatı ölçeği veya sonuç değişikliği uygulanmadı. 574 aritmetik kaydında aralık uyuşmazlığı yok; sıfır olmayan farklar JSON'da korunur.

| Basılı alt toplamların farkı | MS1 | MS2 | SK |
|---|---:|---:|---:|
| Kat kalıp toplamları − basılı genel toplam, m² | -0.01 | 0.00 | 0.01 |
| Kat beton toplamları − basılı genel toplam, m³ | 0.001 | 0.001 | -0.001 |
| İnce + kalın − basılı donatı toplamı, kg | 0.01 | 0.00 | 0.00 |

Katalogdaki `family` ve `plannedStages` alanları yayın düzeni için editoryal eşlemedir; yönetmelik uygulanabilirliği veya tam yaprak madde kapsamı değildir. Kural kaynağı ve destek durumu ayrıca CODE_COVERAGE/CAPABILITY_MATRIX içinde tutulmalıdır.

| Editoryal aile | MS1 | MS2 | SK | Plan aşamaları |
|---|---:|---:|---:|---|
| beams | 12 | 12 | 13 | P09 |
| columns | 3 | 3 | 13 | P10 |
| foundations | 12 | 10 | 9 | P06, P13 |
| geometry | 7 | 6 | 8 | P04, P05 |
| global-analysis | 97 | 97 | 47 | P06, P07, P08 |
| joints | 3 | 3 | 4 | P10 |
| model | 4 | 4 | 4 | P03, P05 |
| slabs | 11 | 10 | 11 | P12 |
| stairs | 28 | 4 | 36 | P14 |
| walls | 15 | 15 | 14 | P11 |

Her kaynak için ayrı `.input.json` ve `.expected.json` vardır. Input fixture yerel native dosyanın hash'ini ve eksik alan listesini taşır; **çalıştırılabilir, tamamlanmış yapısal model değildir**. Malzeme/yük anlamı/ayar/boşluk/rol/donatı/güncellik unknown kalır. Expected fixture yalnız basılı kaynak çıktısıdır. Üretim modüllerine import edilmez. MS1 yedi, MS2 bir ve SK dokuz `MERDİVEN GENEL BİLGİSİ` girişi ayrı kimlikle doğrulandı; bu sayılar native nesne sayısı varsayımı değildir.

Yerel özel çıktı kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-01\corpus`.

- `reference-section-catalog.json`: 515 başlığın tümü, hedef/satır kimlikleri ve kaynak PDF/metin SHA-256.
- `mustafa-1.input.json`, `mustafa-2.input.json`, `suheyla.input.json`: kaynak kimliği ve unknown girdiler.
- Eşlenik `.expected.json`: bütün metraj satırları/hücreleri, hassasiyetler ve basılı aritmetik kayıtları.
- `corpus-audit.json`: proje bazlı kapsam sayıları; yapısal karşılaştırma `not_run`.

Yeniden üretim: `scripts/hsyncad/build_reference_corpus.py --source <plan-kanit-koku> --output <yeni-ozel-klasor>`. Mevcut çıktı klasörünün üstüne yazmaz. Kaynak PDF/native kimlikleri manifestle doğrulanır; PDF metni tekrar çıkarılmaz.

Güncel doğrulama: `tests/hsyncad-structural/test_reference_corpus.py --source <plan-kanit-koku> --corpus <corpus-koku>` 10/10 geçti. Negatifler: yinelenmiş sayfa altlığı, hedefte başlık yokluğu, bilinmeyen sayısal tür, eksik çap başlığı ve yuvarlamayla açıklanamayan toplam; pozitifler: bütün kaynak satırları, yinelenen başlıklar, SK Ø14/Ø16 radye hücreleri ve 0/bilinmeyen ayrımı. Bounded runner kanıtları `asama-01/corpus-build/result.json` ve `asama-01/corpus-tests/result.json`; ham stdout/stderr aynı klasörlerde. Bunlar ürün solver, native mühendislik importu veya yeni PDF testi değildir.

## P07 kaynak ve oracle sınırı

TDMD barındırmalı416sayfalık teknik ek kopyasında14ilgili sayfa Poppler görüntüsünden incelendi;SHA ve kaynak denemeleri asama-07/source-manifest.json içindedir. Bu seçili yöntem/denklem doğrulamasıdır,değişiklik seti veya tüm standart kabulü değildir.792düğümlü sentetik modelde19mod çıktı;MS1=6/SK=15sayısına ayar yapılmadı. SDOF/iki kat/2×2burulma oracle'ları mekanikten hesaplandı;sabit native sonuçlar kullanılmadı. Üç gerçek dosyanın native kabulü hâlâ açıktır.

## P08 kaynak sınırı

Özgün teknik ek PDF'nin BKS/DTS/BYS,bodrum,Tablo3.6,Tablo4.1,sistem/perde bağlılık,Rayleigh,drift/ikinci mertebe/derz ve4.10 aktarımına ilişkin24sayfası görüntüden incelendi;asama-08/source-manifest kaynak ve görüntü SHA'larını tutar. Metin/denklem sınır farkı otomatik uygunluğa çevrilmedi. MS1 A13/R değişimi ve SK A15/R7/bağlı perde yalnız kaynaklı kural senaryosu;native mühendislik girdisi kanıtlanmadığından gerçek proje sonucu regresyonu yapılmadı. Örnek referans metraj/rapor sayısı hiçbir sayısal oracle olmadı. Tadil seti ve tam normatif kabul açık.

## P09 kaynak/örnek durumu

Çukurova Üniversitesi sunucusundan özgünTSE TS500/Şubat2000kopyası81sayfa alındı,SHAasama-09/source-manifest'te. TS50026sayfa veTBDY5sayfa görüntüden incelendi;T1/T2ilgili metinleri okundu,tüm tadil zinciri kabul edilmedi. Tablo/k1/fctk/Ec vegeometri/donatı/kesme/burulma/ankraj/lap/servis kaynak sayfaları sürümlüdür. Regresyonlar bağımsız analitik denge,sehim ve gerçekP06fixture'larıdır;nativeMS1/SKrapor sonucu sabit oracle değildir. Native donatı/kuvvet/revizyon alanları kanıtlanmadığı için gerçekörnek kiriş eşdeğerliği açık kalır. Önceki REArepo kanıtı korunur,yeniREAkoşulmadı.

## P10 kaynak ve gerçek proje sınırı

TS50081sayfalık CU ve TBDY416sayfalık TDMD kopyasından sırasıyla11/10sayfa görüntüden incelendi; asama-10/source-manifest.json orijinal/render SHA ve indisleri tutar. Kural kaynağı incelemesi SK native kolon/joint ayrıntı karşılaştırması değildir. P04/P05 mühendislik alanları/revizyon engeli sürer; bu kıyas yapılmadı. Resmî/tadil zinciri ve üç gerçek proje kabulü false. REA önceki somut kanıtları korundu, yeni REA koşusu yok.

## P11 kaynak ve karşılaştırma sınırı

Mevcut hash'li TBDY/TS500 PDF kopyalarından 11+5 sayfa render edilip görüntüden incelendi; indis/orijinal/render hash'leri `asama-11/source-manifest.json` içinde. Resmî tadil zinciri doğrulanmış sayılmaz. TBDY Denklem 4.28 için ΣAw*(0,2+L/H)^2 okuması kaynak görüntüsü ve bağımsız Ct testiyle düzeltildi. Kesit/lif/dengenin bağımsız oracle'ları ve ağ yakınsaması kullanıldı; MS1/SK sabit sonuçları oracle olmadı. Native alan/revizyon/malzeme/G-Q engelleri nedeniyle yeni gerçek proje kabulü yok. Önceki somut REA kanıtları korundu; bu aşamada yeni REA/native koşusu yapılmadı.

## P12–P14 bütünleşik kayıt — 7 Kasım 2026

Koordinatör10TBDY/TS500 sayfasını render edip görüntüden inceledi; kaynak/render hashleri asama-12-14/source-manifest.json içinde. Döndürülmüş elastisite patch, bağımsız sehim/zımbalama ve gerçek ağ yakınsaması kullanıldı. Native referans sonuçları oracle yapılmadı; resmî tadil zinciri/genel mevzuat kabulü verilmedi. Önceki REA kanıtı korundu, yeni REA/native koşusu yok.
