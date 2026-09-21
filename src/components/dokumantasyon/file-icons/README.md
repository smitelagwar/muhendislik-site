# Özgün dosya ikonları — Aşama 03/04 teknik altyapı

Bu klasör kullanıcı tarafından seçilen ilk ikon konseptinin kod karşılığıdır.

- Hazır dosya türü ikon paketi kullanılmaz.
- Dosya gövdesi, renkler ve merkez semboller projeye özel SVG olarak render edilir.
- Tek merkezli extension/MIME registry vardır.
- `.md`, `.dwg` ve `.dxf` ayrı türlere resolve edilir.
- Klasör ikonu da aynı görsel ailede özel SVG'dir.
- Aksiyon ikonları (ara, taşı, paylaş, sil vb.) kapsam dışıdır.
- Bu branch production'a alınmadan önce mobil/desktop entegrasyonu ve regresyon testleri tamamlanmalıdır.

## Hedef kullanım

```tsx
<FileTypeIcon extension={file.extension} mimeType={file.mime_type} size="list" />
<FolderIcon size="list" />
```

Boyut tokenları:
- `list`: 28 px
- `grid`: 40 px
- `detail`: 48 px
- sayı: özel px değeri
