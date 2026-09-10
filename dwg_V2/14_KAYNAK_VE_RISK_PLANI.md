# 14 — Kaynak ihtiyacı, maliyet, risk ve açık kararlar

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Adaylar](03_ARASTIRMA_VE_ADAYLAR.md) · [Yol haritası](12_YOL_HARITALARI.md)

Bu belge satın alma önerisi veya zaman garantisi değildir. Rakamlar belirtilen kaynakların 5 Eylül 2026'da görülen durumudur; mühendislik süreleri ise henüz teklif/prototip verisine dayanmayan kaba planlama aralıklarıdır.

## Maliyet seçenekleri

| Yol | Lisans/ücret görünümü | Bütçe açısından yorum |
|---|---|---|
| Mevcut LibreDWG tabanı | Açık kaynak; GPL dağıtım yükümlülükleri | SDK satın alma olmayabilir; doğruluk ve bakım mühendisliği devam eder |
| ACadSharp + özel scene | MIT ana repo | Server compute ve custom render/fidelity maliyeti; tam uyum ücretsiz diye varsayılmaz |
| ODA | Resmi sayfada Sustaining: ilk yıl 7.500 USD, yenileme 4.500 USD | Web/SaaS için paket/ek modül ve dağıtım hakları yazılı netleştirilebilir |
| MLightCAD ticari parser | Belgede 3.000 USD tek seferlik; ilk yıl sonrası güncelleme 1.500 USD/yıl | Teslim sürümünü kullanma ve güncelleme hakları farklı; trial uygunluğu ve destek kapasitesi önemli |
| RealDWG | Resmi lisanslama/teklif yolu | Bu araştırmada doğrulanmış fiyat yok; Windows/native işletim de hesaplanır |
| APS | Hizmet tabanlı maliyet | Gerçek hacim/bölge/çeviri tipine ait güncel teklif ve koşul henüz alınmadı |

Ücret kaynakları: [ODA fiyat sayfası](https://www.opendesign.com/pricing?language=en), [MLightCAD ticari parser](https://github.com/mlightcad/cad-viewer/blob/main/PROPRIETARY-PARSER.md), [RealDWG lisanslama giriş sayfası](https://forge.autodesk.com/developer/overview/realdwg-api). Vergi/kur, inWEB ek kapsamı, SLA ve alt bileşen hakları bu rakamlardan çıkarılamaz. Herhangi bir satın alma veya başvuru yapılmadı.

## Hazır scene işletim hesabı

Önerilen model:

```text
Aylık toplam ≈ SDK amortismanı / yenileme
  + yeni/değişen revision sayısı × ortalama compile maliyeti
  + yeniden denemeler ve yeniden derlemeler
  + scene ve staging GB-ay
  + aylık aktarılan scene GB ve istek sayısı
  + queue / DB / gözlenebilirlik
  + bakım ve destek emeği
```

Örnek çalışma tablosu için 1.000 kaynak revision/ay, revision başına 30 CPU-sn, 20 MiB scene gibi **tamamen varsayımsal** girdiler seçilebilir. Bu, yaklaşık 8,33 CPU-saat ve bir ay tutulursa yaklaşık 19,5 GiB scene kapasitesi demektir; sağlayıcı fiyatı veya bu repoda ölçülen hacim değildir. Tekrar açılma sayısı, cache hit, atlas paylaşımı ve egress asıl maliyeti değiştirebilir.

Her dosyayı upload olur olmaz hazırlamak ile yalnız açılan dosyayı hazırlamak ayrı politikadır. Örneğin çok sayıda yüklenip hiç açılmayan proje varsa lazy compile daha ekonomik çıkabilir. Bir dosyanın onlarca cihazda açıldığı durumda server türevi daha değerli olabilir. Profiling öncesi pahalı servis kurulması gerekmez.

## Emek ve takvim için ihtiyatlı başlangıç

| Hedef | Kaba takvim aralığı | Varsayım |
|---|---|---|
| Baseline, decoder elemesi, temel vertical slice | 2–6 hafta | Deneyimli geliştirici + AI; örnek/reference dosyaları erişilebilir |
| Belirli 2D profilde kullanılabilir bağımsız pilot | 2–4 ay | Decoder hazır, kritik font/layout problemleri çözülüyor |
| Geniş mimari/statik corpus ve gerçek cihazlarda olgun ürün | 6–12+ ay | Sürekli CAD doğrulaması, bug corpus'u ve işletim desteği |
| Geniş uyumlu ham DWG decoder'ını da baştan geliştirme | 12–24+ ay; çok belirsiz | Uzman format/grafik emeği ve kapsamlı corpus; tek kişi için daha uzun olabilir |

Bu aralıklar endüstri benchmark'ı veya Astra'nın hızı hakkında kanıt değildir. İlk 2–3 haftalık gerçek çıktıdan sonra emek tahmini yeniden yapılabilir. Birkaç günde temel çizgi demosu mümkün olması, aynı sürede güvenilir mesleki görüntüleyici kurulacağı anlamına gelmez. Trial/font/reference gecikmeleri kritik yolu uzatabilir.

AI rutin kod, test üretimi ve araştırmayı hızlandırabilir; örnek erişimi, SDK lisansı, gerçek cihaz deneyi, referans çizim ve ürün kararlarını ortadan kaldırmaz. Modelin “ultra” düzeyi bu dış koşulların yerine geçmez.

## Risk kaydı

| Risk | Erken işaret | Etkiyi azaltma / alternatif |
|---|---|---|
| Decoder kritik bilgi kaybediyor | Text/layout/proxy karşılaştırması FAIL | Başka decoder veya vectorizer; destek profilini açık tut |
| V2 yeniden yazımı mevcut yatırımı kaybediyor | Aynı font/block sorunları geri geliyor | Korunan legacy + feature atlası + aynı corpus |
| Mobile OOM | Tab reload, uzun heap büyümesi | Bounded chunks, düşük resident bütçe, server scene |
| Yanlış text/ölçü ama hızlı görüntü | Görsel score iyi, kritik ROI yanlış | Semantik oracle ve kritik hata veto kriteri |
| XREF/font bulunmuyor | Eksik dependency manifest | İzinli proje paketi ve görünür degraded durum |
| Lisans sonradan engel oluyor | Trial/proprietary/GPL koşulları belirsiz | P1'de dağıtım haritası; decoder'ı değiştirilebilir tut |
| Browser cache veri sızdırıyor | Logout/public revoke sonrası açılma | Online yetki, scope, hassas oturumda RAM-only |
| Scene version karışıyor | Yanlış font/revision veya schema fail | Immutable identity, checksum ve atomik manifest |
| Native worker sürekli retry ediyor | Aynı hash tekrarlayan deterministic crash | Bounded retry, quarantine, hata sınıfları |
| Upstream API drift | Temiz kurulum davranışı değişiyor | Pinned sürüm/build, geçerli patch/fork ve regression |
| Süreç uzuyor, demo ürün sanılıyor | Çok modül var, gerçek pafta yok | P2 gerçek pafta, küçük karar kapıları ve holdout |
| Maliyet kullanım arttıkça sıçrıyor | Compile/egress/hit oranı kötü | Lazy compile, reuse ve kaynak sınıfına göre bütçe |

## Kullanıcı girdisi olmadan ilerlenebilecek varsayımlar

İlk araştırma ve ücretsiz yerel prototip için 2D, salt-okunur, iki motorlu kullanım esas alınabilir. Mevcut çizimler başlangıç corpus'udur; yeni dosya yükleme istenmeden analiz başlayabilir. WebGL2/TypedArray ilk aday olabilir; benchmark değiştirirse yaklaşım değişir.

## Uygulamada netleştirilecek açık kararlar

- Ticari SDK bütçesi ve satıcı trial uygunluğu: satın alma/ücretli trial öncesi.
- Native/server compute kullanılabilirliği ve veri bölgesi: dış hizmete gerçek çizim gönderilmeden önce.
- Exact SHX/TTF ve XREF erişimi: gerçek yüksek fidelity kabulünden önce.
- Public share'de V2 ve offline disk cache ihtiyacı: ilgili entegrasyon alt etabından önce.
- Desteklenecek asgari gerçek telefon/tablet modelleri: ürün uyumluluk taahhüdünden önce.
- Ölçüm/review araçlarının V2 ilk sürüm kapsamı: görüntüleyici sonradan tam CAD stüdyosuna büyümeden önce.

Bu açık kararlar bütün bağımsız işleri durdurmaz. Erişilemeyen seçenek `NOT RUN`, çözülemeyen özellik `bilinmiyor` olarak kaydedilir; başka uygun yol araştırılır.
