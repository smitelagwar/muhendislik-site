# Hsyncad ile ideCAD Statik Rapor & Metraj Birebir Eşleşme ve REA Uygulama Rehberi

**Tarih:** 14 Kasım 2026  
**Amaç:** Orijinal `.ide` / `.ide10` projeleri Hsyncad’de açıldığında **hesap tutarlılığı, mühendislik kuralları, bölüm/seçenek kapsamı, görsel kalite, sayfa sayısı (ör. 311–954+ sayfa + metraj) ve tek PDF teslimi** bakımından ideCAD Statik ile birebir eşleşen kusursuz çıktı üretmek.  
**Hedef Kapsam:** Kişisel yerel Windows kullanımı + tam bağımsız Hsyncad mühendislik motoruna geçiş yol haritası.  
**Temel Kaynaklar:** `D:\IDM_DOWNLOAD\` altındaki 3 gerçek `.ide10` + PDF çıktı seti, kurulu `C:\Program Files\ideCAD\ideCAD Statik 11 Deneme`, `C:\Users\hsyn\Desktop\hsyncad\rea` (`v6.9.0`) + `C:\ghidra\ghidra_12.1.4_PUBLIC` ve mevcut `src/lib/hsyncad/` modülleri.

---

## 0. Kesin Sınırlar ve Lisans / Güvenlik Çerçevesi

1. **Deneme Kısıtı veya Lisans Aşımı Yapılmaz:** `ideCAD Statik 11.28 Deneme` ve `ideRPTTrial.exe` üzerindeki *"Bu komut deneme sürümünde kullanılamaz"* engeli ile Sentinel LDK / HASP (`hasp_rt.exe`, `snvm_x64.dll`) korumalarını kırma, yamama veya atlatma kesinlikle kapsam dışıdır ve uygulanmaz.
2. **Meşru Clean-Room Tersine Mühendislik (REA):** REA araçları yalnızca kullanıcının kendi `.ide10` dosyalarının ikili şemasını, kurulu programdaki rapor şablon/veri paketleme mantığını, mühendislik hesap kabullerini ve donatı/metraj kurallarını çözüp **Hsyncad’in kendi okuyucu, çözücü ve PDF motorunu** birebir uyumlu hale getirmek için kullanılır.
3. **Sahte Sayı / Sabit Şablon Yasağı:** Hiçbir senaryoda eski PDF’lerden sayı kopyalanmaz (`HEAD:quantities.ts` içindeki `CERTIFIED_METRAJ_REFERENCE` benzeri sabitler kaldırılır), olmayan eleman boş tabloyla rapora eklenmez, başarısız tahkik "uygun" diye gizlenmez.

---

## 1. Eldeki Gerçek Varlık Envanteri: Seçeneksiz Değiliz!

Hsyncad elinde hem **ham proje dosyaları** hem **resmî ticari ideCAD 10 çıktıları** hem de **çalışır yapısal motor çekirdeği** bulunduğu için benzersiz bir doğrulama (oracle) avantajına sahiptir.

### 1.1 Üç Gerçek `.ide10` + PDF Oracle Çifti (Toplam 1.991 Sayfa Çıktı)

| Proje | Özgün `.ide10` (Boyut & SHA-256) | Ana Hesap Raporu | Kapak / Dizin | Metraj PDF | Ek Raporlar |
| :--- | :--- |---:|---:|---:|---|
| **MS1** (Mustafa Selvi 1. Kısım) | `145.671.130 B` (`00957781...`) | **606 sayfa** (`45.400.326 B`) | 4 sayfa | 4 sayfa | — |
| **MS2** (Mustafa Selvi 2. Kısım) | `48.753.119 B` (`0a4400a0...`) | **311 sayfa** | 3 sayfa | 4 sayfa | — |
| **SK** (Süheyla Kara) | `74.359.398 B` (`de92fa25...`) | **954 sayfa** | 3 sayfa | 4 sayfa | İskele 70 s. + Kalıp İskelesi 28 s. |

Basılı metraj hedefleri:
- **MS1:** C25 Beton `1.334,015 m³`, Kalıp `6.681,91 m²`, B420C Donatı `117.421,93 kg` (`61.412,19 kg` ince + `56.009,75 kg` kalın). *(Not: 13 Kasım'da aynı MS1 üzerinde 11.28 Deneme'de taze `F9` sonrası canlı metraj `123,68 t`, kayıtlı sonuçta `117,02 t` okunmuştur; bu fark sürüm/ayar/kayıt tazeliğinin izlenmesi gerektiğini gösterir.)*
- **MS2:** Beton `633,099 m³`, Kalıp `3.194,33 m²`, Donatı `55.149,22 kg` (`28.275,14` ince + `26.874,08` kalın).
- **SK:** Beton `1.873,479 m³`, Kalıp `9.680,89 m²`, Donatı `162.069,83 kg` (`79.331,95` ince + `82.737,88` kalın).

Bu 1.871 ana rapor sayfasının tamamı halihazırda `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-plan-2026-11-05\` altında metin/JSON sayfa dosyalarına (`mustafa-1-rapor.pages.json`, `mustafa-2-rapor.pages.json`, `suheyla-rapor.pages.json`) ve `D:\HsyncadHybridOS\rea-investigation\report-trace\REPORT_TRACE_MATRIX.json` içinde **855 satırlık** katalog izine dökülmüş durumdadır.

### 1.2 Hsyncad Kod Tabanında Halihazırda Hazır Olanlar

1. **İkili Okuyucu/Çevirici (`src/lib/hsyncad/ide-import/`):** `.ide10` (`201094`), `.ide11` (`211220`), `.ide11trial` (`211280`) zarf, CRC32, Blowfish float64 çözümü, kat ve taşıyıcı geometri (MS1 `1273`, MS2 `686`, SK `2171` kayıt) ve 14 Kasım'da düzeltilen `525/525` normal döşeme `Q` okuması (`p+513`).
2. **Bağımsız Hesap Çekirdeği (`src/lib/hsyncad/structural/`, ana repoda 60+ modül):** P06 seyrek LDLT 3B çerçeve + dikdörtgen kabuk + Winkler (`sparse-spd.ts`, `linear-structure.ts`, `shell-rect.ts`, `foundation-fe.ts`), P07 modal özdeğer + CQC/SRSS spektrum (`modal-eigen.ts`, `response-spectrum.ts`), P08 global TBDY (`building-classification.ts`, `global-checks.ts`), P09–P11 kiriş/kolon/birleşim/perde tasarımı, P12–P14 kısmi döşeme/radye/merdiven profilleri.
3. **İzole Rapor/Metraj Prototipi (`D:\HsyncadHybridOS\controller\runs\hsyncad-luna-v4\repo\src\lib\hsyncad\reporting/`):** 2 geçişli deterministik `jsPDF` (`IBMPlexSerif` Türkçe font, dinamik içindekiler linkleri, tablo başlığı tekrarlı sayfa bölme), P15 `reinforcement-schedule.ts` (fiziksel çubuk/kanca/etriye metrajı) ve `analytical-report-pipeline.ts` (şimdilik yalnız tek kiriş açık-girdi hattı doğrulandı; önceki `model-report-adapter.ts` sahte donatı nedeniyle karantinaya alındı).
4. **Yerel Rapor İş Akışı (`ASAMA2-3-DURUM-2026-11-14.md`):** `local-report-dialog.tsx`, `ide-source-report.ts` ve `.rpt` (`193 B`) ayar profili; şu an yalnızca seçili ağaçta `treeIdx` 1 ve 3 + kaynak kat/döşeme Q verisini basabildiği için 22–28 sayfa çıkmaktadır.

---

## 2. Kritik Teşhis: REA Reposu Bugüne Kadar Neden "Olmadı"? (5 Somut Neden)

Önceki denemelerde REA aracının yetersiz sanılmasının arkasında **5 tamamen teknik ve çözülebilir kurulum/strateji hatası** vardır:

1. **Antigravity / IDE MCP Kaydında `GHIDRA_INSTALL_DIR` ve `JAVA_HOME` Eksikliği:**  
   5 Kasım'daki `rea-readiness.json` ve 14 Kasım'da çalıştırılan canlı `rea doctor --client antigravity --json` çıktısı aynı gerçeği göstermektedir: Terminal CLI üzerinde Ghidra `12.1.4` ve JDK `21.0.12.1` tamamen `healthy` görünse de **`registration_environment:antigravity` -> `unknown` (`Its registration does not record GHIDRA_INSTALL_DIR, JAVA_HOME`)** durumundadır (öncesinde `java.exe` Win32 Error 87 veriyordu). Yani MCP sunucusu arka planda Ghidra ortam değişkenlerini görmeden başlamıştır.
2. **223 MB Monolitik EXE Üzerinde Soğuk `600 sn` Zaman Aşımı ve `-deleteProject` İsrafı:**  
   `ideCAD_Statik_11_Deneme.exe` **223.081.544 bayt** dev tekil ikilidir. Soğuk tam analiz başlatıldığında `600s` (`exit 124`) zaman aşımına düşülmüştür (`REA_UNKNOWN_LEDGER.json#L137`). 7 ve 13 Kasım denemelerinde ise timeout aşmak için `-noanalysis` ile çalıştırılıp sadece iki fonksiyon adresi (`0x1403804e0`, `0x140dccb70`) okunduktan sonra **`-deleteProject`** bayrağıyla Ghidra projesi hemen silinmiştir (`ghidra-producer/result.json#L11-L19`). Oysa REA v6.9.0 içinde kalıcı önbellek (`REA_GHIDRA_CHECKPOINT_DIR`) veya diskte tek seferlik ön-indekslenmiş `.gpr` projesi tutulursa sonraki her XREF/decompile sorgusunda 223 MB ikili yeniden açılmak zorunda kalmaz.
3. **Yanlış İkililere Odaklanma (Küçük Altın Madenleri Atlandı):**  
   Tüm emek 223 MB ana EXE'ye gömülürken kurulum klasöründeki asıl hızlı çözülebilir dosyalar hiç analiz edilmedi:
   - **`ideRPTTrial.exe` (`5.144.648 B`) ve `ideRPT.exe` (`5.298.760 B`):** Sadece ~5 MB boyutundadır; 223 MB ana EXE'ye kıyasla çok daha küçük olduğu için Ghidra'da hızlıca tamamen analiz edilip `IDERPT FILE 11.00` (`iderpt.tmp`) veri blok yapısını ve tüm rapor bölümlerinin kayıt etiketlerini ortaya koyabilir.
   - **`database\report.rpt` (`65.536 B`), `Group By Stories.rpt`, `Group By Components.rpt`, `Construction Cost.rpt`:** İçlerinde `Crystal Reports ActiveX Designer`, `ReportInfo`, `QESession` barındıran standart OLE2 bileşik belgelerdir; doğrudan şablon/tablo/kolon adları okunabilir.
   - **`ASCALC.EXE` (`103.040 B` — "As Calculator"):** ~101 KB (`103.040 B`) boyutunda küçük hesap aracı.
   - **`database\StructuralSections\TR.json` (`1.334.546 B`) & `components.mdb` (`118.784 B`):** Yapısal kesit ve bileşen veri tabanları.
   - **Kurulum Klasöründeki İki Resmî Kılavuz PDF'i:** `ideCADSonluElemanlarKilavuzu.pdf` (`5.769.732 B`) ve `ideCADStatikIDSv102018TDBYUyumlulugu.pdf` (`5.880.411 B`) — ideCAD'in sonlu eleman ağ, diyafram, bodrum, burulma ve TBDY 2018 kabullerini zaten doğrudan belgelemektedir.
4. **Yalnız `RT_DIALOG` Kaynak Haritasında Kalıp C++ `Serialize()` / Hesap Zincirine İnilememesi:**  
   Önceki REA turları yalnız 744 diyalog ve 11 RTTI adayını listeledi (`REA_UNKNOWN_LEDGER.json` `R1–R8`). Hiçbir turda diyalog kontrol ID'sinden (`DDX_Text`, `DoDataExchange`) başlayıp sınıf üye offsetine → `Archive::Serialize` okuyucu/yazıcısına → tasarım/rapor fonksiyonuna kadar XREF yürüyüşü tamamlanmadı.
5. **`.ide10` Dosyasının İçindeki 411 MB Sıkıştırılmış Verinin Görmezden Gelinmesi:**  
   14 Kasım bayt taramasında `MUSTAFA SELVİ 1.KISIM.ide10` (`145.671.130 B`) içinde **30.261 adet geçerli `zlib` akışı** tespit edildi. Bunların sıkıştırılmış toplamı `115.262.142 B`, açılmış toplam veri boyutu ise **`411.653.897 B` (~411 MB)** tutmaktadır! Özellikle `40 MB – 140 MB` aralığında binlerce sabit yapılı `13.564 B` (`0x0d3e = 3390` float32 blok başlığı) sıkıştırılmış vektör/sonuç/ağ bloğu yer alır. Hsyncad'in mevcut `ide-import/index.ts` okuyucusu yalnızca ilk 30 MB'taki ham geometri başlıklarını tarayıp bu 30.261 sıkıştırılmış bloğun neredeyse tamamını atlamaktadır. Üstelik `MS1` açılıp **hiç F9 basılmadan** doğrudan 606 sayfalık rapor ve `117,02 t` metraj üretebilmesi, hesap ve donatı verisinin `.ide10` içinde zaten taşındığını kanıtlamaktadır.

---

## 3. ideCAD'in 606 / 311 / 954 Sayfa Çıktısı Nelerden Oluşuyor?

Hsyncad neden şu an 22–28 sayfa çıkarıyor, ideCAD neden 606 sayfa çıkarıyor? `mustafa-1-kapak.txt` sayfa dağılımı farkı tek bakışta açıklar:

| Ana Rapor Ailesi | `MS1` Sayfa Aralığı | Sayfa Adedi | İçerdiği Başlıca Tablolar ve Hesaplar | Hsyncad Mevcut Durumu |
|---|---|---:|---|---|
| **Yerleşim Şekilleri** | s. 1–7 | **7** | 6 kat kalıp/taşıyıcı planı + 1 temel planı vektör çizimi (etiket, kesit, G/Q) | Yok (yalnız metin tablo) |
| **Genel & TBDY & Modal & Düzensizlik** | s. 8–45 | **38** | Çatlamış kesit `4.5.8`, yük kombinasyonları, 12 modal seri (`Modal'`, `E1..E4`, `BE1..BE4`, `Modal-B'`), `B1` azaltması, devrilme, göreli öteleme, 2. mertebe | Yalnız kat bilgileri + statik/modal motoru UI'ye bağlı değil |
| **Döşemeler** | s. 46–74 | **29** | Ön bilgi, yük analizi, **duvar yükleri (7 s.)**, kalınlık, donatı hesabı, bant kiriş, sehim, zımbalama, `7.11.3` / `7.11.5` | Yalnız G/Q özet satırları |
| **Kirişler** | s. 75–284 | **210** | Yük analizi, kiriş yükleri (`19 s.`), **bodrumlu tasarım kuvvetleri (`70 s.`)**, **kiriş bilgisi ve statik sonuçları (`51 s.`)**, **betonarme hesabı (`25 s.`)**, dengeli donatı, kesme, burulma, sehim/çatlak, askı | Yalnız tek kiriş P17 demosu var; tüm bina bağlı değil |
| **Kolonlar** | s. 285–286 *(SK'de yüzlerce s.)* | **2** *(SK'de ana blok)* | Kolon burkulma, güçlü kolon (`Vis/Vik`), kolon betonarme/kesme/normal kuvvet *(MS1 perde ağırlıklıdır; SK gerçek kolon testidir)* | Yalnız `P10` sınırlı profil |
| **Perdeler** | s. 286–463 | **178** | **Bodrumlu tasarım kuvvetleri (`71 s.`)**, **perde bilgileri ve statik sonuçları (`78 s.`)**, eğilme momentleri (`7 s.`), betonarme/kesme/güçlü perde/eksenel | Yalnız `P11` sınırlı profil |
| **Radye Temel** | s. 464–562 | **99** | Ön bilgi, **sonlu eleman bilgileri (`30 s.`)**, kolon/perde yükü (`19 s.`), **taban basıncı (`45 s.`)**, ilave donatı, zımbalama | `P13` tek yön kesme blokeli; FEM çıktısı rapora bağlı değil |
| **Merdivenler** | s. 563–606 | **44** | 7 merdiven × (genel bilgi + kol yük/statik + kol betonarme + sahanlık hesabı) | `P14` parametrik profil; tam bağlı değil |
| **Kapak + İçindekiler** | Ayrı `KAPAK.pdf` (3–4 s.) | **4** | Proje künyesi + gerçek sayfa numaralı 170+ alt satırlı TOC | Eksik (bölüm ağacının ~%1'i) |
| **Metraj Eki** | Ayrı `METRAJ.pdf` (4 s.) | **4** | Kalıp (`m²`), Beton (`m³`), Ø8–Ø32 Çap & İnce/Kalın Donatı (`kg`), Genel Toplam Özeti | `HEAD` sahte referans; `P15` henüz modelden bağlanmadı |
| **TOPLAM (`MS1`)** | — | **614 s.** | **Tek Birleşik PDF Hedefi: Kapak + TOC + 606 s. Statik + 4 s. Metraj** | **~22–28 s.** |

---

## 4. Stratejik Mimari Karar: Birebir Eşleşmeye Nasıl Ulaşılır?

Tek bir "ya hep ya hiç" yolu izlemek yerine, aynı altyapıyı besleyen **Çift Katmanlı Mimari** benimsenmelidir:

| Yaklaşım | Çalışma Mantığı | Doğruluk / Hız / Risk | Önerilen Rol |
|---|---|---|---|
| **Mod 1 — Tam Yerel `.ide10` Doğrulamalı Okuma + Bağımsız Çapraz Hesap (Önerilen Kişisel Hızlı Yol)** | REA ile `.ide10` içindeki **411 MB zlib bloklarında** kayıtlı F9 sonuçları, eleman donatıları, yükler ve ayarlar okunur; aynı anda Hsyncad `structural/` motoru da çalıştırılarak sonuçlar çapraz doğrulanır (`% fark = 0` veya sapma uyarısı). | `.ide10` içinde F9 verisi varsa **sayısal ve metraj bazında %100.000 birebir eşleşme** birkaç fazda yakalanır. | **Faz 1–3'ün birincil kişisel çalışma modu.** |
| **Mod 2 — Tam Bağımsız Hsyncad Mühendislik Motoru ("İkiz Çözücü")** | Sıfırdan çizilmiş veya F9 çalıştırılmamış projelerde `P05–P15` motoru ideCAD kabulleriyle (`4.5.8` çatlamış kesit, `3.3.1.1.b` bodrum, `CM2` benzeri döşeme/radye ağı, donatı seçim kuralları) birebir aynı algoritmayla hesaplar. | Ağ boyutu/düğüm yuvarlamaları nedeniyle başlangıçta `%0.5–%3` farklar kalabilir; **3 gerçek PDF (`1.871 s.`) + yeni `iderpt.tmp` akışlarıyla** kalibre edilir. | **Faz 2–5 kalibrasyon hedefi (Web + bağımsız masaüstü).** |

**Önemli Mühendislik İlkesi:** İki mod aynı ara veri modelini (`StructuralProject` → `AnalysisResults` → `ReinforcementModel` → `TakeoffResult` → `ReportDocument`) besler. Böylece kaynak ister `.ide10` F9 önbelleğinden gelsin ister Hsyncad'in kendi FEM/TBDY çözücüsünden üretilsin, **rapor dizgicisi ve metraj motoru aynı standart çıktıyı üretir.**

---

## 5. REA'yı Gerçekten Sonuç Alacak Şekilde Kullanma Protokolü

Bundan sonraki REA çalışmalarında "zaman aşımı / proje silinmesi / sonuçsuz arama" döngüsünü kırmak için şu 6 kural zorunlu uygulanmalıdır:

### 5.1 Kurulum ve Kalıcı Ghidra Veritabanı (Tek Seferlik Hazırlık)
1. **MCP Ortam Onarımı:** `rea setup --client antigravity --skill=false --dry-run` önizlenip `mcp_config.json` içinde `GHIDRA_INSTALL_DIR = C:\ghidra\ghidra_12.1.4_PUBLIC` ve `JAVA_HOME = C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot` tanımlanır.
2. **Kalıcı Analiz Önbelleği (`-deleteProject` Yasağı):** Büyük ikililerde (`ideCAD_Statik_11_Deneme.exe`) her seferinde `-deleteProject` ile projeyi silmek yerine diskte `D:\HsyncadHybridOS\ghidra-cache\idecad11.gpr` kalıcı projesi oluşturulur (veya `REA_GHIDRA_CHECKPOINT_DIR` açılır). İlk analiz yalnızca hedefli analizörlerle (Strings, RTTI/Symbols, Entry Points, XREFs) tek seferde tamamlanır; sonraki sorgular doğrudan kayıtlı proje veritabanı üzerinden yürütülür.

### 5.2 Küçükten Büyüğe REA Okuma Sırası (Maliyet ve Kapsam Optimizasyonu)
1. **Aşama A — Şablon ve Ara Çıktı Yapısı (Hızlı Çözümlenebilir Hedefler):**
   - `C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\database\*.rpt` (`report.rpt`, `Group By Stories.rpt`, `Group By Components.rpt`, `Construction Cost.rpt`) OLE2 akışlarından Crystal Reports tablo şemaları, alan adları ve alt-rapor hiyerarşisi (`Subdocument 2..N`) çıkarılır.
   - `D:\HsyncadHybridOS\idecad-rapor-hizli-2026-11-13\asama4-kabul\ms1-1a-iderpt.tmp` ve `39,4 MB` `MS1-IDE-RAPOR-*.tmp` dosyaları (`"IDERPT FILE 11.00"`) ile **`ideRPT.exe` (`5,30 MB`)** Ghidra'da tam analiz edilir. Böylece 223 MB EXE'ye bile girmeden **ideCAD raporunun tüm bölüm başlıkları, satır etiketleri ve gömülü vektör/PNG blokları** %100 çözülür. *(Salt okuma amaçlıdır; Deneme export kilidine dokunulmaz.)*
   - **`ASCALC.EXE` (`103 KB`)**, `TR.json` (`1,33 MB`), `ideCADSonluElemanlarKilavuzu.pdf` (`5,77 MB`) ve `ideCADStatikIDSv102018TDBYUyumlulugu.pdf` (`5,88 MB`) indekslenerek teorik formül tablosu çıkarılır.
2. **Aşama B — `.ide10` İkili Konteyner & Zlib Blok Avı (`M0..M6` Diferansiyel Testi):**
   - Bilinen giriş noktalarından (`0x14098b600` okuyucu, `0x140989c30` yazıcı, `0x1409441c0` eleman fabrikası) başlayarak `MS1.ide10` içindeki **30.261 zlib akışının** indeks tablosu çıkarılır.
   - **Kritik M0 Deneyi (F9 Öncesi vs F9 Sonrası Diff):** Küçük bir temiz projede F9 yapılmadan `Ctrl+S` → `A.ide10`, ardından `F9` → `Ctrl+S` → `B.ide10` alınır. İki dosya tüm zlib akışları açıldıktan sonra karşılaştırılır. Bu tek deney **analiz sonuçlarının, modal periyotların ve hesaplanmış donatıların `.ide10`'un tam neresinde tutulduğunu** kanıtlar (`R5` ve `R8` kilidini açar).
   - **M1–M6 Tekil Mutasyonlar:** Yalnız bir ayar değiştirip (`E`, `qt`, döşeme `Q`, radye `Q`, kiriş donatı çapı, rapor seçeneği `.rpt`) kaydederek C++ `Serialize()` alan offsetleri doğrulanır (`R1–R4`, `R7`).
3. **Aşama C — 223 MB EXE Cerrahi XREF Zinciri (`R1–R8` Eksiksiz Kapanış):**
   - `RT_DIALOG` kimliklerinden fonksiyon ağacına yürünür:
     - `2708` + `0x145d79260` → Malzeme bağları (`C25`, `B420C`, `E`, `γ`) [**R1**]
     - Döşeme / Radye G-Q okuyucu + öz ağırlık düşüm kontrolü [**R2**]
     - `442` → Zemin `qt`, Winkler `ks`, yapı-temel etkileşim, negatif gerilme iptali [**R3**]
     - `346` + `mustafa-1-toc-p003-l020` (`K301`) → Donatı seçim ve çap/adet yerleştirme rutini [**R4**]
     - `0x1403804e0` ve `0x140dccb70 -> 0x141f686d0` (`iderpt.tmp` yazıcısının çağrı ebeveynleri) → 146 seçenek bayrağının hangi `if/else` ve boş-eleman filtrelerinden geçtiği [**R6**]
     - `13740` → Metraj kesişim/kalıp düşümü ve çubuk kesim yuvarlama kuralları [**R7**]

---

## 6. Kusursuz Birebir Eşleşme İçin 5 Fazlı Teknik Yol Haritası

### Faz 0 — Ortam, Şablon Envanteri ve Zlib Haritası
- [ ] Antigravity + Terminal `rea` ortamının kalıcı `.gpr` / `REA_GHIDRA_CHECKPOINT_DIR` ile yapılandırılması.
- [ ] `ideRPT.exe` (`5,30 MB`), `database\*.rpt` ve `iderpt.tmp` ikili akış çözücüsünün çıkarılması (`docs/hsyncad/IDERPT_FORMAT_MAP.md`).
- [ ] `ideCADSonluElemanlarKilavuzu.pdf` ve `ideCADStatikIDSv102018TDBYUyumlulugu.pdf` kılavuzlarından formül/kural tablosunun damıtılması.
- [ ] `M0 (F9 Öncesi vs F9 Sonrası)` ve `MS1.ide10` 30.261 zlib akışının ham envanter dökümü.

### Faz 1 — Eksiksiz `.ide10` Okuyucu (`P04+` Genişlemesi)
Mevcut `src/lib/hsyncad/ide-import/` yalnız kaba geometriyi ve normal döşeme Q'sunu okuyor. Birebir eşleşme için tamamlanması gereken alanlar:
- [ ] **Streaming / Web Worker Zlib Dekompresyonu:** `145 MB` `.ide10` -> `411 MB` açılmış veriyi tarayıcı belleğini taşırmadan chunk bazlı okuyacak Worker mimarisi (`ide-reader.worker.ts`).
- [ ] **Malzeme & Kesit Bağlama (`R1`):** Her kolon/kiriş/perde/döşeme/radye/merdiven kaydının gerçek malzeme indeksi (`fck`, `fyk`, `E`, `ν`, birim hacim ağırlık `γ`).
- [ ] **Tam Yük Modeli (`R2`):** Döşeme `G/Q` öz ağırlık anlamı, radye `G/Q` gerçek offseti, **duvar yükleri**, çizgisel/noktasal kiriş-döşeme yükleri, merdiven basamak/sahanlık yükleri, termal/ek yükler.
- [ ] **Analiz ve Zemin Ayarları (`R3`):** TBDY 2018 spektrum (`Ss`, `S1`, `Zemin Sınıfı`, `DTS`, `BKS`, `I`, `Rx/Ry`, `Dx/Dy`), bodrum katı rijitlik bayrağı, yatak katsayısı `ks`, zemin taşıma gücü/emniyet `qt`, çatlamış kesit `4.5.8` çarpanları, diyafram tipi (rijit / yarı rijit).
- [ ] **Topoloji & Yardımcı Öğeler:** Döşeme boşlukları (`holes`), akıllı merdiven bağlantıları, bant kirişler (`primitiveType 128`), sürekli temel/tekil temel/bağ kirişi/kazık kayıtları.
- [ ] **Varsa Gömülü F9 Sonuçları ve Tazelik Damgası (`R5`, `R8`):** `.ide10` içindeki kayıtlı kesit tesirleri, modal periyotlar, zemin gerilmeleri ve donatı dizilimlerinin model revizyon hash'iyle güvenli okunması (Mod 1 aktifleşmesi).
- **Kabul Ölçütü:** `MS1`, `MS2`, `SK` için her elemanın malzeme/yük/kesit/aks ilişkisi %100 doğrulanır, sıfır "default tahmin" kalır.

### Faz 2 — Çözücü, Yönetmelik ve Donatı Seçim Kalibrasyonu (`P06–P14` Kapanışı)
Ana çalışma ağacında (`MAIN_PORTAL` / `ASAMA2_WT`) ile `LUNA_V4_COPY` arasında ayrışmış modüller tek temiz omurgada birleştirilir ve açık mühendislik kapıları kapatılır:
- [ ] **Kabuk Ağ ve Bodrum İki Aşamalı Çözüm (`P06`, `P07`, `P08`):**
  - Döşeme/perde/radye kabuk ağ boyutu ve düğüm birleştirme toleransının `CM2` (`cm2fem_x64_57.dll`) ve `ideCADSonluElemanlarKilavuzu.pdf` ile hizalanması (MS1'de `0.837–0.840 s` mod periyotlarının %1 içinde yakalanması).
  - TBDY `3.3.1.1.b` + `4.8.5` iki yükleme/kütle durumlu (Üst Yapı `Modal E1..E4` + Bodrum `Modal BE1..BE4` + `Modal-B'`) çözüm ve `B1` (`0.60 ≤ 1.25ηci < 0.80`) otomatik `R` azaltmasının `MS1` ve `MS2` ile birebir uyumu.
  - Yük azaltması (TS 498 Madde 13 hareketli yük azaltması) desteğinin eklenmesi (`MS1` sayfa 401'de doğrulanmıştır).
- [ ] **Donatı Tasarımı ve Pratik Çubuk Seçim Kuralları (`P09–P11`):**
  - `K301` ve rastgele 20 kiriş/kolon/perde üzerinde ideCAD'in hangi çapları nasıl seçtiğinin (`RT_DIALOG 346` kuralları: montaj, pilye kullan/kullanma, ilave aralık yuvarlama, minimum etriye `Ø8/20` veya `Ø10/10` kuralları) birebir kodlanması.
  - `SK` projesiyle **kolon ailesinin** (kolon burkulma, güçlü kolon `Vis/Vik`, sarılma bölgesi, etriye/çiroz yerleşimi) kalibrasyonu.
- [ ] **Mevcut Açık Blokelerin Kapatılması (`P12–P14`):**
  - `P12` zımbalama çevresi (`TS 500 Şekil 8.5` kenar/köşe kolon geometrisi ve eksantrisite aktarımı).
  - `P13` radye sonlu eleman taban basıncı (`negatif gerilme kontrolü`, iteratif temas), tek yön kesme ve ilave donatı hesabı.
  - `P14` parametrik merdiven kol + sahanlık yük/mesnet/donatı hesabı (MS1'deki 7 merdiven x ~6 s.).
- **Kabul Ölçütü:** Hsyncad'in kendi çözücüsü `MS1`, `MS2` ve `SK`'da kat ağırlıkları (`gi`, `qi`, `wi`), temel mod periyotları, taban kesme kuvvetleri ve eleman kesit donatılarında belirlenen mühendislik toleransı dahilinde (`VERIFICATION_TOLERANCES.json`) kalibre olur; `.ide10` kayıtlı F9 sonuçlarıyla fark raporu sunar.

### Faz 3 — Gerçek Kesim Listesi ve Net Metraj Motoru (`P15+` & `R7` Kapanışı)
`HEAD`'deki `CERTIFIED_METRAJ_REFERENCE` tamamen tasfiye edilip `LUNA_V4_COPY` içindeki `reinforcement-schedule.ts` temel alınarak genişletilir:
- [ ] **Beton Hacmi & Düşüm Kuralları:** Kolon-kiriş-döşeme-perde birleşim bölgelerinde hangi elemanın ortak hacminin nereden düşüldüğü (`MS1: 1.334,015`, `MS2: 633,099`, `SK: 1.873,479 m³` ile 0.001 m³ basamağına kadar doğrulama).
- [ ] **Net Kalıp Alanı:** Kapalı temas yüzleri (döşeme altı oturma şeritleri, kiriş-perde/kolon birleşim yüzleri, kat betonu dışı açık alanlar) çıkarılarak `MS1: 6.681,91 m²`, `MS2: 3.194,33 m²`, `SK: 9.680,89 m²` kurallarına göre net kalıp hesabı.
- [ ] **Tam Bina Donatı Metrajı (`Ø8–Ø32`):** Kiriş (montaj + düz + pilye + ilave + etriye + gövde), kolon (boyuna + filiz/bindirme + etriye/çiroz), perde (uç + gövde + etriye + çiroz), döşeme (ana/dağıtma düz + pilye + sehpa/ek), bant kiriş, radye (üst/alt hasır + ilave + sehpa + zımbalama) ve merdiven donatılarının gerçek 3B eksen uzunluğu + kanca/bindirme ile hesabı; önce tam hassasiyette toplayıp yalnız gösterimde yuvarlama.
- [ ] **4 Sayfalık `METRAJ` Çıktı Şablonu:** `Sayfa 1: Kalıp Metrajı`, `Sayfa 2: Beton Metrajı`, `Sayfa 3: Donatı Metrajı (Ø8..Ø32 + İnce/Kalın kat & eleman grubu tablosu)`, `Sayfa 4: Toplam Metraj Özeti` (birebir tablo formatında).

### Faz 4 — 22 Grup / 146 Seçenekli, Vektör Çizimli, `600–1000+` Sayfa Tek PDF Motoru (`P16+` & `R6`)
Mevcut `src/lib/hsyncad/ide-source-report.ts` ile izole `LUNA_V4_COPY/reporting/` birleştirilerek üretim sınıfı dizgi motoru kurulur:
- [ ] **Dinamik Veri-Güdümlü Bölüm Filtresi (Boş Elemanı Basmama Kuralı):**  
  Kullanıcının özellikle vurguladığı kural kesin işletilir: Ağaçta tüm seçenekler seçili olsa dahi projede ilgili eleman veya durum yoksa (ör. `Tekil Temeller = 0`, `Sürekli Temel = 0`, `Kazıklar = 0`, `Çelik = 0`, `İstinat = 0`, `A2/A3 = Yok`) **o bölüm ve alt tablolar PDF'e yazılmaz**. (Hata/uyarı varsa veya kapsanan eleman başarısızsa tam tersi zorunlu gösterilir ve kırmızıyla işaretlenir.)
- [ ] **22 Grup / 146 Seçenek Ağacı Tam Eşlemesi:** `RT_DIALOG 30801` + `.rpt` ikili profilindeki 146 bayrağın her biri ilgili tablo üreticisine bağlanır (`treeIdx 1` ve `3` sınırından kurtulunur).
- [ ] **Otomatik 2B Vektör Plan Çizici (`YAPI GENEL YERLEŞİM ŞEKİLLERİ`):** PDF'in ilk sayfaları için her kat ve temel planının temiz ölçekli çizimi (akslar, perde/kolon taramalı kesitler, kiriş eksenleri ve `K301 25/50` etiketleri, döşeme kalınlık ve `G/Q` değerleri).
- [ ] **Tüm Hesap Tablo Şablonlarının Kodlanması:** `mustafa-1-rapor`, `mustafa-2-rapor` ve `suheyla-rapor` içindeki 515 TOC başlığına karşılık gelen yoğun tablo bileşenleri (ör. Kiriş Tasarım Kuvvetleri 70 s., Perde Statik Sonuçları 78 s., Radye Taban Basıncı 45 s., Merdiven Sayfaları, Kolon Etkileşim Diyagram/Tabloları).
- [ ] **İskele / Kalıp İskelesi Desteği (SK Çıktıları):** SK klasöründe bulunan `70 s. İskele` ve `28 s. Kalıp İskelesi` raporları ana betonarme teslimden sonra Faz 4B genişletmesi olarak eklenir (modelde iskele elemanı varsa çıkar, yoksa atlanır).
- [ ] **1.000+ Sayfa İçin Bellek Güvenli Tek PDF Birleştirme:**  
  2 geçişli deterministik motor (`Geçiş 1:` sayfa ölçüleri & bölüm indeksleri, `Geçiş 2:` tam sayfa numaralı Kapak + Tıklanabilir PDF İçindekiler + Statik Rapor + Metraj Eki tek PDF). Büyük raporlarda DOM/ana thread donmasını önlemek için **Web Worker içi sayfa parçalı üretim** ve düşük bellekli PDF stream yazımı kullanılır (`C:\Users\hsyn\Desktop\hsyncad\calisma-kayitlari\README.md#L43` kaydında Task 2 stres testinde `1.022` sayfalık PDF üretildiği bildirilmiştir; `p16-runtime` örneği ise `6` sayfa demo üretir).
- [ ] **Arayüz ve Kapsam Entegrasyonu (`P17`):** Kullanıcı görselindeki `Statik Rapor Ayarları` penceresi (`Kapsam: Tüm proje / Aktif kat / Seçili elemanlar` gerçek filtrelemesiyle, `.rpt` profili kaydet/yükle ile, künye/revizyon/logo ile) ve "Tek PDF İndir" akışı (`workbench.tsx` + `local-report-dialog.tsx`).

### Faz 5 — Çoklu Gerçek Proje Kabulü ve Canlı Üretim Doğrulaması (`P18–P19`)
- [ ] **3+1 Karşılaştırma Test Paketi:** `MS1` (606+4+4), `MS2` (311+3+4), `SK` (954+3+4) ve sıfırdan oluşturulmuş küçük bir bağımsız bina projesi (`0` sabit veri garantisi için).
- [ ] **Otomatik Sayfa & Satır Denetçisi:** Üretilen Hsyncad PDF'sini `pdftotext` / `pdfjs` ile açıp:
  - Kapak ve İçindekiler sayfa numaralarının fiziksel sayfa hedefleriyle %100 eşleşmesini,
  - Türkçe glif (`ğüşiöçİĞÜŞÖÇ`), `Ø`, `λ`, `η`, alt/üst simgelerin bozulmamasını,
  - Bölüm kapsamının (projede olan elemanlar dahil, olmayanlar hariç) birebir tutmasını,
  - Künye, kat ağırlıkları, modal periyotlar, kritik eleman kesit/donatı ve kalıp-beton-donatı metraj toplamlarının oracle hedefleriyle tutarlılığını otomatik raporlar.
- [ ] **Production Build & Canlı Sitede Mühendis Smoke Testi:** İlgili Next.js / Worker TypeScript kontrolleri + `npm run build` + tarayıcıda gerçek `.ide10` yükleyip 600–950+ sayfa tek PDF indirme ve görsel inceleme.

---

## 7. Hemen Başlanacak Somut İlk Eylem Sırası (Sprint 1)

Hiç vakit kaybetmeden maksimum ilerleme sağlayacak ilk 6 adım:

1. **Adım 1 (Ortam & Kalıcı Önbellek):** `rea setup --client antigravity --skill=false --dry-run` sonrası Antigravity MCP ortam değişkenlerini (`GHIDRA_INSTALL_DIR`, `JAVA_HOME`) hizala ve kalıcı `D:\HsyncadHybridOS\ghidra-cache\` klasörünü kur.
2. **Adım 2 (Küçük İkili & Şablon Çözümlemesi):** `ideRPT.exe` (`5.298.760 B`), `database\report.rpt` OLE akışları ve `ms1-1a-iderpt.tmp` (`"IDERPT FILE 11.00"`) üzerinde REA çözümlemesi yap → Rapor kayıt etiketlerini ve bölüm şemasını dök.
3. **Adım 3 (`M0` F9 Fark Testi & 30.261 Zlib Envanteri):** Küçük bir temiz projede `F9 öncesi` vs `F9 sonrası .ide10` açılmış zlib farkını + `MS1.ide10` 30.261 zlib bloğu haritasını çıkar → `.ide10`'da analiz sonuçlarının ve donatıların gömülü olup olmadığını kesin kanıtla.
4. **Adım 4 (Kılavuz Özeti & Aday Senkronizasyonu):** Kurulu iki resmi PDF (`ideCADSonluElemanlarKilavuzu.pdf`, `ideCADStatikIDSv102018TDBYUyumlulugu.pdf`) ve `ASCALC.EXE` + `TR.json` özetini çıkar; `LUNA_V4_COPY` içindeki `reporting/` ve 3 ek `structural/` dosyasını ana çalışma ağacıyla dikkatle senkronize et (mevcut çalışan dosyaları bozmadan).
5. **Adım 5 (Faz 1 Okuyucu Genişlemesi):** `P04+` ile malzeme, radye Q, duvar yükleri, TBDY ayarları ve (`M0` doğrulandıysa) gömülü F9 sonuç/donatı okuyucusunu Worker içinde tamamla; `MS1` (606 s.), `MS2` (311 s.), `SK` (954 s.) ile sayısal eşlik tablosunu çıkar.
6. **Adım 6 (Faz 3–4 Metraj & 600–954+ Sayfa Tek PDF):** `P15+` net metraj + `P16+` dinamik boş-eleman elemeli 22 grup vektör/tablo PDF üretici + 2 geçişli Kapak+TOC+Hesap+Metraj tek PDF hattını kurup ilk olarak `MS2` (311 s.), ardından `MS1` (606 s.) ve `SK` (954 s.) ile birebir doğrula.
