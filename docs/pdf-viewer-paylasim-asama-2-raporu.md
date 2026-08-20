# PDF Viewer + Paylaşım Sistemi — Aşama 2 Raporu

Tarih: 20 Ağustos 2026

## Değiştirilen dosyalar

- `src/components/dokumantasyon/studio/document-studio-shell.tsx`
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`
- `src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx`
- `src/components/dokumantasyon/studio/pdf/pdf-thumbnail-sidebar.tsx`
- `src/components/dokumantasyon/studio/studio-command-button.tsx`
- `src/components/dokumantasyon/studio/studio-topbar.tsx`
- `tests/document-studio/stage1.spec.ts`

## Uygulanan çözüm

- Studio mount edildiğinde `html` ve `body` scroll'u, önceki inline değerleri
  saklanarak kilitleniyor; unmount'ta değerler geri yükleniyor.
- Shell, viewer kökü, workspace, thumbnail sidebar ve PDF scroll viewport
  zincirinde `min-h-0` / `min-w-0` ile intrinsic PDF boyutunun üst katmanları
  büyütmesi engellendi.
- PDF viewport tek ana scroll owner olarak korundu; `overscroll-contain` ve
  stabil scrollbar gutter eklendi.
- PDF içerik sarmalayıcısı küçük sayfalarda ortalama, büyük sayfalarda ise
  erişilebilir scroll origin sağlayacak gerçek layout ölçülerini kullanıyor.
- Sayfa navigasyonu `scrollIntoView` yerine yalnızca PDF scroll container'ına
  `scrollTo` uyguluyor.
- Toolbar sabit, tek satırlı hale getirildi. Mobilde temel sayfa, arama ve zoom
  eylemleri görünür; sidebar, ilk/son sayfa, seçim/el araçları, fit, döndürme
  ve yazdırma ikincil menüden erişilebilir.
- Studio topbar'ın mobilde yatay taşmasına neden olan tema kontrolü ve eylem
  etiketleri dar ekranda gizleniyor; eylem ikonları korunuyor.

## Doğrulama

Yeni E2E testi %500 PDF zoomunda şu viewport'ları doğrular:

```text
390×844, 430×932, 768×1024, 1024×768,
1366×768, 1440×900, 1920×1080
```

Her ölçümde `html` ve `body` scroll yüksekliği viewport yüksekliğine eşit,
shell scroll genişliği client genişliğine eşit kaldı. 390 px genişlikte toolbar
tek satırda, temel eylemler görünür ve PDF viewport hem yatay hem dikey overflow
üretmektedir.

Çalıştırılan kontroller:

- `npx tsc --noEmit` — başarılı
- `npm run check:document-studio:e2e` — başarılı (2/2)
- `npm run build` — başarılı

## Kalan risk

Yok. Ctrl/Cmd + wheel listener yaşam döngüsü ile imleç-odaklı zoom davranışı
Aşama 3 kapsamındadır.
