# Kirişli Döşemeli Binalarda Beton ve Demir Tahmini — Saha, Piyasa, Akademi ve YouTube Araştırması

> **Kapsam:** Türkiye'deki şantiye uygulamaları, YouTube mühendislik/müteahhitlik videoları, ideCAD/STA4CAD analiz pratikleri ve DergiPark akademik çalışmalarından derlenen gerçekçi beton ($\text{m}^3$) ve demir ($\text{kg/m}^2$, $\text{kg/m}^3$) kıyaslama bulguları.

---

## 1. YouTube, Şantiye ve Mühendislik Kanallarından Çıkan Bulgular

| Kaynak / İçerik Odağı | Somut Teknik ve Metraj Bulgusu | Hesaplama Modeline Etkisi |
| :--- | :--- | :--- |
| **Ahmet Çelikkollu (YouTube & Teknik Yazılar)** — *Radye Temel, Perde Donatısı ve Kolon-Kiriş Birleşimleri* | Kirişsiz radye temelde TS 500 minimum donatı şartları, zımbalama güvenliği ve çift yönlü şebeke + ilave donatılar sebebiyle radye temel kalınlığının kat sayısı ve zeminle birlikte büyüdüğü; perdelerde yatay/düşey çift yüz donatının zorunlu olduğu vurgulanmıştır. | Radye temel kalınlığının sabit değil, **toplam kat sayısına bağlı** ölçeklenmesi (`40–75 cm`); perdeli sistemlerde çift yüz donatının korunması. |
| **Emirhan Aydın & KremŞANTİYE (YouTube)** — *Pratik Beton Metrajı ve Radye Temel İncelemeleri* | Kirişli döşeme katlarında sadece plak + kiriş betonunun ~`0,18–0,22 m³/m²`, 100 m² tabanlı radye temelin ise 40–50 cm kalınlıkla `40–50 m³` beton ve `3,5–4,5 ton` demir (~`80–90 kg/m³`) tükettiği sahadan gösterilmiştir. | Döşeme+kiriş grubu taban beton katsayısı (`~0,195 m³/m²`) ve temel grubunun **taban oturum alanı** üzerinden hesaplanması. |
| **Prof. Dr. Servet Karasu — Metraj Dersleri & Şantiye Günlükleri (YouTube)** | Mütemadi (sürekli) temelde betonun sadece aks altlarına dökülmesi nedeniyle hacmin radye temele göre ~%35–40 düştüğü, ancak kiriş kalıp işçiliğinin ve bağlama kirişi donatı sıklığının daha yoğun (`~100–110 kg/m³`) olduğu aktarılmıştır. | Mütemadi temel seçildiğinde temel beton hacminin `0,60×` ölçeklenip birim donatı yoğunluğunun `105 kg/m³` olarak alınması. |
| **Sanal Şantiye / Özkaya Mühendislik / İnşaatım Saha Ortalamaları** | 1–2 katlı yapılarda genel ortalama `25–35 kg/m²` demir ve `0,32–0,38 m³/m²` beton; 3–5 katlı yapılarda `35–42 kg/m²` demir; bodrumlu ve 5+ katlı radye temelli yapılarda `40–55 kg/m²` demir ve `0,38–0,46 m³/m²` beton gözlenir. | Kat sayısı ve bodrum artışıyla metrekare başına düşen demirin ~`32 kg/m²` bandından ~`42–48 kg/m²` bandına doğal tırmanışı. |

---

## 2. Akademik Yayınlar ve ideCAD / Sta4CAD Karşılaştırma Bulguları

1. **DergiPark — Perde Duvarlı ve Çerçeveli Binalar (TBDY 2018):**
   - Saf çerçeve (yalnız kolon) sistemlerde yatay rijitlik düşük olduğu için TBDY 2018 göreli kat ötelemesi, güçlü kolon–zayıf kiriş ve düğüm bölgesi sıklaştırması sebebiyle **1 m³ betona düşen demir miktarı (`115–135 kg/m³`) yüksektir**.
   - Kolon + Perde karma sisteminde perdeler yatay yükü paylaşarak çerçeve donatısını rahatlatır; toplam beton hafifçe artarken toplam demir miktarı optimize olur.
   - **Sadece Perdeli** (perde ağırlıklı / tüm düşeyleri perde) kirişli sistemlerde perde kesit alanı büyük olduğundan **beton hacmi belirgin yükselir**, buna karşın perde gövde donatısı kolonlara kıyasla daha seyrek (min. pursantaj `0,0025`) kaldığı için **$\text{kg/m}^3$ demir oranı düşer** (`~80–95 kg/m³`).

2. **DergiPark & OMÜ Yüksek Lisans Tezleri — Radye vs. Mütemadi Temel:**
   - Aynı taşıyıcı sistemde radye temel tercih edildiğinde toplam kaba yapı donatısı mütemadi temele kıyasla **~%7–15 daha yüksek**, toplam beton hacmi ise **~%10–18 daha yüksek** çıkmaktadır.

3. **Bodrum Çevre Perdesi (Rijit Bodrum) Etkisi:**
   - Çevre perdeleri binayı 3–4 cepheden sardığında hem betonarme perde hacmi (`P × 3,0 m × 0,25 m`) hem de çift sıra donatı (`~100 kg/m³`) doğrudan metrajı yükseltir; bodrumsuz eşdeğer alana göre toplam demirde **%10–20** bandında artış yaratır.

---

## 3. Kalibre Edilmiş Referans Senaryo Doğrulamaları (Önerilen Motor Çıktıları)

| Örnek Bina Senaryosu | Toplam Alan & Kat | Sistem & Temel & Bodrum | Tahmini Beton | Tahmini Demir | Birim Göstergeler | 2026 Tahmini Lab. Ücreti (KDV Dahil) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **A — Müstakil Konut** | `200 m²` · `2 Kat` | Kolon · Mütemadi · Bodrum Yok | `~70 m³` | `~7,1 ton` | `0,35 m³/m²` · `35,6 kg/m²` | `~18.200 TL` |
| **B — Orta Şehir Apartmanı** | `1.200 m²` · `5 Kat + 1 Bodrum` | Kolon+Perde · Radye · 1 Bodrum | `~497 m³` | `~48,8 ton` | `0,41 m³/m²` · `40,6 kg/m²` | `~77.100 TL` |
| **C — Büyük Konut Bloğu** | `2.400 m²` · `8 Kat + 1 Bodrum` | Sadece Perdeli · Radye · 1 Bodrum | `~1.050 m³` | `~89,5 ton` | `0,44 m³/m²` · `37,3 kg/m²` | `~112.900 TL` |

*(Not: Sahada sipariş aşamasında pompa artığı, kesme/bindirme payı için ayrıca %3–5 fire eklenmesi hatırlatılır; hesap motoru net teorik yapı tahminini üretir.)*
