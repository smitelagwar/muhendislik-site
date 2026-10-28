# hsynCAD — 28 Ekim 2026 REA devam doğrulaması

Bu devam çalışmasında önceki araştırma tamamlanmış varsayılmadı. Kurulu hedef gerçek REA `inspect_pe_resources` aracıyla yeniden okundu; eski hiyerarşi ve mevcut web manifesti kaynak byte aralıklarıyla kontrol edildi. İkonlar, bitmapler, handler kodu ve ideCAD model formatı çıkarılmadı; kurulum değiştirilmedi.

## Kaynak kimliği ve doğrulama

Kalıcı arşiv: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\devam-2026-10-28`.

- Taze Evidence: `ev_e800b36e7334aaa0764d0a4ab7dec7854c4f4f86f2fade6de811e4f530a720a4`.
- Hedef 213.281.352 byte; EXE SHA-256 `a4dcabe8680507c1444a4cb40a2f908f9bf51120929a8f763b425b60ff2cbdd3`.
- 9.243 dizin girdisi / 4.613 kaynak; tamamı bütçe içinde incelendi.
- 25955: tür 28 / dil 1055 / sıra 4498; ofset 211.996.456 + 702.753 byte; payload SHA-256 `6f3f23a4a7c440dab175153bbc670358ec6547767e65f9e2ae6953c3d407a4ac`.
- Önceki dört şablondan toplam 4.887 XML fragmenti güncel EXE ile hash düzeyinde eşleşti.
- `src/lib/hsyncad/ribbon-layout.ts` içindeki 1.287 sekme içi komut/alt komut/ayraç kaydı; ID, sembol, büyük-küçük bayrağı, tür, ebeveyn ve sıralama bakımından önceki hiyerarşiyle eşleşti. Bu sayı webde çalışan özellik sayısı değildir.

25955'in 12 görünür sekmesi referans ekranla uyumludur: **Betonarme, Çelik, Birleşim, Objeler, Değiştir, Araçlar, Ayarlar, Görüntü, Analiz ve Tasarım, Analiz ve Tasarım Görüntüleme, Raporlar, Çizimler**. `HIDDEN` on üçüncü kayıttır; arayüzde görünür sekme olduğu söylenemez. Kurulu uygulamanın çalışma anında 25955'i seçmesi gözlenmedi; görsel uyum hâlâ çıkarımdır.

## İlgili panel düzeni

| Sekme | Sıralı paneller |
| --- | --- |
| Betonarme | Proje Ayarları · Aks · Duvar · Betonarme · Temel - Zemin · İskele Ayarları · Tasarım · Raporlar · Çizim Oluştur · Analiz ve Tasarım Görüntüleme · Analiz |
| Çelik | Proje Ayarları · Aks · Çelik · Makro · Tasarım · Raporlar · Çizim Oluştur · Analiz ve Tasarım Görüntüleme · Analiz |
| Birleşim | Birleşim · Konstrüktif Birleşimler · Mod |
| Objeler | Objeler · Çatı · Arazi · Donatı · Kesit |
| Değiştir | Obje Özellikleri · Obje Edit · Katmanlar · Yük Ekle · Dönüştür |
| Araçlar | Düzenle · Araçlar · Referans · Metraj · Oluştur · Seçim Grupları · Import / Export · Dosya Paylaşımı |
| Ayarlar | Proje Ayarları · Ayarlar · Birimler |
| Görüntü | Perspektif · Çalışma Düzlemi · Görüntü · Pencere · Zoom · Mod · Görüntü |
| Analiz ve Tasarım | Analiz Modeli · Betonarme Tasarım · Çelik Tasarım · Donatı · Tasarım Parametreleri · Tanımla · Analiz |
| Analiz ve Tasarım Görüntüleme | Görüntü · Yükler · Deformasyon · Kesit Tesirleri · Perde · Aşık · Kabuk Elemanlar · Veri · Tasarım · Sonuç · Analiz |
| Raporlar | Özet · Döşeme · Betonarme · Temel - Zemin · Dinamik Analiz · ŞGDT · Deprem Yönetmeliği · Çelik · Kalıp Planı · Metraj |
| Çizimler | Pencere · Çizim Oluştur · İlkel Objeler · Değiştir · Düzenle · Yakalama · Referans · Ölçüler · Donatı · Tarama · Yazılar · Pafta Dizaynı · Araçlar |

### Betonarme ana/alt ilişkileri

| Yer | Büyük ana komut | Küçük kardeş komutlar | Gerçek alt komutlar |
| --- | --- | --- | --- |
| Proje Ayarları | Analiz Ayarları, Kat listesi | Kat Genel Ayarları, Kat Kopyala, Yarı Rijit | — |
| Aks | Aks | Yay Aks, 3 Noktadan Yay Aks, Aks Çizim Tipini Değiştir | Kontur Hesapla, Kontur Çizgileri, Aks Etiketini Taşı, Aks Ayarları |
| Betonarme | Kolon | Daire Kolon, Poligon Kolon, Kolon Başlığı | Kolon Ayarları |
| Betonarme | Kiriş | Eğrisel Kiriş, Sürekli Yay Kiriş, Yay Kiriş | Dairesel Kiriş, Kiriş Ayarları |
| Betonarme | Perde | — | Subasman Perdesi, Güçlendirme Perdesi, Perde Uzunluğunu Değiştir, Perde Ayarları |
| Betonarme | Döşeme | Hesap aksları, nervür/kaset/tipik diş, boşluk ve çizgisel/noktasal yük komutları | Kontur Seçerek Döşeme Oluştur, Döşeme Boşluğu, Betonarme Hesap Aksı Sil, Bant Kiriş, Yay Bant Kiriş, Döşeme Ayarları |
| Betonarme | Döşeme Kenarı | — | Eğrisel, yay, dairesel, sürekli kenar, Döşeme Kenarı Ayarları |

Merdiven aynı Betonarme panelinde büyük kardeş düğmedir. Bu semantik yerleşimin bilinmesi merdiven, temel, analiz, tasarım, DWG veya pafta motorlarının webde mevcut olduğu anlamına gelmez. Kaynakta adı boş küçük ikonlar RT_STRING açıklamalarından adlandırılmıştır. Örneğin `CM_DRAW_ARC_BEAM_3P`, kaynak eşlemesinde “Sürekli Yay Kiriş” olarak görünür; bu etiket bütün olay davranışını kanıtlamaz.

Görüntü → Perspektif paneli sekiz büyük görünüş komutu taşır: Perspektif, Üst, Alt, Sol, Sağ, Ön, Arka, Aksonometrik. Pencere panelinde koordinat kutusu, yapı ağacı ve toolbar erişimi; Zoom panelinde büyük Zoom/Zoom Seçim ile küçük pencere/çizime sığdır/kaydır bulunur. Ana ve küçük düğmelerin bu ayrımı tek tip büyük düğme sırasına indirgenmemelidir.

## Oturum başlangıcında görülen entegrasyon boşluğu

Başlangıçtaki `command-bar.tsx`, doğrulanmış `NATIVE_RIBBON_TABS` manifestini import etmiyordu. Üst satır beş yapı elemanı, ayrı ölçüm grubu, marka ve proje adından oluşuyordu. Böylece önceden eklenmiş ikon/manifest/koordinat dosyalarının varlığı tamamlanmış Ribbon entegrasyonunu göstermiyordu. Bu tespit değişiklik öncesi kaynak incelemesidir; devam uygulamasının son görsel kabulü ayrıca tarayıcıyla yapılmalıdır.

Web arayüzünde uygulanmayan komutların durumu açık tutulmalıdır. Referanstan yararlanarak bir panel sırası göstermek veya alt menü kurmak native hesap motorunu uygulamak değildir. Yeni ikonlar özgün web vektörleri olmalıdır; native görseller kullanılmamalıdır.

## Resmî Help ile akış karşılaştırması

- [Aks çizimi](https://help.idecad.com.tr/ideCAD/aks-cizimi), [ofset](https://help.idecad.com.tr/ideCAD/aks-ofset) ve [ayarlar](https://help.idecad.com.tr/ideCAD/aks-ayarlari): Aks yardımcı toolbarı, yatay/düşey/serbest türler, ölçülü tekrar, uç deltaları ve ayrı etiket konumu doğrulandı. Aks ofseti statik 25955 Ribbon yerleşiminde görülmese de yardımcı toolbarda belgelenir.
- [Koordinat kutusu](https://help.idecad.com.tr/ideCAD/koordinat-kutusu-ve-dinamik-bilgi-girisi): Enter girilen değeri kilitler; kilitli satır kırmızı görünür; X+Y ve L+A kilit çiftleri birbirini dışlar. Kilitsiz değerler imleçle değişir, Z bilgi verir.
- [Kat genel ayarları](https://help.idecad.com.tr/ideCAD/kat-genel-ayarlari): mimari kot tabanı, statik kot tavanı anlatır. Web modelinin taban kotu saklaması özgün veri kararıdır.
- [Kolon](https://help.idecad.com.tr/ideCAD/betonarme-kolon-ayarlari) ve [perde](https://help.idecad.com.tr/ideCAD/perde-ayarlari): alt fark tabana, üst fark tavana göre ele alınır. [Kiriş](https://help.idecad.com.tr/ideCAD/betonarme-kiris-ayarlari): sıfır kot tavan seviyesidir; farklı uç kotlarıyla eğim verilir.
- [Döşeme ayarları](https://help.idecad.com.tr/ideCAD/doeseme-ayarlari): üst yüz tavan + kot farkında, kalınlık aşağıya uzanır. [Döşeme oluşturma](https://help.idecad.com.tr/ideCAD/doeseme-olusturma): kapalı ve doğru bağlı kiriş/perde/kenar çevresi önizlenir, içine tıklanır. [Aynı katta farklı kotlar](https://help.idecad.com.tr/ideCAD/ayn-katta-farkl-kotlarda-doseme-nasl-olusturabilir): katman ve kotlar ayrı yönetilir.

İlgili kısa özgün kaynak özetleri `devam-2026-10-28/help-bulgulari.md` içindedir. Webin snap önceliği, bağlantı güncellemesi, katı birleşimi, hacim paylaşımı ve atomik hata politikası özgün tasarım kararlarıdır. Help veya statik kaynaklar bunların native algoritmayla aynı olduğunu kanıtlamaz.

## Kanıt türlerine göre açık durum

| Soru | Durum | Kanıt / açık sınır |
| --- | --- | --- |
| Kurulu dosya ve 25955 kimliği aynı mı? | Yanıtlandı | Taze REA kaydı ve payload hash'i. |
| Sekme/panel/ana/alt/büyük-küçük sırası? | Statik bildirim düzeyinde yanıtlandı | XML fragmentleri ve web manifest eşleşmesi. Dinamik toolbar ekleri kapsam dışı. |
| Aks ve eleman yerleştirme akışının temel ilkeleri? | Kısmen yanıtlandı | Resmî Help; tüm runtime tıklamaları izlenmedi. |
| Kot/katman/koordinat kutusu anlamları? | Belge düzeyinde yanıtlandı | Yukarıdaki resmî sayfalar; webdeki eşdeğerlik ayrıca sınanır. |
| Native snap önceliği, birleşim hacmi ve kalıp kesintisi algoritması? | Doğrulanmadı | Bu araştırmada native runtime/kod incelemesi yapılmadı. |
| hsynCAD görsel kabulü ve çalışan işlevler? | Ayrı uygulama doğrulaması gerekir | REA başarısı arayüz veya modelleme testinin yerine geçmez. |

Eski `rea-ui-resource-map.json`, `tam-bulgular.json`, hiyerarşi JSON'ları ve açıklama belgeleri kalıcı araştırma arşivinde korunur. `node devam-2026-10-28/verify-ribbon-evidence.cjs` 4.887 kaynak fragmenti / 1.287 manifest kaydı kontrolünden başarılı geçti. Bu doğrulama web TypeScript/lint/build veya tarayıcı testinin yerine geçmez.
