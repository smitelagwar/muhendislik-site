# DWG Motor V2 — 2D proje görüntüleme araştırması ve uygulama atlası

**Tarih:** 6 Eylül 2026 · **Geçerli uygulama planı: EXEC-2.** Araştırma ve Gemini uygulama/denetim paketi hazır; yeni motor henüz uygulanmadı.

Amaç, bu web sitesinden mimari ve statik DWG/DXF projelerini bilgisayar, tablet ve telefonda doğru, hızlı ve güvenilir biçimde açabilmek. Mevcut görüntüleyici korunur. Yeni motor, dosyanın üç nokta menüsündeki **“DWG Motor V2 ile aç”** seçeneğiyle bağımsız kullanılabilecek şekilde tasarlanır.

**Kullanıcının son kararı: Gemini yalnız uygulayıcı; seçim yetkisi yok.** Geçerli başlangıç [00 — Bağlayıcı uygulama kararları](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [18 — Gemini talimatı](18_GEMINI_UYGULAMA_REHBERI.md). Seçilen yol: ayrı Node hazırlama hizmetinde sabit DWG/DXF adapter'ları → bize ait canonical/packed 2D sahne → cihazlarda Three.js WebGL2 altyapılı yeni CAD renderer + D3 2D giriş denetimi. Mevcut motor bağımsız kalır. İlk araştırmadaki alternatifler bu uygulama turunda seçilmeyecek.

**Çalışma döngüsü:** Astra karar verir → Gemini 18 paketi uygular ve kanıtları kaydeder → Astra 48 gereksinimi tek tek denetler → somut FIX planı → Gemini düzeltir → Astra yeniden kontrol eder. Arayüzün modern, kaliteli ve lüks görünüşü [21](21_ARAYUZ_TASARIM_SISTEMI.md) ve [22](22_ARAYUZ_SENARYOLARI_VE_KABUL.md)'de somut kabul koşullarıdır. Hız ve tam uyumluluk henüz ölçülmüş sonuç değildir.

## Okuma dizini

| İhtiyaç | Belge |
|---|---|
| Gemini'nin değiştiremeyeceği ürün/teknoloji/kapsam kararları | [00 — Bağlayıcı kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) |
| Hedef, ürün anlayışı ve “kusursuz”un ölçülebilir anlamı | [01 — Manifesto](01_MANIFESTO.md) |
| Bu repoda bugün ne var, ne korunuyor? | [02 — Repo incelemesi](02_REPO_INCELEMESI.md) |
| Gerçek seçenekler, GitHub depoları ve lisanslar | [03 — Araştırma ve adaylar](03_ARASTIRMA_VE_ADAYLAR.md) |
| İlk araştırmada karşılaştırılan yaklaşımlar | [04 — Tarihsel karar çerçevesi](04_KARAR_CERCEVESI.md) |
| Önerilen uçtan uca motor ve veri sözleşmeleri | [05 — Sistem mimarisi](05_SISTEM_MIMARISI.md) |
| 2D CAD geometrisi, metin, tarama ve pafta doğruluğu | [06 — Doğruluk atlası](06_DOGRULUK_ATLASI.md) |
| Hız, bellek, GPU ve önbellek tasarımı | [07 — Performans](07_PERFORMANS_VE_BELLEK.md) |
| Telefon/tablet/tarayıcı davranışları | [08 — Cihazlar ve etkileşim](08_CIHAZLAR_VE_ETKILESIM.md) |
| Üç nokta menüsü, ayrı motor ve geri dönüş | [09 — Site entegrasyonu](09_SITE_ENTEGRASYONU.md) |
| Dosya güvenliği, sunucu işleri, erişim ve işletim | [10 — Güvenlik ve işletim](10_GUVENLIK_VE_ISLETIM.md) |
| Gerçek çizimler, referanslar, benchmark ve kabul | [11 — Doğrulama programı](11_DOGRULAMA_PROGRAMI.md) |
| Bağımlılıkları belli, alternatifli ilerleme sırası | [12 — Yol haritaları](12_YOL_HARITALARI.md) |
| Uygulamaya dönüştürülebilir deney ve iş paketleri | [13 — İş paketleri](13_IS_PAKETLERI.md) |
| Bütçe, emek, risk ve açık kararlar | [14 — Kaynak ve risk planı](14_KAYNAK_VE_RISK_PLANI.md) |
| Astra'nın karar ve bağımsız denetim rolü | [15 — Astra çalışma rehberi](15_ASTRA_CALISMA_REHBERI.md) |
| Doğrudan birincil kaynaklar ve araştırma sınırları | [16 — Kaynakça](16_KAYNAKCA.md) |
| Ne yapıldı, ne yapılmadı, ilk sonraki adım | [17 — Teslim ve durum](17_TESLIM_VE_DURUM.md) |
| Gemini'ye doğrudan kopyalanacak uygulama talimatı | [18 — Gemini rehberi](18_GEMINI_UYGULAMA_REHBERI.md) |
| G00–G17 giriş, uygulama, negatif test ve çıkış koşulları | [19 — Adım adım uygulama](19_GEMINI_ADIM_ADIM_UYGULAMA.md) |
| Gemini'nin yaptığı her işi sonradan denetleyebilmek | [20 — Kayıt ve kanıt sistemi](20_KAYIT_VE_KANIT_SISTEMI.md) |
| Modern ve kaliteli arayüzün sabit tasarım yönü | [21 — Arayüz tasarım sistemi](21_ARAYUZ_TASARIM_SISTEMI.md) |
| UI01–UI20 ekranları ve görsel kabul | [22 — Arayüz senaryoları](22_ARAYUZ_SENARYOLARI_VE_KABUL.md) |
| Astra denetimi, FIX planı, Gemini düzeltmesi ve tekrar kontrol | [23 — Denetim döngüsü](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md) |
| Tek tek kontrol edilecek R01–R48 | [24 — Gereksinim kataloğu](24_GEREKSINIM_KATALOGU.md) |
| Sabit source/scene/protocol/API ve küçük yetkili chunk yolu | [25 — Veri ve API sözleşmeleri](25_SABIT_VERI_VE_API_SOZLESMELERI.md) |

| Plan denetimi ve EXEC-2 düzeltmeleri | [Plan denetimi ve EXEC-2 düzeltmeleri](26_PLAN_DENETIMI_VE_EXEC2.md) |
| GitHub kaynakları, sabit sürümler ve kullanım sınırı | [GitHub kaynakları, sabit sürümler ve kullanım sınırı](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md) |
| Kesin pan/zoom/fit ve N01–N24 | [Kesin pan/zoom/fit ve N01–N24](28_PAN_ZOOM_FIT_SOZLESMESI.md) |
| Render/kalite/cleanup ve V01–V18 | [Render/kalite/cleanup ve V01–V18](29_RENDER_VE_YASAM_DONGUSU.md) |
| F01–F24 özellikleri ve erken temel kapı | [F01–F24 özellikleri ve erken temel kapı](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) |
| Metadata/binary/resource/lease ve C01–C12 | [Metadata/binary/resource/lease ve C01–C12](31_SOZLESME_TAMAMLAMALARI.md) |

| Kullanıcının klasik CAD görünüşü, bilgisayar/Poco kabulü ve bütçe durumu | [32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) |

Gemini için: **00 → 18 → 26 → 19 → 20 → 21 → 22 → 24 → 25 → 27–32 → uygulama/DURUM**; repo talimatlarının zorunlu okuma sırası ayrıca uygulanır. Sonraki Astra denetimi için: **00 → 26 → 23 → uygulama/DENETIM_DEVRI → R01–R48 → uygulama/ALT_KABUL_DURUMLARI**. 01–16 kaynak/teknik araştırmadır; çelişen alternatifler geçerli karar değildir.

## Kararların niteliği

İlk teslim kullanıcı isteğiyle öneri niteliğindeydi. Kullanıcının sonraki açık talimatıyla uygulama kararları şimdi **Gemini için bağlayıcıdır**. Gemini decoder, renderer, hizmet, UI yönü, kapsam veya kabul eşiği seçemez/değiştiremez. Uygulanamayan karar için CR ve somut kanıt kaydeder; Astra/kullanıcı revizyonundan önce alternatife geçmez.

Bu klasör root AGENTS/GEMINI koruma talimatlarını kaldırmaz. Kullanıcının 2D/iki motor/legacy koruma kapsamı geçerlidir. Bu oturum yalnız planı ve uygulama kayıt düzenini hazırladı. Gemini'nin gerçek uygulaması, kullanıcının 18 numaralı metinle başlatacağı sonraki çalışmadır.

## İsimlerin ayrımı

- **Mevcut motor / `legacy`:** Repo belgelerinde zaten “CAD Preview V2” olarak geçen MLightCAD/LibreDWG sistemi ve onun fallback zinciri. Burada `legacy` yalnız yeni deneyden ayıran bir kimliktir; çalışmadığı anlamına gelmez.
- **Yeni motor / `cad-v2`:** EXEC-2'in tanımladığı bağımsız 2D çalışma hattı. Kullanıcı etiketi “DWG Motor V2”. DXF dosyalarında aynı motor için “DXF Motor V2 ile aç” kullanılacak.
- **`dwg_V2/`:** Araştırma, bağlayıcı uygulama planı ve çalışma/denetim kayıtları. Uygulamanın runtime klasörü değildir.

## Kanıt ve başlangıç malzemesi

- [Sol'un değiştirilmemiş önerisi](girdi/SOL_TEKNIK_ONERILER_ORIJINAL.md)
- [15 GitHub deposunun tarihli HEAD/lisans metadata kaydı](arastirma/github-snapshot.json)
- [GitHub açık issue örneklemi](arastirma/github-issue-ornekleri.json)
- [Dört gerçek çizimin SHA-256 ve format envanteri](arastirma/yerel-corpus.json)
- [Yerel HEAD ve korunacak dosyaların parmak izleri](arastirma/yerel-baslangic.json)
- [Karar kaydı şablonu](sablonlar/KARAR_KAYDI.md), [deney raporu şablonu](sablonlar/DENEY_RAPORU.md), [oturum devri şablonu](sablonlar/OTURUM_DEVRI.md)
- [Boş uygulama kayıtları](uygulama/README.md), [güncel durum](uygulama/DURUM.md), [48 maddelik izlenebilirlik](uygulama/IZLENEBILIRLIK.md), [Astra denetim devri](uygulama/DENETIM_DEVRI.md)
- [İlk paket düzenleme öncesi kimliği](arastirma/plan-revizyon-oncesi.json); yeni plan ve kayıt kontrolleri [teslim durumunda](17_TESLIM_VE_DURUM.md).
- [EXEC-1 tarihsel yerel paket/API/tema dayanakları](arastirma/gemini-karar-dayanaklari.json) ve [EXEC-1 belge doğrulaması](arastirma/gemini-devir-kontrol.json).

Yerel kaynak kod incelendi ve dosya envanteri çıkarıldı. Yeni renderer çalıştırılmadı, alternatif SDK'lar benchmark edilmedi, gerçek cihaz testi veya AutoCAD referans karşılaştırması yapılmadı. Bu ayrım bütün yol haritasının başlangıç noktasıdır.

## EXEC-2 teslim kanıtı

[Önceki 45 belgenin tam arşivi](arastirma/exec1-tam-belge-arsivi.json), [yeni kaynak kod/sürüm hash kaydı](arastirma/exec2-yerel-kaynak-kaniti.json), [public kaynak commit kimlikleri](arastirma/exec2-public-kaynak-kimlikleri.json), [78 alt kabul satırının boş uygulama kaydı](uygulama/ALT_KABUL_DURUMLARI.md) ve [güncel belge kontrolü](arastirma/exec2-plan-kontrol.json). Motor ve fiziksel cihaz testleri hâlâ NOT_RUN.

**U1 kullanıcı netleştirmesi:** [32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md). Son belge kontrolü [EXEC-2 U1 kontrolünde](arastirma/exec2-u1-plan-kontrol.json); önceki EXEC-2 raporu tarihsel olarak korundu.

**U2:** [D22 lisans yaklaşımı](00_BAGLAYICI_UYGULAMA_KARARLARI.md) sadeleştirildi; lisans evrakı genel geliştirme/teknik kabul kapısı değil. Gerçek bildirimler paketleme işi olarak kalır. [U2 belge kontrolü](arastirma/exec2-u2-plan-kontrol.json) en güncel rapordur.

**U3 — Kesin kullanım:** ilk amaç AutoCAD düzeyinde görüntü; yalnız online; genelde≤30 MB/en fazla70 MB; tek DWG/DXF, companion klasör/font/XREF istenmez. [32 U3](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) ve [son belge kontrolü](arastirma/exec2-u3-plan-kontrol.json) geçerlidir.
