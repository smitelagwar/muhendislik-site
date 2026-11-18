# Tarihsel ideCAD erişim denemeleri — 8 Kasım 2026 öncesi/devamı

> Arşivdir. Aşağıdaki başarısızlıklar ve geçici talimatlar güncel çalışma kuralı değildir. Güncel yöntem: [IDECAD_DESKTOP_WORKFLOW.md](IDECAD_DESKTOP_WORKFLOW.md). PID, HWND, indeks ve adresler tarihsel kanıttır; yeniden kullanılmaz. Eski ikili/deadlock incelemesi bu oturumda tekrar yapılmadı.

# ideCAD masaüstü açma ve doğrulama

5 Kasım 2026'da Windows'ta ideCAD Statik 11 Deneme ile gözlenen iş akışı. Başka kurulumlarda yürütülebilir yolu, dosya ilişkisini ve izin verilen kayıt biçimlerini yeniden doğrula. Kod ve biçim durumu için [Native IDE uyumluluğu](NATIVE_INTEROP_STATUS.md).

1. **Açık projeyi tanı.** Computer Use ile pencere listesini oku. Pencere başlığındaki dosya ve aktif katı kaydet. Kullanıcının projesi açıksa testi ayrı bir kopya üzerinde yap. Kopyanın özgünle SHA-256 eşitliğini doğrula.
2. **Native dosyayı kayıtlı açma yoluyla başlat.** `.ide10`, `.ide11` ve `.ide11trial` bu bilgisayarda `HKEY_CLASSES_ROOT\ideYAPI\shell\open\command` altında EXE'ye `"%1"` olarak iletiliyor. Doğrulanmış küçük veya bayt eşit test kopyasını aynı bağımsız değişkenle ayrı bir ideCAD oturumunda aç. Test dosyası adı tek başına proje yüklendi kanıtı değildir. Başlıkta test dosyası ve aktif katı, erişilebilirlik ağacında model alanını ve mümkünse yapı ağacındaki katları gör.
3. **Genel başlık varsa diyaloğu ara.** Açılış sırasında başlık bir süre yalnız `ideCAD Statik` olabilir. `.ide11trial` yeniden açılırken deneme dosyasının normal sürümde açılamadığı bilgisi çıktı. Odak ana pencereye kaydıysa erişilebilirlik ağacında diyaloğun `Raise` eylemini doğrula. `performSecondaryAction(index, 'Raise')` çağır, yeni ağaçta odağın diyaloğa geçtiğini kontrol et ve `Return` gönder. Bildirim kapanınca gerçek proje ve kat başlığını bekle. Sadece PID, RAM veya `Responding` değerini kabul ölçütü yapma.
4. **Sadece test kopyasını kaydet.** `Ctrl+S` eski `.ide10` kopyasında `Proje Kaydet` açtı. Açık deneme sürümü yalnız `.ide11trial` sundu. Varsayılan hedef yeni dosya ve doğru klasörse kaydet. Erişilebilirlik tıklaması çalışmıyorsa kullanıcıdan yalnız açık test diyaloğundaki **Kaydet** düğmesini istemek yeterli. Sonra dosyanın oluştuğunu, başlığın değiştiğini ve CRC'nin geçerli olduğunu kontrol et. Orijinal kaydı değiştirme.
5. **Kaydı yeniden aç ve karşılaştır.** Yeni test oturumunda aynı kayıtlı açma yolunu kullan. ideCAD proje/kat başlığını doğruladıktan sonra Hsyncad okuyucusuyla kat, eleman kimliği, ölçü ve yükleri karşılaştır. Arşivin sürümünü dosya başlığından oku. Güncel deneme örneği `211280`; önceki `211220` örneğiyle aynı sürüm varsayılmaz. Deneme uzantısı ve dosya bayrakları korunur.

Bu makinede görünür ve büyütülmüş ideCAD penceresinde ekran yakalama `FrameArrived timed out` hatası verdi. MFC menülerinde bazı indeksler ağaçta göründüğü hâlde eylem çağrısı `element ... is not available in cached app state` veya `coordinate input geometry is unavailable` döndürdü. Yeniden gözlemden sonra aynı hata sürüyorsa art arda tıklama deneme. Native dosyada kayıtlı komut satırı açılışını, diyaloğun gözlenen klavye eylemini veya gerektiğinde tek bir kullanıcı adımını kullan. Kullanıcının ekran görüntüsü yerel pencerenin görünür olduğunu gösterir. Otomasyonun koordinat eşlemesi için güncel yakalama gerekir.

IFC için **ideCAD logosu → Import → IFC** kullanılır. Örnek modeli yeni proje olarak al ve elemanlar ile kat kotları doğrulanmadan native kabulü tamamlandı sayma. Deneme sürümünde çıkan `.ide11trial` ile ticari `.ide11` kabulü ayrı sonuçlardır. [IFC iş akışı](IFC_INTEROP.md)

Bu kurulumda `.ifc` yolunu native dosya gibi EXE'ye vermek `tanınamayan format` hatasıyla sonuçlandı. `idecadalias.txt` içinde IFC içe alma komutu bulunmadı. Dosyayı uygulamanın Import → IFC menüsünden seçmek gerekiyor. [ideCAD IFC içe aktarma kılavuzu](https://help.idecad.com.tr/ideCAD/ifc-import)

5 Kasım canlı testinde yeni proje sihirbazından başlatılan projede betonarme malzemesi tanımlı değildi. Kaynak model yalnız `Beton` adını taşıyordu; test için uygulamanın sunduğu C25 B420C seçildi. Bu seçim kaynak projeden okunmuş bir beton sınıfı değildir. Sonraki kontrollü testte kurulumun `templates/structural/ide_default_white.ide10` dosyasının ayrı kopyası açıldı. Bu boş şablonda C25 B420C ve S235 zaten vardı. IFC sorusuna **Hayır** denerek yalnız bu boş test projesine aktarıldı. Kullanıcının mevcut projesinde aynı işlem yapılmaz.

Eski IFC'de duvarın Axis temsili Body'den önceydi. İçe aktarma `0xa2988b` adresinde erişim ihlaliyle çöktü. Body ilk sıraya alınınca aynı 4×4 örnek içe alındı, `.ide11trial` kaydedildi ve yeniden açıldı. Yine de ilk kayıtta döşemenin sınır noktaları boştu; kayıt oluşması ve yeniden açılma tek başına eksiksiz aktarım kanıtı değildir. İç perdesiz karşılaştırmada ideCAD döşemeyi kiriş/kolon yüzlerine göre yeniden kurdu. Panel geometrisini kaynakla ayrıca karşılaştır.

Erişilebilirlik hedeflerinin numaraları gözlemler arasında değişebiliyor. Yeni ağacın döndürdüğü hedefi kullan; eski numarayı yeniden deneme. `setValue` bazı dosya diyaloglarında çalıştı, bazılarında aynı gözlemden hemen sonra bile önbellek hatası verdi. Klavye de her zaman modal diyaloğa ulaşmadı. Yeniden bağlama veya runtime sıfırlama kesin çözüm olarak doğrulanmadı. İki güncel gözlemden sonra aynı hata sürerse kullanıcıdan dosyayı seçme/kaydetme gibi tek somut adımı iste; kod ve dosya doğrulamasına devam et.

Komut satırında dosya bağımsız değişkeni Windows ters bölü çizgileriyle ve çift tırnakla verilir (`"C:\...\test.ide10"`). İleri bölü çizgili yol verilen testte `Encountered an improper argument.` uyarısı ve genel şablon başlığı görüldü; istenen dosyanın açıldığı kabul edilmedi. Boş şablonun başlığında dosya adı görünmeyebildiğinden malzemeleri ve boşluğu da doğrula.

İki kapalı döşemeli 11 elemanlı IFC örneği, `hsyncad-paneller-test.ide11trial` olarak yeniden açıldı; `Zemin kat TAVANI, 3.00 KOTU` ve C25 B420C/S235 ağacı okundu. Ctrl+S dosyanın zamanını ve SHA-256 değerini değiştirdi; ardından kaynakla karşılaştırma yine 11/11 geçti. İlk kayıt ayrı korundu. Ayrıntılar ve hash değerleri [durum belgesindedir](NATIVE_INTEROP_STATUS.md).

## Computer Use ile kontrol — 8 Kasım 2026 ölçümü

Ayrıntılı çağrılar ve hata metinleri: `D:\HsyncadHybridOS\gui-erisim\TESHIS_SONUC.md`. Tek açık `mutation-B.ide11trial` penceresi `list_windows` ile, C25 B420C öğesi ekran görüntüsüz erişilebilirlik ağacıyla görüldü. `Alt_L+F5` ana pencereyi normal boyuta aldı. Ekran yakalama büyütülmüş ve normal durumda da zaman aşımına uğradı; koordinat tıklaması için görüntü elde edilmedi. Ağaç/komut alanı indeks tıklamaları koordinat hatası, `Görüntü` sekmesi indeks tıklaması önbellek hatası verdi. Komut alanının odağı doğrulanamadığından `ma` komutu denenmedi. Bunların nedenleri ve başka hedeflere genellenmesi doğrulanmadı. İki güncel aynı hata sonrası yineleme yapma; bu kurulumda malzeme diyaloğunu açmanın güvenilir yolu henüz doğrulanmadı.

Kurulu `C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\idecadalias.txt` dosyasından seçilmiş komutlar (bu ölçümde hiçbiri çalıştırılmadı):

| İşlem | Alias | Bu oturumda |
|---|---|---|
| Malzemeler (`materials`) | `ma` | Test edilmedi: odak doğrulanamadı |
| Kat ayarları (`storyset`) | `ss` | Test edilmedi |
| Ayarlar (`settings`) | `s` | Test edilmedi |
| Geri al (`undo`) | `u` | Test edilmedi |
| İleri al (`redo`) | `rd` | Test edilmedi |

Kayıt ve analiz için bu dosyada bir alias saptanmadı; `Ctrl+S` önceki oturumda gözlendi, bu ölçümde test edilmedi. Analiz çalıştırılmadı.

### Kullanıcı tarafından açılmış malzeme diyaloğunda gözlem

8 Kasım devamında kullanıcı C25 özellikler diyaloğunu açtıktan sonra `set_value` ile `Malzeme adı` alanı değiştirildi ve ekran görüntüsüz ağaçta doğrulandı. `Tamam` indeks tıklaması önbellek hatası ve diyaloğun `Raise` eylemi önbelleğe alınmış eylem yok hatası verdi; `Return` ile diyalog kapandı ve yeni ad ağaçta görüldü. `Ctrl+S` sonrası ayrı oturumda aynı ad ağaçta okundu. Bu yalnız isim alanı ve bu oturum için ölçümdür; malzeme penceresinin müdahalesiz açılması veya fiziksel özellik mutasyonu doğrulanmadı. Tam çağrılar ve hash: `D:\HsyncadHybridOS\resume-20261108\native-material-oracle\PROTOCOL.md`.

### Klavye teşhisi ve kontrol uygulaması — Aşama 1b

Ayrıntı: `D:\HsyncadHybridOS\gui-erisim\TESHIS_SONUC.md`. Bu ortamda boş Not Defteri de ekran yakalamada `window capture timed out: timed out waiting on channel`, Dosya menüsü indeks tıklamasında `coordinate input geometry is unavailable` verdi; dolayısıyla bu belirtilerin yalnız ideCAD'de olduğu söylenemez. ideCAD'de iki Escape komut geçmişinde iptal üretti. Sonrasında `ma` + Return ve `ma` + space malzeme diyaloğunu açmadı; `ma` komut geçmişinde görünmedi, odağa ulaştığı doğrulanmadı. Komut Satırı edit alanı `set_value` için ayarlanabilir değildi. Sekiz Tab ve altı F6 sonrası raporlanan odak hep araç çubuğu seçenekleriydi. Bu ölçümde diyaloğu müdahalesiz açan bir yöntem bulunmadı; `ma` aliasının geçersiz olduğu sonucu çıkarılamaz.

### `codex-computer-use.exe` ikili analiz bulguları (8 Kasım 2026)

`C:\Users\hsyn\AppData\Local\OpenAI\Codex\runtimes\cua_node\db1cc9e06a6c48d6\bin\node_modules\@oai\sky\bin\windows\codex-computer-use.exe` üzerinde yapılan statik ikili incelemeyle doğrulanan mekanik nedenler:

1. **`coordinate input geometry is unavailable` neden tüm uygulamalarda (`element_index` dahil) oluşuyor:**
   - `click_element` (`RVA 0xa9ea3..0xa9fe4`), UIA `InvokePattern` çağırmaz; öğenin önbellekteki dikdörtgen sınırlarının merkezini (`width/2`, `height/2`) hesaplayıp `0xaf18b` → `0xaf29f` koordinat tıklama yoluna gönderir.
   - `0xaf29f` işlevi `cmp dword ptr [rdx + 0x208], 1` kontrolü yapar; `[rdx + 0x208] != 1` ise `coordinate input geometry is unavailable` (`RVA 0x1327ed`) döndürür.
   - `[rbx + 0x208]` (`Option<CoordinateInputGeometry>`), `get_window_state` (`RVA 0xa01a8..0xa01f0`, `0xaba5c`) içinde **yalnızca ekran görüntüsü yakalama (`include_screenshot: true`) başarılı olduğunda `1` yapılır**; `include_screenshot: false` çağrıldığında geçerli ekran görüntüsü önbelleği yoksa `0xa01f0` (`and dword ptr [rbx + 0x208], 0`) ile sıfırlanır.
   - Bu nedenle `include_screenshot: true` başarısız olduğu sürece hem ideCAD hem Not Defteri'nde tüm `sky.click({ element_index })` ve `sky.click({ x, y })` çağrıları mekanik olarak reddedilir.
2. **`FrameArrived timed out` ve `window capture timed out: timed out waiting on channel` bağlantısı (canlı iş parçacığı yığını ve `ID3D10Multithread` kilitlenme kanıtı):**
   - `PID 11944` (`codex-computer-use.exe`) üzerinde canlı iş parçacığı bağlamları (`GetThreadContext` / `ReadProcessMemory`) ve `RTL_CRITICAL_SECTION` (`0x192cf5a30b0`, `d3d11.dll+0x1c9ef0` `ID3D10Multithread`) incelendiğinde 3 iş parçacıklı deterministik bir kilitlenme (deadlock) doğrulandı:
     - **1. İş Parçacığı (`TID 22680 / 0x5898`, `GraphicsCapture.dll` `CreateFreeThreaded` geri çağrı iş parçacığı):** `Direct3D11CaptureFramePool.CreateFreeThreaded` (`GraphicsCapture.dll+0x10213`) D3D11 cihazı üzerinde `ID3D10Multithread::SetMultithreadProtected(TRUE)` (`d3d11.dll+0x46740`) açar. Kare geldiğinde `GraphicsCapture.dll+0x11079`, `ID3D10Multithread::Enter()` (`CRITICAL_SECTION 0x192cf5a30b0`, `OwningThread = 0x5898`, `RecursionCount = 1`) kilidini **alarak** `dcomp.dll` üzerinden `FrameArrived` geri çağrısını (`codex-computer-use.exe+0x4247a`) çağırır; `ID3D10Multithread::Leave()` çağrısı (`GraphicsCapture.dll+0x110b6`) ancak `FrameArrived` döndükten sonra çalışır.
     - `codex-computer-use.exe+0x4247a` (`FrameArrived`) içinde `TryGetNextFrame` (`0x4258f`) ve `Direct3D11CaptureFrame.Surface` (`0x425fb`) başarılı olur (`2560x1440` monitör karesi, `2560x1400` pencere kırpma alanı yığında doğrulanmıştır), ardından `SoftwareBitmap::CreateCopyFromSurfaceAsync(surface)` (`0x4279c..0x42996`) çağrılır ve **geri çağrı iş parçacığı içinde senkron olarak** `WaitForSingleObject(0x898, INFINITE)` (`0x42c88`, dönüş adresi `0x42c8d`) ile beklenir.
     - **2. İş Parçacığı (`TID 22000 / 0x55f0`, `RTMediaFrame.dll` WinRT iş havuzu iş parçacığı):** `SoftwareBitmap::CreateCopyFromSurfaceAsync` işlemini yürüten `RTMediaFrame.dll+0x19a03` → `d3d11.dll+0x1194a0` → `0x118e56` → `0x11920c` → `0x34ec7` (`ID3D10Multithread::Enter()`), yüzeyi kopyalamak için **`TID 22680`'in tuttuğu aynı `0x192cf5a30b0` (`ID3D10Multithread`) kritik bölgesine** (`ntdll.dll+0x64a4d` `RtlEnterCriticalSection`) girmeye çalışır ve sonsuza kadar bloklanır.
     - **3. İş Parçacığı (`TID 21932 / 0x55ac`, `window_capture_worker`):** İlk ekran görüntüsü çağrısında `0x3f945` 2 saniye bekleyip `FrameArrived timed out: timed out waiting on channel` döndürür. İkinci ekran görüntüsü çağrısında `TID 21932`, `CreateFreeThreaded` (`codex-computer-use.exe+0x3e250` → `0x41454` → `GraphicsCapture.dll+0x10213` → `d3d11.dll+0x4676c` → `0x49246`) çağırırken aynı `0x192cf5a30b0` kilidine takılır ve **kalıcı olarak bloklanır**. Bu andan sonra `TID 21932` kanaldan hiçbir istek okuyamadığı için ana RPC iş parçacığı (`TID 17660`, `RVA 0x9f83a`) her `include_screenshot: true` çağrısında 5 saniye bekleyip `window capture timed out: timed out waiting on channel` (`RVA 0x9f84b`) döndürür.
   - Aynı paketteki Swift yardımcısı (`bin\windows\swift\x64\codex-computer-use-swift.exe`) `SoftwareBitmap::CreateCopyFromSurfaceAsync` yerine `IDirect3DDxgiInterfaceAccess.GetInterface(ID3D11Texture2D)` + aynı iş parçacığında D3D11 staging texture okuma + `IWICImagingFactory.CreateBitmapFromMemory` kullandığından bu kilitlenmeye girmez ve `include_text: true` sonrasında ekran görüntüsü olmadan da `click_element` çalıştırabilir; ancak `ChatGPT.exe` (`app.asar` `0xa802d3` `nnW`) `computer-use-native-pipe` için doğrudan Rust yardımcısını (`codex-computer-use.exe`) başlatmaktadır.
3. **`type_text` ile `press_key` farkı:**
   - `press_key` (`RVA 0xaf9ce`) `SendInput` çağrısında sanal tuş kodu (`wVk`) gönderirken, `type_text` Unicode karakter bayrağı (`KEYEVENTF_UNICODE`, `wVk = 0`) kullanır.
   - K2–K3'te odak `CMFCToolBarMenuButton` üzerindeyken `type_text('ma')` komut satırına ulaşmadı; tek tek `press_key({ key: 'm' })` + `press_key({ key: 'a' })` gönderiminin davranışı ise henüz canlı ölçülmedi.

### Aşama 1c — hedef doğrulama ve `idecad_gui_helper.ps1` yardımcı betiği

Bu denemede test dosyası başlığı kısa süre göründükten sonra aynı pencere kimliği başka proje başlığına (`MUSTAFA SELVİ 1.KISIM.ide10`) dönüştü; ekran görüntüsüz erişilebilirlik sonucu `null` oldu. Bu durumda pencereye giriş gönderme; açık test dosyasını ve diyaloğu yeniden doğrula. Sanal tuş veya ikincil eylem yöntemi bu denemede ölçülmedi. Ayrıntı: `D:\HsyncadHybridOS\gui-erisim\TESHIS_SONUC.md`.

Codex Desktop'ın `exec_command` aracı `WinSta0\Default` masaüstünde çalıştığı (oturum kaydında `Get-Process` çıktısının `MainWindowTitle` döndürmesiyle doğrulandı) ve `view_image` aracına sahip olduğu için, `@oai/sky` içindeki `ID3D10Multithread` kilitlenmesine takılmadan ekran görüntüsü almak ve açık `Statik Malzeme Özellikleri` (`#32770`) diyaloğundaki düğmeleri/sayısal alanları yönetmek üzere `D:\HsyncadHybridOS\gui-erisim\idecad_gui_helper.ps1` hazırlandı:

- **Güvenlik kilidi:** Betik yalnızca başlığında `mutation-B.ide11trial` bulunan ideCAD penceresi ve onun sahibi olduğu `#32770` malzeme diyaloğu üzerinde çalışır; kullanıcı projelerine dokunmaz.
- **Ekran görüntüsü (`-Action Screenshot`):** Pencere veya açık malzeme diyaloğunu `.NET CopyFromScreen` ile `D:\HsyncadHybridOS\gui-erisim\mutation-B-screenshot.png` dosyasına kaydeder; Codex Desktop bunu `view_image` ile doğrudan inceler.
- **Sayısal malzeme alanlarının etkinleştirilmesi (`ID: 4393`):** Standart katalog malzemesinde (`C25 B420C`) `Elastisite modulü` (`ID: 1027`), `Kayma modulü` (`ID: 1028`), `Poisson oranı` (`ID: 1029`), `Birim hacim ağırlığı` (`ID: 1030`) ve `Isıl genleşme katsayısı` (`ID: 1031`) alanları varsayılan olarak devre dışıdır (`disabled`). Sayısal alanları düzenlenebilir yapmak için önce `Tanımlı malzemeye dönüştür` düğmesi (`ControlId = 4393`) `-Action ClickDialogButton -ControlId 4393` ile tetiklenir, ardından tek sayısal alan (`sky.set_value` veya `-Action SetDialogEdit`) değiştirilir.

### Sanal tuş ve sayısal diyalog — ölçüm ve v2 yardımcı iyileştirmeleri

Mutation-B'de `Escape`, ayrı `press_key(m)`, `press_key(a)`, `Return` komut geçmişine `ma` yazdı ve `Materyaller` diyaloğunu açtı; statik malzeme özellikleri penceresine erişimi kanıtlamadı. Kullanıcının açtığı statik özellikler diyaloğunda 4393 dönüşüm düğmesi 1027–1031 sayısal alanlarını etkinleştirdi; 1030 `2.5 → 2.6` görüntü ve erişilebilirlik ağacında okundu. Dönüşüm ayrıca malzeme durumunu değiştirir; salt tek alanlı oracle sayma. `Return` diyaloğu kapatmadı, yardımcıdaki Tamam düğmesi kapattı; Ctrl+S sonrası hash değişti (`04f7753b0e036dcdc08f8518ba4eff4d929f2c69b7976eb554764c4ba8c49598`). Ayrıntılar: `D:\HsyncadHybridOS\gui-erisim\TESHIS_SONUC.md`.

Bu ölçümde gözlenen üç sınır `D:\HsyncadHybridOS\gui-erisim\idecad_gui_helper.ps1` içinde giderildi:
1. **`WM_GETTEXT` (`0x000D`) desteği:** Süreçler arası `Edit` kontrollerinde boş dönen `GetWindowText` yerine `SendMessage(..., WM_GETTEXT, ...)` eklendi (`InspectDialog` ve `SetDialogEdit` artık sayısal metinleri doğrudan okur).
2. **Örtülme önleme (`BringToFront`):** `-Action Screenshot` öncesinde hedef pencere/diyalog `SetForegroundWindow` ile öne alınır.
3. **Müdahalesiz ağaçtan diyalog açma (`-Action OpenTreeItem -TreeItemName "C25 B420C TEST"`):** `.NET UIAutomationClient` (`AutomationElement.FromHandle`) ile yapı ağacındaki öğenin `BoundingRectangle` koordinatları okunup `DoubleClickAt` ile `Statik Malzeme Özellikleri` penceresi kullanıcı müdahalesi olmadan açılır.

### Aşama 1d — müdahalesiz açma denemesi

Mutation-B ve yeni `mutation-B-defined-2.6.ide11trial` yedeği SHA-256 `04f7753b0e036dcdc08f8518ba4eff4d929f2c69b7976eb554764c4ba8c49598` ile eşit. Yeni ideCAD PID 4060 açıldı; deneme bildirimi Return ile kapatıldı, başlıkta mutation-B ve kat görüldü. `OpenTreeItem -TreeItemName 'C25 B420C TEST'` iki güncel denemede aynı hatayı verdi: `UIA agacinda 'C25 B420C TEST' ogesi bulunamadi.` İki deneme arasında ekran görüntüsüz sky ağacı aynı isimli 1412 öğesini gösterdi. İki hata sınırında duruldu; nedeni belirlenmedi. Diyalog açılmadığından kayıtlı 2.6 okunmadı, 2.7 mutasyonu, kayıt, ayrı oturum ve ekran görüntüsü yapılmadı. Orijinal fixture SHA-256 `2d836ac7ad325729fc5287330c97f1d1901f141bc1768ae0076698139baefb85`. Müdahalesiz kabul ve sayısal kalıcılık açık.
