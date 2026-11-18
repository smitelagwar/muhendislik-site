# Yetenek ve kabul durumu — Aşama 03

Bu matris doğrulanmış sınırı gösterir. `partial_verified` bir projenin tam hesabı veya mevzuat uygunluğu anlamına gelmez. P02 rapor/metraj kodunu değiştirdi; yeni hesap motoru kabulü verilmedi.

| Yetenek | Durum | Kanıt / açık kabul |
|---|---|---|
| Üç referansın bölüm kapsamı | partial_verified | 515/515 içindekiler başlığı hedef gövde sayfasında; gövdeye özgü tali caption kapsamı ayrı |
| Basılı metraj oracle verisi | partial_verified | 334 satır, 280 sayısal satır, 574 aritmetik kayıt; gerçek native ham toplam değildir |
| Native geometri/taşıyıcı koruma | existing_baseline | P02 model/workspace/IFC/review regresyonu38/38; native codec P00 tarihsel44+1skip |
| Native G/Q alanları | partial_verified | MS1/MS2/SK 159/70/299 alan; bayt/mutasyon/NaN/kesik dosya denetimi geçti |
| Yükün hesap modeline aktarımı | missing | G/Q editöre taşınan 0; öz ağırlık anlamı, diğer yük türleri ve yük yolu açık |
| Native malzeme/analiz ayarı | missing | Yalnız kimlikli statik UI kaynakları; serializer ve hesap tüketicisi bilinmiyor |
| Native donatı/kesim/sonuç kimliği | missing | R4/R5/R8 bağlantı ve güncellik kabulü yok |
| Yerel REA repo kullanımı | partial_verified | Kaynak parser gerçek EXE'de çalıştı, MCP ile kaynak eşitliği; tüm repo CLI build'i başarısız |
| REA native mühendislik kapısı | not_passed | R1–R8: 6 partial, 2 unresolved; UI kaynak ağacı bu kapıyı tek başına geçirmez |
| Normatif kaynak indeksi | partial_verified | TBDY resmî yeniden yayını + TSE katalog kimlikleri; kaynak/tadil/denklem kabulü açık |
| Yaprak mevzuat hesapları | existing_unverified | Kabul edilmiş yaprak kontrol 0; eski kod varlığı bağımsız doğrulama değildir |
| Yeni analiz ayarları / migration | verified_storage_input_scope | P03 sürümlü yan paket, arşivli migration, boş/null kaydı ve birimli UI;48domain+3browser. Etüt dosyası gerekmez; fiziksel/native eşleştirme ve yeni motor kabulü ayrı. |
| Bağımsız 3B kabuk/statik/temas | verified_bounded_static_profile | P06 açık girdili prizmatik çubuk/dikdörtgen kabuk/Winkler;32test,1600düğüm/1176kabuk Worker. Genel şekil/native ve mevzuat kabulü yok |
| Gerçek 3B modal/spektrum | verified_explicit_numeric_profile | P07 gerçek ortak FE matrisi/M, X/Y/RZ katılımı, kaynaklı spektrum/CQC, diyafram/üst-alt setleri;792düğüm/19yakınsamış mod. Native, bölgesel tasarım ve nihai kuvvet etkileşimi kabulü yok |
| Gerçek donatı/metraj | not_accepted | P02 sabit/tahmini sonuç yolları kaldırıldı; nullable beyan kütlesi ve brüt kalıp mevcut, gerçek kesim listesi/net kalıp P09–15 |
| Kapak/TOC dahil tek yeni PDF | not_implemented_in_plan | P02 kapak dahil dürüst taslak/eksik kapsam var; nihai TOC/bölüm planlayıcı/kurum raporu P16–19 |
| İskele/kalıp iskelesi | outside_first_delivery | İlk betonarme bina tesliminden sonraki kapsam; unsupported çıktı PASS olamaz |

P01 açık kaynak/native kapıları, kaynaktan bağımsız P02 sahte sonuç temizliği hazırlığını engellemez. Bu, P01 kabulünü geçmiş saymaz; bağımlı hesap veya nihai rapor eşdeğerliği verilemez. Her sonraki aşama için kullanıcının `devam` komutu gerekir.

P02 integrity kapısı geçti: bağımsız ad/geometri, bilinmeyen-sıfır, negatif/cached sonuç, PDF son kayıt ve UI/production testleri. Nihai hesap veya mevzuat eşdeğerliği değildir. Sonraki kullanıcı komutu yalnız P03 içindir.

P04: IMPORT_COVERAGE API ve üç gerçek kaynak çıktısı doğrulandı; native mühendislik aktarımı `not_accepted`, hazır hesap nesnesi0. Yeni REA RTTI/vftable adayları araştırma kanıtıdır; serializer değildir. P03 runtime alanları değişmedi.

P05 açık girdili prizma/sabit yük parçası kütle ve preflight/JSON profili doğrulandı. Geçerli input_ready, analiz/kararlılık/mevzuat PASS değildir. Native, shell/thermal/özel kesit/kaçıklık engelleri açık tanı olarak korunur.3seçili native Q/rapor farkı otomatik aktarımı kapalı tutar.

P07 ayrı kütle setleri ve rijit diyafram/dışmerkezlik alternatifi sayısal olarak doğrulandı;P08'in fiziksel uygulanabilirlik kararı yerine geçmez. CQC/SRSS ham imzalı modları ve yerel çapraz kovaryansı saklar;koşullu kuvvet takımı kestiriminin tasarım etkileşimi onayıfalse. Dinamik zemin basıncı perturbasyonu toplam temas uygunluğu değildir.

## P08 güncellemesi

| Yetenek | Kabul | Sınır |
|---|---|---|
| Sistem/bodrum/global kontrol | verified_explicit_global_profile | BKS/DTS/HN/BYS,R-gerçek yeniden analiz,A1–B3,drift/ikinci mertebe/derz,iki kütle ve bölgesel çubuk/kabuk sınırları;85domain/4browser. Native ve genel bina kabulü false. |
| Görünür mühendis değerlendirmesi | verified_storage_and_validation | A2/A3/B3 varsayılan bilinmiyor,gerekçeli kayıt/indir/aç/revizyon. Motor entegrasyonu P17;özel aktarım hesabı yerine geçmez. |
| Normatif kaynak | selected_original_pages_reviewed | TDMD teknik ek24sayfa P08'de görüntüden incelendi;tadil seti/resmî kopya eşitliği açık. |

P08'in tamamlanması bütün sistem/eleman tasarım kabulü değildir. P09 başlamadı;sonraki devam komutu beklenir.

## P09 güncellemesi

| Yetenek | Kabul | Sınır |
|---|---|---|
| Kiriş kesit/donatı | verified_uniform_deterministic_beam_profile | Gerçek koordinat,N-Mdenge,Ttabla,net aralık,katalog/mevcut doğrulama ve tüm istasyonlar;19yeni+85regresyon. Genel yük/geometri/native kabulü yok. |
| Kiriş kesme-burulma/detay/servis | verified_bounded_rules_profile | Gerçek N'li uç kapasitesi veDdalı,etriye/çevresel alan,ankraj/tam boy stok,çatlamış kesit,sehim/çatlak/süre. Ekli/askı yerleşimi ve servisN-T desteklenmez;imalat metrajı yok. |
| Bütün kiriş listesi | verified_no_ten_item_truncation |12kirişin tamamı CLI/domain'de işlendi;5000girdi üst sınırı performans kabulü değildir. |

P09 temel profili sonuçlandı;P10 için kullanıcı devam komutu beklenir. Genel bina/native/normatif kabulfalse.

## P10 kolon/birleşim profili

Açık deterministik veride merkez simetrili gerçek N-M2-M3, narinlik ve fiziksel çiroz/sarılma; dikdörtgen üye kesmesi, aynı revizyonlu kolon-kiriş topolojisi/± güçlü kolon ve panel kesmesi/etriyesi vardır. Eksik birleşim veya kat kapsamı bütün kapıyı açık bırakır. Daire/poligon N-M var; üye kesmesi, genel/özel birleşim, filiz/lap/bitiş ve SK native kıyası kabul edilmedi. engineeringAcceptance=false. Ayrıntı P10_COLUMN_JOINT_DESIGN.md.

## P11 perde ve bağ kirişi profili

| Yetenek | Güncel durum | Sınır |
|---|---|---|
| Ortak hücre/bar kesit kapasitesi | doğrulanmış açık N-M2-M3 profili | L/T/U kapasitesi özel uç/kol detayının kabulü değildir |
| Dikdörtgen deprem perdesi | sınırlı detay/kesme/sürtünme/güçlü perde | Gerçek bar, çiroz konumu, birleşim ve kesit tarafı gerekir |
| Normal ve çapraz bağ kirişi | gerçek geometri/ankraj/kuvvet aktarımı | Çapraz dal saf antisismetrik M-V; genel yük ve imalat açık |
| Ω ve R yeniden analizi | gerçek mod/denge ve yeni bağımlı tasarım | Ortak kabuk yüzleri; köşe frame-shell bağı ve yüksek Ω etkileşimi açık |
| Bütün perde listesi | 12/12 işlendi | Genel bina/native kabulü değildir |

147 test geçti; engineeringAcceptance=false. Ayrıntı [P11_WALL_DESIGN.md](P11_WALL_DESIGN.md). P12 devam bekliyor.

## P12–P14 bütünleşik kayıt — 7 Kasım 2026

P12: gerçek P06 kabuk kuvvetleri/diyafram, tek yön şerit/servis ve iç kolon zımbalaması. P13: gerçek Winkler temas, signed tepkiler/ayarlar/birleşim katsayıları ve net Fa ile sınırlı zımbalama. P14: parametrik hacim/üçgen basamak yükü, N-M/kesme, sahanlık servisi ve içerik parmak izi. Tam kapsam kısmi; engineeringAcceptance=false. Bütünleşik kayıt P12_P14_INTEGRATION.md.
