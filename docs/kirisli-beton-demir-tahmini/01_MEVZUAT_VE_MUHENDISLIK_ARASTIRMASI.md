# Kirişli Döşemeli Binalarda Beton, Demir ve Laboratuvar Tahmini — Mevzuat ve Mühendislik Araştırması

> **Kapsam:** TBDY 2018 ve TS 500 kapsamında **kirişli döşemeli** betonarme binalarda taşıyıcı sistem seçiminin (Kolon / Kolon+Perde / Sadece Perdeli), temel tipinin (Radye / Mütemadi) ve **rijit bodrum perdesinin** beton ($\text{m}^3$) ile donatı ($\text{ton}$ / $\text{kg/m}^2$) sarfiyatına etkileri ve 2026 laboratuvar maliyeti bağlantısı.

---

## 1. Kirişli Döşeme Sisteminin Mühendislik Profili (TS 500 & TBDY 2018)

- **Döşeme Kalınlığı:** TS 500 Bölüm 11 uyarınca tek/çift doğrultuda çalışan kirişli plak döşemelerde tipik kalınlık **12–15 cm** (`0,12–0,15 m³/m²`) bandındadır.
- **Kiriş Katkısı:** Kat düzlemindeki taşıyıcı kirişler (`25×50` – `30×60 cm` tipik kesitler) döşeme üstüne eklendiğinde yatay elemanların brüt kat alanı başına beton eşdeğeri ortalama **0,18–0,21 m³/m²**, donatı yoğunluğu ise döşeme (`80–95 kg/m³`) ve kirişlerin (`90–120 kg/m³`) ağırlıklı bileşimiyle **16–21 kg/m²** aralığında gerçekleşir.
- **Asmolen / Düz Plak Farkı:** Kirişli döşeme, aynı açıklıkta asmolene göre yaklaşık %15–25 daha az donatı tüketir ve TBDY 2018 kapsamında yüksek süneklikli sistemlerde çerçeve davranışını en öngörülebilir biçimde sağlar.

---

## 2. Taşıyıcı Sistem Alternatiflerinin Karşılaştırması

Düşey taşıyıcı sistem seçimi hem beton hacmini ($\text{m}^3/\text{m}^2$) hem de beton içindeki donatı yoğunluğunu ($\text{kg/m}^3$) doğrudan değiştirir:

| Taşıyıcı Sistem | Yönetmelik & Tasarım Davranışı (TBDY 2018) | Düşey Eleman Beton Payı | Beton Başına Donatı Yoğunluğu | Genel Karakter |
| :--- | :--- | :--- | :--- | :--- |
| **Kolon (Saf Çerçeve)** | Yatay yüklerin tamamını moment aktaran kolon-kiriş çerçeveleri taşır. Güçlü kolon–zayıf kiriş (Madde 7.3.5), birleşim bölgesi kesme güvenliği (Madde 7.5) ve sık etriye kuralları çerçeve donatısını artırır. | En düşük (`~0,055–0,075 m³/m²`) | **En yüksek** (`~115–135 kg/m³` düşey eleman; kirişlerde ek sıklaştırma) | Az katlı (1–4 kat) binalarda ekonomik; kat arttıkça göreli öteleme sınırları nedeniyle demir yoğunluğu hızla yükselir. |
| **Kolon + Perde (Karma)** | Deprem kuvvetlerinin büyük bölümünü perdeler karşılar; çerçevelerdeki moment ve göreli kat ötelemeleri azalır. Perde uç bölgeleri (Madde 7.6.2) ve min. gövde oranı (`0,0025`) eklenir. | Orta (`~0,070–0,095 m³/m²`) | **Dengeli** (`~100–115 kg/m³` düşey eleman) | Türkiye'de 4–10 katlı kirişli döşemeli apartmanlarda **optimum güvenlik/maliyet** dengesi sunar. |
| **Sadece Perdeli (Tam Perdeli)** | Tüm düşey taşıyıcılar ≥25 cm (veya Madde 7.6.1.3 şartları sağlanırsa ≥20 cm) betonarme perdelerden oluşur. Yatay rijitlik çok yüksektir; kiriş momentleri belirgin biçimde düşer. | **En yüksek** (`~0,100–0,135 m³/m²`) | **En düşük birim yoğunluk** (`~80–95 kg/m³` perde gövdesi min. `0,0020–0,0025` + uç bölgeleri) | Beton hacmi belirgin artar (`+12%–20%`), ancak birim beton başına demir yoğunluğu düştüğü için toplam $\text{kg/m}^2$ dengeli veya kontrollü kalır. |

---

## 3. Temel Tipi Etkisi: Radye Temel vs. Mütemadi (Sürekli) Temel

Temel metrajı toplam inşaat alanı üzerinden değil, **bina taban (oturum) alanı** ($A_{\text{taban}} = A_{\text{toplam}} / N_{\text{toplam kat}}$) üzerinden hesaplanır:

1. **Radye Temel (TS 500 Madde 10.4.2):**
   - Kirişsiz radye plak kalınlığı minimum **30 cm** olup pratikte kat sayısına ve zımbalama (punching) tahkikine göre **40 cm (1–2 kat)** ile **55–75 cm (5–10 kat)** arasında değişir.
   - Tüm oturum alanını kapladığı ve alt-üst çift kat donatı ağı + ilave/sehpa donatıları içerdiği için birim beton başına ortalama **85–100 kg/m³** donatı alır.
   - Taban alanının $\text{m}^2$'sine ortalama **35–60 kg/m²** temel demiri düşer.

2. **Mütemadi (Sürekli / Şerit) Temel:**
   - Yalnızca kolon ve perde aksları altında temel kirişi + ampatman pabucu olarak dökülür; plak alanının tamamı betonlanmaz.
   - Akademik karşılaştırmalara (OMÜ / İTÜ / DergiPark zemin-yapı etkileşimi tezleri) göre aynı yapıda radye temele kıyasla:
     - Temel beton hacmi **~%35–42 daha az** (`eşdeğer hacim ≈ 0,58–0,62 × radye`),
     - Temel kirişlerinde boyuna ve etriye donatı yoğunluğu yüksek (`~100–110 kg/m³`) olmasına rağmen toplam temel demiri **~%25–32 daha az**,
     - Toplam kaba yapı donatısı ise **~%7–15 daha düşük** çıkar; buna karşın şantiye kalıp işçiliği daha fazladır.

---

## 4. Rijit Bodrum Katı ve Bodrum Çevre Perdesi (TBDY 2018 Madde 3.3.1 & 4.3.6.2)

Kullanıcının vurguladığı üzere bodrum varlığı beton ve demir metrajını doğrusal olmayan şekilde değiştiren ana faktördür:

- **Rijit Bodrum Şartı (Madde 3.3.1.1):** Bodrum katın rijit kabul edilebilmesi için yapının en az üç (pratikte dört) cephesinin çevre perdeleriyle kapatılması ve $T_{\text{tüm}} / T_{\text{üst}} \le 1{,}1$ koşulunun sağlanması gerekir.
- **Üst/Alt Bölüm Ayrımı (Madde 4.3.6.2):** Rijit bodrum katı (`bodrum tavan döşemesi` seviyesi) sismik taban kabul edildiğinde, bodrum çevre perdeleri hem yatay deprem yüklerini temele aktarır hem de toprak statik ($K_0$) ve dinamik (Mononobe-Okabe) basıncını taşır.
- **Fiziksel Geometri ve Metraj Katkısı:**
  - Çevre uzunluğu taban alanından türetilir: $P \approx 4{,}15 \sqrt{A_{\text{taban}}}$ (tipik ~1,4:1 dikdörtgen apartman oturumu; kare plan için $4{,}0 \sqrt{A}$).
  - Bodrum çevre perdesi minimum kalınlığı TBDY 2018 gereği **en az 25 cm** (derin/iki bodrumlu yapılarda **28–30 cm**), tipik bodrum kat yüksekliği **~3,0 m** alınır.
  - Perde hacmi: $V_{\text{perde,bodrum}} = P \times h_{\text{bodrum}} \times t_{\text{perde}} \times N_{\text{bodrum}}$.
  - Çift yüz (dış + iç) düşey ve yatay donatı ağı (`ρ ≥ 0,0025`, filiz ve uç sargılarıyla birlikte) ortalama **95–110 kg/m³** demir sarfiyatı üretir.
  - Bu nedenle bodrum katlı binalarda toplam inşaat alanı aynı kalsa dahi **beton metrajı ~%8–15**, **demir tonajı ~%10–20** artış gösterir.

---

## 5. 2026 Tahmini Laboratuvar Ücreti Entegrasyonu

Portalımızdaki mevcut `src/lib/calculations/modules/laboratuvar-ucreti/` motoru (4708 s. Kanun, 22 Şubat 2024 RG 32468 Ek-10, 2026 Ek-9 Tarife Cetveli, TS 13515 Çizelge B1.1, Aselsannet EBİS RFID Çip `123,49 TL` ve ÇŞİDB 2026 Döner Sermaye TS 708 Çekme/Kütle `772,91 TL/takım`) **beton hacmi ($\text{m}^3$)**, **demir tonajı ($\text{ton}$)** ve **toplam kat adedini** doğrudan girdi olarak kabul etmektedir.

Yeni araç hesapladığı taşıyıcı sistem, temel ve rijit bodrum bazlı beton ($\text{m}^3$) ile demir ($\text{ton}$) değerlerini `calculateLaboratuvarFee()` fonksiyonuna aktararak ekranda ek bir formül tekrarı olmadan **%100 tutarlı 2026 Tahmini Laboratuvar Ücretini (KDV Dahil)** gösterecektir.
