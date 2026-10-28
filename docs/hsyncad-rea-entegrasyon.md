# hsynCAD — REA seçeneklerinin çalışan entegrasyonu

İlk entegrasyon: 26 Ekim 2026. Güncel çizim/arayüz devamı: 27 Ekim 2026. Rota: `/kategori/araclar/hsyncad`.

**Güncel çizim ve arayüz sözleşmesi:** [Çizim akışı, ölçüm ve referans](hsyncad-cizim-akisi.md). Aşamalı kolon, sürekli kiriş/perde, kapalı alan döşemesi, bağlı düğümler, lokal koordinat sistemi, ölçümler ve yeni CAD düzeni bu belgede açıklanır. Model artık isteğe bağlı `drafting` (ölçüm/referans) alanını da korur.

Bu belge önceki entegrasyonun alan sözleşmesidir. Önceki incelemedeki alanlar özgün TypeScript koduyla modele, 2B/3B çizime, düzenlemeye, geçmişe ve JSON kaydına bağlandı. ideCAD'in kodu, ikonları veya proje biçimi alınmadı. Tam ideCAD/analiz motoru entegrasyonu iddiası yoktur.

**Güncel denetim:** [REA Ribbon ve masaüstü doğrulaması](hsyncad-rea-denetim.md). Gerçek ana/alt komut kaynakları ve kot bandına göre otomatik alan tanıma bu devam çalışmasında eklendi.

## Kaynak ile uygulama kararının ayrımı

Kaynak, daha önce gerçek REA `inspect_pe_resources` çağrısıyla bulunan EXE aralıklarının salt okunur Win32 çözümüdür: 743 diyalog, 5 menü, 8.600 metin. Bu çalışma yeni bir ideCAD canlı tıklama kaydı değildir. Kontrollerin etiketleri ve şablondaki yerleşimleri doğrulanmıştır; iç olay bağlantıları, hesap formülleri, varsayılan değerler ve birleşim algoritmaları bu JSON'lardan çıkmaz.

Kaynak kimliği: `ev_5756763f7757b0a2a78bc84b5bdb5416294438729a347abee48618669981910b`; EXE SHA-256 `a4dcabe8680507c1444a4cb40a2f908f9bf51120929a8f763b425b60ff2cbdd3`. Kaynak haritası ve çözülmüş JSON'lar `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea` altında korunur.

## Eklenen ve bağlanan alanlar

| REA kaynağı | hsynCAD'de çalışan karşılık |
| --- | --- |
| Aks, diyalog 127; metin 7591 | Yatay/düşey/iki nokta; ad eki, tali aks, ayrı başlangıç/bitiş uzatması, balon tarafı, kontur içi/dışı renk ve çizgi tipi, çizgileri açma/kapama, dış uzantıları yatay düzleştirme. Ölçülü ağ ve ardışık paralel aks birlikte çalışır. |
| Kolon, diyalog 132 | Dikdörtgen/daire/poligon kesit, döndürme, yerel X/Y kaçıklığı, üst uç X/Y ötelenmesi, alt/üst kot ve kat tavanına bağlı/sabit yükseklik, grup, materyal, renk, çizgi/tarama. |
| Kiriş, diyalog 170 | b/h, başlangıç ve bitiş uç kotları, merkez/sol/sağ hizası ve tanımlı kaçıklık, eğri kiriş sehimi/parça sayısı, materyal ve görünüm. |
| Perde, diyalog 174 | Kalınlık, alt/üst kot, kat tavanına bağlanma, merkez/sol/sağ hizası ve tanımlı kaçıklık, eğrisel perde sehimi/parça sayısı, grup/materyal/görünüm. |
| Döşeme, diyalog 137 | Kalınlık/kot, X/Y eğimleri, tarama açısı/içini boyama, referans yönü, katman kalınlıklarını toplama, kaplama adı/yükü ve hareketli Q yükü. |
| Yakalama, diyalog 604 | Kesişim/uç/orta/ızgara ayrı açılıp kapanır. Yakalama ve seçme uzaklıkları piksel cinsinden; düğüm görünürlüğü ve yarıçapı ayarlanır. Ortho ve ızgara aralığı çalışma bandındadır. |
| Kat/katman, diyalog 10470 ve 106 | Üste/alta kat ekleme, kat kopyalama, katı elemanlarıyla geri alınabilir silme; statik kot ve mimari referans farkı. Katman görünürlüğü/kilidi aktif kata veya tüm katlara uygulanır; özel katman ve ortak renk tanımlanır. |
| Metraj, diyalog 593 ve 13740 | Kat, eleman tipi, kat→tip, tip→kat, materyal ve tek tek eleman gruplaması; kat/tip filtresi ve CSV. Elle tanımlı donatı kg'si ile döşeme yük toplamları ek sütunlardır. |

Malzeme kataloğu Proje → Malzeme tanımları üzerinden düzenlenir. Elemanlarda malzeme kimliği saklanır, rapor buna göre gruplanır. Mekanik malzeme dayanımı/analizi hesaplanmaz; katalog adları beton sınıfı veya kullanıcı etiketi olarak kullanılır.

## Kullanım

1. **Proje → Gelişmiş örneği aç** ile bütün yeni geometrileri aynı modelde inceleyin. Eski model Geri al ile döner. Soldaki 4×4 örnek korunur; sağda daire/poligon/eğik kolon, eğri kiriş/perde ve eğimli katmanlı döşeme vardır.
2. Üstten bir eleman seçin; bağlam bandındaki **Kolon/Kiriş/Perde/Döşeme ayarları** düğmesi yeni eleman varsayılanlarını açar. Uygula'dan sonraki yerleştirmeler bu tanımı kullanır. Ad öneki otomatik sıra numarasıyla tamamlanır. Varsayılanlar JSON'a kaydolur.
3. Mevcut elemanı seçip **Özellikler → Ayrıntılı eleman ayarları** bölümünü açın. Değişiklik Uygula ile model, metraj ve 3B'ye birlikte gider. Kilitli katman seçilemez/düzenlenemez.
4. Aks için yön ve ölçülü ağ ana bantta; **Aks genel ayarları** içinde ek gösterim alanları vardır. Ortak uzatmayı değiştirmek ayrı uç uzatma tercihlerinin yerine geçer. Paralel aks başarıyla oluşunca referans yeni aksa ilerler.
5. Koordinat kutusu **mutlak X/Y**, **göreli ΔX/ΔY** veya **uzunluk/açı** kabul eder. Göreli/kutupsal giriş çizimin son noktasına, çizim yoksa son girilen noktaya göredir. Koordinat kutusu hassas giriş olarak ayrıca snap uygulamaz.
6. **Görünüm → Yakalama ayarları / Katman ayarları**, sağdaki **Ayrıntılı metraj raporu** ve **Proje → Malzeme tanımları** pencereleri hem masaüstü hem mobilde kullanılabilir. Escape kapatır; pencereler doğal modal odak davranışını kullanır.

## Özgün geometri sözleşmesi

- Bütün boyutlar metre. Yeni kolon/perdeler varsayılan olarak kat tavanına bağlıdır. Eski JSON'da `heightMode` yoksa önceki sabit yükseklik davranışı korunur. `bottom = kat kotu + baseOffset`; story üstü `kat kotu + kat yüksekliği + topOffset`, fixed üstü `bottom + height + topOffset`.
- Kolon kaçıklıkları döndürülmüş yerel kesit eksenlerinde, üst uç ötelenmesi global X/Y'dedir. Daire kesiti b çapını kullanır; 8–64 kenarlı çokgen yaklaşımıdır. Poligon köşeleri yerel metre koordinatlarıdır; b/h yerine bu köşeler kullanılır.
- Eğri kiriş/perde, başlangıç/bitiş ve orta sehimle tanımlanan dairesel yaydır. Pozitif sehim başlangıçtan bitişe bakışta soldadır. 2–15 doğru parçasıyla örneklenir; 2B/3B/metraj aynı örneklemeyi kullanır. Bunlar ideCAD'in bilinmeyen eğri parametrelerinin aynısı olduğu iddiası taşımaz.
- Kirişin iki uç kotu kat tavanına göre farktır. Uçlar farklıysa üst yüz, başlangıç–bitiş doğrusu boyunca eğimli bir düzlemdir; eğri kirişte de bu düzlem kullanılır. Kesit yüksekliği düşeydir. Hizalama, çizim yönüne göre sol/sağ kenardır.
- Döşeme kotu ilk köşede tanımlıdır; X/Y eğimleri yüzde, kalınlık düşeydir. Eğimli döşemede gösterilen alt/üst kotlar bütün köşelerdeki minimum/maksimumdur. Yerleştirmeden önceki ayar penceresi ilk köşe referansını gösterir.
- Katmanlı döşeme bu sürümde **beton tabakalarıdır**: toplam düşey kalınlık toplanır ve tamamı beton hacmine girer. Kaplama, ayrı kN/m² yük alanıdır; farklı malzeme tabakalarının mekanik kompozit hesabı yapılmaz.
- Katın `architecturalOffset` değeri mimari referans gösterimidir; statik geometriyi değiştirmez. ideCAD'in mimari/statik kot dönüşümü çıkarılmış değildir.

## Ortak birleşim ve metraj

`junctions.ts` yatay prizmalarda Z dilimleri ve dışbükey çokgen farkı kullanır. Eğimli döşeme/kiriş veya eğik kolon varsa `polyhedra.ts` dışbükey çokyüzlüleri düzlemlerle keser; basamaklı Z yaklaşımı kullanılmaz. Konkav kesitler önce üçgenlenir. Aynı ayrık parçaların yüzleri 3B'ye, hacimleri metraja gider.

Ortak hacim önceliği kolon → perde → kiriş → döşeme, aynı tipte kimlik sırasıdır. Rapor filtresi birleşimden **sonra** uygulanır; bir tipi gizlemek ortak hacmi diğerine yeniden dağıtmaz. Aynı ada sahip kat/materyaller kimlikleriyle ayrı gruplanır.

Kalıp alanı brüttür; birleşim temas yüzeyleri düşülmez. Düz kirişte eski `(b+2h)L+2bh` sonucu korunur; eğimli kiriş/döşemede alt yüzün eğimli alanı ve düşey kenarlar kullanılır. Eğik kolon yan yüzleri gerçek ötelenmeye göre hesaplanır. Daire/yay metrajı çokgen yaklaşımıdır.

Donatı kg'si **elle girilen** değerdir. Döşeme kaplama/hareketli yük toplamları plan alanı × kN/m²'dir. Bu değerlerden taşıma gücü veya otomatik donatı tasarımı üretilmez.

İşlem sınırı 1.000.000, parça sınırı 20.000. Hata halinde net hacim `null`, parça listesi boştur; sahnede belirgin hata gösterilir. Çakışan brüt prizmalara geri dönüş kaldırıldı. Farklı kotlu, birbirinden ayrı 200 kolon örneğinde gereksiz kırpma elenerek bütçe aşımı giderildi.

## Dosyalar ve doğrulama

26 Ekim entegrasyonu için tarihsel yerel sonuç: **27/27 model/geçmiş/geometri testi, 20/20 tarayıcı senaryosu** başarılı. Uygulama TypeScript kontrolü ve değişen hsynCAD TS/TSX/test dosyalarında ESLint temiz. Üretim derlemesi tamamlandı (636 sayfa); ek bağımlılık kurulmadı. Canlı dağıtım yapılmadı.

Model hâlâ `schemaVersion: 1`; alanlar isteğe bağlı uzantılardır. `layers`, `snap`, `toolDefaults`, kat `layerStates` ve yeni eleman alanları doğrulanarak JSON'da korunur. Eski dosyalar açılır. Geçersiz içe aktarma mevcut modeli değiştirmez. İnceleme JSON'ları uygulama paketine import edilmez.

- Domain: `src/lib/hsyncad/{model,definitions,creation,geometry,axes,junctions,polyhedra,quantities,reports,feature-demo}.ts`.
- UI: `src/components/hsyncad/{workbench,properties,element-settings,project-settings,quantity-report,settings-dialog,plan2d,scene3d}.tsx`.
- Yeni bağımsız kontroller: `src/lib/hsyncad/integration.test.ts`, `tests/hsyncad/rea-integration.spec.ts`.
- Kalıcı arşiv: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\entegrasyon-2026-10-26`. Kaynak eşlemesi, yeniden açılabilir gelişmiş model, ekran görüntüleri ve test özeti burada tutulur.

```powershell
npx tsx --test src/lib/hsyncad/model.test.ts src/lib/hsyncad/integration.test.ts tests/hsyncad/editor-state.test.ts
npx tsc --noEmit --incremental false -p tsconfig.next.json
$env:HSYNCAD_TEST_URL='http://127.0.0.1:3136'
npx playwright test --config playwright.hsyncad.config.ts
npm run build
```

Sonlu eleman/deprem/dinamik/betonarme tasarımı, ideCAD dosyası okuma, DWG/pafta ve lisans işlemleri bu çalışmanın kapsamında değildir. Kullanıcıya bu yetenekler varmış gibi düğme eklenmedi.
