# Yerel ideCAD kontrol yardımcısı

Windows üzerinde Python 3 + Pillow gerektirir. Bu bilgisayarda mevcut Python 3.14.3 ve Pillow ile canlı doğrulandı; yeni paket kurulmadı. Önce [masaüstü kılavuzunu](../../docs/hsyncad/IDECAD_DESKTOP_WORKFLOW.md) ve uygulanabilir Computer Use talimatlarını okuyun. Yerleşik araç dışındaki bu yöntem için açık kullanıcı yetkisi gerekir; 8 Kasım kabul sohbetinde verilmiştir.

`desktop.py`, görünür ideCAD penceresinin GDI görüntüsünü alır ve Win32 girdi yollarını kullanır. UIA ağacı veya Sky ekran görüntüsüne bağımlı değildir. Ribbon dahil ekrandaki özel çizimli kontroller görüntüyle kullanılır. Bütün ürün düğmelerinin otomatik anlamsal eşlemesini içermez.

```powershell
python -X utf8 scripts/idecad/desktop.py --help
python -X utf8 scripts/idecad/desktop.py list
```

`list` sonucundan görevdeki dosyaya ait **ideCADMainFrame** HWND'sini seçin. Aşağıdaki `$ideHwnd`, bu güncel sonuçtan alınmalıdır; geçmiş HWND veya PID kullanmayın.

```powershell
$ideSession = 'D:\HsyncadHybridOS\gui-erisim\desktop-control\session.json'
python -X utf8 scripts/idecad/desktop.py bind --hwnd $ideHwnd --expect-title 'test-projesi.ide11trial' --session $ideSession --brief
python -X utf8 scripts/idecad/desktop.py observe --session $ideSession --brief
```

`observe` çıktısındaki `image` dosyasını `view_image` ile inceleyin. Tıklama/sürükleme/kaydırmada aynı çıktının `observation` dosyası gerekir. `$ideObservation`, `$ideX`, `$ideY` o görüntüden türetilir. Her işlem yeni gözlem üretir; bir sonraki işlemde yeni dosyayı kullanın. PNG koordinatları orijinal pikseldir; küçültülmüş araç önizlemesinin koordinatlarını doğrudan kullanmayın.

```powershell
python -X utf8 scripts/idecad/desktop.py click --session $ideSession --observation $ideObservation --x $ideX --y $ideY --count 2 --brief
python -X utf8 scripts/idecad/desktop.py click --session $ideSession --observation $ideObservation --x $ideX --y $ideY --button right --brief
python -X utf8 scripts/idecad/desktop.py key --session $ideSession --chord ctrl+s --brief
python -X utf8 scripts/idecad/desktop.py replace --session $ideSession --text '2.7' --brief
```

| İşlem | Gerekli parametre / davranış |
|---|---|
| `bind` | `--hwnd`, `--expect-title`; kimliği süreç başlangıç zamanı + EXE + PID ile bağlar |
| `observe` | Etkin modalı/ana pencereyi öne alır, PNG + kontrol/focus JSON'u üretir |
| `inspect` | Yeni kontrol/focus JSON'u; görüntü üretmez, önceki koordinat gözlemini geçersiz kılar |
| `click` | `--observation --x --y`; `--count 1/2`, `--button left/right/middle` |
| `key` | `--chord ctrl+s`, `alt+f4`, `esc`, `enter`, `tab`, `shift+tab`, oklar vb. |
| `type` | `--text`; odaktaki etkin Edit'e Unicode metin ekler |
| `replace` | `--text`; etkin Edit'in tamamını seçer, yazar, tam metni geri doğrular |
| `drag` | `--observation --x --y --to-x --to-y`; isteğe bağlı `--button` |
| `scroll` | `--observation --x --y --delta`; `-120` aşağı, `120` yukarı; `--horizontal` yatay |

`--contains` çıktıdaki kontrol metinlerini süzer; tam kontroller JSON dosyasında kalır. `--brief` tekrar eden metadatayı azaltır. `--out-dir` bind sırasında kanıt dizinini belirler. Varsayılan kanıt dizini `D:\HsyncadHybridOS\gui-erisim\desktop-control`; oturum yolunu açıkça vermek önerilir.

Koordinat gözlemi son gözlem olmalı, 120 saniyeden eski olmamalı; süreç, başlık, modal ve geometri eşleşmelidir. Nokta başka sürece aitse girdi reddedilir. Her komut 30 saniyede sonlandırılır, hata sıfır dışı döner. Hata sonrasında girdi sonucunu varsaymayın; yeni `observe` alın. `alt+f4` normal kapanırsa `closed: true`; kayıt sorusu açılırsa diyalog döner.

Yardımcı yalnız izin verilen ideCAD EXE'lerine ve `WinSta0\Default` masaüstüne bağlanır. Başka masaüstüne geçmez; kalıcı servis, uzak kontrol endpoint'i, UAC geçişi veya host ikilisi değişikliği içermez. Ön plandaki görünür pikselleri kullandığı için masaüstü açık olmalı; kullanıcının eşzamanlı fare/klavye hareketi sırasında yeniden gözlem gerekir.

Canlı kabul: `D:\HsyncadHybridOS\gui-erisim\desktop-control\ACCEPTANCE.md`. Test projesi bir mühendislik tasarım onayı değildir; malzeme değişikliği yalnız ayrı test kopyasındadır.

Koordinatla çizim için `coordinate_point.py --help`: mevcut çizim komutunda X/Y kısayollarıyla global nokta kilitler; birim ve plan tıklama konumu önceden doğrulanır. Bekleyen Edit veya uyumsuz geri okumada durur. Yedi katlı uygulamada radye sınırı bu yolla oluşturuldu. Analiz sırasında gizlenen ana pencerenin gerçek owner zinciri izlenir; uzun günlük Edit metni 500000 karaktere kadar alınır.
