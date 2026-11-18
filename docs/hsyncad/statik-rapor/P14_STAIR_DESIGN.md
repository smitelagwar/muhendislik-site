# P14 — Parametrik merdiven kolları ve sahanlıklar

6 Kasım 2026. Bu çalışma açık girdili, basit mesnetli tek doğrultulu şerit profilini ekler. Parametrik geometri, yüklerin şeride aktarılması, seçili donatı ve yerel kontroller aynı fiziksel aile/revizyonda tutulur. **Bina/genel mühendislik kabulü değildir:** tüm çıktılarda `engineeringAcceptance=false`, `analysisApproved=false` kalır.

## API ve geometri

- `stair-geometry.ts` her aile için fiziksel kimlik, başlangıç/ara/bitiş kat kotları, rıht/basamak sayısı ve ölçüleri, genişlik, eğik bel kalınlığı, sahanlık açıklığı/kalınlığı, açık beton birim ağırlığı ve gerçek iki mesnet kimliği ister.
- Rıht toplamı, kayıtlı kat kot farkıyla eşleşmezse geometri reddedilir. Basamak sayısı bu profilde rıht sayısına eşittir. Uçuş bel plağı kapalı eğik prizma olarak; basamak ek hacmi her tread aralığındaki üçgen kama olarak hesaplanır. Sahanlık yalnız bir dikdörtgen prizma hacmi taşır; bel ve sahanlık hacmi birbirine eklenerek çift sayılmaz.
- Üçgen kama öz ağırlığı her basamakta doğrusal değişen yayılı yük olarak çözümlenir. Mesnet reaksiyonları bu dağılımın birinci momentinden gelir; uçuş basamak ağırlığı iki mesnete eşit paylaştırılmaz. Tüm bileşenlerin katı/düşey yük dengesi ayrıca kontrol edilir.
- Native ağ kimlikleri referanstır; parametrik hacim/donatı toplamına eklenmez. Fiziksel aile kaydı ve native temsil kaydı için `validateStairFamilyRegistry` yinelenmeyi yakalar. Yerel incelemede native 7/1/9 merdiven kayıtlarının hangi fiziksel ailelere ait olduğu yeniden çözülmedi; bu adetler tasarım ailesi sayısı kabul edilmez.
- Bileşen katılarının çakışmadığına ilişkin kaynaklı `disjointSolids` beyanı zorunludur. API yerleşim koordinatları/açık 3B sınır hacimlerinden kesişimi kendisi test etmez; bu beyan ayrıca geometri doğrulaması yerine geçmez. Kaynak geometri açık değilse miktarlar onaylı net metraj sayılmaz.

## Yük ve yerel hesap profili

`stair-design.ts` basit mesnetli uçuş/sahanlık şeritlerinde aşağıdaki yükleri alır:

- Bel plağı ve sahanlık öz ağırlığı parametrik hacimden; basamak kamaları gerçek üçgen dağılımdan türetilir.
- Kaplama/diğer kalıcı yük ve hareketli yük için değer ile yatay izdüşüm/eğik yüzey temeli zorunludur. Eğik alandan yatay izdüşüme `1/cos(θ)` dönüşümü uygulanır.
- Her ULS birleşimi kendi kaynak ve G/Q katsayılarıyla girilir. Hiçbir kombinasyon ilk 10 ile kırpılmaz. Servis toplam, kalıcı ve hareketli durumları ayrı kurulur; sürdürülen Q katılımı kullanıcı girdisidir.
- Düşey yük diyagramı yatay izdüşüm boyunca çözülür; eğimli uçuşta yerel normal kuvvet/eğilme ve imzalı eksenel kuvvet `N(x)=V_vertical(x) sin(θ)` olarak korunur. Bütün yük durumlarındaki eylem noktalarında 1 m şerit için TS 500 §7.1 beton basınç bloğu/çelik uyumu, minimum asal donatı ve seçili gerçek çubuk alanı denetlenir.
- İki mesnet için kesme, gerçek mesnet yüzünden faydalı yükseklik uzaklığındaki kesitte kontrol edilir. Beton katkısı `0,8 Vcr` ile sınırlıdır; kesme donatısı katkısı varsayılmaz. Bu sınırı aşan şerit tasarlanmamış/başarılı gösterilmez.
- TS 500 §11.2.2–11.2.3 kapsamında: tek doğrultulu basit mesnet kalınlığı `max(80 mm, yatay açıklık/25)`, net örtü en az 15 mm, S420/S500 asal donatı oranı en az 0,002, asal aralık en çok `min(1,5h, 200 mm)`, dağıtma donatısı asal donatının en az beşte biri ve aralığı en çok 300 mm. Mesnet yüzünden itibaren kenetlenme çıkıntısı en az 150 mm ve TS 500 §9.1.2 uzunluğu ile karşılaştırılır.
- Servis sehim/çatlak hesabı seçili çubuklarla çatlamış kesit rijitliğini ve gerçek parçalı doğrusal yük/moment diyagramını kullanır. Sehim, çatlak gerilmesi ve çatlak genişliği ilgili TS 500 §13 sınırlarıyla verilir. Sayısal eğrilik integrali 10 mm hedef aralıklı ve 20.000 istasyon sınırındadır.
- Destek reaksiyonları bileşen ve fiziksel mesnet kimliğine göre gruplanır; bir çift uçuş ve ara sahanlık aynı mesnet kimliğinde üst üste toplanır. Çıktıda G/Q ve her ULS birleşiminin reaksiyonu, kat kimliği ve denge artığı bulunur.

## Analiz snapshot ve geçerlilik

Girdi; model revizyonu, rijitlik seti, geometri revizyonu, analiz damgası ve tam kanonik JSON geometri parmak izi taşır. Parmak izi fiziksel geometri girdisinin sıralı dizilerini korur ve nesne anahtarlarını kanonik sıralar; fiziksel parametre değişikliği, revision string'leri unutulsa da global snapshot eşleşmesini bozar ve `rebuild_required` üretir. Bu aşama global solver'a merdiven elemanı veya kabuk eklemez; gerçek reaksiyonları ve geçerlilik kapısını üretir. Eski global analiz sonucunu güncelmiş gibi işaretlemez.

## Sınırlar ve kabul durumu

- Eğik uçuşlarda ULS eksenel-eğilme etkileşimi bütün eylem istasyonlarında kontrol edilir. Buna rağmen servis çatlamış kesit rijitliğinde eksenel etki/P-Delta hesabı yoktur; `service-axial` `requires_engineering` üretir. Bu nedenle eğik uçuş `local_review_ready` durumuna geçemez.
- Sürekli uçuş-sahanlık monolitik çerçeve etkisi, iki doğrultulu plak/kabuk dağılımı, depremde merdiven etkileşimi, küresel modele otomatik entegrasyon, sıcaklık/büzülme kısıtı, tam üretim kesim listesi, native dosya eşlemesi ve PDF/UI/Worker kabulü desteklenmiyor.
- Mesnetler dikey tepkiyi taşıyan basit destek profili olarak modellenir. Gerçek yatay mesnet/itki, bağ rijitliği veya monolitik süreklilik çözülmez. Kaynak/native G-Q semantiği kendiliğinden hesap yüküne çevrilmez.
- Landing profili, bütün yerel kontrolleri sağladığında `local_review_ready` olabilir; bu adlandırma yalnız yerel şerit incelemesine aittir. Hiçbir sonuç mühendis imzası, bina uygunluğu veya kurum kabulü değildir.

## Bağımsız doğrulama ve kanıt

Testler uygulama fonksiyonunun kendisini oracle olarak yeniden çağırmaz:

- 2×2×0,3 m landing: kapalı form hacim `1,2 m³`, birim ağırlık 25 kN/m³ ile `30 kN`; öz ağırlık mesnet tepkileri 15/15 kN.
- Landing G/Q: 30 kN öz ağırlık + 3 kN kaplama + 12 kN hareketli yük = 45 kN; servis tepkileri 22,5/22,5 kN. ULS açık test katsayılarıyla iki destek tepkisi 29,4 kN, bir metre şerit talebi 7,35 kNm/m.
- Çatlamamış landing için sehim `5qL⁴/(384EcIg)` bağımsız kapalı formuyla %1 tolerans içinde kıyaslanır.
- Flight bel hacmi, basamak üçgen kama hacmi, basamak ağırlık merkezinden gelen asimetrik uçuş tepkileri, kot uyumu, fiziksel/native aile yinelenmesi, ara sahanlık destek dengesi, eğik/yatay yük alanı dönüşümü, snapshot geçersizliği, eksik yük ve donatı sınırı karşı durumları sınanır.

Güncel hedefli koşu (`scripts/hsyncad/run-owned-command.mjs` gözetimi altında): `node --import tsx --test tests/hsyncad-structural/stair-geometry.test.ts tests/hsyncad-structural/stair-design.test.ts` — **15/15 geçti** (yeni fiziksel geometri değişti/revision string'leri sabit mutation case'i dahil), `stair-domain-test-06/stdout.log`; çıkış 0. Sahip olunan kaynak/test dosyalarında ESLint `--max-warnings=0` — **0 uyarı/hata**, `stair-lint-04/result.json`; sıkı izole TypeScript derlemesi (`--strict --module ESNext --moduleResolution bundler`) — **çıkış 0**, `stair-typecheck-04/result.json`. Önceki `stair-domain-test-05`, `stair-lint-03` ve `stair-typecheck-03` fingerprint değişikliğinden öncedir ve güncel kabul yerine kullanılmaz. İlk `moduleResolution node` denemesi yalnız mevcut `ide-zlib.ts`/`three/addons/libs/fflate.module.js` çözümlemesinde başarısız oldu; başarılı derleme bundler çözümleyicisiyle yenilendi. Yerel P13 cross-module denemesi koordinatörün entegrasyon kaydında izlenir.

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-12-14\p14`. Girdi kaynak: `asama-09\TS500_CU.pdf`; özellikle basılı sayfa 29–30 (8.1 kesme), 48–49 (§11.2 tek doğrultulu plak), 62–63 (§13 kullanılabilirlik). Bu P14 turunda gerçek native dosya/ideCAD, global bina solver, browser, Worker, production build, birleşik PDF veya üretim metrajı çalıştırılmadı. Gerçek native merdiven aile eşlemesi ve eğik uçuş servis eksenel etkisi açık kalır.
