# Calculation Spec: Göreli Kat Ötelemesi (Drift) & İkinci Mertebe Kontrolü

> **Tool ID:** `goreli-kat-otelemesi`  
> **Risk Sınıfı:** TIER A  
> **Standart:** TBDY 2018 (Türkiye Bina Deprem Yönetmeliği)  
> **İlgili Bölümler:** Madde 4.9.1 (Göreli Kat Ötelemelerinin Sınırlandırılması), Madde 4.9.2 (İkinci Mertebe Göstergesi)

---

## 1. Amaç ve Kapsam
Bina katlarındaki mutlak yatay deplasmanlar ($u_i$) kullanılarak katlar arası indirgenmiş göreli kat ötelemelerini ($\delta_i$), etkin göreli kat ötelemelerini ($\Delta_i$), göreli kat ötelemesi oranını ve ikinci mertebe gösterge değerini ($\theta_{II}$) hesaplamak; TBDY 2018 Tablo 4.3 sınırlarıyla karşılaştırmak.

---

## 2. Matematiksel Denklemler

### 2.1 İndirgenmiş Göreli Kat Ötelemesi (TBDY Denklem 4.28)
- Katın tabana göre mutlak ötelemesi $u_i$, bir alt katınki $u_{i-1}$ olmak üzere:
  $$\delta_i = u_i - u_{i-1}$$
- Kat Yüksekliği: $h_i$ (mm)

### 2.2 Etkin Göreli Kat Ötelemesi (TBDY Denklem 4.29)
$$\Delta_i = \frac{R}{I} \delta_i$$

### 2.3 Göreli Kat Ötelemesi Sınırı (TBDY Denklem 4.30 / Tablo 4.3)
- $\lambda$: Hakim modun taban kesme kuvvetine oranı veya mod birleştirme katsayısı ($\lambda \approx 1.0$)
- Göreli Öteleme Oranı:
  $$\text{Oran} = \frac{\lambda \delta_{i,max}}{h_i}$$
- Sınır Katsayısı $\kappa$:
  - Gevrek dolgu duvarlı (veya dolgu duvarla çerçeve arasında esnek derz bulunmayan) binalarda: $\kappa = 0.008$
  - Esnek derzli veya dolgu duvarsız binalarda: $\kappa = 0.016$
  - Çelik binalarda: $\kappa = 0.016$
- Koşul: $\frac{\lambda \delta_{i,max}}{h_i} \le \kappa$

### 2.4 İkinci Mertebe Gösterge Değeri $\theta_{II}$ (TBDY Denklem 4.31)
$$\theta_{II} = \frac{\sum_{j=i}^N w_j \times (\Delta_i)_{ort}}{V_{ti} \times h_i} \le 0.12$$
- $w_j$: $j$. katın deprem hesabı ağırlığı ($G + nQ$)
- $V_{ti}$: $i$. kattaki toplam kat kesme kuvveti
- $\theta_{II} > 0.12$ ise ikinci mertebe etkileri doğrudan göz önüne alınmalı veya rijitlik artırılmalıdır.

---

## 3. Bağımsız Doğrulama Örneği (Oracle)
- Kat yüksekliği $h_i = 3000\text{ mm}$, $u_1 = 12\text{ mm}$, $u_0 = 0 \rightarrow \delta_1 = 12\text{ mm}$.
- $\lambda = 1.0 \rightarrow \text{Oran} = 12 / 3000 = 0.0040$.
- Gevrek dolgu için limit $\kappa = 0.008 \rightarrow 0.0040 \le 0.008$ (GÜVENLİ, Kapasite Oranı: 0.50).
