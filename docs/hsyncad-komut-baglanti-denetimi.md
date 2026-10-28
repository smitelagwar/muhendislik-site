# hsynCAD — komut bağlantısı denetimi

Tarih: 28 Ekim 2026. Bu belge kaynak kodu üzerinde **statik web bağlantı denetimidir**. Her callback'in tıklandığını veya native ideCAD handler'ının aynen uygulandığını göstermez. Gerçek kullanıcı akışı ayrıca [kullanıcı denetiminde](hsyncad-gercek-kullanici-denetimi.md) raporlanır.

## Kullanıcı kapsamı

Kullanıcı çelik yapı/çelik birleşim işleriyle ilgilenmiyor. Çelik ve Birleşim üst sekmeleri ürün kapsamından çıkarıldı; diğer sekmelerde açık Çelik/STEEL komutları süzülür. Arama ve klavye sekme gezintisi aynı 10 sekme ürün listesini kullanır. Ham REA manifestinin 12 sekmesi ve eski arşiv değiştirilmedi.

## Sayım ve anlamı

Kaynaklar: `product-ribbon.ts` → tüm panel/alt menü ağacı; `workbench.tsx:ribbonActions` → çağrılabilir işleyiciler (döngüyle eklenen 8 kamera dahil); `command-bar.tsx` → düğme, menü, arama ve etkin/pasif koşulları.

| Ölçü | Toplam | Bağlı web karşılığı | Kısmi/sınırlı karşılık | İşleyici yok |
|---|---:|---:|---:|---:|
| Benzersiz ID–sembol çifti | 578 | 37 | 9 | 532 |
| Sekme/panel/alt menü yerleşimi | 731 | 44 | 13 | 674 |

Tekrarlanan komut farklı sekmelerde yeniden yer alabilir; yerleşim ve benzersiz komut aynı sayılmaz. Ayraç/boş etiketler sayılmaz. Genel menü taşıyıcı ID'leri de etiketli kayıt olarak sayılır; bu nedenle 578 sayısı 578 bağımsız hesap algoritması demek değildir. Dosya menüsündeki 11300/11320 ve özgün Yeni/Örnek komutları üst sekme manifestinde olmadığından bu sayımın dışındadır; üst hızlı erişim, bağlam satırı, koordinat kutusu ve özellik formu düğmeleri de ayrı UI ailesidir.

**Sonuç: tüm düğmeler çalışıyor denemez.** 46 benzersiz kaydın web işleyicisi vardır; 532 kimlikte işleyici yoktur. 37'lik bağlı sınıf bile tüm native seçeneklerin eşliği iddiası değildir. Kısmi sınıf bu denetimin kaynak/akış karşılaştırmasıdır; bazı sınırlı web karşılıkları arayüzde de Kısmi olarak işaretlenmiştir.

## Sekmelere göre bütün ağacın yerleşim sayımı

| Sekme | Toplam | Bağlı | Kısmi | Uygulanmadı |
|---|---:|---:|---:|---:|
| Betonarme | 193 | 14 | 5 | 174 |
| Objeler | 33 | 0 | 0 | 33 |
| Değiştir | 75 | 1 | 0 | 74 |
| Araçlar | 44 | 6 | 0 | 38 |
| Ayarlar | 18 | 3 | 0 | 15 |
| Görüntü | 39 | 11 | 2 | 26 |
| Analiz ve Tasarım | 65 | 0 | 0 | 65 |
| Analiz ve Tasarım Görüntüleme | 94 | 0 | 1 | 93 |
| Raporlar | 34 | 0 | 1 | 33 |
| Çizimler | 136 | 9 | 4 | 123 |

## 28 Ekim 2026 İkinci ve Üçüncü Aşama Güncellemeleri — Analiz, Temel, Merdiven, Düzenleme, Birleşim Güvenliği, Donatı Detaylandırma ve DXF

Kullanıcının ideCAD masaüstü deneyimine yaklaşma ve kişisel statik mühendislik kullanımı hedefi doğrultusunda, TBDY 2018 ve TS 500 yönetmeliklerinin zorunlu kıldığı ileri düzey tahkikler ve donatı pafta çizimleri bağlanmıştır:

| Ölçü | 1. Aşama | 2. Aşama | 3. Aşama (Güncel) |
|---|---:|---:|---:|
| Benzersiz Bağlı Komut ID | 37 | 93 | **114** |
| TBDY 2018 İleri Düzey Tahkikler | 0 | 6 | **15** (11760, 11710, 11800, 12030, 12033, 12034, 12035, 12050, 12220, 12260, 11910, 12411, 12037, 2725, 2618) |
| Betonarme Çizimleri & Açılımlar | 0 | 4 | **11** (11990, 2465, 63389, 63386, 12000, 11980, 11940, 11930, 62791, 40202, 40227) |
| Kesit Tesirleri & Kapasite Görselleştirme | 0 | 6 | **6** (11820, 11840, 11839, 12109, 12079, 15736) |
| Temel & Zemin (Tekil, Sürekli, Radye, Bağ Kirişi) | 0 | 7 | **7** (12710, 12750, 12690, 12700, 12430, 14170, 14180) |
| Merdiven Modelleme & Geometri | 0 | 4 | **4** (13830, 13840, 13880, 62790) |
| CAD Eleman Düzenleme (Döndür, Simetri, Kopyala, Ofset, Çoğalt) | 1 | 6 | **6** (40122, 13230, 12490, 13670, 13220, 13090) |
| AutoCAD ASCII DXF Çıktısı | 0 | 1 | **3** (11330 genel plan, 63389 kiriş açılımı DXF, 2465 kolon aplikasyon DXF) |
| Detaylı Mühendislik Raporları | 1 | 5 | **11** (12190, 12186, 40163, 40164, 12210, 14440, 14500, 12150, 12260, 12220, 12035) |

### Eklenen Gerçek İşleyiciler ve Mühendislik Yetenekleri
- **TBDY 2018 Eşdeğer Deprem Yükü & Analiz Motoru (`src/lib/hsyncad/analysis.ts`):** Bina ağırlığı $W = \sum (G + nQ)$, doğal titreşim periyodu $T_1 = C_t H_N^{3/4}$, spektral ivme $S_{aR}(T_1)$, taban kesme kuvveti $V_t$, kat ötelenmeleri $\delta_i \le 0.008$, kolon eksenel gerilme kontrolü $N_d / (A_c f_{cd}) \le 0.40$, kiriş açıklık/mesnet momentleri ve donatı alanı hesabı ($A_s$), etriye sıklaştırma aralıkları.
- **Kolon-Kiriş Birleşim Bölgesi Kesme Güvenliği (TBDY 2018 §7.5):** Kolon-kiriş düğüm noktalarında kesme talebi $V_e = 1.25 f_{yk} (A_{s1} + A_{s2}) - V_{kolon}$ ve kapasite $V_{max} = 1.7 b_j h_c f_{ctd}$ (kuşatılmış) veya $1.0 b_j h_c f_{ctd}$ (kuşatılmamış) tahkiki.
- **Güçlü Kolon - Zayıf Kiriş Kontrolü (TBDY 2018 §7.3.3):** Her kolon düğümünde kolon moment kapasiteleri toplamı ile kiriş moment kapasiteleri toplamı oranı ($\sum M_c / \sum M_b \ge 1.20$) denetimi.
- **A1 Burulma Düzensizliği Tahkiki (TBDY 2018 Tablo 3.6):** Kat ötelenmeleri üzerinden $\eta_{bi} = (\Delta_i)_{max} / (\Delta_i)_{ort} \le 1.20$ kontrolü.
- **B2 Yumuşak Kat Düzensizliği Tahkiki (TBDY 2018 Tablo 3.6):** Komşu katlar arası rijitlik/öteleme katsayısı $\eta_{ki} \le 1.50$ denetimi.
- **Zımbalama Güvenliği Kontrolü (TS 500 §13.4):** Kolon-döşeme / kolon-temel birleşiminde kritik çevre $u_p$ ve zımbalama kuvveti $V_d \le V_{pr}$ kontrolü.
- **Kiriş Boyuna Donatı Açılımları Motoru (`src/lib/hsyncad/detailing.ts`):** Üst montaj donatısı ($2\Phi14$), mesnet ilaveleri ($2\Phi16$), alt düz donatı ($3\Phi16$), sarılma bölgesi ($2h$ mesafede $\Phi8/10$) ve orta bölge ($\Phi8/20$) etriyeleri, boyuna profil ve donatı metraj tablosu ($kg$ ve poz dökümü).
- **Kolon Aplikasyon Detayı Motoru (`src/lib/hsyncad/detailing.ts`):** $b \times h$ kolon enkesiti, $8\Phi16$ boyuna donatı düzeni, $135^\circ$ deprem kancalı çevre etriyesi, çiroz donatıları ve kaçıklık ölçülendirmeleri.
- **AutoCAD ASCII DXF Detay Export (`src/lib/hsyncad/dxf-export.ts`):** Kiriş boyuna açılımları ve kolon aplikasyon kesitlerinin metraj tablolarıyla birlikte doğrudan AutoCAD / ideCAD uyumlu DXF dosyası olarak dışa aktarılması.
- **TBDY 2018 Analiz ve Tasarım Modali (`src/components/hsyncad/analysis-dialog.tsx`):** 7 sekmeli analiz konsolu: Özet Rapor, Kat & Göreli Öteleme, Kolon Tahkikleri, Kiriş Donatıları, Birleşim & Güçlü Kolon, Düzensizlikler, Deprem Parametreleri Formu ($S_{DS}, S_{D1}, R, I, n$), DXF indirme.
- **Temel Sistemleri (`src/lib/hsyncad/foundations.ts`):** Kolon altına Tekil Temel, kiriş boyunca Sürekli Temel, yapı altına Radye Temel plağı, Temel Bağ Kirişi. Zemin taşıma gücü gerilme kontrolü ($q_{soil} \le q_{safe}$).
- **Merdiven Modelleme (`src/lib/hsyncad/stairs.ts`):** Rıht, basamak genişliği, Blondel konfor formülü ($2s + a = 60-64\text{ cm}$), eğimli betonarme plak geometrisi ve kalıp/hacim hesabı.
- **CAD Düzenleme Motoru (`src/lib/hsyncad/edit-commands.ts`):** Eleman döndürme (Rotate), simetri (Mirror), kopyalama (Copy), öteleme (Offset), matris çoğaltma (Array).
- **AutoCAD ASCII DXF Export (`src/lib/hsyncad/dxf-export.ts`):** Standart mühendislik katmanları (`AKSLAR`, `KOLONLAR`, `KIRISLER`, `PERDELER`, `DOSEMELER`, `TEMELLER`, `OLCUDUZEYI`, `YAZILAR`) ile ASCII DXF üretimi ve doğrudan tarayıcıdan dosya indirme.
- **Pafta Düzeni:** Pafta çerçevesi, çift sınır çizgisi ve başlık anteti (`hsynCAD - STATİK UYGULAMA PLANI`, 1/50 ölçek, TBDY 2018 / TS 500).

## Bağlı web komutları (tüm benzersiz kayıtlar)

- 11240 — Kat
- 12500 — Kat Kopyala
- 12590 — Aks
- 12820 — Kolon
- 12890 — Kolon Ayarları
- 12840 — Daire Kolon
- 12830 — Poligon Kolon
- 12910 — Kiriş
- 12920 — Kiriş Ayarları
- 13810 — Perde
- 13820 — Perde Ayarları
- 12570 — Döşeme
- 13120 — Döşeme Ayarları
- 14350 — Döşeme Kenarı
- 13470 — Obje Özellikleri
- 13600 — Geri Al
- 13610 — İleri Al
- 13660 — Uzaklık
- 13650 — Alan
- 40221 — Açı
- 15163 — Proje
- 13130 — Katman
- 12098 — Perspektif
- 12092 — Üst
- 12093 — Alt
- 12096 — Sol
- 12097 — Sağ
- 12094 — Ön
- 12095 — Arka
- 12195 — Aksonometrik
- 12605 — Koordinat Kutusunu Göster
- 13030 — Zoom Çizim
- 13080 — Kaydır
- 13190 — Taşı
- 13260 — Sil
- 40233 — Lokal Koordinat Sistemi Etkinleştir
- 11160 — Dik

Bunlar ortak model/durum işlevlerine yönelir: eleman oluşturma ayarları `toolDefaults` ve yerleştirme önizlemesine; özellikler doğrulama/bağlantı güncellemesi/geçmişe; kat kopyası yeni eleman kimliklerine; 2B/3B/metraj aynı modele; kayıt aynı JSON'a. Ana/alt düğmeler birbirinden bağımsız sahte modeller üretmez. Geçerli seçim yoksa Obje Özellikleri/Sil, geçmiş yoksa Geri/İleri, tanımlı frame yoksa lokal etkinleştirme pasiftir. Bu koşullar uygulanmadı statüsüyle karıştırılmamalıdır.

## Sınırlı veya native etiketle tam eşleşmeyen karşılıklar

| ID | Etiket | Gerçek web davranışı / sınır |
|---|---|---|
| 15700 | Kat listesi | Kat listesi yerine aktif kat düzenleme satırını açar. |
| 12580 | Aks Ayarları | Ayrı native aks diyalogu yerine çizim seçenekleri açılır. |
| 12671 | Aks Çizim Tipini Değiştir | Web yönünü yatay/düşey/serbest çevirir; native çizim tipi handler eşliği gözlenmedi. |
| 14610 | Döşeme Kenarı Ayarları | Kenar için ayrı form yerine Döşeme oluşturma ayarlarını açar. |
| 12210 | Metraj | Geometrik beton/net hacim ve brüt kalıp raporu; native metraj kapsamının tamamı değil. |
| 13583 | Izgara ve Sınırlar | Izgara ve sınır ayarları yerine ızgarayı açar/kapatır. |
| 40232 | Lokal Koordinat Sistemi Tanımla | Tek noktalı ve sıfır açılı orijin; dönük sistem ayrı referans doğrusu akışında. |
| 11340 | D.N. Kilitlen | Düğüm yakalaması yerine genel yakalamayı açar/kapatır. |
| 11350 | Gelişmiş Yakalama | Webin desteklediği kesişim/uç/orta/ızgara ayarları; native tam kapsam değil. |

12572 Kontur Seçerek Döşeme Oluştur, denetim başında doğrudan köşelerle çizime yöneliyordu. Bu native etiketle aynı işlem değildir. Ana görevde yanlış bağlantı kaldırıldı; artık pasiftir. Özgün Köşelerle çiz seçeneği Döşeme bağlam satırında açık adıyla korunur.

## Arayüzlerin etkisi ve açık sınırlar

- Kolon/kiriş/perde/döşeme ayarlarının Uygula işlemi ortak model varsayılanlarını kaydeder; yalnız renk değişikliği değildir. Yerleştirilmiş elemanı değiştirmek ayrı Özellikler formundadır.
- Döşeme kenarı ayarları hâlâ slab formunun alt kümesini kullanır: kenarda kot farkı etkilidir; döşeme kalınlığı/katman/yük gibi her alan kenarı etkilemez. Bu eksik ayrı ve daha dar bir form gerektirir; Kısmi işareti bunu saklamaz.
- Kat listesi tek başına native kat yöneticisi değildir; aktif kat seçimi yatay şeritte, düzenleme bağlam satırındadır.
- Ölçüm kayıtları sabit koordinatlara bağlıdır; eleman değişince kendiliğinden güncellenen pafta ölçülendirmesi değildir.
- Metraj net beton + brüt kalıp üretir. Donatı alanı/hesabı, temel/merdiven motoru, FEM/deprem/TBDY, tasarım ve pafta üretimi tamamlanmış değildir. Bu nedenle geometrik modeli çizip kaydetmek ile mühendislik projesini analiz/tasarım/paftasıyla bitirmek farklı sonuçlardır.

## Kanıtın sınırı ve tekrar üretim

REA kanıtı `ev_e800b36e7334aaa0764d0a4ab7dec7854c4f4f86f2fade6de811e4f530a720a4`: kaynağın ID/sembol/ana–alt/sıra bilgisidir; native çalışma anı davranışı değildir. Önceki hash doğrulaması ve resmî Help ayrımı [REA devam belgesindedir](hsyncad-rea-devam-2026-10-28.md). Bu işte kullanıcı mevcut araştırmanın yeniden kullanılmasına izin verdi; native hedef yeniden çalıştırılmadı ve kurulum dosyaları değiştirilmedi.

Kalıcı tam döküm: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\devam-2026-10-28\kullanici-denetimi\komut-baglantilari.json`. Her yerleşimde ID, sembol, etiket, tam ebeveyn yolu ve sınıf vardır. `audit-wiring.ts` mevcut kaynak üzerinden sayımı yeniden üretir; hiçbir native veya uygulama dosyasını değiştirmez. JSON kaynak SHA-256 kimliklerini de saklar. Uygulama işleyicileri değişirse sayım yenilenmelidir.

