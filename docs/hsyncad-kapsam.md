# hsynCAD ürün kapsamı

28 Ekim 2026 kullanıcının son kararı: çelik hariç bütün aileler kapsam içindedir. Önceki analiz/deprem/pafta/DWG kapsam dışı notları tarihsel kalmıştır. Çelik ve çelik birleşim işleri kapsam dışı kalır; ham REA kayıtları korunur.

Hedefler: betonarme modelleme; temel/merdiven/boşluk; düzenleme/çoğaltma/hizalama; çizim/ölçülendirme; yükler ve analiz; betonarme tasarım ve mevzuat; rapor/pafta; veri ve dosya alışverişi. Kapsama alınmış olması uygulanmış olduğu anlamına gelmez. Pasif komutlar gerçek model/hesap/çıktı doğrulanmadan etkinleştirilmez.

İlk geliştirme paketi: seçili elemanın döndürme, simetri, kopyalama, ofset ve çoğaltma akışları. Her değişiklik aynı serileştirilebilir modelden 2B/3B/metraj üretir, tek işlemde geri alınır ve JSON aç/kaydet ile korunur. Bağlı geometrinin kapalı çevresi bozulduğunda atomik ret uygulanır.

Sonraki büyük paketler bağımsız çalışma gerektirir: delikli katılar ve döşeme boşlukları; gerçek temel/merdiven eleman tipleri; kalıcı bağlı ölçülendirme; analiz için mesnet/yük/çözüm modeli; tasarım hesaplarının bağımsız örneklerle doğrulanması; pafta ve dosya biçimi desteği. Bunlar basit Ribbon bağlantısı sayılmaz. Tamamlanma durumu test ve üretilen artefaktlarla raporlanır; kusursuzluk iddiası yoktur.
