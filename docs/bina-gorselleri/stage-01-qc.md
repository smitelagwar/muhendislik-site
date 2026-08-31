# Aşama 01 — QC ve Entegrasyon Notu

Kapsam: Proje & İzinler, Mimari Proje, Statik Proje. Her konu için 1 PRIMARY + 1 SECONDARY.

## Sonuç

- 6/6 görsel üretildi.
- 6/6 görsel 3840×2160, 16:9, WebP.
- PRIMARY/SECONDARY dosyaları ayrı binary'lerdir.
- SHA256 tekrar yok.
- Görsel çiftleri aynı kadraj/crop değildir.
- Görünür logo/filigran yok.
- Kullanıcı arayüzü/infografik/etiket görseli yok; sahne odaklı inşaat/mimarlık görselleridir.

## QC skorları

| Konu | Slot | QC | Not |
|---|---|---:|---|
| Proje & İzinler | PRIMARY | 94 | Maket + proje koordinasyon masası net, konu ilk bakışta okunuyor. |
| Proje & İzinler | SECONDARY | 93 | BIM/MEP koordinasyon ve çakışma sahnesi primary'den belirgin farklı. |
| Mimari Proje | PRIMARY | 94 | Plan/kesit + bina maketi ilişkisi güçlü. |
| Mimari Proje | SECONDARY | 95 | Düşey sirkülasyon ve mekân ilişkisi kesitte net. |
| Statik Proje | PRIMARY | 95 | Betonarme kolon-kiriş-döşeme sistemi sade ve gerçekçi. |
| Statik Proje | SECONDARY | 93 | Kolon-kiriş-döşeme birleşimi/donatı detayı öğretici ve farklı. |

## Repo hedef yolları

- `public/bina-asamalari/topics/proje-hazirlik.webp`
- `public/bina-asamalari/details/proje-hazirlik.webp`
- `public/bina-asamalari/topics/mimari-proje.webp`
- `public/bina-asamalari/details/mimari-proje.webp`
- `public/bina-asamalari/topics/statik-proje.webp`
- `public/bina-asamalari/details/statik-proje.webp`

Mevcut V2 manifest bu hedef yolları zaten tanımlıyor; binary'ler bu yollarla eşleşecek şekilde hazırlanmıştır.

## Kapanış durumu

**Görsel üretim + yerel QC tamamlandı.** Repo branch'i oluşturuldu (`bina-gorselleri-stage-01`), ancak 6 WebP henüz branch'e yazılmadı. Bu yüzden route/publish kapısı teknik olarak açık kalıyor; Aşama 01'i tam `published` saymıyoruz.
