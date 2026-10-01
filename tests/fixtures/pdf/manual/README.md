# Manuel Test PDF Fixture Deposu

Bu dizin, telif hakkı, dosya boyutu (50 MB+) veya özel üretim gerektiren dosyalardan oluşur.
Dosyalar **repoya commit edilmez** (`.gitignore` kapsamındadır).

## Beklenen Manuel Fixture Dosyaları:

1. `taranmis-metinsiz.pdf`
   - Metin katmanı (TextLayer) olmayan, yalnızca raster taranmış görüntüler içeren PDF.
   - Test amacı: Arama motorunun "Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz." uyarısını doğru vermesini doğrulamak.

2. `sifreli.pdf`
   - Kullanıcı parolasıyla kilitlenmiş PDF (`onPassword` akışı doğrulaması için).
   - Test amacı: Parola iletişim kutusunun açılması, yanlış parolada hata verilmesi ve doğru parola girildiğinde belgenin açılması.

3. `buyuk-mimari-50mb.pdf`
   - 50 MB üzeri boyuta sahip, çok sayıda vektörel ve raster katman içeren gerçek mimari/mühendislik paftası.
   - Test amacı: Range (HTTP 206) istekleri, ilk sayfa yükleme hızı ve bellek tüketimi bütçesini doğrulamak.

4. `bozuk-kesik.pdf`
   - Bayt dizisinin ortasında kesilmiş veya xref tablosu bozulmuş geçersiz PDF.
   - Test amacı: `InvalidPDFException` yakalanıp temiz hata ekranı ve "İndir" butonunun sunulması (sonsuz retry olmamalı).
