# ASAMA_04 Doğrulama ve Karşılaştırma Raporu

**Tarih:** 2026-10-24T18:09:35.000Z  
**Uygulanan Değişiklik:** `src/components/ambient-ocean-scene.tsx`  
- Scroll ve DOM mutation gözlemcileri (`layoutChange`) doğrudan senkron çağrılmak yerine tek bir `requestAnimationFrame` (`scheduleMeasure`) içine koaleslendi.
- `measure()` içindeki `Array.from(...).map(...)` ve `Math.min/max(...spread)` yerine tek geçişli, ara dizi tahsis etmeyen temiz döngü kuruldu.
- Unmount sırasında `measureRaf` iptali ve event listener temizliği sağlandı.
- Balık/deniz canlıları ekosistemi, 4 kademeli tüy maskesi (feather mask) ve sahne estetiği 100% korundu.

---

## 1. Masaüstü Okyanus Scroll ve Layout Maliyeti

- **Scroll Gözlemcisi:** Senkron layout okuması yerine rAF koalesleme ile sınırlandı.
- **Kart Maskesi Bütünlüğü:** Balıklar kartların veya başlıkların üzerine taşmadan optik maske tam eşleşmeyle korundu.
- **5 Stüdyo Rotası Tıklama -> İlk PDF:** 5 rotanın tamamında soğuk açılışlar 509–588ms, sıcak açılışlar 117–198ms seviyesinde seyrederek ASAMA_01 baz değerlerinin belirgin biçimde üzerinde hız sağladı.
