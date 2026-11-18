# Doğrulama matrisi

## Tarihsel Aşama 01

Bütün aşağıdaki koşular `asama-01` kanıt kökündeki bounded runner job/result ve stdout/stderr dosyalarına bağlıdır. Önceki Aşama 00 sonucu bu aşamada yeniden çalıştırılmış sayılmaz.

| Kontrol | Gerçek sonuç | Kapsam / kanıt alt yolu |
|---|---|---|
| Referans kataloğu üretimi | exit 0 | corpus-build; 515 TOC hedefi, 334 metraj satırı, 574 aritmetik kayıt |
| Referans sınır/kapsam testleri | 10/10 | corpus-tests; bütün sayısal kaynak satırları, yinelenen başlık, çap/boş hücre, yanlış toplam negatifleri |
| RT_DIALOG/RT_STRING ayrıştırma | exit 0 | rea/dialog-decode; 744 diyalog, parse hatası 0 |
| Diyalog decoder testleri | 6/6 | rea/resource-decoder-tests-final; standart/extended, tüm kesik önekler, Unicode, fazla kontrol/extra data, string kimliği |
| Native mühendislik probe | exit 0 | rea/native-probe-v2; üç ayrı kaynak, 528 G/Q, tek alan izolasyonu, NaN ve kesik taşıyıcı; fiziksel yük semantiği kabulü değildir |
| REA kaynak parser/MCP eşitliği | exit 0 | rea/source-parser-bundled; 4.621 kaynak, kesik PE ve kapasite negatifleri; repo CLI build kabulü değildir |
| Normatif indeks üretimi | exit 0 | standards/index-build-final-v3; multiline TOC dışlanır, aday indeks mühendislik yorumu değildir |
| Normatif indeks testleri | 7/7 | standards/index-tests-final-v3; TOC/çok satırlı TOC, kaynak konumu/alt bent ve bağımsız kaynak kabul kapıları |
| Araştırma dosya/lint denetimi | Ayrı result.json | stage01-audit-v3 ve script-lint; kapanış kaydındaki gerçek sonuç geçerli |
| REA repo bağımlılık kurulumu | exit 0 | rea/runtime-setup/npm-ci |
| REA repo build:cached | FAIL exit 1 | Windows native manifesti eksik; kapı kaldırılmadı |
| Process-scoped global doctor | FAIL exit 1 | Config drift nedeniyle genel healthy=false; Ghidra sağlayıcısının available=true durumu ayrıdır |
| Doğrudan tsx REA kaynak yükleme | TIMEOUT exit 124 | rea/source-parser-check-v2; sahip olunan süreç ağacı temizlendi; farklı bundle yöntemiyle doğrulandı |
| İlk yardımcı script koşuları | FAIL, sonra düzeltildi | source-parser-check Evidence şeması; native-probe bayt-eşit Downloads kopyasını çift saydı. Loglar korunuyor |
| Ürün solver / yeni tasarım / yeni metraj | NOT RUN | Aşama 06–15 kapsamı |
| Yeni PDF / browser / production build | NOT RUN | Ürün değişikliği yok; bu aşamanın kabulü sayılmaz |
| Genel/uygulama TypeScript | NOT RERUN | Aşama 00 baseline: uygulama geçti; genel tsc 567 tanıyla başarısız |

Gelecek benchmark toleransları [VERIFICATION_TOLERANCES.json](VERIFICATION_TOLERANCES.json) içinde önceden sabitlendi. Referans rakamları üretim cevabı değildir. Başarısız kontrolün taraf değiştirmesi, genel toplam toleransı içinde diye kabul edilemez.

Kapanış denetiminin önceki iki başarısız koşusu Windows newline/hash üretimini ve içerik dizini false-positive adayını ortaya çıkardı. Üretici sınırları düzeltildi; final kaynak metin hashleri ve TOC bölge sınamasıyla audit geçti. Bu önceki sonuçlar başarılı final koşunun yerine sayılmadı.

## Aşama 02 — güncel kod

`asama-02` bounded job/result/stdout/stderr; her koşunun gerçek zaman/komutu TASKS.json'da. Aşağıdaki testler ayrı paketlerdir; tekrar denemeler toplanarak test sayısı şişirilmedi.

| Kontrol | Sonuç | Kanıt / sınır |
|---|---|---|
| Rapor/metraj/CLI/negatif/cached/PDF | 39/39, skip0 | report-integrity-closure; sekiz korunmuş diagram testi dahil |
| Model/workspace/IFC/review | 38/38, skip0 | geometry-regression; native codec paketi yeniden koşulmadı |
| FEM/adversarial/analiz | 37/37, skip0 | modal-integrity; gerçek modal dalında Y/RZ=null; solver tam kabulü değil |
| Rapor/UI/script/test ESLint | exit0, hata/uyarı0 | lint-closure |
| Solver ESLint | FAIL exit1, hata2/uyarı1 | lint-modal; before/current JSON imza farkı0, borç sürüyor |
| Genel TypeScript | FAIL exit2, tanı552 | general-tsc-closure; P00 567, yeni imza0 |
| Production build + uygulama TypeScript | exit0, 684/684 | build-verified; yalnız yerel izole dist; deployment yok |
| Production tarayıcı | 2/2 | browser-verified: model import→UI→PDF yeniden açma, gerçek başarısız analiz, masaüstü390px/koyu tema; JS hata kontrolü |
| PDF renderer/yerleşim | exit0 | pdf-examples-final:4/16 sayfa, tüm100eleman, son başarısız kayıt; dış glyph0;1/2/son sayfalar render; seçili görseller gözle incelendi |
| Kaynak/hash/HEAD/başlangıç koruması | Ayrı kapanış JSON | preservation-and-closure.json; kaynak ve test sürümü final-source-snapshot ile bağlı |
| Gerçek proje nihai eşdeğerliği / yeni donatı / kabuk / temas / merdiven | NOT RUN | P01/P03–19 kabul işi; sentetik renderer ön kayıtları solver oracle sayılmaz |

Başarısız ara koşular saklandı: PDF.js yanlış cleanup API'si, ilk UI asserted durum/sekme seçimi ve hatalı Görüntü/Görünüm ara değişikliği, geçersiz eski test kabulleri, ilk yardımcı script null tipleri ve ESLint state-effect, PDF kanıt/log klasörünün aynı adla çakışması. Üretimde hata toleransı gevşetilmedi; doğru kaynak/cleanup/nullable durum/seçici/ayrı çıktı yoluyla düzeltildi. İlk production tema hatası yanlışlıkla eski artifact sanıldı; son inceleme iç durum dönüşümünü gösterdi, ara değişiklik geri alındı. Son production build ve browser aynı sabit kaynakla koşuldu. Önceki loglar başarılı sonuç yerine sayılmadı.

## Aşama 03 — sürümlü sözleşme ve ayarlar

`asama-03` bounded result/job/stdout/stderr dosyaları; zaman/komut/hash TASKS.json'da. P02 sonuçları tarihsel kalır.

| Kontrol | Sonuç | Kanıt / sınır |
|---|---|---|
| Şema/migration/birim/model/workspace/M5 |48/48, skip0 | schema-final-v3: geometri/opaque legacy arşivi, kimlik/idempotence, bilinmeyen/source, qt ayrımı, R used=null, yük/malzeme/mekanik bağlantı/donatı sözleşmesi negatifleri, birim dönüşümü |
| İlgili lint | exit0, hata/uyarı0 | lint-final-v3; yeni modüller/UI/testler/config |
| Yerel production build + uygulama TS | exit0,684sayfa | build-final-v3; izole dist, deploy yok |
| Production tarayıcı |3/3 | browser-final-v3: kaydet/indir/aç, gerçek hata odağı, qt/ks birimleri, kaynak/arşiv/proje izolasyonu, mobil390px, eski metraj PDF/dark regresyonu, uyumsuz legacy engine çalıştırma engeli |
| Genel TypeScript | FAIL exit2,552tanı | general-tsc-final-v3; önceki552, yeni imza0; ilk553 koşusunda test AssertPredicate hatası düzeltildi |
| Kaynak/HEAD/özgün koruması | kapanış JSON |20özgün/5kullanıcı/12son kaynak; başlangıç131aynı+9yetkili değişiklik |
| Yeni solver/native REA/nihai kurum PDF | NOT RUN | P03 veri/UI kabulü; P01 kaynak/native kapıları devredilir. Donatı/yük sözleşmesinin saklanması fiziksel hesap kabulü değildir. |

İlk build/browser geçti; ardından mekanik bağlantı/donatı/kesit/boşluk sözleşmesi sıkılaştırıldı ve son kaynakla build/browser yeniden doğrulandı. Üç browser senaryosu ve48domain yalnız final koşudan sayılır. Ara sonuçlar ayrıca saklıdır; tekrarlı koşular test sayısına eklenmedi.

## Aşama04 — gerçek koşular ve kaynak eşleştirme

| Kontrol | Sonuç | Sınır / kanıt |
|---|---|---|
| Coverage + native index/workspace |15PASS,5SKIP,0FAIL | coverage-tests-final;5eski IFC acceptance fixture testi atlandı; native trial/CDE workspace ve3gerçek v10 örneği kapsandı |
| Üç gerçek proje coverage/mutasyon | exit0 | real-probe-final; kaynak hashleri, tek G değişimi izolasyonu; solver acceptance=false |
| İlgili lint | exit0 | lint-final; yeni API/script/test |
| Genel tsc | FAIL exit2,552tanı | general-tsc-final; P03'te552, yeni imza0 |
| REA repo statik aday doğrulaması | exit0 | rea-static-verification6Kasım;11aday/13vftable/292pointer, bozuk COL negatifleri; serializer değildir |
| Ghidra cold araması | TIMEOUT124 | material-search max600s; owned-tree taskkill exit0; snapshot/serializer başarı sayılmadı |
| Build/browser/yeni native decoder/solver | NOT RUN | Yeni yardımcı API mevcut runtime import akışına bağlanmadı; önceki sonuç bu aşamada yeniden test sayılmaz |

5Kasım koşularının sonucu6Kasım kapanışında güncel kaynak/kanıt hashleriyle eşleştirildi.6Kasım coverage API'nin3testi yeniden geçti; bunlar önceki15'e dahildir, sayılar toplanmaz. Önce/sonra kaynak hashleri aynı. Aşama04 kabulü kısmi: native→yapısal proje→solver malzeme/yük/ayar/donatı zinciri tamamlanmadı. Mevcut kaynak korunumu/kapsam testi bu eksik hesabı PASS yapmaz.

## Aşama05 — açık yük/kütle/preflight

| Kontrol | Gerçek sonuç | Kanıt / sınır |
|---|---|---|
| Domain |13/13,skip0 | domain-verified: poligon/üçgen/delik/ötelenme/kat/zonal kütle ve paralel eksen, yoğunluk×hacim, G/Q/birim, şerit force+moment dengesi, fiziksel yük sahibinin çift uygulanması, native/unknown reddi, graph/thermal/eksik malzeme sınırları |
| Lint | exit0 | lint-verified; yeni modüller/test/CLI/fixture üretici |
| CLI hazır ve tekrar |0/0; byte-eşit | cli-ready-final/cli-repeat-final; analysisApproved=false |
| CLI eksik malzeme | beklenen exit2 | cli-blocked-final; blocked JSON, uygunluk verilmedi |
| CLI girdi üzerine yazma | beklenen exit1 | cli-overwrite-final; kaynak hash aynı |
| Native G/Q kaynak araştırması | exit0, kabulfalse | g-semantics/verification;3seçili G eşit/Q farklı; kesin revizyon farkı veya genel öz ağırlık semantiği iddia edilmez |
| Genel tsc | FAIL exit2,552tanı | general-tsc-verified; önceki552, yeni imza0 |
| Build/browser/gerçek bina FE reaksiyonu | NOT RUN | İlk profil CLI/diagnostic teslimi; yeni sayısal solver P06. Şerit statik oracle, bina çözümü değildir |

Ara koşular son kaynak/test artışından önceydi ve saklandı;13test final koşudan sayılır. Yeni model için açık verili profil hazır olabilir; native/unsupported aileler blocked kalır. Mevzuat veya gerçek bina kabulü verilmedi.

## Aşama06 — 6 Kasım 2026 son kaynak

| Kontrol | Gerçek sonuç | Kanıt / sınır |
|---|---|---|
| Statik domain/negatif/ağ |32/32,skip0 | closure-tests-refined; analitik çubuk/sürekli kiriş, patch, Navier ince/kalın, temas/delik/etkileşim, açıklıklı perde64ağ, mekanizma/bütçe/iptal |
| Lint |exit0 | closure-lint-final; yeni runtime/test/benchmark/Worker |
| Uygulama TypeScript |exit0 | application-tsc; tsconfig.next.json, noEmit |
| Genel TypeScript |FAIL exit2,552tanı | closure-tsc-final; P05'e göre yeni/çıkan imza0, general-tsc-delta.json |
| Karma bina ölçeği |PASS,84,96s/RSS719MB | mixed-building-benchmark:1600düğüm,4224çubuk,1176kabuk;120s/1,5GB/4m/denge1e-4sınırları önceden seçildi |
| Chromium Worker |PASS,73,97s | browser-worker-final; aynı karma ağ, canlı ana thread, terminate/invalid_input; production UI testi değildir |
| Koruma/kapanış |PASS | closure-audit;20özgün,5başlangıç dosyası,53önceki kaynak,16yeni kaynak ve HEAD/main |
| Linux/production build/native REA/nihai PDF |NOT RUN | Bu aşamada bağımsız sayısal profil; önceki REA sonucu yeni koşu sayılmadı |

Ara başarısızlıklar: shell-tests-01 test kodu hataları; browser-worker TSX __name harness hatası; closure-tests-final açıklıklı perde32ağ%4,7057>%3. Sonuncuda hedef gevşetilmedi;64e inceltildi. Eski frame/kernel-only ve önceki büyük frame-only koşular final karma ağ kabulünün yerine sayılmadı. Bütün loglar korundu.

## Aşama07 — 6 Kasım2026 kapanışı

| Kontrol | Gerçek sonuç | Kanıt / sınır |
|---|---|---|
| Son domain ve statik regresyon |57/57,skip0 | closure-domain;25dinamik+32P06;bağımsız SDOF/iki kat/torsiyonlu3B oracle, yakın/eş18mod, kaynaklı spektrum/CQC, üst-alt/dışmerkezlik/yay/radye ve negatifler |
| Son lint / uygulama TS |exit0/0 | closure-final-lint, closure-final-app-tsc |
| Genel TS |FAIL exit2,552tanı | closure-final-tsc;P06'ya göre yeni/çıkan imza0,multiset imzalar eşit |
| Bina ölçeği modal |PASS55,42s/RSS554MB | building-modal-benchmark;792düğüm/4536serbestDOF/2016çubuk/525kabuk;19mod,özdeğer artığı<=2,36e-8 |
| Bütün eleman spektral paket |PASS56,23s/RSS516MB | building-response-benchmark;CQC/işaret/kovaryans bütün elemanlarda, beta1,12592;eşdeğer periyot1s açık fixture varsayımı |
| Son Chromium Worker |PASS47,69s | browser-dynamic-final;19mod/gerçek spektrum işi/4773canlılık tick'i/invalid/terminate;UI testi değildir |
| Kaynak PDF edinme/görüntü |PASS,416sayfa/14incelenen sayfa | tdmd-fetch,source-extract-02/additional;source-manifest görselSHA;amendmentSetVerified=false |
| CLI hazır/tekrar |0/0,byte-eşit | cli-ready/repeat;engineeringAcceptance=false |
| CLI eksik/üzerine yazma |beklenen2/1 | cli-blocked/overwrite;kaynak hash korundu |
| Koruma |PASS | closure-audit;20özgün/5kullanıcı/67önceki kaynak,2izinli refactor/22son kaynak,HEAD/main aynı |
| Native yeni REA/üç gerçek proje uygunluğu/Linux/production build/nihai PDF |NOT RUN | Önceki REA sonucu yeni test sayılmaz;numerical profil/UI entegrasyonu ayrıdır |

Büyük modal/response ve browser koşuları son yay/zemin reaksiyon alanları eklenmeden yapıldı; bu alanların sayısal oracle'ı son domain'dir. İlk18mod örneğinin büyüme koşulu ve EB/Timoshenko fixture uyumsuzluğu ara başarısızlığı saklıdır; tolerans gevşetilmedi. AFAD/CSB/RG ağ denemeleri22/56/28,fitz bağımlılığı denemesi1 ile başarısızdı;Poppler+pypdf mevcut ortamla geçti. Yeni sonuçlar önceki statik/native kabul yerine kullanılmaz.

## P08 gerçek son koşular

Kanıt: asama-08. Önceki büyük Worker/native/REA sonuçları bu aşamanın yeni testi sayılmadı.

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Sayısal/global/şema regresyonu |85PASS,0FAIL,0SKIP |domain-final-07;57P06/P07+9P03+19P08 |
| Lint / uygulama TS |exit0/0 |lint-07,app-types-06 |
| Genel TS |FAIL exit2,552önceki tanı |final-types-07;P07 ile imza multiset eşit,yeni/çıkan0 |
| Yerel production build |exit0 |build-02;UI son düzeni,engine entegrasyonu değildir |
| Yerel production browser |4PASS |browser-02;review→localStorage→indir→aç→revizyon;P03birim/izolasyon ve eski motor/eksik PDF;mobil görüntü görüldü |
| Gerçek R döngüsü |6→4.8,iki iterasyon |examples-final/ready-output;ham X kesme26.7833→27.2308kN,deplasman1.33205e-5→1.35527e-5m |
| Bodrum gerçek çift yükleme |checks_ready,nihai kabulfalse |examples-final/basement-output;hakim mod karşılığı,alt kütle4.65896kN ve bölgesel kuvvet sınırları |
| CLI |0/0/0/2/2/1 |cli-closure-ready/basement/repeat/missing/bounded/overwrite;tekrar byte-eşit,girdi SHA korundu |
| Kaynak görüntü |24sayfa incelendi |source-manifest;416sayfalık özgün teknik ek,tadil setifalse |
| Koruma/son snapshot |closure-audit |20özgün/5kullanıcı;2amaçlı P03kaynak değişikliği,diğer önceki kaynaklar aynı;HEAD/main aynı |

İlk kayan nokta kesin eşitlik testi,nullable TS ve readonly fixture TS hataları düzeltildi;başarısız/ara loglar saklı. İlk mobil formda etiket sıkışması vardı;son class düzeni ikinci build/browser/görüntüyle doğrulandı. Son controller mod-aile/kat-kapsam ekleri UI'da bağlı değildir;son domain/uygulama tsc ile ayrıca doğrulandı. Native üç proje karşılaştırması,bağlı pier FE kabulü,nihai PDF,gerçek Linux ve büyük P08 Worker benchmark yapılmadı.

## P09 gerçek son koşular

Kanıt asama-09;UI değişmediği için yeni build/browser/nihai PDF koşusu yapılmadı.

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Kiriş+P03/P06–P08 domain |104PASS,0FAIL,0SKIP |domain-01-06;19yeni kiriş+85önceki regresyon |
| Son lint / uygulama tsc |0/0 |lint-final-06,app-types-06 |
| Genel tsc |FAIL552önceki tanı |general-types-06;P08ile imza multiset eşit,yeni/çıkan0 |
| Bağımsız kesit/sehim oracle'ı |PASS |tek donatı kuvvet/moment,çift donatı elastik basınç çeliği kapalı kök,T/tersyön,gerçek P06qL²/8 ve5qL⁴/384EI,qL⁴/384EI |
| Detay/etkileşim/yeniden tasarım |PASS |net aralık,sığmama,kötü kesme/burulma,ankraj/lap,süre/çatlak,gerçek FEtorque,gerçekN'li kapasite kesmesi,eski snapshot/eksik/bütçe |
| Son CLI |0/0/0/0/2/2/2/1 |cli-last-ready/higher/twelve/repeat/missing/failed/budget/overwrite;examples-final/last-*-output |
| Girdi/tekrar |SHAkorundu,byte-eşit |closure-audit;wxüzerine yazma reddi |
| Kaynak PDF |81sayfaTS500+416sayfaTBDY,31sayfa görüntüden |ts500-fetch/source-extract/source-manifest;tadil zincirifalse |
| Koruma |closure-audit |20özgün/5kullanıcı,önceki kaynaklar veHEAD/main;son kaynak SHA |
| Yeni REA/native/UI/Worker/Linux/build/browser/nihai PDF |NOT RUN |Önceki kanıt yeni test değildir;motor henüzUI'da bağlı değil |

İlk min-etriye assertion'ı/sınır fixture'ları ve yetersiz katalog araması başarısızdı;sonlu denge elemesi sonrası yüksek yük aynı25kN/m ile geçti. İlk C30/fctk/Ec örtük varsayımı kaldırılıp açık tablo/denklem/deney temeli eklendi;son fixtureC25tablo değerleridir. Parse ve UTF8 terminal çıktı hataları giderildi. Eksik servis verisi önce budget_exhausted oluyordu;son test/CLI'da incomplete. Başarısız ara koşular saklı,tolerans gevşetilmedi.

## P10 son doğrulama

asama-10/domain-last: 124/124, skip0; 20 yeni test. Bağımsız tek eksenli kesit/analitik daire/600×600 lif oracle; N değişimi, iki eksen, dönüş/öteleme, Euler/ββs, çift büyütme engeli, gerçek çirozlar, yüksek talep, katalog bütçesi, tüm ULS kesmeleri, iç/kenar/köşe/tek taraflı/çatı, gerçek donatıyla başarısız güçlü kolon, eksik/eski/geçişli topoloji ve kat kapsamı var. Lint-last sıfır uyarı, app-types-last geçti; general-types-last exit2/552eski tanı, yeni/çıkan0. CLI hazır/12/tekrar0, eksik/eski/etriye/zayıf kolon2, ezme1; 24kolon/48kiriş/12joint ve byte eşitliği audit edilir. Başarısız ara loglar saklı. Yeni UI/build/browser/REA/native/Linux/Worker/nihai PDF koşusu yok.

## P11 — 6 Kasım 2026 son doğrulama

Kanıt: `asama-11/domain-final-02`, `lint-final-02`, `app-types-final-02`, `general-types-final-02`. Gerçek son bounded domain koşusu 147/147 (124 regresyon + 23 yeni), fail/skip 0; lint sıfır uyarı ve uygulama TypeScript başarılı. Genel TypeScript exit2/552 eski tanı; imza çokluğu değişmedi, PASS değildir.

Bağımsız kesit/lif integrali, eksen dönüşümü, gerçek FE kesit dengesi, uzaysal çiroz kaybı, kenetlenme/çakışma, tüm kesit tarafları ve bilinmeyen/sıfır ayrımı test edildi. Gerçek global Ω/R yeniden çözümü, yeni 6 perde/1 bağ kirişi ve eski imza reddi doğrulandı. P08 Denklem 4.28 karesi bağımsız sınırsız Ct örneğiyle sınandı. CLI `cli-last-*`: hazır/12/çapraz/global/iki tekrar child0; eksik/başarısız/bodrum/bağlantı/eski/yeniden-üretim-gerekli child2; üzerine yazma child1. Negatif koşuların dış runner exit1 olması başarı diye yorumlanmadı. Üye ve sistem tekrarları byte-eşit.

`convergence.json`: 64/128/256/512 hücre; son iki fark %0,3062 ve %0,07653, denge artığı <2,3e-13. İlk kaba ağ yakınsama hatası ve ara başarısız loglar saklı. 16 kaynak sayfası görüntüden incelendi. Yeni UI/build/browser/Worker/Linux/REA/native/nihai PDF testi yapılmadı; önceki kanıtlar yeni koşu sayılmaz. Kapanış `preservation-and-closure.json`; ayrıntı P11_WALL_DESIGN.md.

## P12–P14 bütünleşik kayıt — 7 Kasım 2026

Son final-domain201/201skip0, final-lint-02 sıfır uyarı/exit0, final-app-types-02 exit0; final-general-types exit2/552eski tanı, yeni/çıkan0. Koordinatör11/11; P12:14, P13:14, P14:15 yeni test. 64x64 gerçek FE,32→64 Mxy farkı%0.7873; Navier sehim%0.004115. 8M açık benchmark bütçesi; başarısız 2M ve%2.54 denemeleri saklı. Yeni UI/build/browser/Linux/Worker/REA/native/nihai PDF koşusu yok. Kanıt asama-12-14; P12_P14_INTEGRATION.md.
