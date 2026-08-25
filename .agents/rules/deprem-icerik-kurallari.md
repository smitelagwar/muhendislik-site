# Deprem ve Yönetmelikler — İçerik Altyapısı Kuralı

Bu dosya `/kategori/deprem-yonetmelik` kapsamındaki makale, figure, formül, callout, yazar veya kalite scripti işi yapılırken **zorunlu görev kuralıdır**. Repo kökündeki `AGENTS.md` ile birlikte uygulanır.

## 1. TS 500 sınırı

TS 500 ana serisi tamamlanmış referans/regresyon setidir. Başka seriler geliştirilirken TS 500 makale metinleri topluca yeniden yazılmaz veya yeniden üretilmez. Ortak renderer/author altyapısı TS 500'ü de etkiliyorsa regresyon kontrolü yapılır.

## 2. Merkezi yazar

Deprem ve Yönetmelikler içeriklerinde yazar metadata'sı kaynak dosyalarda farklı olsa bile runtime canonical değer şudur:

- Görünür author: `İnşaat Mühendisi Hüseyin GÜNAYDIN`
- Monogram: `HG`
- Aynı `İnşaat Mühendisi` unvanı ikinci satırda tekrar edilmez.

Kaynak: `src/lib/content-author.ts`.

Makale veya component içinde yeniden initials üretme (`author.split(...)`) mantığı ekleme. Yazar görünümü için merkezi helper kullan.

## 3. Figure yazım standardı

Makale içi teknik görsel mevcut Markdown image satırıyla başlar. Alt text boş bırakılamaz. Hemen altındaki italik satır caption'dır. İsteğe bağlı üçüncü metadata satırı figure/source/lightbox bilgisini taşır.

```md
![Perde ve çerçevede yatay yük aktarımı](/images/deprem/ornek.svg)
*Perde–çerçeve sisteminde yatay yük aktarımının şematik gösterimi.*
{figure: 2 | note: Çizim ölçekli değildir. | source: TBDY 2018 | lightbox: true}
```

Desteklenen metadata:

- `figure` / `şekil`: açık figure numarası; verilmezse makale içindeki render sırasına göre otomatik numara
- `note` / `not`: şematik, ölçeksiz veya yöntem notu
- `source` / `kaynak`: kısa kaynak notu
- `lightbox`: `true` ise büyütme aktif

Body figure için caption zorunludur. Teknik şemalar `object-contain` ile kırpılmadan gösterilir. Renderer sabit oranlı alan kullandığı için CLS üretilmemelidir.

## 4. Formula yazım standardı

Profesyonel denklem genel kod bloğu gibi yazılmaz. Ortak `formula` fence kullanılır:

````md
```formula
@label: Denklem 1
VtE = mt * SaR(Tp)
@symbol: VtE | Eşdeğer deprem yükü taban kesme kuvveti | kN
@symbol: mt | Toplam bina kütlesi | t
@symbol: SaR(Tp) | Azaltılmış tasarım spektral ivmesi | m/s²
```
````

Kurallar:

- ifade kopyalanabilir düz metindir,
- semboller açıklanır,
- her sembolde birim yazılır; boyutsuzsa `-` kullanılabilir,
- mobilde formül yatay taşabilir fakat sayfa genişliğini bozamaz,
- formülün kabul/geçerlilik alanı ve mühendislik yorumu makale metninde ayrıca açıklanır.

## 5. Semantik callout tipleri

Obsidian biçimi kullanılır:

```md
> [!MÜHENDİSLİK] Tasarım kararı
> Rijitlik kabulünün sonuç üzerindeki etkisini burada açıkla.
```

Desteklenen ana tipler:

- `BİLGİ` / `INFO`
- `UYARI` / `WARNING`
- `İPUCU` / `TIP`
- `YÖNETMELİK` / `REGULATION`
- `MÜHENDİSLİK` / `ENGINEERING`
- `SAHA` / `FIELD`
- `KONTROL` / `CHECK`

Callout dekorasyon için değil, gerçek teknik ayrım için kullanılmalıdır.

## 6. İlgili araç / CTA

Seri CTA'sı yalnız gerçekten var olan ve konuya doğrudan yararlı hesap aracına bağlanır. Uygun araç yoksa `relatedToolHref: ""` kullanılır ve CTA render edilmez. Kullanıcıyı sırf CTA göstermek için genel araç merkezine yönlendirme.

Eski `/deprem-yonetmelik/araclar/...` route ailesi yasaktır. Güncel araç rotaları `src/lib/tools-data.ts` içindeki gerçek `href` değerlerinden alınır.

## 7. Kalite kapıları

Ortak altyapı kontrolü:

```bash
npm run check:deprem-infrastructure
```

Tam içerik kalite kapısı:

```bash
npm run check:deprem-content
```

`check:deprem-content` TS 500 dışındaki hedeflerde en az şunları denetler:

- canonical author ve `HG`,
- minimum iki gerçek görsel (benzersiz/non-generic cover + body figure),
- body image alt ve caption,
- generic/reused cover,
- eski route kalıbı,
- related slug bütünlüğü,
- references,
- formula sembol/birim semantiği,
- placeholder ve duplicate section/related kayıtları,
- seri sayıları ve gerçek tool CTA rotaları.

FAZ 2+ içerik üretiminde bir makale strict kalite kapısından geçmeden "tamamlandı" sayılmaz. Mevcut toplu içerik borcu nedeniyle FAZ 1 sonunda `check:deprem-content` raporunun hedef makalelerde görsel/reference borcu göstermesi beklenebilir; bu borç quality kuralını gevşetme gerekçesi değildir.
