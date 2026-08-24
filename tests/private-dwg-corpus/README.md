# Private DWG Golden Corpus

Bu klasör CAD upstream migration kabul testlerinde kullanılacak gerçek DWG dosyaları içindir.

Gerçek proje çizimleri, müşteri/arsa bilgileri ve kuruma özel paftalar public repoya commit edilmemelidir. `.gitignore`, bu klasörde yalnız bu README ile güvenli örnek manifestin commit edilmesine izin verir.

## Aşama 1 kullanımı

1. En az 13 gerçek DWG dosyasını bu klasöre lokal olarak kopyalayın.
2. Dağılımı en az 5 `small`, 5 `medium`, 3 `large` olacak şekilde belirleyin.
3. `manifest.example.json` dosyasını `manifest.local.json` adıyla kopyalayın ve her gerçek DWG için bir kayıt oluşturun.
4. Mevcut custom viewer ile her dosyayı açıp baseline alanlarını gerçek gözlemlerle doldurun.
5. `node scripts/check-cad-migration-stage1.mjs` çalıştırın.
6. Çıktı `GATE: PASS` olmadan Aşama 2'ye geçmeyin.

## Baseline değerleri

`color`, `linetype`, `lineweight`, `text`, `block` ve `hatch` alanları şu değerlerden birini kullanır:

- `pass`
- `warning`
- `fail`
- `not-applicable`

Bir özelliğin mevcut viewer'da bozuk olması Aşama 1'i tek başına başarısız yapmaz. Aşama 1'in amacı mevcut davranışı dürüstçe dondurmaktır; alanın eksik bırakılması kabul edilmez.

## Corpus kapsamı

Mümkün olduğunca şu çizim ve özellikleri dağıtın:

- kalıp planı,
- kolon aplikasyonu,
- kiriş açılımı,
- mimari plan,
- HATCH,
- MTEXT,
- BLOCK/INSERT,
- DIMENSION,
- lineweight,
- linetype,
- farklı kaynak renkleri.

`sizeClass` otomatik ve keyfi bir MB eşiğinden türetilmez. Dosyayı gerçek kullanım/performans corpus'unda temsil ettiği sınıfa açıkça atayın; gerçek byte boyutu checker tarafından ayrıca raporlanır.

## Public regresyon fixture'ı

Bir gerçek dosyada bulunan hata ileride public regresyon testine dönüştürülecekse önce çizim anonimleştirilmeli/minimize edilmeli ve yalnız problemi yeniden üreten paylaşımı güvenli küçük fixture repoya eklenmelidir.
