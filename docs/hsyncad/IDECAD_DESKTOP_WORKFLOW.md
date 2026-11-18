# ideCAD masaüstü kontrolü ve native doğrulama

Güncel yöntem: **8 Kasım 2026**, Codex Desktop, Windows `WinSta0\Default`, ideCAD Statik 11 Deneme. Kullanıcının açık isteği; ideCAD'i ajanın açması, ekran görüntüsünü kendisinin alması ve menü/ayarları kendisinin kullanmasıdır. Kullanıcı ayrıca bu sohbette **yerel Python/Win32 alternatifini kurup kullanmayı açıkça onayladı**. Bu onay mevcut oturumdaki yetkili ideCAD işi içindir; bu belge tek başına başka oturumlara araç/politika yetkisi vermez.

## Çalışan yol

Yerleşik `cua_repl` / Sky yakalama bu koşuda yeniden başarısız oldu: önce `FrameArrived timed out: timed out waiting on channel`, pencereye yeniden bağlandıktan sonra `window capture timed out: timed out waiting on channel`. Bu backend onarılmış değildir. Kullanıcı onayıyla hazırlanan [yerel kontrol yardımcısı](../../scripts/idecad/desktop.py), **Pillow/GDI ekran yakalama + Win32 SendInput** kullanarak bu bağımlılığı kaldırır. Codex'in kurulum/host ikilileri değiştirilmedi.

- Kullanım: [scripts/idecad/README.md](../../scripts/idecad/README.md).
- Canlı kabul ve görüntüler: `D:\HsyncadHybridOS\gui-erisim\desktop-control\ACCEPTANCE.md`.
- Test projesi: aynı klasörde `control-acceptance.ide11trial`.
- Ham işlem/gözlem kanıtı: zaman damgalı `.json` / `.png`, `actions.jsonl`, `guard-tests.json`.
- Eski başarısız denemeler: [tarihsel arşiv](IDECAD_DESKTOP_HISTORY_2026-11-08.md). Eski PID/HWND/indeks/adresler veya “kullanıcı diyaloğu açsın” adımları güncel çalışma talimatı değildir.

Normal navigasyonda kullanıcıdan ekran görüntüsü, dosya seçme, malzeme penceresi açma veya düğmeye basma istenmez. Önce yetkili kontrol yolu uygulanır. Araç/politika bir yöntemi engelliyorsa gerçek hata ve gerekli en küçük izin açıklanır; başarısız bir yöntemi tekrar etmek yerine izin verilen başka yol denenir. Windows kilidi, UAC, kimlik doğrulama veya gerçek yetki sınırı varsa durulur; bunlar atlatılmaz.

## Ajan için başlangıç

1. Uygulanabilir Computer Use talimatlarını oku. Yerleşik araç çalışıyorsa onu kullan; aynı yakalama hatasını tekrar tekrar üretme. Alternatif için gereken açık kullanıcı yetkisini kontrol et. Bu koşudaki açık onayı tekrar sorma.
2. `python -X utf8 scripts/idecad/desktop.py list` çalıştır. Yalnız ideCAD pencereleri, PID, HWND, başlık, sınıf ve masaüstü döner. **Tek bir `ideCADMainFrame` hedefini** görevdeki dosyaya göre seç; diyalog veya koordinat kutusunu ana pencere sanma.
3. Uygulama kapalıysa `desktop.py launch --exe ... [--project ...] [--dismiss-trial]` komutuyla WinSta0\Default üzerinde başlat. Boş açma veya doğrudan dosya argümanı ile açma desteklenir.
4. **Ezberlenecek Açılış Standartları (Duraksamadan İlerleme):**
   - Açılışta her zaman modal deneme bilgilendirme diyaloğu (`DENEME SÜRÜMÜ\nDeneme sürümünde kayıt edilen projeler, normal versiyonda açılamazlar.`, sınıf `#32770`, başlık `ideCAD Statik`) çıkar. Bu diyaloğu görünce tereddüt etme, ekrana tekrar tekrar bakıp düşünerek vakit harcama; `launch --dismiss-trial` ile otomatik kapat veya `key --chord enter` ile anında kapatıp çalışma alanına geç.
   - Ekranda her zaman çıkan sabit bileşenler: Sol panelde **Yapı Ağacı** (Tasarım ve Sonuç dalları), sol üstte yüzen **Koordinat Kutusu** (`Dx`, `Dy`, `Dz`, `L`, `A`), üstte ribon menüler ve altta **Hazır** durum çubuğudur.
5. `bind --hwnd ... --expect-title 'gözlenen dosya adı' --session '...json'` ile bağlan. Açılışta genel `ideCAD Statik` başlığına geçici bağlandıysan proje yüklendikten sonra **tam dosya adına daraltarak tekrar bağlan**.
6. Kaynak kullanıcı projesiyse test için ayrı dosya kopyası oluştur, SHA-256 eşitliğini ölç ve kopyayı aç. Kullanıcının istediği gerçek düzenlemelerde hedef dosyayı ve yapılacak işlemi mevcut istekten belirle; yardımcı `mutation-B` adına sabitlenmiş değildir.

Doğrulanmış EXE: `C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe`.

```bash
# Boş açma ve deneme uyarısını anında kapatma:
python -X utf8 scripts/idecad/desktop.py launch --exe "C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe" --dismiss-trial

# Dosya ile açma ve deneme uyarısını anında kapatma:
python -X utf8 scripts/idecad/desktop.py launch --exe "C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe" --project "D:\HsyncadHybridOS\gui-erisim\desktop-control\control-acceptance.ide11trial" --dismiss-trial
```

Dosya argümanı henüz yüklenmediyse yeni gözlem al. Başka proje açılmışsa `Ctrl+O` ile gözlenen `Proje Yükle` diyaloğunu aç, dosya adı alanına tam yolu gir ve açılışı doğrula. Sürecin çalışması veya kısa süre görünen başlık tek başına kabul değildir.

## Gözlem → işlem → doğrulama

- Her `observe` / başarılı işlem yeni PNG ve JSON üretir. PNG'yi `view_image` ile ajan kendisi inceler; JSON standart HWND kontrollerini, odak ve onay kutusu durumlarını içerir. Ribbon ve özel çizimli kontroller için görsel koordinatlar kullanılır.
- `click`, `drag`, `scroll` **en son gözlemin** `--observation` dosyasını ister. Koordinatlar görüntünün **orijinal piksel boyutuna göre**, hedef pencere/diyalog başlangıcından ölçülür. Araç görüntüyü küçülterek gösterdiyse ölçeği hesaba kat veya kırpılmış görüntünün ofsetini koru.
- Tek/çift/sağ/orta tıklama, sürükleme, dikey/yatay tekerlek, tuş birleşimleri ve metin girişi desteklenir. Yardımcı her girdide süreç kimliğini, proje başlığını, aktif modalı ve odağı doğrular; koordinat girişinde güncel görüntüyü ve noktanın ideCAD'e ait olduğunu kontrol eder.
- `type` odaktaki etkin Edit'e **ekleme** yapar. Tüm alanı değiştirmek için `replace --text ...` kullan: standart Edit'te `EM_SETSEL` ile seçer, Unicode giriş gönderir ve tam metni geri okuyarak doğrular. **Sayısal MFC Edit'te `Ctrl+A` çalışır varsayma**; bu koşuda ekleme yaptı, `replace` ile düzeltildi. Son değer doğrulanmadan onaylama/kaydetme yok.
- `key --chord ctrl+s`, `esc`, `enter`, `tab`, `shift+tab`, ok tuşları vb. kullanılır. `Return` her diyaloğun Tamam düğmesi değildir; kapanmıyorsa görüntüdeki **Tamam** düğmesine tıkla.
- Yardımcı başarısızlıkta sıfır dışı çıkar; işlem/sonraki görüntü başarısızsa sonuç bilinmiyor kabul edilir. Tekrar girdi göndermeden `observe` ile yeniden doğrula. Her komutun 30 saniyelik emniyet zaman aşımı vardır; sürekli çalışan servis veya uzak dinleyici yoktur.
- Eski PowerShell `idecad_gui_helper.ps1` genel kontrol yolu değildir: yalnız `mutation-B` ve belirli diyalog için yazılmıştır; `OpenTreeItem` canlı kabulde başarısız olmuştur. Eski istemlerdeki `ValueText` / `OutputPath` adları gerçek betiğin `Value` / `OutPath` parametreleriyle uyuşmaz. Yeni yöntemde `desktop.py --help` arayüzü esastır.

## Canlı kabul sonucu

Bu koşuda kullanıcıdan GUI adımı istenmeden:

| Senaryo | Ölçülen sonuç |
|---|---|
| Uygulama başlatma, dosya diyaloğu ve tam yol girişi | Ayrı test kopyası açıldı; dosya ve kat başlığı doğrulandı |
| Büyütülmüş ana pencere ve modal görüntü | Gerçek GDI PNG'leri ajan tarafından alındı/incelendi |
| Yapı ağacı çift tıklama | `C25 B420C TEST` → `Statik Malzeme Özellikleri` açıldı |
| Sayısal alan ve kayıt | Zaten tanımlı malzemede yalnız 1030 alanı `2.6 → 2.7 tf/m³`; tüm görünen Edit'lerin farkında yalnız bu alan değişti |
| Ayrı süreçte yeniden açma | PID 14172 normal kapandı; PID 14288'de aynı dosya ve özellikler açıldı; **2.7** metin ve görüntüde okundu |
| Ribbon ve ayar ağacı | Ayarlar → Genel Ayarlar → Girdi Birimleri açıldı |
| Onay kutusu | Plan görünümde ipucu: `1 → 0 → 1`; eski durum geri getirildi |
| Açılır liste, kaydırma ve sürükleme | Hane Sayısı listesi açıldı/Escape ile kapandı; ayar ağacı kaydı; diyalog 50×20 px taşındı; ayarlar İptal ile kapandı |
| Sağ tuş menüsü | Malzeme → Özellikler açıldı; yine 2.7 okundu |
| Yanlış hedef/geçersiz görüntü | Beş ret senaryosu geçti: eski görüntü, başka süreç görüntüsü, görüntü dışı nokta, yanlış proje, kapanmış süreç |

Kayıtlı test SHA-256: `d95106402d77b60fa9fb7a7d11bc960870869fd24b79c3fc9e952eb66e5dba8c`. Kaynak mutation-B: `04f7753b0e036dcdc08f8518ba4eff4d929f2c69b7976eb554764c4ba8c49598`; orijinal fixture: `2d836ac7ad325729fc5287330c97f1d1901f141bc1768ae0076698139baefb85`; ikisi değişmedi.

Bu kabul **çalışan genel kontrol mekanizmasını ve yukarıdaki akışları** doğrular. Bütün ideCAD komutları, analiz/hesapların doğruluğu, ticari sürüm, yeni sürümler ve farklı makineler tek tek test edilmedi; “her düğme kusursuz” garantisi verilmez. Yeni bir görevde görünen sonuç ayrıca doğrulanır.

## Argon / Opus değerlendirmesi ve ortam sınırı

İncelenen sohbetler: Antigravity `96a2bd1d-c7e1-476a-b752-6903c0eb8e8b`; Codex `01a1bb00-dc82-7b01-8fd0-7e7faf2c9cf3`.

Argon'un boş MFC koordinatı / tam ekran OpenGL açıklamaları ölçüm olmadan kesinleştirilmişti; kalıcı kural yapılmadı. Opus'un bu tahminleri ayırması yerindeydi. Eski canlı iş parçacığı/ikili deadlock iddiası tarihsel arşivde korunur; bu koşuda yeniden binary analizi yapılmadı. Güncel kanıt, yerleşik yakalamanın yeniden başarısız olması ve aynı büyütülmüş uygulamada bağımsız GDI + gerçek fare/klavyenin çalışmasıdır. `ma` daha önce **render Materyaller** penceresini açmıştır; statik malzeme özellikleri komutu değildir. Yardımcıyı yazmak, çalıştığını doğrulamak yerine geçmez.

Antigravity komut ortamı önceki ölçümde `exebox` masaüstündeydi. Yeni yardımcı yalnız `WinSta0\Default` üzerinde çalışır ve başka masaüstüne **geçmez**. Bu nedenle bu kabul Antigravity sandbox'ında GUI kontrolü sağlandığı anlamına gelmez. Orada Default erişimi/onaylı GUI aracı yoksa dosya/kod işi yürütülür; GUI işi yetkili Codex Desktop oturumunda yapılır. Sandbox veya host güvenlik sınırı değiştirilmez.

## Native / IFC kabulünün ayrı koşulları

Kaydetme → normal kapatma → yeni süreçte yeniden açma → gerçek değer/geometri karşılaştırması uygulanır. Deneme `.ide11trial` ve ticari `.ide11` kabulü ayrıdır. `Ctrl+S` eski `.ide10` için `Proje Kaydet` açabilir; gözlenen uzantı ve hedef doğrulanır. Native sürüm dosya başlığından okunur; farklı örnek sürümleri eşit varsayılmaz.

IFC için ideCAD logosu → Import → IFC kullanılır; bu kurulumda `.ifc` yolunu EXE'ye vermek `tanınamayan format` üretmişti. İçe aktarma yalnız uygun ayrı test projesinde yapılır; kat, panel, eleman, ölçü ve yük karşılaştırılmadan dosyanın oluşması kabul değildir. Eski örneklerde Axis/Body sırası ve döşeme sınırları sorun çıkarmıştır. Ayrıntı: [Native IDE uyumluluğu](NATIVE_INTEROP_STATUS.md), [IFC iş akışı](IFC_INTEROP.md), [tarihsel masaüstü kayıtları](IDECAD_DESKTOP_HISTORY_2026-11-08.md).

## Yedi katlı uygulama ve kullanım skill

8 Kasım devamında yeni proje sihirbazı → IFC → C30/B420C → koordinatla radye → donatı seçimleri → F9 → kaydet/yeni süreçte sonuç açma akışı tamamlandı. Proje: `C:\Users\hsyn\Desktop\ide_cikti\HSYNCAD-7K-UYGULAMA.ide11trial`; kapsam/varsayımlar/kanıtlar aynı klasörde `TESLIM-NOTU.md`. Kişisel skill: `C:\Users\hsyn\.codex\skills\idecad-desktop\SKILL.md`. Güncel ayrıntılı kullanım ve resmî kaynaklar skill referansındadır; 406 kaynak elemanın geometri eşliği ayrıca doğrulanmıştır. Bu örneğin varsayımları gerçek saha verisi değildir.
