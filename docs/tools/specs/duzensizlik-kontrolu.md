# Calculation Spec: Bina Düzensizlik Kontrolleri (A1, A2, A3 & B1, B2, B3)

> **Tool ID:** `duzensizlik-kontrolu`  
> **Risk Sınıfı:** TIER A  
> **Standart:** TBDY 2018 (Türkiye Bina Deprem Yönetmeliği)  
> **İlgili Bölümler:** Bölüm 3.6 (Bina Düzensizlikleri), Tablo 3.6

---

## 1. Amaç ve Kapsam
TBDY 2018 Tablo 3.6'da tanımlanan 6 temel bina düzensizliğinin (Planda: A1 Burulma, A2 Döşeme Süreksizliği, A3 Çıkıntılar; Düşeyde: B1 Zayıf Kat, B2 Yumuşak Kat, B3 Düşey Eleman Süreksizliği) sayısal göstergelerini hesaplamak ve yasal sınırlarla karşılaştırarak raporlamak.

---

## 2. Düzensizlik Tipleri ve Matematiksel Denklemler

### 2.1 A1 — Burulma Düzensizliği (TBDY Tablo 3.6)
- **Denklem:** $\eta_{bi} = \frac{(\Delta_i)_{max}}{(\Delta_i)_{ort}} > 1.2$
- $(\Delta_i)_{ort} = \frac{(\Delta_i)_{max} + (\Delta_i)_{min}}{2}$
- $\eta_{bi} > 1.2$ ise A1 Düzensizliği vardır. $\eta_{bi} > 2.0$ ise sistem izin verilmez veya özel analiz gerektirir.

### 2.2 A2 — Döşeme Süreksizlikleri
- **Kriter 1 (Boşluk Alanı):** $\frac{A_{bosluk}}{A_{kat}} > 0.33$
- **Kriter 2 (Rijitlik Azalması):** Yerel döşeme rijitliğinde %50'den fazla ani azalma.

### 2.3 A3 — Planda Çıkıntılar Bulunması
- **Denklem:** Binanın plandaki çıkıntı uzunluğu $L_x > 0.2 \times L_{toplam}$ ve $L_y > 0.2 \times B_{toplam}$.

### 2.4 B1 — Komşu Katlar Arası Dayanım Düzensizliği (Zayıf Kat)
- **Denklem:** $\eta_{ci} = \frac{\sum A_{ei}}{\sum A_{e(i+1)}} < 0.80$
- Etkili kesme alanı: $\sum A_e = A_{kolon} + A_{perde} + 0.15 A_{duvar}$.

### 2.5 B2 — Komşu Katlar Arası Rijitlik Düzensizliği (Yumuşak Kat)
- **Denklem:** $\eta_{ki} = \frac{(\Delta_i / h_i)_{ort}}{(\Delta_{i+1} / h_{i+1})_{ort}} > 2.0$ veya $\frac{(\Delta_i / h_i)_{ort}}{(\Delta_{i-1} / h_{i-1})_{ort}} > 2.0$.

### 2.6 B3 — Düşey Elemanların Süreksizliği
- Kolonların veya perdelerin alt katta devam etmeyip kiriş veya konsol üzerine oturması durumu ($A_k = 0$ veya açık süreksizlik kontrolü).

---

## 3. Bağımsız Doğrulama Örneği (Oracle)
- **A1:** $\Delta_{max} = 15\text{ mm}$, $\Delta_{min} = 5\text{ mm} \rightarrow \Delta_{ort} = 10\text{ mm} \rightarrow \eta_{bi} = 1.5 > 1.2$ (A1 Düzensizliği VAR).
- **A2:** Kat alanı $500\text{ m}^2$, boşluk $200\text{ m}^2 \rightarrow 200/500 = 0.40 > 0.33$ (A2 Düzensizliği VAR).
- **B1:** $i$. kat $\sum A_e = 4.0\text{ m}^2$, $(i+1)$. kat $\sum A_e = 5.5\text{ m}^2 \rightarrow \eta_{ci} = 4.0/5.5 = 0.727 < 0.80$ (B1 Zayıf Kat VAR).
- **B2:** $i$. kat göreli öteleme oranı %0.8, $(i+1)$. kat %0.35 $\rightarrow \eta_{ki} = 0.8/0.35 = 2.28 > 2.0$ (B2 Yumuşak Kat VAR).
