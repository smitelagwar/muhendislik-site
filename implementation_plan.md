# Hesaplamalar Dünyası - Tamamlanan Yol Haritası

## Tamamlanan Özellikler:

- [x] **Adım 1:** Yeni layout (`hesaplamalar/layout.tsx`), route yapısı ve landing page oluşturuldu. Navbar/mobile-menu eklendi.
- [x] **Adım 2:** Type tanımları (`types.ts`), Core katsayılar (`core.ts`), Global pricebook (`price-books.ts`) ve Hazır şablonlar (`presets.ts`) kurgulandı.
- [x] **Adım 3:** Motor (`engine.ts`): 12 kategori formülü (BetonDemir, Duvar, Çatı, vb.), `buildSnapshot` özeti ve oto-doldurma modülü yazıldı.
- [x] **Adım 4:** Proje ana formu (`ProjeGirisFormu.tsx`) ve ana sayfa global state (useReducer, `page.tsx`) kuruldu. Preset butonları entegre edildi.
- [x] **Adım 5:** UI Bileşenleri — `KategoriKarti` genişleyebilen akordiyon bileşeni + 12 kategori için ayrı input alanları (`KategoriFormlari.tsx`) yapıldı.
- [x] **Adım 6:** Sağ sütun yapışkan özet kartı (`OzetKarti.tsx`) yapıldı.
- [x] **Adım 7:** Analiz pasta grafiği (`MaliyetChart.tsx` - Recharts ile) bağlandı.
- [x] **Adım 8:** Ana menü (landing page) ufak rituşları ve testleri (Typescript, `npm run build`) yapıldı. Temiz bir üretim (production) sürümü elde edildi.

## Sonraki Plan (Kullanıcı İsterse — Faz 2):
1. Yapı Denetim ve Müteahhitlik Karı gibi spesifik kullanıcı overrides alanları eklenebilir.
2. Yazdır ve PDF indir özellikleri aktif hale getirilebilir (react-pdf).

Sistem şu an Next.js projesinde tam entegre, hatasız (error-free) çalışmaktadır.
Kullanıcılar "İnşaat Maliyet Hesaplama" sayfasına `/hesaplamalar/insaat-maliyeti` veya ana menüdeki `Hesaplamalar` sekmesinden sorunsuzca erişebilirler.
