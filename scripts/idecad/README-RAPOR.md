# Yerel ideCAD rapor adayı

Bu aday çalışma ağacında yerel kullanım içindir. Windows'ta kurulu ideCAD Statik 11.28 Deneme, Python 3 ve Pillow gerekir. Bilgisayarda etkin bir ideCAD/ideRAPOR oturumu varken yeni iş başlatılmaz. İşlenen dosya kopyalanır; özgün kaynak değiştirilmez.

```powershell
cd C:/Users/hsyn/.codex/worktrees/hsyncad-report-asama2
$env:NODE_ENV = 'development'
node scripts/idecad/local-report-server.cjs
```

Tarayıcı: `http://127.0.0.1:3311/kategori/araclar/hsyncad`. IDE10 dosyasını açın, **Seçmeli Raporlar** düğmesini kullanın. İş bittiğinde **İşi kapat** yalnız işe ait ideCAD ve ideRAPOR süreçlerini kapatır. Hizmet yalnız 127.0.0.1'de çalışır; normal Next başlatması rapor uç noktasını açmaz. Bu örnek çalışma ağacı bağımlılıklar için ana reponun `node_modules` bağlantısını kullanır.

## Desteklenen kapsam ve sınırlar

- Önizleme için `report-profile.rpt` dosyasından ideCAD'in kaydedip tekrar okuduğu doğrulanmış rapor profili kullanılır: 21 rapor grubu (14 varsayılan betonarme + 7 opsiyonel) ve **İde Kapak** (`offset 48`) seçilebilir; **Çelik Raporları** `.rpt` bayt eşlemesi olmadığı için kilitlidir. `SECTION_GROUPS` dışındaki eşlenmemiş 4 bayrak (`tree_idx` `20, 59, 121, 144`) ve grup içi ikincil alt öğe bayrakları doğrulanmış `betonarme-11-28.rpt` taban değerlerini korur.
- Kapsam olarak **Tüm proje** veya **Aktif kat** (`Kat listesi` + başlık doğrulaması) desteklenir; **Seçili elemanlar** kapsamı kilitlidir.
- Taze F9 veya açıkça seçilen kayıtlı sonuç kullanılabilir. Merdiven akıllı bağlantısı sorulduğunda açık seçeneği yoksa iş durur. Analiz günlüğündeki uyarılar saklanır; rapordaki bütün proje hataları ayrıca ideCAD önizlemesinde görülmelidir.
- Hsyncad'in isteğe bağlı PDF'si yalnız doğrulanmış kaynak katlarını, eleman/kesit envanterini, normal döşeme Q/G yüklerini ve açık `unknown`/`blocked` durumlarını içerir; `Aktif kat` seçiminde PDF ilgili katı vurgular. ideCAD hesap raporu, donatı ve gerçek metraj bu PDF'de yoktur. Doğrudan `ideRAPOR` PDF kaydı, Yazdır ve Baskı Önizleme bu Deneme kurulumunda engellidir.
- Arayüz otomasyonu doğrulanmış masaüstü boyutuna ve ideCAD 11.28 ribbon görünümüne bağlıdır; görünüm farklıysa işlem güvenli biçimde reddedilir. Kullanıcı eşzamanlı fare/klavye kullanmamalıdır.
- Yalnız IDE10 kaynağı işlenir. Model değiştiğinde eski sonuçtan indirme kapanır. Tarayıcı geri yüklemesinde aynı kaynak dosyası hash ile tekrar doğrulanabilir; hash kaydı yoksa orijinal dosya yeniden açılmalıdır.
- Üretim derlemesi, tam hesap/metraj içeren `ideRAPOR` PDF'si ve bağımsız Aşama 4 kabulü henüz tamamlanmadı. Bu aday ana repoya aktarılmadı.
