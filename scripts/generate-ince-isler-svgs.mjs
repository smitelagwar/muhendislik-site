import fs from "fs";
import path from "path";
import { targetDir, svgWrapper } from "./svg-helpers.mjs";

function save(name, svg) {
  fs.writeFileSync(path.join(targetDir, `${name}.svg`), svg, "utf-8");
  console.log(`Generated: ${name}.svg`);
}

const CAT = "İNCE İŞLER";
const COLOR = "#10b981";

// 1. ince-isler.svg
save("ince-isler", svgWrapper("İnce İşler Koordinasyon ve Katman Akışı", CAT, COLOR, `
  <g transform="translate(60, 140)">
    <rect x="0" y="0" width="1080" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
    
    <g transform="translate(30, 30)">
      <rect x="0" y="0" width="220" height="160" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
      <text x="110" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">1. SIVA &amp; KURU YAPI</text>
      <text x="15" y="60" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Ano ve mastar çıtaları</text>
      <text x="15" y="85" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kaba ve alçı sıva</text>
      <text x="15" y="110" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Alçıpan bölme duvar</text>
      <text x="15" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Asma tavan karkası</text>
    </g>

    <path d="M 260 110 L 290 110" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)" />

    <g transform="translate(300, 30)">
      <rect x="0" y="0" width="220" height="160" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
      <text x="110" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">2. TESİSAT &amp; ŞAP</text>
      <text x="15" y="60" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Zemin tesisat geçişleri</text>
      <text x="15" y="85" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Ses &amp; ısı yalıtım şiltesi</text>
      <text x="15" y="110" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Lazer kotlu tesviye şapı</text>
      <text x="15" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kenar genleşme bandı</text>
    </g>

    <path d="M 530 110 L 560 110" stroke="#10b981" stroke-width="2" />

    <g transform="translate(570, 30)">
      <rect x="0" y="0" width="220" height="160" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
      <text x="110" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">3. ZEMİN &amp; DUVAR</text>
      <text x="15" y="60" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Seramik &amp; fayans kaplama</text>
      <text x="15" y="85" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Parke &amp; süpürgelik</text>
      <text x="15" y="110" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Macun &amp; astar &amp; boya</text>
      <text x="15" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Epoksi zemin uygulaması</text>
    </g>

    <path d="M 800 110 L 830 110" stroke="#10b981" stroke-width="2" />

    <g transform="translate(840, 30)">
      <rect x="0" y="0" width="210" height="160" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
      <text x="105" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">4. DOĞRAMA &amp; ÇATI</text>
      <text x="15" y="60" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kapı &amp; pencere montajı</text>
      <text x="15" y="85" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kör kasa &amp; mastik yalıtım</text>
      <text x="15" y="110" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kiremit / kenet metal çatı</text>
      <text x="15" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Son rötuş ve temizlik</text>
    </g>

    <g transform="translate(30, 220)">
      <rect x="0" y="0" width="1020" height="170" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
      <text x="20" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="700">KRİTİK TOLERANS VE KONTROL STANDARTLARI (TS 1262 / TS 14810 / TS EN 13914):</text>
      <text x="20" y="65" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="12">1. Sıva ve Şap Yüzey Düzgünlüğü: 2 metrelik mastar altında sapma en fazla ±2 mm olmalıdır.</text>
      <text x="20" y="95" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="12">2. Nem Ölçümü: Parke serilmeden önce çimento esaslı şap nemi ağırlıkça %2'nin (yerden ısıtmada %1.8) altında olmalıdır.</text>
      <text x="20" y="125" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="12">3. Islak Hacim Su Yalıtımı: Seramik öncesi sürme yalıtım min. 2 kat uygulanmalı, dikeyde min. 20 cm süpürgelik pahı dönülmelidir.</text>
      <text x="20" y="150" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="12">4. İnce İşler Sıra Disiplini: Tavan ve duvar boya 1. katı bittikten sonra parke montajı yapılır; süpürgelikten sonra son kat boyanır.</text>
    </g>
  </g>
`));

// 2. siva-isleri.svg / kara-siva.svg / ic-siva.svg / dis-siva.svg / alci-siva.svg / dekoratif-siva.svg
function generateSivaSvg(title, specText) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <!-- Duvar Katman Kesiti -->
      <g transform="translate(60, 40)">
        <rect x="0" y="0" width="140" height="340" fill="#b45309" fill-opacity="0.4" stroke="#d97706" stroke-width="1.5" />
        <text x="70" y="170" fill="#fde68a" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle" transform="rotate(-90 70 170)">TUĞLA / GAZBETON DUVAR</text>

        <!-- Serpme Katmanı -->
        <rect x="140" y="0" width="20" height="340" fill="#64748b" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" />
        <text x="150" y="360" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Aderans Serpmesi</text>

        <!-- Kaba Sıva -->
        <rect x="160" y="0" width="50" height="340" fill="#475569" stroke="#94a3b8" stroke-width="1.2" />
        <text x="185" y="170" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" transform="rotate(-90 185 170)">Kaba Sıva (15-20 mm)</text>

        <!-- Donatı Filesi -->
        <line x1="210" y1="0" x2="210" y2="340" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 2" />
        <text x="210" y="375" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">160 g/m² Sıva Filesi</text>

        <!-- İnce Sıva / Saten -->
        <rect x="210" y="0" width="30" height="340" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.2" />
        <text x="225" y="170" fill="#0f172a" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" transform="rotate(-90 225 170)">İnce Sıva / Alçı</text>

        <!-- Boya Astar & Son Kat -->
        <rect x="240" y="0" width="10" height="340" fill="#10b981" />
        <text x="245" y="360" fill="#10b981" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Boya</text>

        <!-- Ano Çıtası ve Mastar Çizgisi -->
        <line x1="160" y1="40" x2="240" y2="40" stroke="#f59e0b" stroke-width="2" />
        <circle cx="200" cy="40" r="4" fill="#f59e0b" />
        <text x="250" y="45" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11">Ano Kot Çizgisi</text>
      </g>

      <!-- Açıklamalar ve Tablo -->
      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="560" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">SIVA TEKNİK ÖZELLİKLERİ VE SAHA KURALLARI</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Harç Karışım Oranları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Serpme Aderans: 1 m³ yıkanmış kum + 350-400 kg çimento + aderans katkısı</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kaba Sıva: 1 m³ 0-3 mm kum + 250-300 kg çimento + kireç (15-20 mm)</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• İnce Sıva: 1 m³ 0-1 mm elenmiş ince kum + 200 kg çimento (3-5 mm)</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Kritik Kontrol Adımları:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yüzey nemlendirme: Kuru tuğla/gazbeton sıva suyunu emmemesi için ıslatılmalı.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Farklı malzeme birleşimleri (beton-tuğla) fileli sıva ile takviye edilmeli (min. 20 cm bindirme).</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Köşelerde alüminyum/PVC fileli köşe profili şakülünde yerleştirilmeli.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Mastar kontrolü: 2 metrede sapma max 2 mm (TS EN 13914 standardı).</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("siva-isleri", generateSivaSvg("Sıva İşleri Katman ve Donatı Detayı", "• Kuruma süresi: Katlar arası min. 24 saat, boya öncesi 28 gün beklenmeli."));
save("ic-siva", generateSivaSvg("İç Sıva Uygulama ve Ano Mastar Detayı", "• İç mekan nem dengesi sağlanmalı; cereyan ve hızlı kuruma çatlaklarına engel olunmalı."));
save("dis-siva", generateSivaSvg("Dış Cephe Sıva ve Isı Yalıtım Donatı Filesi", "• Dış cephede alkali dayanımlı 160 g/m² cam elyaf donatı filesi ve damlalık profili zorunludur."));
save("alci-siva", generateSivaSvg("Alçı Sıva ve Saten Perdah Uygulama Kesiti", "• Brüt beton yüzeylerde aderans artırıcı brüt beton astarı (kumlu astar) sürülmelidir."));
save("kara-siva", generateSivaSvg("Geleneksel Çimento Esaslı Kara Sıva Detayı", "• 1:3 çimento-kum oranında kaba sıva, ahşap mastar ve tirfil perdahı yapılmalıdır."));
save("dekoratif-siva", generateSivaSvg("Dekoratif Mineral Sıva ve Dış Cephe Kaplaması", "• Tane dokulu mineral sıva homojen çekilmeli, ek izi olmaması için iskelede kesintisiz sürülmeli."));

// 3. alcipan.svg / alcipan-asma-tavan.svg / bolme-duvar.svg / alcipan-bolme-duvar.svg / asma-tavan.svg / klasik-asma-tavan.svg / moduler-asma-tavan.svg / gizli-isik-bandi.svg
function generateAlcipanSvg(title, subType) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <!-- Kuru Yapı Şeması -->
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
        
        <!-- Üst ve Alt U Profilleri -->
        <rect x="20" y="20" width="300" height="24" fill="#64748b" stroke="#94a3b8" stroke-width="1.5" />
        <text x="170" y="37" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Tavan U Profili + Akustik İzolasyon Bandı</text>

        <rect x="20" y="296" width="300" height="24" fill="#64748b" stroke="#94a3b8" stroke-width="1.5" />
        <text x="170" y="313" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Zemin U Profili + Akustik İzolasyon Bandı</text>

        <!-- Düşey C Profilleri -->
        <rect x="50" y="44" width="20" height="252" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1" />
        <rect x="160" y="44" width="20" height="252" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1" />
        <rect x="270" y="44" width="20" height="252" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1" />

        <!-- Aks Ölçüsü -->
        <line x1="60" y1="170" x2="170" y2="170" stroke="#f59e0b" stroke-width="1.5" />
        <text x="115" y="160" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Aks: 60 cm</text>

        <!-- Taşyünü Yalıtım Dolgusu -->
        <rect x="70" y="44" width="90" height="252" fill="#ca8a04" fill-opacity="0.3" stroke="#eab308" stroke-dasharray="4 2" />
        <text x="115" y="230" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">50 mm Taşyünü</text>

        <rect x="180" y="44" width="90" height="252" fill="#ca8a04" fill-opacity="0.3" stroke="#eab308" stroke-dasharray="4 2" />
        <text x="225" y="230" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">50 mm Taşyünü</text>

        <!-- Çift Kat Alçıpan Levhalar -->
        <rect x="10" y="44" width="10" height="252" fill="#e2e8f0" stroke="#94a3b8" />
        <rect x="320" y="44" width="10" height="252" fill="#e2e8f0" stroke="#94a3b8" />
        <text x="15" y="280" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 15 280)">12.5 mm Alçıpan</text>
      </g>

      <!-- Standart ve Montaj Detayı -->
      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="560" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">KURU YAPI SİSTEM KRİTERLERİ (TS EN 520 / TS EN 14195)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Karkas ve Malzeme Standartları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Profil Sac Kalınlığı: Min. 0.60 mm galvanizli çelik (C50/C75/C100).</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Profil Aks Aralığı: Standart duvarlarda 60 cm, seramik altı duvarlarda 40 cm.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Vida Aralığı: Borazan vidalar tek katta 25 cm, çift katta 15 cm sıklıkta atılmalıdır.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Ses, Yangın ve Derz Uygulaması:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Akustik Yalıtım Bandı: U ve C profillerin zemin, tavan ve duvara bastığı her noktaya çekilmelidir.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Derz Şaşırtması: Çift kat alçıpan uygulamasında 1. ve 2. kat derzleri en az 40 cm şaşırtılmalıdır.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Derz Bandı ve Dolgusu: Kendinden yapışkanlı file bant veya kağıt bant + 3 kat derz dolgu alçısı.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Islak Hacim: Suya dayanıklı yeşil (WR) veya neme/küfe ekstra dayanıklı levha kullanılmalıdır.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${subType}</text>
        </g>
      </g>
    </g>
  `);
}

save("alcipan", generateAlcipanSvg("Alçıpan Kuru Yapı ve Asma Tavan Sistemleri", "• Asma tavanda çelik dübel, askı çubuğu (90 cm aks) ve ana taşıyıcı C profili kullanılır."));
save("alcipan-asma-tavan", generateAlcipanSvg("Alçıpan Asma Tavan ve Karkas Sistemi", "• Tavan taşıyıcı profiller 100 cm, tali profiller 40-50 cm aks aralığı ile vidalanır."));
save("bolme-duvar", generateAlcipanSvg("Alçıpan Bölme Duvar ve Karkas Kesiti", "• Çift kat 12.5 mm levha + 50 mm 50 kg/m³ taşyünü ile 48 dB ses yalıtımı sağlanır."));
save("alcipan-bolme-duvar", generateAlcipanSvg("Alçıpan Bölme Duvar Detayı", "• Kapı kasası kenarlarına çift C profil içine ahşap lata veya kutu profil takviyesi konulmalıdır."));
save("asma-tavan", generateAlcipanSvg("Asma Tavan Taşıyıcı Karkas ve Askı Detayı", "• Aydınlatma armatürleri, menfezler ve yangın sprinklerleri alçıpana değil karkasa asılmalıdır."));
save("klasik-asma-tavan", generateAlcipanSvg("Klasik Düz Alçıpan Asma Tavan", "• Tavan çevre U profili lazer nivo ile teraziye alınmalı, derz bandı çatlamaya karşı çekilmelidir."));
save("moduler-asma-tavan", generateAlcipanSvg("Modüler 60x60 Asma Tavan (T24 / T15 Karkas)", "• Akustik taşyünü karolar, gizli/görünür taşıyıcılar ve kolay servis müdahale kapağı avantajı."));
save("gizli-isik-bandi", generateAlcipanSvg("Gizli Işık Bandı ve Işık Havuzu Detayı", "• Alüminyum LED soğutma profili, endirekt ışık açısı ve pürüzsüz boyalı alçıpan havuz imalatı."));

// 4. zemin-kaplamalari.svg / tesviye-sapi.svg / seramik-kaplama.svg / seramik-fayans-zemin.svg / parke-kaplama.svg / parke-laminat.svg / mermer-kaplama.svg / epoksi-kaplama.svg / epoksi-zemin.svg
function generateZeminSvg(title, note) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <!-- Zemin Katman Kesiti -->
      <g transform="translate(60, 50)">
        <!-- Taşıyıcı Döşeme -->
        <rect x="0" y="240" width="320" height="60" fill="#334155" stroke="#475569" stroke-width="1.5" />
        <text x="160" y="275" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">BETONARME DÖŞEME BETONU</text>

        <!-- Yalıtım Şiltesi -->
        <rect x="0" y="210" width="320" height="30" fill="#ca8a04" fill-opacity="0.5" stroke="#eab308" stroke-width="1" />
        <text x="160" y="230" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Şilte / Yerden Isıtma Straforu (20-30 mm)</text>

        <!-- Tesviye Şapı -->
        <rect x="0" y="130" width="320" height="80" fill="#64748b" stroke="#94a3b8" stroke-width="1.5" />
        <text x="160" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Tesviye Şapı (40-50 mm C20)</text>

        <!-- Kenar İzolasyon Bandı -->
        <rect x="0" y="100" width="16" height="170" fill="#ef4444" fill-opacity="0.7" stroke="#dc2626" />
        <text x="8" y="180" fill="#fecaca" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 8 180)">Genleşme Bandı</text>

        <!-- Yapıştırıcı / Altlık -->
        <rect x="16" y="115" width="304" height="15" fill="#0284c7" stroke="#38bdf8" />
        <text x="160" y="127" fill="#f0f9ff" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">C2TE Esnek Yapıştırıcı / Şilte</text>

        <!-- Zemin Kaplaması -->
        <rect x="16" y="80" width="304" height="35" fill="#10b981" stroke="#34d399" stroke-width="1.5" />
        <text x="160" y="102" fill="#064e3b" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">NİHAİ ZEMİN KAPLAMASI</text>

        <!-- Süpürgelik -->
        <rect x="0" y="30" width="20" height="70" fill="#b45309" stroke="#d97706" stroke-width="1.5" />
        <text x="10" y="70" fill="#fef3c7" font-family="system-ui, sans-serif" font-size="9" transform="rotate(-90 10 70)">Süpürgelik</text>
      </g>

      <!-- Sağ Tablo -->
      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="560" height="350" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ZEMİN KAPLAMA KRİTERLERİ VE STANDARTLARI</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Şap ve Yüzey Hazırlığı (TS EN 13813):</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Şap Kalınlığı: Min. 40 mm (yerden ısıtma borusu üzeri min. 30 mm örtü).</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Çatlak Önleme: Polipropilen mikro elyaf veya çelik hasır donatı kullanılmalıdır.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kenar Yalıtım Bandı: Yüzer şap duvara temas etmemeli; ses köprüsü kırılmalıdır.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Kaplama Türlerine Göre Kritik Kontroller:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Seramik / Granit: C2TE S1 yapıştırıcı, çift taraflı taraklama, min. 2-3 mm derz.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Parke: Şap nemi &lt;%2, 10-15 mm duvar genleşme payı, buhar bariyeri altlık.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Epoksi: Yüzey bilyalama/frezeleme, nem &lt;%4, primersiz uygulama yapılmamalı.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Mermer / Doğal Taş: Harç kalınlığı 3-5 cm, derz dolgusu ve leke önleyici emprenye.</text>
          <text x="15" y="260" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${note}</text>
        </g>
      </g>
    </g>
  `);
}

save("zemin-kaplamalari", generateZeminSvg("Zemin Kaplama Katmanları ve Yüzer Şap Detayı", "• Zemin seviyeleri ıslak hacimlerde kuru mekanlara göre 1.5 - 2 cm düşük tutulmalıdır."));
save("tesviye-sapi", generateZeminSvg("Tesviye Şapı ve Ano Kotlama Kesiti", "• Ano çıtaları lazer nivo ile kurulmalı, 2 m mastarda boşluk 2 mm'yi aşmamalıdır."));
save("seramik-kaplama", generateZeminSvg("Seramik ve Porselen Karo Zemin Kaplaması", "• 60x120 ve üzeri büyük ebatlı karolarda seviye takozu ve S1 esnek harç zorunludur."));
save("seramik-fayans-zemin", generateZeminSvg("Seramik & Fayans Zemin Döşeme Detayı", "• Islak hacimlerde süzgece doğru %1.5 - 2 eğim verilmeli, derzler su itici olmalıdır."));
save("parke-kaplama", generateZeminSvg("Lamine ve Laminat Parke Yüzer Sistem Kesiti", "• Duvar diplerinde 12-15 mm genleşme boşluğu bırakılmalı, süpürgelikle gizlenmelidir."));
save("parke-laminat", generateZeminSvg("Laminat Parke Altlığı ve Kilitli Sistem Montajı", "• Altlık şilte ezilmeye dirençli seçilmeli, şapın tam kuruduğundan emin olunmalıdır."));
save("mermer-kaplama", generateZeminSvg("Mermer ve Granit Zemin Kaplama Detayı", "• Harç altı şerbetleme yapılmalı, açık derz veya elastik derz dolgusu uygulanmalıdır."));
save("epoksi-kaplama", generateZeminSvg("Endüstriyel Epoksi Zemin Kaplama Katmanları", "• Astar + ara kat kuvars kumu + self-leveling son kat (2-3 mm toplam kuru film)."));
save("epoksi-zemin", generateZeminSvg("Self-Leveling Epoksi Zemin Uygulama Şeması", "• Kimyasal dayanım, pürüzsüz hijyenik yüzey ve yüksek mekanik aşınma direnci."));

// 5. duvar-kaplamalari.svg / fayans.svg / boya.svg / duvar-boyasi.svg / duvar-kagidi.svg / ahsap-duvar-paneli.svg
function generateDuvarSvg(title, note) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(60, 50)">
        <rect x="0" y="0" width="300" height="320" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
        <text x="150" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">DUVAR KAPLAMA KATMANLARI</text>
        
        <rect x="20" y="60" width="60" height="230" fill="#475569" stroke="#64748b" />
        <text x="50" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle" transform="rotate(-90 50 175)">Kaba Sıva</text>

        <rect x="80" y="60" width="50" height="230" fill="#cbd5e1" stroke="#94a3b8" />
        <text x="105" y="175" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle" transform="rotate(-90 105 175)">Alçı / Macun</text>

        <rect x="130" y="60" width="20" height="230" fill="#38bdf8" />
        <text x="140" y="175" fill="#0f172a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" transform="rotate(-90 140 175)">Astar</text>

        <rect x="150" y="60" width="50" height="230" fill="#10b981" />
        <text x="175" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" transform="rotate(-90 175 175)">1. Kat Son Kat</text>

        <rect x="200" y="60" width="50" height="230" fill="#059669" />
        <text x="225" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" transform="rotate(-90 225 175)">2. Kat Son Kat</text>
      </g>

      <g transform="translate(400, 50)">
        <rect x="0" y="0" width="580" height="330" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">DUVAR KAPLAMA VE BOYA STANDARTLARI</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Yüzey Hazırlığı ve Macunlama:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Alçı yüzey zımparası 180-220 kum zımpara ile yapılmalı, toz tamamen alınmalıdır.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Bağlayıcı astar (şeffaf astar) tozumayı engeller ve boyanın emilmesini eşitler.</text>

          <text x="0" y="110" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Boya, Duvar Kağıdı ve Ahşap Panel Kuralları:</text>
          <text x="15" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Boya Katları: İki kat arasında min. 4-6 saat kuruma süresi bırakılmalıdır.</text>
          <text x="15" y="160" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Işık Testi: Projektör ışığı duvara yatay tutularak yüzey dalgalanması kontrol edilir.</text>
          <text x="15" y="185" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Duvar Kağıdı: Ek yerleri üst üste binmemeli, silikon rulo ile havası alınmalıdır.</text>
          <text x="15" y="210" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Ahşap Paneller: Arkasında min. 20 mm hava sirkülasyon boşluğu bırakılmalıdır.</text>
          <text x="15" y="245" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${note}</text>
        </g>
      </g>
    </g>
  `);
}

save("duvar-kaplamalari", generateDuvarSvg("Duvar Kaplamaları ve Son Kat Boya Katmanları", "• Boya yapılacak mahalde hava sıcaklığı min. +5°C, bağıl nem max. %80 olmalıdır."));
save("fayans", generateDuvarSvg("Fayans ve Duvar Seramiği Montaj Detayı", "• Islak hacimlerde tesisat çıkışları rozet arkası silikonlanmalı, köşeler mastiklenmelidir."));
save("boya", generateDuvarSvg("Boya Katmanları, Astar ve Zımpara Kalitesi", "• İki kat son kat su bazlı silikonlu boya homojen taranmalı, rulo izi bırakılmamalıdır."));
save("duvar-boyasi", generateDuvarSvg("İç ve Dış Cephe Duvar Boyası Katman Şeması", "• Astar boya tüketimini azaltır ve boyanın yüzeye yapışma mukavemetini %40 artırır."));
save("duvar-kagidi", generateDuvarSvg("Duvar Kağıdı Uygulama ve Desen Hizalama Detayı", "• Alt zemin pürüzsüz saten alçı olmalı, küf önleyici özel tutkal kullanılmalıdır."));
save("ahsap-duvar-paneli", generateDuvarSvg("Akustik Ahşap Duvar Paneli ve Gizli Karkas Kesiti", "• Gizli klipsli montaj, arkasında akustik taşyünü ve yangına dayanımlı MDF lamel."));

// 6. kapi-pencere.svg / dis-kapi.svg / ic-kapi.svg / ic-kapilar.svg / celik-kapi.svg / pencere.svg / pvc-dograma.svg / aluminyum-dograma.svg
function generateKapiPencereSvg(title, specText) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="320" height="340" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
        <text x="160" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">DOĞRAMA &amp; KASA MONTAJ KESİTİ</text>
        
        <!-- Duvar Boşluğu -->
        <rect x="30" y="50" width="50" height="260" fill="#b45309" fill-opacity="0.4" stroke="#d97706" />
        <text x="55" y="180" fill="#fde68a" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 55 180)">Duvar Boşluğu</text>

        <!-- Kör Kasa -->
        <rect x="80" y="60" width="25" height="240" fill="#64748b" stroke="#94a3b8" />
        <text x="92" y="180" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 92 180)">Kör Kasa</text>

        <!-- Poliüretan Köpük / İzolasyon -->
        <rect x="105" y="60" width="20" height="240" fill="#fef08a" fill-opacity="0.6" stroke="#eab308" stroke-dasharray="2 2" />
        <text x="115" y="180" fill="#713f12" font-family="system-ui, sans-serif" font-size="9" transform="rotate(-90 115 180)">PU Köpük</text>

        <!-- Ana Profil Kasa -->
        <rect x="125" y="60" width="45" height="240" fill="#334155" stroke="#38bdf8" stroke-width="1.5" />
        
        <!-- Cam Paketi -->
        <rect x="170" y="80" width="30" height="200" fill="#0284c7" fill-opacity="0.6" stroke="#0ea5e9" stroke-width="1.5" />
        <text x="185" y="180" fill="#f0f9ff" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle" transform="rotate(-90 185 180)">4+16+4 Low-E Cam</text>

        <!-- Pervaz / Denizlik -->
        <polygon points="120,60 210,60 200,45 120,45" fill="#94a3b8" stroke="#cbd5e1" />
        <text x="160" y="40" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">İç Pervaz</text>

        <polygon points="120,300 240,315 240,325 120,305" fill="#64748b" stroke="#94a3b8" />
        <text x="180" y="335" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Dış Denizlik (Damlalıklı)</text>
      </g>

      <g transform="translate(400, 40)">
        <rect x="0" y="0" width="580" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">KAPI &amp; PENCERE PERFORMANS STANDARTLARI (TS EN 14351-1)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Montaj ve Yalıtım Kuralları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Şakül ve Terazi: Kasa montajında düşey ve yatay sapma max. 1.5 mm/m olmalıdır.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kör Kasa: Sıva öncesi kör kasa takılmalı, sıva kasaya sıfır bitirilmelidir.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yalıtım: Kasa-duvar arasına poliüretan köpük sıkılmalı, dıştan silikon mastik çekilmelidir.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Isı, Rüzgar ve Güvenlik Performansı:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Isı Geçirgenliği: Pencere U değeri max. 1.3 - 1.5 W/m²K (TS 825 standardı).</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Çelik Kapı: Kasa içi harç/beton dolgulu olmalı, kanat içi taşyünü izolasyonlu olmalıdır.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Alüminyum Doğrama: Min. 24 mm poliamid ısı bariyeri bulunmalıdır.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Denizlik: Dış denizlik eğimi min. %5 olmalı ve damlalık burnu cepheden 3 cm taşmalıdır.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("kapi-pencere", generateKapiPencereSvg("Kapı ve Pencere Doğrama Montaj Şeması", "• Montaj vidaları köşelerden 15 cm içeride ve max. 70 cm aralıklarla atılmalıdır."));
save("dis-kapi", generateKapiPencereSvg("Dış Giriş Kapısı ve Güvenlik Donanımı Detayı", "• Dış hava şartlarına dayanıklı kompakt lamine/alüminyum yüzey ve çelik takviyeli karkas."));
save("ic-kapi", generateKapiPencereSvg("İç Mekan Ahşap / Lake / Melamin Kapı Montajı", "• Ayarlı teleskopik pervaz, EPDM ses fitili ve manyetik sessiz kilit mekanizması."));
save("ic-kapilar", generateKapiPencereSvg("İç Kapılar Kasa-Kanat ve Pervaz Montaj Detayı", "• Kapı altı boşluğu parke üzerinde 5-8 mm (havalandırma için) bırakılmalıdır."));
save("celik-kapi", generateKapiPencereSvg("Çelik Güvenlik Kapısı Kasa Dolgu ve Kilit Detayı", "• Monoblok çok noktalı kilitleme sistemi, 2 mm galvaniz çelik kasa ve beton enjeksiyonu."));
save("pencere", generateKapiPencereSvg("Pencere Doğraması ve Çift Cam Isı Yalıtım Kesiti", "• Çift açılım mekanizması, hava geçirimsizlik contaları ve rüzgar yükü hesabı."));
save("pvc-dograma", generateKapiPencereSvg("PVC Pencere Profil Kesiti (5-6 Odacıklı)", "• 70 mm profil genişliği, galvaniz çelik destek sacı (min. 1.5 mm) ve TPV/EPDM contalar."));
save("aluminyum-dograma", generateKapiPencereSvg("Isı Yalıtımlı Alüminyum Doğrama Kesiti", "• Poliamid ısı bariyeri, gizli kanat tasarımı, elektrostatik toz boya ve yüksek statik dayanım."));

// 7. cati-kaplamasi.svg / kiremit.svg / kiremit-cati.svg / membran-cati.svg / sandvic-panel.svg / shingle.svg / metal-cati.svg
function generateCatiKaplamaSvg(title, specText) {
  return svgWrapper(title, CAT, COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
        <text x="170" y="30" fill="#10b981" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">EĞİMLİ ÇATI KAPLAMA KESİTİ</text>
        
        <!-- Mertek Taşıyıcı -->
        <polygon points="30,280 200,100 240,100 70,280" fill="#78350f" stroke="#b45309" stroke-width="1.5" />
        <text x="120" y="240" fill="#fde68a" font-family="system-ui, sans-serif" font-size="11" transform="rotate(-40 120 240)">Mertek (5x10 / 10x10)</text>

        <!-- OSB / Tahta Kaplama -->
        <polygon points="35,270 205,90 215,90 45,270" fill="#d97706" />
        <text x="100" y="200" fill="#fef3c7" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-40 100 200)">15 mm OSB-3</text>

        <!-- Nefes Alan Su Yalıtım Örtüsü -->
        <polygon points="45,260 215,80 220,80 50,260" fill="#38bdf8" />
        <text x="110" y="185" fill="#e0f2fe" font-family="system-ui, sans-serif" font-size="9" transform="rotate(-40 110 185)">Buhar Geçirgen Örtü</text>

        <!-- Havalandırma Çıtaları (Dikey / Yatay) -->
        <rect x="90" y="160" width="16" height="16" fill="#f59e0b" />
        <rect x="140" y="120" width="16" height="16" fill="#f59e0b" />
        <text x="210" y="165" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="10">5x5 Havalandırma Çıtası</text>

        <!-- Kiremit / Metal Kaplama -->
        <circle cx="100" cy="145" r="14" fill="#b91c1c" />
        <circle cx="150" cy="105" r="14" fill="#b91c1c" />
        <circle cx="200" cy="65" r="14" fill="#b91c1c" />
        <text x="230" y="80" fill="#ef4444" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Kiremit / Metal</text>

        <!-- Yağmur Oluğu -->
        <path d="M 20 290 Q 35 320 50 290" fill="none" stroke="#94a3b8" stroke-width="3" />
        <text x="35" y="335" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Asma Çinko Oluk</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="560" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ÇATI KAPLAMA TEKNİK STANDARTLARI (TS EN 1304 / TS EN 508)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Eğim ve Su Tahliye Esasları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kiremit Çatı Eğimi: Min. %30 - %33 (daha düşük eğimlerde su sızdırma riski artar).</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Metal Kenet Çatı Eğimi: Min. %5 - %7 (kenet içi butil mastik takviyesi ile).</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Sandviç Panel: Min. %7-10 eğim, enine binilerde min. 20 cm bindirme ve mastik.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Havalandırma ve Rüzgar Güvenliği:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Çatı Havalandırması: Saçaktan giren hava mahyadan çıkacak hava sirkülasyon kanalı kurulmalı.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kiremit Sabitleme: Saçak, kalkan ve mahya sıraları ile her 3 kiremitte biri vidalanmalı/çivilenmeli.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Mahya Havalandırma Bandı: Harçsız kuru mahya sistemi uygulanmalı, havalandırma kesilmemeli.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Gizli Dere / Oluk Yalıtımı: Çift kat EPDM veya bitümlü membran ile min. %1 eğimli dere tabanı.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("cati-kaplamasi", generateCatiKaplamaSvg("Çatı Kaplama Türleri ve Katman Detayları", "• Yağmur iniş boruları m² çatı alanına 1 cm² boru kesiti (min. Q100 mm) hesabıyla boyutlandırılır."));
save("kiremit", generateCatiKaplamaSvg("Kiremit Çatı Kaplama ve Kuru Mahya Detayı", "• Kiremit altı çıtaları 31-34 cm aralıkla çakılmalı, saçak eteğine kuş önleyici ızgara takılmalıdır."));
save("kiremit-cati", generateCatiKaplamaSvg("Kiremit Çatı Havalandırma ve Su Yalıtım Kesiti", "• Buhar geçirgen su yalıtım örtüsü min. 150 g/m² olmalı ve bini yerleri bantlanmalıdır."));
save("membran-cati", generateCatiKaplamaSvg("Bitümlü Membran ve Shingle Çatı Kaplaması", "• Çift kat 4 mm polyester keçeli şalumo alevli membran veya OSB üzerine çivili shingle."));
save("sandvic-panel", generateCatiKaplamaSvg("Sandviç Panel Çatı Kaplama Kesiti", "• PIR / Taşyünü dolgulu 5 hadveli çatı paneli, semerli EPDM contalı paslanmaz vidalar."));
save("shingle", generateCatiKaplamaSvg("Shingle Çatı Kaplama ve Çivileme Detayı", "• Eğim min. %20, galvanizli geniş başlı shingle çivisi ile her yaprağa 4-6 çivi atılmalıdır."));
save("metal-cati", generateCatiKaplamaSvg("Kenet Sistem Metal Çatı Kaplama Detayı", "• Titanyum çinko / boyalı alüminyum levhalar gizli sabit ve hareketli klipslerle kilitlenir."));

console.log("İnce İşler SVGs completed successfully!");
