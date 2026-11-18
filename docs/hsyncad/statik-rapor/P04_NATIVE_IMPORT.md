# Aşama 04 — Native kapsam ve açık mühendislik kapıları

6 Kasım 2026. Araştırma ve kapsam çıktıları hazır; **tam native mühendislik aktarımı kabul edilmedi**. Yeni kod kapsam/izlenebilirlik API'sidir; mevcut import akışına otomatik mühendislik alanı yazan bir entegrasyon değildir. Kaynak/serializer/birim kabulü olmadan gözlemler solver yüküne veya fiziksel malzemeye dönüştürülmedi.

`structural/native-import-coverage.ts`, native kaynak kimliğiyle düzenlenebilir/referans/hariç/kapsamı eksik kayıtları ayırır. Delikler, native merdiven ağı ve diğer referans geometrileri `analysisGeometryCandidate` içinde açık bir sonraki aşama sınırıyla korunur; bu bir doğrulanmış hesap nesnesi değildir. Fiziksel rol adın ilk harfinden çıkarılmaz. Kaynak temel biti saklanır, isimden radye varsayılmaz. G/Q, parserın kaynak konumuyla gözlem olarak taşınır; öz ağırlık anlamı, aileye özgü sayısal kodlama ve birim semantiği için solver kabulü verilmez. Ofset uzayı parserın çözümlenmiş akışıdır; CDE/açılmış gövdede ham dosya ofseti diye sunulmaz.

`probe-import-coverage.ts` açık envanter/yeni çıktı klasörü ister. Üç gerçek kaynağı hash ile tekilleştirir, kaynağı değiştirmeden her biri için `IMPORT_COVERAGE.json` ve doğrulama kaydı üretir. Özgün dosyalar salt okunur; G mutasyonu yalnız bellekte yapılır ve değişmiş kopyanın ayrı hash'i tutulur. Referans sonuçlar hesap cevabı olarak kullanılmaz.

| Kaynak | Tanınan | Düzenlenebilir | Referans | Hariç | Hesap adayı | Hazır | G/Q gözlemi |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mustafa 1 |1273|928|345|523|750|0|159|
| Mustafa 2 |686|532|154|339|347|0|70|
| Süheyla |2171|1986|185|589|1582|0|299|

Hariç sayısı ile referans sayısı farklı sınıflandırmalardır; birbirleriyle toplanarak toplam çıkarılmaz. Üçünde parser unsupported sayısı sıfırdır, ancak gerekli mühendislik verileri bilinmediğinden hazır kayıt sıfırdır. Native dosyadaki bütün nesnelerin keşfedildiği de iddia edilmez; `nativeObjectUniverse=unknown`, parserın ham kapsamı ayrıca saklanır. Aile yetenek girdisi her çıktıda kendi formatına aittir; v10 verisi v11/trial/CDE mühendislik kabulü sayılmaz.

Yeni REA repo kanıtı: kaynak `PeResourceLayout.ts` gerçekten bundle edilip EXE üzerinde çalıştırıldı; 11 odaklı RTTI sınıf adayı, 13 vftable bağı ve 292 yöntem işaretçisi bağımsız bayt kontrolünden geçti. Malzeme edit action adayı `0x145d79260 → COL0x1456f8118 → vftable0x14518ca88`; ilk yöntem girişleri `0x1403da240/0x1403da2c0/0x1403da3f0`. Bunlar kod araştırma girişleridir; native dosyada malzeme nesnesi, alan ofseti veya serializer semantiği kanıtı değildir. Yerel `candidate_*` kimlikleri REA Evidence ID'si olarak adlandırılmaz.

Ghidra CLI C25 araması 600s watchdog sonunda exit124 verdi; o çağrının sahip olunan süreç ağacı taskkill ile kapatıldı. Başarılı decompilation/analiz snapshot'ı üretilmiş sayılmadı. Geçici Ghidra çalışma alanlarının silinmesi ayrıca doğrulanmadı. Aktif MCP Ghidra sağlayıcısı gerekli ortam ayarları olmadan kullanılabilir değildi; kalıcı konfigurasyon değiştirilmedi. Aynı cold arama tekrarlanmadı.

Kabul açıkları: native malzeme/eleman bağı; G öz ağırlık ve birim anlamı; diğer yükler; kat/diyafram/bodrum/zemin/analiz ayarları; gerçek donatı ve kayıtlı sonucun revizyon bağı. Native→yapısal proje→solver zinciri bu alanlarda tamamlanmadı. Bu nedenle kayıtlı donatı okunmuş gibi gösterilmez, Ø10/20 üretilmez. REA_UNKNOWN_LEDGER soruları açık kalır. Bağımsız kullanıcı girdili Hsyncad geliştirmesi ilerleyebilir; üç gerçek projenin nihai kabulü geçemez.

Doğrulama: mevcut kodda15 test geçti,5 native IFC fixture testi atlandı; geometri/workspace/save-reopen ve üç gerçek v10 örneği dahil. Üç ayrı gerçek projede tek G değişikliği yalnız ilgili kaydın kapsam gözlemini değiştirdi, Q ve diğer kayıtlar aynı kaldı; kaynak hashleri korundu. İlgili lint geçti. Genel tsc552 eski tanıyla başarısız, yeni hata imzası0. Yeni UI/build/browser veya yeni solver koşulmadı; önceki aşamanın sonucu bu aşamaya test olarak yazılmadı. Ham zaman/komut/sonuçlar TASKS.json'dadır; son kaynaklar kapanışta hash ile eşleştirilir.

Kanıt: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-04`; `real-imports-final/project-1..3/IMPORT_COVERAGE.json`, `rea-research/native-field-candidate-manifest.json`, `rea-static-verification`, `rea-research/material-search/result.json`. Commit/push/deploy yok. Aşama05 kendiliğinden başlatılmaz.
