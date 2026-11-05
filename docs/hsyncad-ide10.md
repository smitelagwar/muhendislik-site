# IDE dosyaları — ana hsynCAD çalışma alanı

5 Kasım 2026. Eski ayrı **IDE projeleri / IDE Proje Görüntüleyici** girişinin yerini normal düzenleyicide açma aldı. Önceki görüntüleyici kabul sonuçları tarihseldir; güncel düzenleme kabulü aşağıdadır. Native biçim sınırları için [uyumluluk durumu](hsyncad/NATIVE_INTEROP_STATUS.md).

## Açma, düzenleme ve kayıt

**Dosya → Model aç**, hızlı aç düğmesi, **Ctrl+O** ve sürükle/bırak aynı akışı kullanır. `.ide`, `.ide10`, `.ide11`, `.ide11trial`, `.cde` dosyaları worker ile okunur; gerçek destek başlık/sürüm ve okuyucunun doğruladığı kayıt gramerine bağlıdır. Uzantı değiştirmek yeni biçim desteği sağlamaz. `.hsyncad` çalışma dosyaları, eski IDE görüntüleme snapshot'ları ve eski model JSON dosyaları da açılır.

`workbench.tsx → ide-reader-client.ts → ide-reader.worker.ts → ide-import/index.ts → ide-workspace.ts → CadModel`.

Doğrulanmış aks, kolon, doğrusal kiriş/perde, boşluksuz döşeme ve döşeme kenarı ana modele aktarılır. Seçim, özellik değiştirme, taşıma/kopyalama, silme, yeni eleman ekleme ve geri al/yinele normal editör araçlarıdır. Konturlar, kat kimlikleri ve çözülen alt/üst kotlar korunur; bilinmeyen boyutlar varsayılmaz. Native kenar yerleşimi merkez çizgisi ofseti sanılmaz; editör ofseti doğrulanmış konturdan türetilir. Daire ve poligon kolon kesitleri korunur. Native malzemeler, yükler, donatı ve analiz sonuçları tam aktarılmış sayılmaz; malzeme açıkça yeniden tanımlanacak olarak işaretlenir.

Merdiven ağı, boşluklu döşeme, mimari duvar, yalnız plan kaydı ve diğer temsil edilemeyen kayıtlar **kaynak referansı** olarak saklanır. Ana 2B/3B görünümde gösterilir; kat silinirse o kata ait referans gizlenir. Referanslar normal eleman gibi düzenlenmez; metraj/analize dahil edilmez. Açma raporu nedenleri ve okuyucu kapsamını gösterir. Referanslar `CadModel.ideImport.source` altında özgün çözümlenmiş veriyle korunur; `mappedIds` ile düzenlenebilir kaynaklar ayrılır. Silinen düzenlenebilir eleman kaynak referansı olarak yeniden belirmez.

**Çalışmayı kaydet · .hsyncad**, güncel düzenlenebilir modeli ve kaynak referanslarını birlikte indirir. Otomatik yerel kayıt `hsyncad.model.v1` anahtarını kullanır. Depolama dolarsa dosya indirme yolu kullanılabilir. Başarısız açma/iptal mevcut modeli değiştirmez; başarılı açma tek geri alınabilir işlemdir. Native IDE kaynakları yüklenmez veya değiştirilmez. Dosya başına 250 MiB ve worker için 120 saniye sınırı vardır; çalışma JSON'u 250 MiB, eski `.json` dosyası 5 MB ile sınırlıdır. Editör 10.000 eleman/100 kat kabul eder.

**Düzenlenen modeli native IDE olarak yazma henüz desteklenmiyor.** Dosya menüsündeki IFC + aktarım raporu mevcut kontrollü ara aktarımı sağlar. IFC raporu kaynak referanslarını kapsam dışı olarak listeler; native kaydetme ideCAD içinde yapılır. IFC panel ve geometri kabul sınırları korunur. [IFC aktarımı](hsyncad/IFC_INTEROP.md).

## Canlı örnek projeler

**Dosya → Örnek IDE projelerini aç** içindeki dört örnek, `public/hsyncad/examples/*.hsyncad` altında dağıtılan çalışma kopyalarını indirir. Canlı sitede yerel Windows yollarına, `.data` klasörüne veya dosya sunan Node fonksiyonuna ihtiyaç yoktur. Eski `/api/hsyncad/ide-examples/[id]` adresi izin listesindeki örneğin statik dosyasına yönlendirir; bilinmeyen kimlik 404 verir.

`scripts/prepare-hsyncad-ide-examples.ts`, Git dışında tutulan `.data/hsyncad/ide-examples.json` eşlemesinden özgün dosyaları okuyup web çalışma kopyalarını üretir. Bu script build sırasında çalışmaz. Yenileme komutu `npx tsx scripts/prepare-hsyncad-ide-examples.ts`; ardından çıktılar tek checkpoint içinde alınır. Kullanıcının 5 Kasım canlıda açma talebi bu kopyaların yayımlanmasını kapsar. Özgün büyük native arşivler repoya alınmaz. Bunlar tam native dosyanın yerine geçen arşivler değildir; okuyucunun çözdüğü geometriyi ve düzenlenebilir karşılıklarını içerir.

`manifest.json`, kaynak dosya ve yayımlanan snapshot SHA-256 değerlerini, bayt ve kapsam sayılarını taşır; özel mutlak disk yolları içermez.

| Örnek | Kat | Düzenlenebilir | Kaynak referansı | Çözülen kayıt |
|---|---:|---:|---:|---:|
| Süheyla Kara | 7 | 1.986 | 185 | 2.171 |
| Mustafa Selvi 2. Kısım | 5 | 532 | 154 | 686 |
| Mustafa Selvi 1. Kısım | 6 | 928 | 345 | 1.273 |
| Mustafa Selvi 1. Kısım son trial kayıt | 6 | 928 | 345 | 1.273 |

Bu sayılar tüm native dosyanın envanteri veya tam ideCAD eşdeğerliği değildir.

## Güncel doğrulama

- `npx tsx --test src/lib/hsyncad/ide-workspace.test.ts`: gerçek 11/33/8 elemanlı trial, iki büyük IDE10 ve üretici CDE örneklerinde aktarım; kontur/kot, kaynak değişmezliği, kayıt/yeniden açma, geri alma ve referans korunması.
- `npx playwright test --config=playwright.hsyncad.config.ts tests/hsyncad/ide-projects.spec.ts tests/hsyncad/ide-exports.spec.ts tests/hsyncad/ide-visual-reference.spec.ts`: dört yayımlanabilir örnek için HTTP/hash/editör açılışı, gerçek native dosyada özellik değişikliği, undo/redo/silme, kayıt/yeniden açma, bozuk dosyada mevcut modelin korunması, indirme hatası/iptal ve 390 px 2B/3B kontrolü. İlk çalıştırmada **4/4 geçti**.
- Son üretim paketi (`NEXT_DIST_DIR=.next-hsyncad-ide-workspace npm run build`) uygulama TypeScript kontrolü ve 684/684 sayfayla geçti. Bu paket üzerinde yukarıdaki IDE senaryoları ve normal model/CSV/kayıt/ribbon/site-shell regresyonları **9/9 geçti**. `npm run check:tools` 30/30 araç smoke dahil geçti. Geniş domain çağrısında 50 geçti/1 CDE fixture testi atlandı; fixture'lı taşıyıcı çağrısında daha sonra 12/12 geçti (örtüşen çağrılar toplanmaz).
- Mobil 3B düğmesine odaklanırken shell `overflow:hidden` nedeniyle 184 px yatay kayıyordu. Shell `overflow:clip` ile kaydırma kabı olmaktan çıkarıldı; 390 px tarayıcı kabulü x=0 ve tam genişlik kontrolünü içerir.
- Geniş depo `npx tsc --noEmit --incremental false` eski doküman/script/test hataları nedeniyle başarısız; bu sonuç uygulama üretim kontrolüyle karıştırılmaz. Yeni/odaklı kaynaklarda ESLint 0 hata/1 eski unused uyarı; mevcut Plan2D/Scene3D dahil geniş lint çağrısı eski `any`/render-ref ihlalleri nedeniyle 8 hatayla başarısız. Bunlar tam başarı olarak raporlanmaz. Yayın sonucu ortak çalışma kaydında tutulur.

Bu görevde ideCAD masaüstü uygulamasında native kayıt kabulü yeniden yapılmadı. Önceki 11/33/8/406 elemanlı masaüstü sonuçları [native uyumluluk belgesindeki](hsyncad/NATIVE_INTEROP_STATUS.md) tarihsel kabul kanıtlarıdır.
