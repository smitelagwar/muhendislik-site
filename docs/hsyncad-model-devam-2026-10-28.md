# 28 Ekim 2026 — model ve bağlantı devam denetimi

Bu belge web uygulamasındaki kaynak kodu ve yeniden çalıştırılmış testleri anlatır. ideCAD çalışma anı davranışı veya statik hesap doğrulaması olarak okunmamalıdır. Önceki JSON araştırma arşivleri ve uygulama modelleri değiştirilmedi.

## Giderilen somut sorunlar

- Bir kolon/aks başka kata taşındığında eski kattaki elemanların nokta bağlantıları o kata ait olmayan kaynağı izliyordu; doğrulama işlemi reddediyordu. Kaynak başka kata geçerse eski katın bağlı düğümü son koordinatında kalır ve artık geçerli olmayan bağ ayrılır. Başka kata taşınan elemanın kendi eski kat bağları da ayrılır. Geçerli aynı kat bağları korunur. Döşeme çevresi gerçekten açılıyorsa mevcut atomik ret devam eder.
- Doğrusal kiriş/perde üzerinde oranla tanımlanmış düğüm, kaynak eğrisel yapıldığında artık geçerli bir doğrusal bağ değildir. Eski nokta korunur ve bağ ayrılır; eğri üzerindeki yeni bir parametrik ilişki varmış gibi davranılmaz.
- Kat kopyası, iç içe koordinat/kesit dizilerini artık kaynak katla paylaşmaz. Tam kat kopyasında bütün düğüm ve döşeme çevre kimlikleri yeni elemanlara yönelir. Kısmi kopya yardımcı işlevinde kopyalanmayan kaynağa ait bağ taşınmaz; döşemenin eksik çevre bağı ayrılıp mevcut geometrisi korunur. Arayüzdeki Kat Kopyala tam katı kullanır.
- Açılan JSON içinde bir döşemenin `boundary.elementIds` kayıtlarının var olması yeterli sayılmıyordu. Artık döşemenin kayıtlı poligonu, beton kot bandında aynı kaynaklarla kapanan gerçek alanla eşleşmelidir. Eski veya kaydırılmış poligon, açık çevre ve kot boşluğu yüklenmeden önce açık hata verir. Bağı açıkça ayrılmış köşeli döşemeler desteklenir. Kat/kot/kalınlık başına alan sonuçları aynı doğrulama sırasında önbelleğe alınır; köşe başlangıcı ve dolaşım yönü eşleşmeyi etkilemez.
- Düğüm bağları plan koordinatını belirler. Üst/alt kot değişince bağlı iki eleman arasında kesin düşey açıklık kalıyorsa ortak birleşim sonucuna açıklığın metre cinsinden büyüklüğünü belirten uyarı eklenir. Kiriş ucunda o ucun gerçek kotu kullanılır; eğimli kiriş yolunda da denetlenir. Normal kesişim hacmi bu uyarıyı üretmez; sadece yüzey teması da açıklık sayılmaz. Uyarı, net hacmin geometrik olarak hesaplanmasına engel değildir.

## Yeniden çalıştırılan doğrulamalar

Komut:

```powershell
node --import tsx --test src/lib/hsyncad/model.test.ts src/lib/hsyncad/integration.test.ts src/lib/hsyncad/workflow.test.ts src/lib/hsyncad/slab-level.test.ts src/lib/hsyncad/drafting.test.ts
```

**51 test başarılı.** Yeni kapsam: kat değişiminde eski bağın ayrılması, tam/kısmi kat kopyasında referans ve nesne bağımsızlığı, aks silinince düğümlerin serbestleşmesi, eğriselleşen kaynağın bağı, kayıtlı döşeme çevresi/kotu ve yatay/eğimli kiriş ucunda düşey açıklık teşhisi. Mevcut kapsamda aks → kolon → kiriş → bağlı döşeme hareketi, açılan çevrenin atomik reddi, silme, JSON dönüşü, eğimli/konkav katıların tek hacim paylaşımı, yakalama ve ölçüm korunur.

Değiştirilen domain dosyalarında ESLint ve `npx tsc -p tsconfig.next.json --noEmit --incremental false` başarılı. Ana görevde son arayüzle birlikte production build ayrıca doğrulanmalıdır.

Kalıcı araştırma arşivi içinde üst düzey `schemaVersion: 1` taşıyan **8 örnek model** mevcut doğrulayıcıyla yeniden açıldı. `bagli-calisma-ornegi.json`, `ara-kat-ornegi.json`, `bagli-yapi-ornegi.json`, `gelismis-ornek.json`, `olcum-referans-ornegi.json` ve üç eski denetim örneği geçerli. Tarayıcının kullanıcının kendi yerel kaydı bu kontrolde okunmadı/değiştirilmedi.

## Elle kontrol edilebilir metraj

| Tek eleman | Beton m³ | Brüt kalıp m² |
|---|---:|---:|
| 0,40 × 0,40 × 3 m kolon | 0,48 | 4,80 |
| 4 m boy, 0,25 × 0,50 m kiriş | 0,50 | 5,25 |
| 4 × 0,20 × 3 m perde | 2,40 | 25,20 |
| 4 × 4 × 0,15 m döşeme | 2,40 | 18,40 |

Kolon/perdede düşey yüzeyler; kirişte alt yüz + iki yan + iki uç; döşemede alt yüz + çevre kenarları dahildir. Üst serbest yüzler dahil değildir. **Kalıp brüttür, birleşim temasları düşülmez.** Kiriş örneği `(0,25 + 2×0,50)×4 + 2×0,25×0,50 = 5,25 m²` verir.

4 × 4 m mevcut örnekte dört kolon + dört kiriş + bir perde + döşeme: brüt beton **8,72 m³**, kesişimler bir kez sayıldıktan sonra net beton **8,0885 m³**, düşüm **0,6315 m³**, brüt kalıp **83,80 m²**. Yeni kat kopyası testinde 0,40 × 0,40 m dört kolonun 3 m kaynak ve 4 m hedef kattaki toplam brüt hacmi `4×0,40×0,40×(3+4) = 4,48 m³` olarak doğrulanır.

## Kalan sınırlar

- Düşey açıklık teşhisi yalnız kayıtlı kolon/kiriş/perde nokta bağlarını denetler. Bağsız rastgele çarpışmaların mühendislik anlamı, yatay kaçıklık veya eğik kolon nedeniyle fiziksel temas kaybının tamamı için bir yapısal bağlantı çözücüsü yoktur. Geometrik ortak hacim, taşıma gücü veya mesnet doğrulaması değildir.
- Otomatik bağlı döşeme yatay kot bandında çalışır; eğimli döşeme köşelerle tanımlanır. Çok büyük sınır grafiklerinde mevcut 2.000 segment sınırı vardır.
- Net kalıp/imalat sırası, donatı hesabı, sonlu eleman, deprem, TBDY kontrolü ve DWG kapsamı eklenmedi. Serileştirilebilir model bunların tamamlandığı anlamına gelmez.
