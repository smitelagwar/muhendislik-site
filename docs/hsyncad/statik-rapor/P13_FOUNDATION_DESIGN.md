# P13 — Temel teması ve raft FE tasarım altyapısı

6 Kasım 2026. Bu teslim P06 ortak doğrusal çubuk/kabuk solver'ı üzerinde sınırlı bir temel hesabı çekirdeğidir. `engineeringAcceptance=false`, `analysisApproved=false`; native MS1/MS2/SK eşdeğerliği veya tam P13 kabulü değildir.

## Uygulanan katman

- `foundation-contact.ts` rol seçimini (`footing`, `strip_footing`, `raft`), rol bazlı kriter/deprem tercihini, `qt` tasarım dayanımı ile izin verilebilir gerilmeyi ayrı tutmayı, imzalı dikdörtgen rijit temel basınç zarfını ve P06'nın çekme taşımayan Winkler temel seçeneğini sağlar. Yalnız `qt` veya yalnız izin verilebilir gerilme girilmişse esas belirlenir; ikisi birden mevcutsa açık seçim olmadan karşılaştırma kapalıdır. Öz ağırlık ve örtü yükü için kaynak ve açık sıfır değeri gerekir.
- `foundation-model.ts` gerçek Q4 kabuk alanlarından nodal tributary alanlarını çıkarır; ks toplam yay rijitliği ağ sıklaştırmasında korunur. Beton öz ağırlığı ve zemin örtüsü basıncı kabuk yüküdür. Üst yapı alt modeli reaksiyonları işaret korunarak ve alan ağırlığıyla düğümlere aktarılır. Büyütülmüş ayak izi için `h` referans boyu ve kaynağı açıktır; yerel/native `0.5h` davranışı kanıtlanmış gibi sunulmaz.
- `foundation-design.ts` P06 modeli çalıştırır. `interaction` seçimi `shared_model` (üst yapı çubukları ve radye aynı model) ile `raft_submodel` (kaynaklı kesit reaksiyonları bir kez uygulanır) arasındaki sınırı belirler. Her iki model de basit Winkler zemin temasını çözer. Alt model, üst yapı geri etkileşimini temsil ettiğini iddia etmez; ortak modelde etkileşim kapalıysa sessizce sabit tabana dönmek yerine blocked olur. Proje/revizyon/yük durumu/reaksiyon kimliği uyuşmazlıkları reddedilir. Temel öz ağırlık, örtü ve mevcut kabuk basınçları aynı yük kombinasyonuna kaynaklı katsayılarla bağlanır. Sonuçta çözülen modelin temel girdilerinden ayrıca deterministik kimlik üretilir.
- `foundation-fe.ts` gerçek P06 kabuk `K*u-f` kuvvetlerini çıkarır, ağı kesen gerçek düğüm kenarındaki imzalı kesme/momentleri toplar, punching konturundaki `Fa`'yı güncel Winkler basıncı ve kontur içindeki imzalı düşey kabuk yükünü hücre hücre entegre ederek üretir. P12 iç kolon punching kapasitesine, kaynak kimlikli gerçek kolon kuvvetiyle bağlanır. 1 m şerit moment ekranında P09 `beamCapacity` gerçek bar koordinatlarını kullanır; çıktı yalnız kapasite taramasıdır.

## Sınırlar ve kontrol kapıları

- `qmin/qavg/qmax` dikdörtgen tekil/sürekli temel profilinde doğrusal rijit basınç dağılımıdır. Bu hesap kısmi temas çözmez; uplift görünür kalır. Ortalama kriterin hangi geoteknik limit halinde normatif olarak kullanılabileceği bilinmiyor. Kriter seçilse bile karşılaştırma `review-required` kalır.
- Radye `qmin/qavg/qmax`, basınç teması aktif P06 düğüm basınçları ve mesh alan ağırlıklarından gelir. Temas kaybı ayrı düğüm kimlikleriyle raporlanır. Birim basınç polygonundan radye FE talebi uydurulmaz.
- Yerel Winkler deplasmanı zemin oturması olarak adlandırılmaz; farklı/toplam oturma, sıvılaşma, taşıma gücü faktörleri ve depremli dayanım koşulları bu aşamada çözülmemiştir. Genel `1.5` artış uygulanmaz.
- Üst yapı ile radye tek ortak P06 model olarak çözülebilir; alt modelde imzalı reaksiyon aktarımı ayrı bir yol olarak vardır. Gerçek native mesnet/kolon/perde yük paketi henüz bağlanmadı. Büyütülmüş bağlantının shared-model DOF/mesh eşdeğerliği doğrulanmadığı için açık engel olarak kalır.
- Gerçek shell kesit kesmeleri elde edilir. TBDY 7.11.7 helper'ı yalnız kaynaklı `fctd`, G+D·E yük tabanı ve gerçek destek yüzünden tam `d/2` konumuna uyarsa FE punching gerilmesi kıyaslar; bu TS 500 8.1 genel tek yön kesme hesabı değildir. P12 punching yalnız iç dikdörtgen kolon çevresinde çalışır ve `Fa`'yı gerçek Winkler nodal basıncı ile kontur içindeki düşey kabuk yükünden üretir. Tam `(B+d)×(L+d)` kontur Q4 ağıyla örtüşmelidir; delik/mesh hücresi eksikse kapasite kontrolü yapılmaz. Destek kimliği, merkez, gerçek kesit boyutu ve `d < actual shell thickness` kontrol edilir. Kenar/köşe/perde ucu/yakın boşluk açık kalır. P06 cut force'larının temel X/Y üst-alt yüzlerine eşlemesi, gerçek donatı kesim/kenetlenme, tam plaka tasarımı, TS 500 tek yön kesme, shared-model punching cut extractor ve gerçek native kuvvet aktarımı eksiktir.
- Model/run kimliği, yalnız kullanıcı metni değildir: giriş paketindeki model-revizyon-yük durumu, reaksiyon kaynak kimliğiyle eşleştirilir; çözülmüş P06 temel model fingerprint'i ayrıca üretilir. Fingerprint kimlik bütünlüğü yardımcısıdır, kriptografik hash değildir.

## Test ve kanıt

Odaklı test dosyaları:

- `tests/hsyncad-structural/foundation-contact.test.ts`
- `tests/hsyncad-structural/foundation-fe.test.ts`
- `tests/hsyncad-structural/foundation-design.test.ts`

MS1 sınır girdileri için `55 tf/m² → 539.36575 kPa` ve `3,080 tf/m³ → 30,204.482 kN/m³` birim dönüşümü uygulanır. TBDY 7.11.7 metni yerel kaynak dökümünde doğrulanmıştır: `asama-12-14/TBDY-157.txt`–`TBDY-158.txt`; resmi metin Resmî Gazete'de okunabilir. Sentetik raft bağımsız yük/mesh girdisidir; native proje cevabı değildir.

Kanıt klasörü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-12-14\p13`.

Son hedefli koşular bu oturumda `scripts/hsyncad/run-owned-command.mjs` ile çalıştı; toplam **14/14 geçti, skip 0**:

- contact `4/4`: `foundation-contact-final1/result.json` ve `stdout.log`.
- FE `5/5`: `foundation-fe-final1/result.json` ve `stdout.log`.
- raft/P12 `5/5`: `foundation-design-final1/result.json` ve `stdout.log`.

Başarısız ön koşular da korunmuştur: wrapper çıktı klasörü önceden yaratıldığı için `test-contact-run1`/`test-fe-run1` EEXIST ile açılmadı; `foundation-contact-run2` kötü kurulmuş eksik-girdi assert'iyle `3/4`, `foundation-fe-run4` iki yanlış beklenen sayıyla `2/4`, `foundation-design-run6` eski Fa değişken adıyla `4/5`, `foundation-design-run8` ve `run9` ise sırasıyla kontur alanı ve boşluklu kesit fixture'ı nedeniyle başarısız oldu. Fixture/hesap kapısı düzeltildikten sonra yeni kanıt klasöründe yeniden çalıştırıldı; bu loglar PASS sayımına dahil değildir. Kod tip denetimi/lint ve tüm P06/P07 tam regresyon paketi bu alt ajan tarafından çalıştırılmadı; koordinatörün cross-module testleri ayrı kayıttadır.

Normatif bağlam için yerel referans paketi `asama-12-14/TS500-53.txt`–`TS500-58.txt` ve `TBDY-157.txt`–`TBDY-158.txt` incelendi. TBDY 7.11.7, kirişsiz plak temellerde sonlu eleman düşey kesme gerilmesine ve kolon/perde yüzünden `d/2` konumuna açık referanstır. Güncel resmi yönetmelik kaynağı [18 Mart 2018 Resmî Gazete TBDY metnidir](https://resmigazete.gov.tr/eskiler/2018/03/20180318M1-2.htm). Bu inceleme bütün tadil ve limit durum yorumlarının normatif kabulü değildir.
