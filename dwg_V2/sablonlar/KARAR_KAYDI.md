# Karar kaydı şablonu

[Dizin](../README.md) · [Karar çerçevesi](../04_KARAR_CERCEVESI.md)

**Durum:** Astra/kullanıcının karar kaydı şablonu; verilmiş karar değil. Gemini karar/seçim alanlarını dolduramaz veya yapıyı sadeleştirip kanıt alanlarını kaldıramaz. Gemini uygulama engellerini [CR şablonuyla](KARAR_ENGELI.md) iletir; [EXEC-1](../00_BAGLAYICI_UYGULAMA_KARARLARI.md) revize edilmeden alternatif uygulanmaz.

## Kimlik

- Karar ID / tarih / ilgili commit:
- İlgili ürün hedefi ve iş paketi:
- Durum: öneri / denendi / kabul edildi / değiştirildi
- Karar sahibi ve gözden geçiren:

## Problem ve seçenekler

Karar verilmesini gerektiren somut dosya/cihaz sorunu. Değerlendirilen en az iki anlamlı seçenek ve “şimdilik değiştirmeme” seçeneği.

## Kanıt

Corpus hash'leri, exact dependency/asset sürümleri, deney raporu ve kaynak bağlantıları. Doğrulanmış bulgu ile sağlayıcı iddiası ve çıkarımı ayır.

## Önerilen karar ve gerekçe

Seçim, beklenen davranış, mevcut motor üzerindeki etkisi. Seçeneğin elenme veya geri alınma koşulu. Lisans/ücret/erişim varsayımları.

## Sonuçlar

Fidelity, hız, bellek, cihaz desteği, bakım ve işletim maliyetine etkiler. Kaybedilen yetenekler, bilinen açıklar ve ölçülmemiş alanlar.

## Takip

Sonraki iş paketi, test ve belge güncellemesi. Eski kararın yerine geçiyorsa ilişki; eski kaydı sessizce silme.
