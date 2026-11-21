# DÖKÜMANTASYON DRIVE V3.1 — KOMUT MATRİSİ (COMMAND MATRIX)

Bu belge, kullanıcı eylemleri için komut kayıt defteri sözleşmesini (`src/components/dokumantasyon/drive-v3/command-registry.ts`) ve UI/klavye tetikleyicilerini envanterler.

> **Kapsam notu:** Bu matris komut sözleşmesi ve masaüstü/genel UI envanteridir. Mobil gövde/ad/çift tıklama/contextmenu/seçim kontrolü kuralları için [`docs/DOK_DRIVE_V3_INTERACTION_CONTRACT.md`](DOK_DRIVE_V3_INTERACTION_CONTRACT.md) ve mobil uygulama/test kanıtı için [`docs/DOK_MOBILE_HARDENING_2026-09-10.md`](DOK_MOBILE_HARDENING_2026-09-10.md) esas alınır.

| # | CommandId | Komut Adı | Kısayol | Hedef | Çoklu Seçim Desteği | Tetikleyici UI |
|---|---|---|---|---|---|---|
| 1 | `new-folder` | Yeni Klasör | `Shift+N` | Klasör Oluştur | Hayır (0 seçim) | Üst Araç Çubuğu / Boş Alan Sağ Tık |
| 2 | `upload-files` | Dosya Yükle | `Ctrl+U` | Dosya Seçici | Hayır | Üst Araç Çubuğu / Boş Alan Sağ Tık |
| 3 | `upload-folder` | Klasör Yükle | - | Klasör Seçici | Hayır | Üst Araç Çubuğu / Boş Alan Sağ Tık |
| 4 | `open` | Aç | `Enter` | Dosya / Klasör | Hayır (Tekil) | Çift Tık / Sağ Tık Menüsü |
| 5 | `preview` | Önizle | `Space` / `P` | Dosya | Hayır (Tekil dosya) | Sağ Tık Menüsü / Detay Çekmecesi |
| 6 | `open-cad-v2` | Motor V2 ile Aç | - | DWG / DXF Dosya | Hayır (Tekil CAD) | Sağ Tık Menüsü / Detay Çekmecesi |
| 7 | `download` | İndir | `Ctrl+D` | Dosya | Evet (ZIP arşivi) | Üst Çubuk / Sağ Tık / Yüzen Bar |
| 8 | `rename` | Yeniden Adlandır | `F2` | Dosya / Klasör | Hayır (Yalnızca 1 öğe) | Sağ Tık / Detay / Kısayol |
| 9 | `move` | Taşı | `M` | Dosya / Klasör | Evet (1..250 öğe) | Sağ Tık / Yüzen Bar / Sürükle-Bırak |
| 10 | `trash` | Çöp Kutusuna Taşı | `Delete` | Dosya / Klasör | Evet (1..250 öğe) | Sağ Tık / Yüzen Bar / Kısayol |
| 11 | `restore` | Geri Yükle | `Alt+R` | Çöp Kutusu | Evet (1..250 öğe) | Çöp Kutusu Modalı |
| 12 | `delete-forever` | Kalıcı Olarak Sil | `Shift+Delete` | Çöp Kutusu | Evet (1..250 öğe) | Çöp Kutusu Modalı |
| 13 | `star` | Yıldızla | `S` | Dosya / Klasör | Evet (1..250 öğe) | Kart İkonu / Sağ Tık / Yüzen Bar |
| 14 | `unstar` | Yıldızı Kaldır | `S` | Dosya / Klasör | Evet (1..250 öğe) | Kart İkonu / Sağ Tık / Yüzen Bar |
| 15 | `share` | Paylaş | `Alt+S` | Dosya / Klasör | Evet (Çoklu ZIP linki) | Sağ Tık / Yüzen Bar / Detay |
| 16 | `details` | Ayrıntılar | `I` | Dosya / Klasör / Klasör Özeti | Evet (0/1/Çoklu) | Sağ Panel Toggle / Sağ Tık |
| 17 | `search` | Ara... | `/` / `Ctrl+Shift+F` | Global | Hayır | Arama Çubuğu / Kısayol |
| 18 | `select-all` | Tümünü Seç | `Ctrl+A` | Liste / Grid | Evet (Tümü) | Üst Çubuk Checkbox / Boş Alan Sağ Tık |
| 19 | `clear-selection` | Seçimi Kaldır | `Escape` | Liste / Grid | Evet (0'a çeker) | Yüzen Bar / Kısayol |
| 20 | `refresh` | Yenile | `R` | Liste / Grid | Hayır | Yenile Butonu / Boş Alan Sağ Tık |
| 21 | `change-view` | Görünümü Değiştir | `V` | Liste / Grid | Hayır | Görünüm Toggle Butonu |
| 22 | `change-sort` | Sıralamayı Değiştir | - | Liste / Grid | Hayır | Sıralama Menüsü / Liste Sütun Başlığı |
| 23 | `open-trash` | Çöp Kutusunu Aç | - | Global | Hayır | Sol Kenar Çubuğu |
| 24 | `open-active-shares` | Aktif Paylaşımları Aç | - | Global | Hayır | Sol Kenar Çubuğu / Üst Çubuk |
| 25 | `copy` | Kopyala | `Ctrl+C` | Dosya / Klasör | Evet (1..250 öğe) | Sağ Tık / Yüzen Bar / Kısayol |
| 26 | `cut` | Kes | `Ctrl+X` | Dosya / Klasör | Evet (1..250 öğe) | Sağ Tık / Yüzen Bar / Kısayol |
| 27 | `paste` | Yapıştır | `Ctrl+V` | Hedef Klasör (Pano) | Evet (Panodaki öğeler) | Pano Çubuğu / Boş Alan Sağ Tık / Kısayol |

## Yardımcı Klavye Rehberi (`?`)

- **`?` (`ShortcutsModal`):** `src/components/dokumantasyon/drive-v3/shortcuts-modal.tsx` üzerinden açılır; Gezinme & Arama, Dosya & Klasör İşlemleri ve Seçim, Pano & Çöp Kutusu gruplarında tüm etkin kısayolları listeler.

Toplam 27 komutun tamamı `COMMAND_DEFINITIONS` ve `CommandRegistry` üzerinden doğrulanmış olup arayüzde 0 ölü kontrol (dead control) kuralı geçerlidir.
