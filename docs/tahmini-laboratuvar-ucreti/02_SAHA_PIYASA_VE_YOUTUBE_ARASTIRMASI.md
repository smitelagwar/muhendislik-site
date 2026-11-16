# Tahmini Laboratuvar Ücreti — Saha Pratikleri, Piyasa ve YouTube Araştırması

> **Kapsam:** YouTube şantiye günlükleri, yapı laboratuvarı (T5 Yapı Laboratuvarı, YZLABDER) teknik anlatımları, müteahhit/şantiye şefi saha deneyimleri, üniversite döner sermaye tarifeleri ile hesaplama modeline yansıyan pratik doğrulamalar.

---

## 1. YouTube ve Sektör Videolarından Çıkan Somut Bulgular

| Kaynak / İçerik Türü | Öne Çıkan Teknik ve Maliyet Bulguları | Hesap Aracına Etkisi |
| --- | --- | --- |
| **"11.500 TL Çip Maliyeti \| İnşaatta Laboratuvar Süreci (Bölüm 9)"** (Müstakil ev / villa şantiye günlüğü serisi) | Müstakil villa inşaatında EBİS için **100 adet Aselsan RFID çipi** alındığı ve **11.500 TL** ödendiği (adet başı **115 TL**) belirtilmiştir. Laboratuvar sözleşmesinin yapı denetimden ayrı olarak müteahhit tarafından ödenmesinin bütçeye ek kalem oluşturduğu vurgulanmıştır. | Çip bedelinin ayrı kalem olarak gösterilmesi; müstakil bir villada bile parça dökümler nedeniyle 60–100+ çip çıkabileceği doğrulandı. |
| **T5 Yapı Laboratuvarı & Saha Eğitim Videoları** (*Karot Numune Basınç Deneyi*, *Donatı Numune Alma*) | Beton dökümü dışında her demir çapı ve parti için 1 m uzunluğunda **3 adet numune (1 takım)** kesildiği, şantiyede slump + numune + kür + kırım zincirinin EBİS mobil onayıyla yürüdüğü gösterilmiştir. | Demir çekme testinin `takım` bazlı modellenmesi (her çap grubu için 1 takım; yüksek tonajda ek takım). |
| **YZLABDER Bilgilendirme Videoları** (*Yapı Denetimi Yönetmeliğinde Laboratuvarların Rolü*) | 22 Şubat 2024 yönetmelik değişikliği sonrası müteahhit-laboratuvar doğrudan sözleşme zorunluluğu (Ek-10), Ek-9 alt/üst limitleri, şantiye şefinin EBİS mobil onay zorunluluğu anlatılmıştır. | Araç varsayılanında "Betonarme (müteahhit öder)" akışının esas alınması. |
| **Şantiye & Excel Takip Videoları** (*Yapı Denetiminde Şantiye ve Laboratuvar Takibi*) | Şantiyelerde maliyetin yalnız toplam beton m³'üne göre değil, **betonun kaç ayrı günde/etapta döküldüğüne** göre arttığı vurgulanmıştır (her döküm günü minimum 8–12 numune doğurur). | Hesaplamada **Döküm Sayısı (veya Kat Adedinden türetilen döküm sayısı)** kritik çarpan olarak kullanılmalıdır. |

---

## 2. Müteahhit ve Şantiye Gözünden En Kritik Maliyet Dinamiği

İnşaat mühendisleri ve müteahhitlerin laboratuvar teklifi alırken karşılaştığı en önemli gerçek şudur:

1. **"m² Başına Sabit Bir Resmî Tarife" Yoktur — Ama Döküm Sayısı Belirleyicidir:**
   - Resmî tarife m²'ye göre değil, **alınan beton numunesi (küp/silindir) adedine**, **kullanılan EBİS çip adedine** ve **demir çekme takım sayısına** göre hesaplanır.
   - Örneğin **250 m²** bir villada toplam beton `~100 m³` olabilir. Bu betonun tamamı tek günde dökülse 12 numune alınırdı; fakat şantiyede **Temel + 1. Kat Kolon + 1. Kat Tabliye + 2. Kat Kolon + 2. Kat Tabliye** şeklinde **5 ayrı günde** dökülür. Her döküm `0–24 m³` dilimine düştüğünden her seferinde asgari **8 numune** alınır → `5 × 8 = 40 numune + 40 çip` oluşur.

2. **Üniversite Döner Sermayeleri vs. Yetkili Yapı Denetim Laboratuvarları:**
   - **Yetkili Yapı Denetim Laboratuvarları (Ek-9 Kapsamı):** Rutin şantiye taze beton deneylerinde Yönetmelik **Ek-9** taban–tavan sınırına bağlıdır (2026 projeksiyonuyla küp başı **167 – 277 TL** KDV hariç; sahada genellikle **asgari ile azami arası veya azamiye yakın ~222–277 TL** + ulaşım/hizmet koşulları uygulanır).
   - **Üniversite Merkez Laboratuvarları:** Genellikle tekil/özel testlerde (karot, hakem deney, özel çekme testleri) kendi döner sermaye tarifelerini uygular (tekil beton basınç/karot **1.000 – 2.000 TL/adet**, çelik çekme **1.300 – 3.000 TL/adet**). Normal ruhsatlı konut/ticari şantiye rutininde üniversiteler değil, ildeki **ÇŞİDB izin belgeli yapı laboratuvarları** hizmet verir.

3. **Betonarme Olmayan Yapılar:**
   - Çelik konstrüksiyon, hafif çelik, prefabrik vb. betonarme dışı yapılarda taşıyıcı sistem laboratuvar gideri yapı denetim bedeline dahildir (ancak temel betonarmesi için yerel uygulama sözleşmesine göre yine beton/demir numunesi gerekebilir).

---

## 3. Doğrulanmış 2026 Hesaplama Parametreleri ve Örnek Senaryolar

Hesap motorunda portalımızdaki mevcut `hizli-metraj` oranlarıyla uyumlu gerçekçi mühendislik katsayıları kullanılacaktır:
- **Varsayılan Beton Hacmi:** `İnşaat Alanı (m²) × 0,38 m³/m²` (radye temel + taşıyıcı çerçeve/perde ortalaması)
- **Varsayılan Demir Tonajı:** `İnşaat Alanı (m²) × 0,036 ton/m²` (`~36 kg/m²`)
- **Varsayılan Döküm Günü Sayısı:** `1 (Temel/Grobeton) + Kat Sayısı × 2` (her kat için 1 düşey kolon/perde dökümü + 1 döşeme/kiriş dökümü)
  - *Örnek 1 — Müstakil Villa (250 m², 2 Kat):*
    - Tahmini beton: `95 m³`, demir: `9 ton`, döküm: `5 gün` (~19 m³/döküm → `8 numune/döküm`)
    - Toplam taze beton numunesi: **40 küp** + **40 EBİS çip**
    - Demir çekme takımı: **4 çap grubu** (tipik küçük çap seti)
    - **Tahmini Tutar (2026 KDV Dahil):**
      - Taze beton (Ek-9 orta `222 TL` [aralık `167–277`]): `8.880 TL` (`6.680 – 11.080 TL`) KDV hariç
      - EBİS çip (`123,49 TL` KDV hariç): `4.940 TL` KDV hariç
      - Demir çekme (`4 × 772,91 TL` KDV hariç): `3.092 TL` KDV hariç
      - **Toplam (KDV Dahil %20):** **~20.300 TL** *(Aralık: ~17.650 – 22.930 TL)*
  - *Örnek 2 — Tipik Şehir Apartmanı (1.200 m², 5 Kat):*
    - Tahmini beton: `456 m³`, demir: `43,2 ton`, döküm: `11 gün` (Temel ~140 m³ → `16 numune`; 10 kat dökümü ~32 m³/döküm → `12 numune/döküm`)
    - Toplam taze beton numunesi: **136 küp** + **136 EBİS çip**
    - Demir çekme takımı: **6 takım**
    - **Tahmini Tutar (2026 KDV Dahil):**
      - Taze beton (orta `222 TL`): `30.192 TL` (`22.712 – 37.672 TL`) KDV hariç
      - EBİS çip: `16.795 TL` KDV hariç
      - Demir çekme (`6 × 772,91 TL`): `4.637 TL` KDV hariç
      - **Toplam (KDV Dahil %20):** **~61.950 TL** *(Aralık: ~52.970 – 70.925 TL, yaklaşık **52 TL/m²**)*
  - *Örnek 3 — Ticari / Büyük Yapı (3.500 m², 8 Kat):*
    - Tahmini beton: `1.330 m³`, demir: `126 ton`, döküm: `17 gün` (Temel ~350 m³ → `32 numune`; 16 kat dökümü ~61 m³/döküm → `12 numune/döküm`)
    - Toplam taze beton numunesi: **224 küp** + **224 EBİS çip**
    - Demir çekme takımı: **8 takım** (ana çaplar + 90 ton üstü ilave parti)
    - **Tahmini Tutar (2026 KDV Dahil):**
      - Taze beton (orta `222 TL`): `49.728 TL` (`37.408 – 62.048 TL`) KDV hariç
      - EBİS çip: `27.662 TL` KDV hariç
      - Demir çekme (`8 × 772,91 TL`): `6.183 TL` KDV hariç
      - **Toplam (KDV Dahil %20):** **~100.290 TL** *(Aralık: ~85.500 – 115.070 TL, yaklaşık **29 TL/m²**)*
