# Korumalı Formül Düzeltme Kaydı: Kolon Donatı Ağırlığı

> **Araç:** Kolon Ön Boyutlandırma (`kolon-on-boyutlandirma`)  
> **Dosya:** `src/lib/concrete-tools/column.ts`  
> **Durum:** ONAYLI FORMÜL DÜZELTMESİ (Birim Boyutsal Analiz Düzeltmesi)  
> **Tarih:** 30 Ağustos 2026

---

## 1. Eski Denklem ve Problem

Eski `column.ts` kodunda donatı metrajı ağırlığı şöyle hesaplanıyordu:
```typescript
// ESKİ HATA:
const barAreaM2 = (Math.PI * Math.pow(barDiameterMm / 2000, 2));
const totalRebarWeightKgPerM = barCount * barAreaM2 * 7850 * 1000; // 1000 kat çarpanı vardı
```

Örnek çıktı:
- 8 adet Ø20 donatı için:
  - 8 × (π × 0.01²) × 7850 × 1000 = **19,729 kg/m** (Metre başına 19.7 ton gibi fiziksel olarak imkansız bir sayı).

---

## 2. Boyutsal ve Bağımsız Analiz (Dimensional Analysis)

- Çeliğin birim hacim ağırlığı $\rho = 7850 \text{ kg/m}^3$.
- Ø20 donatı kesit alanı $A_s = \frac{\pi \times (0.02 \text{ m})^2}{4} = 0.00031416 \text{ m}^2$.
- 1 adet Ø20 donatının 1 metredeki kütlesi:
  $$m = 0.00031416 \text{ m}^2 \times 7850 \text{ kg/m}^3 = 2.466 \text{ kg/m}$$
- 8 adet Ø20 donatının toplam kütlesi:
  $$M = 8 \times 2.466 = \mathbf{19.73 \text{ kg/m}}$$

---

## 3. Düzeltilmiş Denklem

```typescript
// DÜZELTİLMİŞ GEÇERLİ FORMÜL:
const barAreaM2 = (Math.PI * Math.pow(barDiameterMm / 2000, 2));
const totalRebarWeightKgPerM = barCount * barAreaM2 * 7850; // Doğru: ~19.73 kg/m
```

---

## 4. Karar ve Sonuç

Bu değişiklik korumalı formül sözleşmesinde bir algoritma değişikliği değil, boyutsal çarpan hatası (`×1000`) düzeltmesidir. Sayısal regresyon tabanında `19.73 kg/m` doğru değer olarak kilitlenmiştir.
