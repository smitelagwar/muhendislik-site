# P12–P14 — koordinatör incelemesi ve bütünleşik doğrulama

6 Kasım 2026. Kullanıcının açık talebiyle üç alt ajan, ayrı ayrı `gpt-6-luna` / `high` ayarıyla başlatıldı. Üç model seçimi çağrısı araç tarafından kabul edildi; model değiştirilmedi. CLI üzerinden model/görev gönderilmedi. Koordinatör kodu ve hesap yöntemlerini doğrudan inceledi, bulguları ilgili ajana gönderdi ve bağımsız karşı testlerle düzeltmeleri yeniden doğruladı.

**Sonuç:** aşağıdaki sınırlı hesap profilleri uygulanıp doğrulandı. Ana plandaki 12–14 kapsamının bütünü kapanmadı; bu aşamalar tam kabul açısından kısmi tutulur. Genel bina/native/mühendislik kabulü yoktur. Aşama15 başlatılmadı; commit/push/deploy yapılmadı.

## Görev ve bağımlılık düzeni

| Sorumlu | Tek yazma alanı | Bağımlılık ve teslim |
|---|---|---|
| P12 ajanı | Yeni `slab-*`, `punching-shear.ts`, kendi testleri ve P12 belgesi | P06/P09 salt okunur; iç kolon zımbalaması önce koordinatörce doğrulandı, ardından P13 kullanımına açıldı |
| P13 ajanı | Yeni `foundation-*`, kendi testleri ve P13 belgesi | Temas/ayarlar/P06 bağımsız geliştirildi; P12 zımbalama bağlantısı doğrulanmış arayüzden sonra tamamlandı |
| P14 ajanı | Yeni `stair-*`, kendi testleri ve P14 belgesi | Parametrik geometri/yük/şerit hesabı bağımsız; güncel reaksiyonlar koordinatör testinde P13'e aktarıldı |
| Koordinatör | Ortak durum/kayıtlar, bütünleşik test ve kapanış denetimi | Ortak dosyalar ajanlara verilmedi; önceki kaynaklarda eşzamanlı düzenleme yapılmadı |

Sentetik fixture'lar test klasöründedir; üretim modülleri bu fixture'ları kullanmaz. Alt ajanların “tamamlandı” beyanı kabul yerine geçmedi. Ayrıntılar [P12](P12_SLAB_DESIGN.md), [P13](P13_FOUNDATION_DESIGN.md), [P14](P14_STAIR_DESIGN.md) belgelerindedir.

## Düzeltilip tekrar sınanan bulgular

- Döşemede ters çalışma yönü, oran=2 sınırı, signed basınç/kayma, D etkisi, çekmede beton katkısının yanlış düşülmesi ve `0.65√fck` sınırı düzeltildi. Kabuk dönüşümünde aynı ötelemenin üç eksene kopyalanması ve rijitlik çarpanlarının unutulması, bağımsız döndürülmüş elastisite patch testiyle yakalandı. Perde aktarımında sol/sağ donatının iki kez sayılması giderildi.
- Zımbalamada yakın boşluk çevreyi kesince radyal gölge kapısının atlanması, sahte dikdörtgen, dışmerkezlikte eksik karekök, net kuvvet cebri ve çalışma zamanı hatası giderildi. İç dikdörtgen kolon profili doğrulandı; kenar/köşe/perde ucu/yakın boşluk kapasitesi uygun sayılmadı.
- Temelde gizli varsayılanlar, qt/izinverilen esas çatışması, sıfır/NaN limit, eksik basıncın sıfır sayılması, eksik kesit aralığı, çift üst yapı yükü, birleşim katsayısız öz ağırlık ve zımbalama çevresi içi aşağı yüklerin unutulması düzeltildi. Gerçek kolon/çevre/ağ/d derinliği ve revizyon eşlemesi eklendi. Üst yapı etkileşimi kapalıyken zemin yaylarının kaldırılması önlendi.
- Merdivende çift sahanlık hacmi, üçgen basamak ağırlık merkezi ve reaksiyonları, yanlış etkili yükseklik, tam genişlik/birim şerit karışması, metre/mm sehim hatası, eksik sahanlık yükü ve eksik N–M/kesme kontrolleri düzeltildi. Yalnız revizyon yazısına dayanan önbellek yerine gerçek geometri içerik parmak izi karşılaştırılır. Eksenel etkili eğik kol servis hesabı uygun gösterilmez.

İlk başarısız testler, ara API uyum hataları ve TypeScript/lint bulguları kendi loglarında saklıdır. Sayısal hedefler başarısız sonuçlara uydurulmadı.

## Son doğrulama

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-12-14`.

| Koşu | Gerçek sonuç |
|---|---|
| `final-domain` — sahip olunan runner, sıralı test süreçleri, 300 s bütçe | 201/201, fail/skip0; yaklaşık86 s. Önceki147 + P12:14 + P13:14 + P14:15 + koordinatör:11 |
| `review-regressions-after` | 11/11 bağımsız inceleme/bütünleşim testi; fail/skip0 |
| `final-lint-02` | ESLint `--max-warnings 0`: exit0, sıfır uyarı |
| `final-app-types-02` | `tsc --noEmit --incremental false -p tsconfig.next.json`: exit0 |
| `final-general-types` | Genel tsc exit2: 552 eski tanı, yeni/çıkan imza0; PASS değildir |

Gerçek merdiven ULS reaksiyonları, ayrıca tanımlanmış iki mesnet eşlemesiyle P13 radye alt modeline bir kez aktarıldı. Temel öz ağırlığına da aynı açık 1.2G katsayısı uygulandı. Sahanlık kalınlığı300→400mm mutasyonunda qortalama23.7→26.7kPa; FE kuvvet/moment dengesi korundu. Bu sentetik ara yüz kıyasıdır; native binanın global hesap kabulü değildir.

P12 gerçek yüklenmiş P06 ağlarında 4/8/16/32/64 çözümü yaptı. 16→32 Mxy farkı%2.543 ile %1 hedefini geçmedi. Varsayılan2M seyrek faktör bütçesinde64 ağı `resource_limit` verdi. Açık8M benchmark bütçesiyle32→64 Mx/My farkı%0.174, Mxy%0.787;64 ağ Navier sehim farkı%0.004115 oldu. Genel solver bütçesi değiştirilmedi; tolerans gevşetilmedi. `slab-convergence.json` kapanış denetiminden üretilir.

Koordinatör10 kaynak sayfasını render edip görüntüden inceledi; kaynak/render hash'leri `source-manifest.json` içindedir. Resmî tadil zinciri kabulü verilmedi. Yeni UI/browser/build/Linux/Worker/ideCAD/REA/native proje/nihai birleşik PDF koşusu yapılmadı. Önceki somut REA kanıtları korundu; yeniden koşulmuş sayılmadı.

## Tam kabul için kalan işler

- P12: genel iki doğrultu/Mxy etkileşimli donatı tasarımı, bant/kirişsiz profiller, çatlak rijitliği iterasyonu/genel2D servis; kenar/köşe/perde ucu ve yakın boşlukların gerçek normatif zımbalama çevreleri; bütün bina yük/donatı/aktarma kapsamı.
- P13: gerçek X/Y üst-alt/ilave donatıya normatif kesit-yüz eşlemesi ve tam detay; TS500 tek yön kesme, ortak modelde gerçek kolon kesit kuvvetiyle zımbalama; büyütülmüş ortak bağlantı DOF eşdeğerliği; geoteknik limit uygulaması ve oturma/sıvılaşma gibi ek kapsam. Yerel Winkler deplasmanı geoteknik oturma değildir.
- P14: eğik kol eksenel etkili servis/ikinci mertebe; sürekli/monolitik kol-sahanlık veya2D plak etkileşimi, gerçek global rijitlik bağlantısı, native fiziksel aile eşlemesi ve3B katı kesişimi.
- Üçünde native MS1/MS2/SK alan/revizyon/malzeme/yük/donatı kabulü ve genel mevzuat doğrulaması açık. Etüt PDF zorunlu yapılmadı. Yeni ayar ekranına proje değerleri otomatik güvenli varsayım olarak konmadı.

Bu açık hesaplar varken tam12–14 veya genel bina uygunluğu yazılmaz. Aşama15 bu çalışmanın kapsamında başlatılmadı. `TASKS.json` ve ortak çalışma kaydı bu ayrımı korur. Son kaynak/özgün dosya/HEAD denetimi `preservation-and-closure.json` içindedir.
