# ideCAD masaüstü kontrol kuralı

ideCAD'i başlatma, pencere/menü/ayar yönetimi veya gerçek uygulamada native dosya doğrulamasında [IDECAD_DESKTOP_WORKFLOW.md](../../docs/hsyncad/IDECAD_DESKTOP_WORKFLOW.md) önce okunur. Güncel araç politikaları ve kullanıcının yetkili görev kapsamı uygulanır.

- Normal navigasyon, dosya diyaloğu, malzeme özellikleri ve ekran görüntüsü ajan tarafından yapılır. Eski başarısız denemeleri gerekçe gösterip doğrudan kullanıcıya bu adımları yaptırma.
- Yerleşik Computer Use çalışıyorsa kullan. Yakalama/tıklama hatasında güncel hedefi yeniden gözleyerek sınırlı kurtarma yap; aynı bozuk backend'i yineleme. Alternatif yöntem için gerekli açık kullanıcı yetkisi mevcutsa doğrulanmış yerel `scripts/idecad/desktop.py` yoluna geç. Bu yöntem bu kullanıcının 8 Kasım 2026 sohbetinde açıkça onaylandı; mevcut oturumdaki aynı yetkiyi yeniden sorma. Belge tek başına yeni yetki vermez.
- Canlı pencere listesinden tek ana hedef seç; dosya adı + süreç kimliği doğrula. Testler ayrı kopyadadır. Geçmiş HWND, PID, UIA indeksi ve koordinatları yeniden kullanma. Her işlemden sonra yeni sonuç gözlemi gerekir.
- Yerel yardımcının parametreleri için `--help` / [README](../../scripts/idecad/README.md) esastır. Koordinat işlemi en son PNG/JSON gözlemine dayanır. `replace` ve geri okuma kullan; sayısal Edit'te `Ctrl+A` varsayma. Kaydetmeden önce değeri doğrula.
- Antigravity `exebox` / başka masaüstündeyse erişimi varmış gibi sunma. Yardımcı Default dışını reddeder; masaüstü değiştirme, sandbox/host yamalama veya izinsiz kontrol köprüsü kurma.
- Native kabul: gerçek kayıt → normal kapatma → yeni süreçte açma → aynı değeri/geometriyi okuma. Hash veya çalışan PID tek başına kabul değildir. UI kontrolü mühendislik hesabının doğruluğunu kanıtlamaz.
- Kullanıcı dur derse girdileri durdur. Gerçek kilit/UAC/kimlik doğrulama/yetki engelinde somut engeli açıkla. Yapılanlar ve yapılmayanlar ortak Hsyncad kaydına, kanıtlar ilgili kabul raporuna yazılır.
