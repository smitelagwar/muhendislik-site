# Calculation Spec: Eşdeğer Deprem Yükü & Taban Kesme Kuvveti

> **Tool ID:** `taban-kesme-kuvveti`  
> **Risk Sınıfı:** TIER A  
> **Standart:** TBDY 2018 (Türkiye Bina Deprem Yönetmeliği)  
> **İlgili Bölümler:** Bölüm 4.7 (Eşdeğer Deprem Yükü Yöntemi), Bölüm 2.3 (Deprem Spektrumu), Bölüm 4.2 (Deprem Yükü Azaltma Katsayısı)

---

## 1. Amaç ve Kapsam
Binaların hakim titreşim periyodu ($T_p$), spektral ivme katsayıları ($S_{DS}, S_{D1}$), bina önem katsayısı ($I$) ve taşıyıcı sistem davranış katsayısı ($R, D$) kullanılarak toplam eşdeğer deprem yükünü (taban kesme kuvveti $V_{tE}$) ve katlara etkiyen eşdeğer deprem kuvvetlerini ($F_i$) hesaplamak.

---

## 2. Girdiler ve Birimler
- $S_s$: Kısa periyot harita spektral ivme katsayısı (Boyutsuz)
- $S_1$: 1.0 saniye periyot için harita spektral ivme katsayısı (Boyutsuz)
- Zemin Sınıfı: ZA, ZB, ZC, ZD, ZE
- Bina Kullanım Sınıfı (BKS) / Önem Katsayısı ($I$): 1.0, 1.2, 1.5
- Taşıyıcı Sistem Davranış Katsayısı ($R$) ve Dayanım Fazlalığı ($D$)
- Bina Toplam Yüksekliği ($H_N$, m) ve Taşıyıcı Sistem Tipi ($C_t$)
- Kat Sayısı ($N$) ve Kat Bazlı Kütle/Ağırlık ($W_i$, kN) ile Kat Yükseklikleri ($h_i$, m)

---

## 3. Matematiksel Yöntem ve Denklemler

### 3.1 Zemin ve Tasarım Spektral İvmeleri (TBDY 2018 §2.3)
- Zemin katsayıları $F_s, F_1$: `src/lib/engineering/tbdy2018/site-coefficients.ts` üzerinden interpolasyonla hesaplanır.
- $S_{DS} = S_s \times F_s$
- $S_{D1} = S_1 \times F_1$
- Spektrum Köşe Periyotları: $T_A = 0.2 \frac{S_{D1}}{S_{DS}}$, $T_B = \frac{S_{D1}}{S_{DS}}$, $T_L = 6.0\text{ s}$

### 3.2 Hakim Doğal Titreşim Periyodu (TBDY 2018 §4.7.3)
- $T_{pA} = C_t H_N^{3/4}$ ($C_t = 0.07$ betonarme çerçeve, $C_t = 0.08$ çelik çerçeve, $C_t = 0.05$ diğer sistemler)

### 3.3 Deprem Yükü Azaltma Katsayısı $R_a(T)$ (TBDY 2018 §4.2)
- $T \le T_B$ ise:
  $$R_a(T) = D + \left(\frac{R}{I} - D\right) \frac{T}{T_B}$$
- $T > T_B$ ise:
  $$R_a(T) = \frac{R}{I}$$

### 3.4 Toplam Eşdeğer Deprem Yükü $V_{tE}$ (TBDY 2018 §4.7.1)
- Azaltılmış Tasarım Spektral İvmesi: $S_{aR}(T_p) = \frac{S_{ae}(T_p)}{R_a(T_p)}$
- Taban Kesme Kuvveti:
  $$V_{tE} = m_t S_{aR}(T_p) g = \frac{W_t}{g} S_{aR}(T_p) g = W_t S_{aR}(T_p)$$
- Minimum Taban Kesme Sınırı (TBDY Denklem 4.23):
  $$V_{tE} \ge 0.04 \times W_t \times I \times S_{DS}$$

### 3.5 Kat Deprem Kuvvetlerinin Dağıtımı (TBDY 2018 §4.7.2)
- Ek Tepe Kuvveti $\Delta F_{NE}$:
  - $H_N > 25\text{ m}$ ise $\Delta F_{NE} = 0.0075 N V_{tE}$ (Maksimum $0.2 V_{tE}$)
  - Aksi halde $\Delta F_{NE} = 0$
- Kat Kuvvetleri $F_i$:
  $$F_i = (V_{tE} - \Delta F_{NE}) \frac{w_i H_i}{\sum_{j=1}^N w_j H_j}$$
- $N$. kata $\Delta F_{NE}$ eklenir: $F_N = F_N + \Delta F_{NE}$.

---

## 4. Bağımsız Doğrulama Örneği (Oracle)
- **Girdiler:** $S_s = 1.5$, $S_1 = 0.4$, Zemin = ZD ($F_s = 1.1$, $F_1 = 1.9$), $I = 1.0$, $R = 8$, $D = 3$, $H = 24\text{ m}$, 8 kat ($h_i = 3\text{ m}$, $w_i = 1000\text{ kN}$), $C_t = 0.07$.
- **Hesaplanan:**
  - $S_{DS} = 1.65$, $S_{D1} = 0.76$, $T_B = 0.461\text{ s}$, $T_A = 0.092\text{ s}$
  - $T_p = 0.07 \times 24^{0.75} = 0.759\text{ s} > T_B$ $\rightarrow R_a(T_p) = 8.0$
  - $S_{ae}(T_p) = \frac{S_{D1}}{T_p} = \frac{0.76}{0.759} = 1.001\text{ g}$
  - $S_{aR}(T_p) = \frac{1.001}{8} = 0.1251\text{ g}$
  - $W_t = 8000\text{ kN}$
  - $V_{tE} = 8000 \times 0.1251 = 1001.2\text{ kN}$
  - Min sınır: $0.04 \times 8000 \times 1.0 \times 1.65 = 528\text{ kN} \rightarrow V_{tE} = 1001.2\text{ kN}$ geçerli.
