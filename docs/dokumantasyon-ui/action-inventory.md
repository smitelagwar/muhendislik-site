# Dökümantasyon Modülü — Eylem Envanteri (Action Inventory)

Bu doküman, `/dokumantasyon` modülü ve Document Studio içindeki tüm görünür kontrolleri, butonları, menü eylemlerini ve durum yönetimlerini belgeler.

---

## 1. Ana Dosya Gezgini Kontrolleri (`file-manager.tsx`)

| Kontrol / Buton | Konum | Tetiklenen Eylem / Handler | API / Veri Akışı | Bekleme (Pending) Durumu | Başarı / Hata Yönetimi |
|---|---|---|---|---|---|
| **Mobil Menü Hamburgeri** | Üst Komut Çubuğu (Mobil) | `setIsSidebarOpenMobile(true)` | İstemci durumu | Anlık | Menü sheet açılır, Esc/backdrop ile kapanır. |
| **Kök Dizin Butonu** | Breadcrumbs | `setActiveFilter("all")`, `setCurrentFolderId(null)` | `/api/dokumantasyon/items` | `loading: true` spinner | Dizin köke geçer, URL `folderId` güncellenir. |
| **Üst Klasöre Git** | Breadcrumbs (Mobil) | `setCurrentFolderId(parentBreadcrumb.id)` | `/api/dokumantasyon/items` | `loading: true` | Bir üst klasöre döner. |
| **Breadcrumb Klasör Butonları** | Breadcrumbs (Masaüstü) | `setCurrentFolderId(b.id)` | `/api/dokumantasyon/items` | `loading: true` | Hedef klasöre gider, URL güncellenir. |
| **Ara... Butonu** | Komut Çubuğu | `setIsSearchOpen(true)` | İstemci modalı | Anlık | `SearchModal` açılır, klavye kısayolu: `/`. |
| **Filtre Butonu** | Komut Çubuğu | `setIsFilterSheetOpen(true)` | İstemci sheet'i | Anlık | `WorkspaceFilterSheet` açılır. |
| **Dosya Yükle Butonu** | Komut Çubuğu / Sol Menü | `fileInputRef.current.click()` | `/upload/intent` + Blob upload | Upload Queue Toast | Intent token -> direct upload -> metadata teyidi. |
| **Klasör Yükle Butonu** | Komut Çubuğu | `openFolderPicker()` | `/folders` + recursive upload | Upload Queue Toast | Hiyerarşik klasör oluşturma ve dosya aktarımı. |
| **Yeni Klasör Butonu** | Komut Çubuğu / Sol Menü | `setIsNewFolderOpen(true)` | `POST /api/dokumantasyon/folders` | `loading: true` | Başarıda liste yenilenir, hata durumunda alert gösterilir. |
| **Görünüm Modu (Liste / Kart)** | Komut Çubuğu | `setViewMode("list" \| "grid")` | İstemci durumu | Anlık | Liste (tablo) veya Kart görünümüne geçer. |
| **Detay Çekmecesi Butonu** | Komut Çubuğu (Masaüstü) | `setIsDetailsOpen(!isDetailsOpen)` | İstemci durumu | Anlık | Seçili öğe detay çekmecesi açılır/kapanır. |
| **Tümünü Seç Checkbox** | Tablo Başlığı | `handleToggleSelectAll()` | `useDokSelection` | Anlık | Görüntülenen tüm dosyalar seçilir/kaldırılır. |
| **Kolon Sıralama (İsim/Boyut/Tarih)**| Tablo Başlığı | `handleSort("name" \| "size" \| "date")` | İstemci & `/items` query | `loading: true` | ASC/DESC yönünde liste yeniden sıralanır. |
| **Çoklu Taşı Butonu** | Yüzen Aksiyon Çubuğu | `handleOpenMoveSelected()` | `PATCH /api/dokumantasyon/folders/[id]` / `files/[id]` | `loading: true` | `MoveModal` açılır; kısmi hata seçimi korur. |
| **Çoklu Link Oluştur** | Yüzen Aksiyon Çubuğu | `handleOpenShareSelected()` | `POST /api/dokumantasyon/shares` | `loading: true` | `CreateShareModal` seçili tüm öğelerle açılır. |
| **Çoklu Sil Butonu** | Yüzen Aksiyon Çubuğu | `setIsMultiDeleteOpen(true)` | `DELETE /api/dokumantasyon/folders/[id]` / `files/[id]` | `loading: true` | `DeleteConfirmModal` açılır; kısmi başarısızlıklar seçili kalır. |

---

## 2. Tablo / Kart Öğe Satırı Eylemleri

| Kontrol | Konum | Eylem | Sonuç |
|---|---|---|---|
| **Öğe Checkbox** | Satır / Kart Başı | `handleToggleSelect(id)` | Öğe seçilir veya seçimden çıkarılır. |
| **Yıldız Butonu** | Satır / Kart | `toggleStar(type, id, isStarred)` | Optimistic güncelleme + `PATCH /api/dokumantasyon/stars`. Hata olursa rollback yapılır. |
| **Önizle / Tıklama** | Dosya Adı / Satır | `<Link href="/dokumantasyon/dosya/[fileId]">` | Document Studio açılır, `markFileOpened` tetiklenir. |
| **Yeni Sekmede Aç** | 3-Nokta Menü | `<Link target="_blank">` | Document Studio yeni sekmede açılır. |
| **İndir** | 3-Nokta Menü / Detay Çekmecesi | `handleDownload(file)` | Signed erişim URL'si alınarak güvenli indirme başlatılır. |
| **Link Oluştur** | 3-Nokta Menü / Detay Çekmecesi | `handleOpenShareSingle(item)` | Tekil öğe için paylaşım modalı açılır. |
| **Yeniden Adlandır** | 3-Nokta Menü / Detay Çekmecesi | `setRenameItem(item)` | `RenameModal` açılır, duplicate isim kontrolü yapılır. |
| **Taşı** | 3-Nokta Menü | `setMoveItems([item])` | `MoveModal` açılır, dairesel hedef engellenir. |
| **Çöp Kutusuna At** | 3-Nokta Menü / Detay Çekmecesi | `setDeleteItem(item)` | `DeleteConfirmModal` açılır, soft delete yapılır. |

---

## 3. Document Studio Eylemleri (`studio-topbar.tsx`)

| Buton / Kontrol | Komut ID | Eylem / Handler | Güvenlik / Durum Kontrolü |
|---|---|---|---|
| **Geri Dön (Back)** | `studio.back` | `handleBack()` | Varsa dosyanın bulunduğu klasöre (`/dokumantasyon?folderId=...`), yoksa kök dizine döner. |
| **Sürüm Kaydet** | `studio.save` | `handleSaveVersion()` | Yalnızca `isDirty === true` durumunda aktif. Canlı metin/MD içeriğini v2/v3 olarak kaydeder. |
| **Paylaş** | `studio.share` | `setIsCreateShareOpen(true)` | Dosya için anlık süreli link oluşturma modalı açar. |
| **İndir** | `studio.download` | `handleDownload()` | Orijinal dosyayı sunucu stream'i ile indirir. |
| **Tam Ekran** | `studio.fullscreen` | `handleToggleFullscreen()` | Tarayıcı Fullscreen API'sini tetikler/kapatır. |
| **Yeniden Adlandır** | `studio.rename` | `setIsRenameOpen(true)` | Dosya adını günceller. |
| **Çöp Kutusuna At** | `studio.delete` | `setIsDeleteOpen(true)` | Dosyayı siler ve klasöre yönlendirir. |
| **Tema Değiştirici**| Tema Toggle | `ModeToggle` | Light/Dark temayı değiştirir (Canvas içeriğini bozmaz). |
