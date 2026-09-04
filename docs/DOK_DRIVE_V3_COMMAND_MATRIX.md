# DÖKÜMANTASYON DRIVE V3.1 — KOMUT MATRİSİ (COMMAND MATRIX)

Tüm kullanıcı eylemleri tek bir komut kayıt defteri (`src/components/dokumantasyon/drive-v3/command-registry.ts`) üzerinden doğrulanır ve yönlendirilir.

| ID | Komut Adı | Kısayol | Hedef | Çoklu Seçim Desteği | Tetikleyici UI |
|---|---|---|---|---|---|
| `cmd_new_folder` | Yeni Klasör | Shift + N | Klasör Oluştur | Hayır (0 seçim) | Üst Araç Çubuğu / Boş Alan Menüsü |
| `cmd_upload_file` | Dosya Yükle | Ctrl + U | Dosya Seçici | Hayır | Üst Araç Çubuğu / Boş Alan Menüsü |
| `cmd_upload_folder` | Klasör Yükle | - | Klasör Seçici | Hayır | Üst Araç Çubuğu / Boş Alan Menüsü |
| `cmd_select_all` | Tümünü Seç | Ctrl + A | Liste | Evet (Tümü) | Üst Çubuk Checkbox / Kısayol |
| `cmd_clear_selection` | Seçimi Temizle | Escape | Liste | Evet (0'a çeker) | Yüzen Aksiyon Çubuğu / Kısayol |
| `cmd_open_item` | Öğeyi Aç | Enter / Çift Tık | Dosya / Klasör | Hayır (Tekil) | Çift Tık / Kart Tıklaması |
| `cmd_preview_item` | Önizle | Space / P | Dosya | Hayır (Tekil dosya) | Sağ Tık / Detay Çekmecesi |
| `cmd_download_item` | İndir | Ctrl + D | Dosya | Evet (ZIP arşivi) | Üst Çubuk / Kart Menüsü / Yüzen Bar |
| `cmd_rename_item` | Yeniden Adlandır | F2 | Dosya / Klasör | Hayır (Yalnızca 1 öğe) | Kart Menüsü / Kısayol |
| `cmd_move_items` | Taşı | M | Dosya / Klasör | Evet (1..250 öğe) | Kart Menüsü / Yüzen Bar / Sürükle-Bırak |
| `cmd_trash_items` | Çöpe Taşı | Delete | Dosya / Klasör | Evet (1..250 öğe) | Kart Menüsü / Yüzen Bar / Kısayol |
| `cmd_restore_items` | Geri Yükle | Alt + R | Çöp Kutusu | Evet (1..250 öğe) | Çöp Kutusu Modalı |
| `cmd_permanent_delete` | Kalıcı Olarak Sil | Shift + Delete | Çöp Kutusu | Evet (1..250 öğe) | Çöp Kutusu Modalı |
| `cmd_toggle_star` | Yıldızla / Kaldır | S | Dosya / Klasör | Evet (1..250 öğe) | Kart İkonu / Yüzen Bar |
| `cmd_create_share` | Süreli Paylaşım | Alt + S | Dosya / Klasör | Evet (Çoklu ZIP linki) | Üst Çubuk / Kart Menüsü / Yüzen Bar |
| `cmd_view_shares` | Aktif Paylaşımlar | - | Global | Hayır | Üst Çubuk Link Butonu |
| `cmd_search` | Hızlı Arama | Ctrl + K / / | Global | Hayır | Komut Çubuğu / Kısayol |
| `cmd_view_trash` | Çöp Kutusunu Aç | - | Global | Hayır | Sol Kenar Çubuğu |
| `cmd_switch_view` | Görünüm Değiştir | V | Liste / Grid | Hayır | Görünüm Toggle Butonu |
| `cmd_open_details` | Detayları Göster | I | Dosya / Klasör | Hayır (Tekil) | Sağ Panel Toggle Butonu |
| `cmd_refresh_list` | Listeyi Yenile | Ctrl + R | Liste | Hayır | İstemci Önbellek Yenileme |
| `cmd_retry_failed` | Başarısızları Dene | - | Hata Paneli | Evet (Kısmi başarısızlar) | Bildirim Toast'ı |
| `cmd_cancel_upload` | Yüklemeyi İptal Et | - | Transfer Kuyruğu| Evet (Seçili aktarım) | Yükleme Toast'ı Kapat Butonu |

Toplam 23 komutun tamamı doğrulanmış olup arayüzde 0 ölü kontrol (dead control) kuralı geçerlidir.
