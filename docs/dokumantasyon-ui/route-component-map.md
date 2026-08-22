# Dökümantasyon Modülü — Rota ve Bileşen Haritası (Route Component Map)

Bu doküman, `/dokumantasyon` modülü içindeki aktif üretim rotalarını, render zincirlerini, kabuk (shell) mimarilerini ve ölü (legacy) bileşenleri belgeler.

---

## 1. Aktif Üretim Rota Ağacı

### 1.1 Ana Yönetim ve Dosya Gezgini Rotaları
- **Rota:** `/dokumantasyon`
- **Sayfa Giriş Noktası:** `src/app/dokumantasyon/page.tsx`
- **Yetkilendirme:** `getDokumantasyonSession()` (`src/lib/dokumantasyon/auth.ts`)
- **Oturum Yoksa:** `DokumantasyonLoginForm` (`src/components/dokumantasyon/login-form.tsx`)
- **Oturum Varsa:** `DokumantasyonAdminShell` (`src/components/dokumantasyon/admin-shell.tsx`)
  - **Ana Gezgin:** `DokumantasyonFileManager` (`src/components/dokumantasyon/file-manager.tsx`)
  - **Sol Menü:** `DriveSidebar` (`src/components/dokumantasyon/drive-sidebar.tsx`)
  - **Detay Paneli (Masaüstü):** `DriveDetailsDrawer` (`src/components/dokumantasyon/drive-details-drawer.tsx`)
  - **Detay Sayfası (Mobil):** `MobileDetailsSheet` (`src/components/dokumantasyon/mobile-details-sheet.tsx`)
  - **Filtre Çekmecesi:** `WorkspaceFilterSheet` (`src/components/dokumantasyon/workspace-filter-sheet.tsx`)
  - **Yükleme Bildirimi:** `UploadProgressToast` (`src/components/dokumantasyon/upload-progress-toast.tsx`)
  - **CSS Kaynağı:** `src/components/dokumantasyon/dok-workspace.module.css`

---

### 1.2 Document Studio (Tekil Dosya Görüntüleyici ve Düzenleyici)
- **Rota:** `/dokumantasyon/dosya/[fileId]`
- **Sayfa Giriş Noktası:** `src/app/dokumantasyon/dosya/[fileId]/page.tsx`
- **Yetkilendirme:** `getDokumantasyonSession()` + `getAdminFileAccess(fileId)` (`src/lib/dokumantasyon/file-access.ts`)
- **Son Açılanlar Tetikleyicisi:** `markFileOpened(fileId)` (`src/lib/dokumantasyon/files.ts`)
- **Kabuk Bileşeni:** `DocumentStudioShell` (`src/components/dokumantasyon/studio/document-studio-shell.tsx`)
  - **Viewport Boyutu:** `100dvw × 100dvh` (İzole tam ekran, site navbar/footer gizlenir)
  - **Üst Çubuk:** `StudioTopbar` (`src/components/dokumantasyon/studio/studio-topbar.tsx`)
  - **Geri Dönüş Davranışı:** `router.push('/dokumantasyon?folderId=' + file.folder_id)`
  - **Görüntüleyici Motorları (Dinamik Yükleme):**
    - **PDF:** `DokPdfViewer` (`src/components/dokumantasyon/preview/pdf-viewer.tsx` -> `studio/pdf/pdfjs-studio.tsx`)
    - **CAD (DWG / DXF):** `DokCadViewer` (`src/components/dokumantasyon/preview/cad-viewer.tsx` / `aps-dwg-viewer.tsx`)
    - **Görsel:** `DokImageViewer` (`src/components/dokumantasyon/preview/image-viewer.tsx`)
    - **Metin / JSON / CSV:** `DokTextViewer` (`src/components/dokumantasyon/preview/text-viewer.tsx`)
    - **Markdown:** `DokMarkdownViewer` (`src/components/dokumantasyon/preview/markdown-viewer.tsx`)
    - **Desteklenmeyen:** `UnsupportedPreview` (`src/components/dokumantasyon/preview/unsupported-preview.tsx`)

---

### 1.3 Genel İndirme ve Paylaşım Rotaları
- **Rota:** `/p/[token]`
- **Sayfa Giriş Noktası:** `src/app/p/[token]/page.tsx`
- **Erişim Doğrulaması:** `getPublicShareInfo(token)` (`src/lib/dokumantasyon/public-share.ts`)
- **Şifreli Bağlantı:** `SharePasswordScreen` (`src/components/dokumantasyon/public/password-screen.tsx`)
- **İndirme Arayüzü:** `PublicShareDownloadView` (`src/components/dokumantasyon/public/download-view.tsx`)
- **Public Önizleme:** `PublicPreviewModal` (`src/components/dokumantasyon/public/public-preview-modal.tsx`)

---

## 2. Kullanılmayan / Ölü (Legacy) Bileşen Tespiti

- **Bileşen:** `src/components/dokumantasyon/preview/file-preview-shell.tsx`
- **Durum:** **ÖLÜ KOD (DEAD LEGACY CODE)**
- **Analiz:** Bu bileşen Drive v2 Aşama 3 döneminde ara bir kart önizleyici kabuğu olarak geliştirilmiş, ancak Document Studio v3 mimarisine geçişte yerini `src/components/dokumantasyon/studio/document-studio-shell.tsx` bileşenine bırakmıştır. Projedeki hiçbir aktif route veya component tarafından import edilmemektedir.
- **Politika:** UI-Faz 2 ve sonraki aşamalarda stil dönüşümünün odağı `DocumentStudioShell` olacaktır; `file-preview-shell.tsx` dönüştürülmeyecektir.
