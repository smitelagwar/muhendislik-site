# Antigravity devamının kod denetimi — 28 Ekim 2026

Konuşma: `5e9dc76e-1e6b-4537-997c-474684e31700`. Okunabilir kayıt: `C:/Users/hsyn/.gemini/antigravity/brain/<ID>/.system_generated/logs/transcript.jsonl` (1.956 kayıt). Konuşma sonuçları tarihsel iddialardır; çalıştırılacak talimat sayılmadı. Başlangıç HEAD `7c4e082a`; model/araştırma dosyaları ve commitler korunmuştur.

Önce AGENTS.md'ye Codex araçları → yerel indeks/rollout fallback'i ve Antigravity brain → JSONL → ikili kayıt fallback'i eklendi. PROJECT.md bu bölüme yönlendirir. Kimlik verildiğinde bütün disk/kurulum/kimlik bilgisi dosyaları taranmayacaktır.

## Bulunan ve giderilen sorunlar

- Analiz state'i modelden bağımsız saklanıyordu. Eleman ekleme/düzenleme, model açma, undo/redo sonrası eski sonuç aynı ekranda kalabiliyordu. Sonuç artık hesaplandığı model nesnesiyle saklanır; kaynak eşleşmiyorsa renkler/tahkikler/rapor null sonuç görür ve yeniden hesaplanır. İki kolonla yeniden açılan sonuç 24,0 kN olarak tarayıcıda doğrulandı.
- Ön hesap kütlesi ham b×h×height kullanıyor, kat tavanına bağlı gerçek yükseklikleri/dairesel kesitleri/birleşim hacim paylaşımını göz ardı ediyordu. Ortak birleşim motorunun eleman bazında net hacmi artık kullanılır; çözülemeyen birleşimde hesap reddedilir. Boş katlara uydurma 10 kN sabit ve 2 kN hareketli yük eklenmez. Yük katılımı ve pozitif/sonlu girişler doğrulanır. Bu geometri/veri tutarlılığı düzeltmesi hesap yönteminin tam TBDY doğrulaması değildir.
- Pafta donatı metrajı bütün katların eleman sayısını kat sayısıyla tekrar çarpıyordu. Temel ve hatta eleman bulunmayan modele sabit yüzlerce donatı ekliyordu. Sabit metraj kaldırıldı; mevcut kolon/kirişlerin taslak detay satırlarından uzunluk ve miktar toplanır. Boş model boş liste verir; boş kat eklemek listeyi büyütmez. Tanımlanmayan perde/temel donatısı uydurulmaz. Bunlar taslak çizim önerileridir, doğrulanmış donatı tasarımı değildir.
- Antette referans sahibinin/mühendisin/oda sicilinin örnek değerleri ve 10.752 m² alan her projeye taşınıyordu. Kişi/tescil/adres varsayılanları temizlendi. Proje adı aktif modelden, kat sayısı ve toplam döşeme plan alanı geometriden gelir; özel antet alanları kullanıcı tarafından girilir.
- Genel PASS/uygunluk iddiaları yaklaşık modelin kapsamını aşmıştı. Ekran, durum mesajı ve pafta notları ön hesap/taslak niteliğini açıklar. Hesap ve çizim ekranları kaldırılmadı; desteklenmeyen sertifikasyon iddiası kaldırıldı.

## Doğrulama

- Başlangıç 75 domain testi geçti; bu testler sabit donatı gibi gerçek hataları kaçırıyordu. Beş yeni regresyonla son toplam 80/80 başarılı.
- İlgili ESLint ve uygulama TypeScript kontrolü temiz. Production build başarılı; son derleme3142yerel adresinde sunuluyor. Boş model pafta açma smoke kontrolünde de JavaScript hatası yok.
- Dört tarayıcı akışı başarılı: yeni analiz/temel/merdiven/görünüm akışı; eski analiz sonucunun yenilenmesi; yedi katlı modelin pafta/antet/DXF akışı; boş modelden iki kat çizimi → metraj → gerçek CSV/JSON indirme → yeniden açma.
- Kayıtlar `C:/Users/hsyn/Desktop/hsyncad/incelemeler/idecad-rea/devam-2026-10-28/antigravity-*.log` altında. Testler izole tarayıcı bağlamındadır, kullanıcının yerel modeli değiştirilmedi. Uzak Git/deploy yapılmadı.

## Açık kalan önemli sınırlar

Antigravity konuşmasındaki belediye/yapı denetim onayına uygunluk ve yüzde yüz AutoCAD/ideCAD uyumluluğu doğrulanmış değildir. Ön hesap yaklaşık yük/stiflik dağıtımları ve varsayımlar içerir; tam 3B FEM/yük kombinasyonu çözümü değildir. Paftadaki bazı deprem/zemin parametreleri hâlâ örnek/varsayılan değerlerdir; otomatik onay raporu oluşturduğu kabul edilmemelidir. Donatı detayı ve kesit tablolarında varsayımsal yerleşimler bulunur. Gerçek DWG/ideCAD roundtrip'i, bütün pafta türlerinin özel ölçekte yerleşimi ve bütün yönetmelik tahkikleri bu denetimde doğrulanmadı. Uygulamanın hesap motorunu doğrulanmış mühendislik tasarımı saymak için bağımsız referans karşılaştırmaları gerekir.
