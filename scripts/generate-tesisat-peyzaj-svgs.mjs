import fs from "fs";
import path from "path";
import { targetDir, svgWrapper } from "./svg-helpers.mjs";

function save(name, svg) {
  fs.writeFileSync(path.join(targetDir, `${name}.svg`), svg, "utf-8");
  console.log(`Generated: ${name}.svg`);
}

const MEP_CAT = "TESİSAT İŞLERİ";
const MEP_COLOR = "#0284c7";

const PEYZAJ_CAT = "PEYZAJ & TESLİM";
const PEYZAJ_COLOR = "#84cc16";

// 1. tesisat-isleri.svg
save("tesisat-isleri", svgWrapper("Mekanik, Elektrik ve Yangın Koordinasyon Şeması", MEP_CAT, MEP_COLOR, `
  <g transform="translate(80, 140)">
    <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
    
    <g transform="translate(40, 40)">
      <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
      <text x="170" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">ASMA TAVAN PLENUMU (MEP ŞAFTI)</text>
      
      <!-- Döşeme Altı -->
      <rect x="20" y="50" width="300" height="20" fill="#475569" />
      <text x="170" y="65" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Betonarme Döşeme Tavanı</text>

      <!-- Yangın Sprinkler Hattı -->
      <line x1="30" y1="90" x2="310" y2="90" stroke="#ef4444" stroke-width="6" />
      <circle cx="90" cy="105" r="6" fill="#ef4444" />
      <circle cx="210" cy="105" r="6" fill="#ef4444" />
      <text x="260" y="85" fill="#ef4444" font-family="system-ui, sans-serif" font-size="10" font-weight="700">Yangın Hattı (Kırmızı)</text>

      <!-- Havalandırma Kanalı -->
      <rect x="40" y="120" width="120" height="50" fill="#94a3b8" stroke="#cbd5e1" />
      <text x="100" y="150" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">HVAC Kanalı</text>

      <!-- Kablo Tavası -->
      <rect x="180" y="120" width="130" height="25" fill="#ca8a04" stroke="#eab308" />
      <text x="245" y="137" fill="#0f172a" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">Kablo Tavası</text>

      <!-- Temiz ve Pis Su Hatları -->
      <line x1="40" y1="200" x2="310" y2="200" stroke="#0284c7" stroke-width="5" />
      <text x="100" y="195" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="10">PPRC Temiz Su (Mavi)</text>

      <line x1="40" y1="230" x2="310" y2="245" stroke="#64748b" stroke-width="8" />
      <text x="120" y="242" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="10">Pis Su Q110 (%2 Eğim)</text>

      <!-- Asma Tavan Çizgisi -->
      <line x1="20" y1="280" x2="320" y2="280" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 2" />
      <text x="170" y="305" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Asma Tavan Kotu ve Armatürler</text>
    </g>

    <g transform="translate(420, 40)">
      <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
      <text x="20" y="35" fill="#0284c7" font-family="system-ui, sans-serif" font-size="16" font-weight="800">MEP DİSİPLİNLER ARASI KOORDİNASYON KURALLARI</text>
      
      <g transform="translate(20, 60)">
        <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Asma Tavan İçi Yükseklik Hiyerarşisi:</text>
        <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• En Üst Katman: Yangın sprinkler ana ve branşman boruları (en az eğim ihtiyacı).</text>
        <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Orta Katman: Havalandırma kanalları ve kuvvetli/zayıf akım kablo tavaları.</text>
        <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Alt Katman: Yerçekimli pis su ve drenaj hatları (kesintisiz %1.5 - 2 eğim).</text>

        <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Test ve Devreye Alma Standartları:</text>
        <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Basınç Testi: Temiz su boruları işletme basıncının 1.5 katında (min. 10 bar) 24 saat test edilir.</text>
        <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kaçak Akım Testi: 30 mA insan hayatı koruma ve 300 mA yangın koruma röleleri doğrulanır.</text>
        <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Duman &amp; Sızdırmazlık: Pis su kolonları su/duman testiyle sızdırmazlığı onaylanır.</text>
        <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Şaft Geçişleri: Kat döşemesi geçişlerinde yangın durdurucu harç/manşon zorunludur.</text>
        <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">• BIM / Çakışma Yönetimi: Sahaya inmeden önce tüm şaft ve asma tavan çakışmaları çözülmelidir.</text>
      </g>
    </g>
  </g>
`));

// 2. sihhi-tesisat.svg / temiz-su.svg / pis-su.svg
function generateSihhiSvg(title, specText) {
  return svgWrapper(title, MEP_CAT, MEP_COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        <text x="170" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">SIHHİ TESİSAT KOLON ŞEMASI</text>
        
        <!-- Temiz Su Kolonu -->
        <line x1="80" y1="60" x2="80" y2="300" stroke="#0284c7" stroke-width="6" />
        <text x="80" y="320" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Temiz Su PPRC</text>

        <!-- Pis Su Kolonu -->
        <line x1="180" y1="60" x2="180" y2="300" stroke="#64748b" stroke-width="10" />
        <text x="180" y="320" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Pis Su Q110</text>

        <!-- Havalık Borusu -->
        <line x1="260" y1="40" x2="260" y2="300" stroke="#94a3b8" stroke-width="5" stroke-dasharray="4 2" />
        <text x="260" y="320" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Havalık Q75</text>

        <!-- Kat Branşmanları -->
        <line x1="80" y1="120" x2="140" y2="120" stroke="#0284c7" stroke-width="4" />
        <line x1="180" y1="140" x2="140" y2="140" stroke="#64748b" stroke-width="6" />
        <circle cx="140" cy="130" r="10" fill="#10b981" />
        <text x="140" y="134" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Kat 2</text>

        <line x1="80" y1="220" x2="140" y2="220" stroke="#0284c7" stroke-width="4" />
        <line x1="180" y1="240" x2="140" y2="240" stroke="#64748b" stroke-width="6" />
        <circle cx="140" cy="230" r="10" fill="#10b981" />
        <text x="140" y="234" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Kat 1</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#0284c7" font-family="system-ui, sans-serif" font-size="16" font-weight="800">SIHHİ TESİSAT HESAP VE UYGULAMA KRİTERLERİ (TS EN 806 / TS EN 12056)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Temiz Su Dağıtım Esasları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Akma Basıncı: En üst kat musluk ucunda min. 1.0 - 1.5 bar dinamik basınç sağlanmalıdır.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Max Basınç: Alt katlarda gürültü ve koç darbesini önlemek için basınç max. 4-5 bar ile sınırlandırılır.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Boru İzolasyonu: Sıcak su boruları min. 9-13 mm kauçuk köpüğü ile yalıtılmalıdır.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Pis Su ve Drenaj Kuralları:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Eğim Kriteri: Q50-Q75 borularda %2, Q110 borularda %1.5 - %2 kesintisiz eğim verilmelidir.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• 90° Dönüş Yasağı: Kolon tabanlarında ve yatay hatlarda 90° yerine çift 45° dirsek kullanılmalıdır.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Havalık Borusu: Kolon çatı seviyesinden min. 50 cm yukarıya çıkartılarak havalık şapkası takılmalıdır.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Sessiz Boru: Mineral katkılı 3 katmanlı sessiz borular tercih edilmelidir.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("sihhi-tesisat", generateSihhiSvg("Sıhhi Tesisat Kolon ve Kat Branşman Şeması", "• Kat bazında test tapaları takılarak manometre ile sızdırmazlık test kaydı tutulmalıdır."));
save("temiz-su", generateSihhiSvg("Temiz Su Dağıtım, Sayaç ve Kollektör Detayı", "• PPRC kaynaklarında aşırı ısıtma ile iç çap daralmasına kesinlikle izin verilmemelidir."));
save("pis-su", generateSihhiSvg("Pis Su Borulama, Eğim ve Havalık Sistemi", "• Sifon sularının emilmesini (vakum) önlemek için havalık kolonu kesintisiz çalışmalıdır."));

// 3. elektrik-tesisati.svg / kablolama.svg / pano-montaj.svg
function generateElektrikSvg(title, specText) {
  return svgWrapper(title, MEP_CAT, MEP_COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        <text x="170" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">ELEKTRİK DAĞITIM VE PANO ŞEMASI</text>
        
        <!-- Ana Pano Kasası -->
        <rect x="30" y="50" width="280" height="260" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2" />
        
        <!-- Ana TMŞ ve Kaçak Akım -->
        <rect x="50" y="70" width="100" height="45" fill="#b91c1c" rx="4" />
        <text x="100" y="97" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">TMŞ 3x100A</text>

        <rect x="190" y="70" width="100" height="45" fill="#f59e0b" rx="4" />
        <text x="240" y="97" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle">300mA KAR</text>

        <!-- Dağıtım Baraları -->
        <line x1="50" y1="140" x2="290" y2="140" stroke="#f59e0b" stroke-width="4" />
        <line x1="50" y1="150" x2="290" y2="150" stroke="#38bdf8" stroke-width="4" />
        <line x1="50" y1="160" x2="290" y2="160" stroke="#ef4444" stroke-width="4" />
        <text x="170" y="180" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Faz Baraları (L1 - L2 - L3)</text>

        <!-- Otomat Sigortalar ve 30mA KAR -->
        <rect x="50" y="200" width="65" height="35" fill="#0284c7" rx="3" />
        <text x="82" y="222" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">30mA KAR</text>

        <rect x="125" y="200" width="45" height="35" fill="#334155" stroke="#94a3b8" rx="3" />
        <text x="147" y="222" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">16A Priz</text>

        <rect x="180" y="200" width="45" height="35" fill="#334155" stroke="#94a3b8" rx="3" />
        <text x="202" y="222" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">10A Işık</text>

        <rect x="235" y="200" width="55" height="35" fill="#334155" stroke="#94a3b8" rx="3" />
        <text x="262" y="222" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">25A Klima</text>

        <!-- Topraklama Barası -->
        <rect x="50" y="265" width="240" height="15" fill="#10b981" rx="2" />
        <text x="170" y="277" fill="#064e3b" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">Topraklama Barası (PE &lt; 2 Ohm)</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#0284c7" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ELEKTRİK VE KABLOLAMA STANDARTLARI (TS HD 60364)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Kablo Kesitleri ve Koruma Sınıfları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Aydınlatma Linyeleri: Min. 3x1.5 mm² NHXMH (10A B Tipi Otomat).</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Standart Priz Linyeleri: Min. 3x2.5 mm² NHXMH (16A C/B Tipi Otomat).</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Özel Hatlar (Ocak/Fırın/Klima): Min. 3x4 mm² / 3x6 mm² bağımsız linye.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Güvenlik ve Topraklama Kriterleri:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Kaçak Akım Rölesi: Tali panolarda 30 mA (hayat koruma), ana panoda 300 mA (yangın koruma).</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Halojensiz Kablo: Toplu yaşam yapılarında alev iletmeyen, zehirli gaz çıkarmayan HFFR kablo.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Topraklama Direnci: Temel topraklaması + potansiyel dengeleme barası (R &lt; 2 Ohm).</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• İzolasyon Direnci Testi: İletkenler arası meğer testi (min. 1 Megaohm).</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("elektrik-tesisati", generateElektrikSvg("Elektrik Tesisatı Dağıtım ve Pano Şeması", "• Panodaki tüm linyeler tek tek etiketlenmeli, faz yük dengesi (R-S-T) kurulmalıdır."));
save("kablolama", generateElektrikSvg("Kablo Tavası ve Halojensiz Kablolama Detayı", "• Zayıf akım (data/yangın) ve kuvvetli akım kabloları aynı tavada separatörle ayrılmalıdır."));
save("pano-montaj", generateElektrikSvg("Ana Dağıtım ve Tali Pano Montaj Standardı", "• Pano kapakları gövdeye esnek topraklama örgüsü ile irtibatlandırılmalıdır."));

// 4. isitma-sogutma.svg / yerden-isitma.svg / klima-tesisat.svg
function generateHvacSvg(title, specText) {
  return svgWrapper(title, MEP_CAT, MEP_COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        <text x="170" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">YERDEN ISITMA SERPANTİN KESİTİ</text>
        
        <!-- Modülasyon Paneli -->
        <rect x="20" y="240" width="300" height="30" fill="#38bdf8" fill-opacity="0.3" stroke="#0284c7" />
        <text x="170" y="260" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">30 mm EPS Modülasyon Paneli</text>

        <!-- Boru Serpantini -->
        <circle cx="50" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        <circle cx="100" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        <circle cx="150" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        <circle cx="200" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        <circle cx="250" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        <circle cx="290" cy="225" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
        
        <text x="170" y="200" fill="#ef4444" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">16x2 PE-RT / PEX-a Oksijen Bariyerli Boru</text>

        <!-- Kenar İzolasyon Bandı -->
        <rect x="10" y="80" width="10" height="200" fill="#ef4444" />

        <!-- Şap Katmanı -->
        <rect x="20" y="110" width="300" height="110" fill="#64748b" fill-opacity="0.5" stroke="#94a3b8" stroke-dasharray="2 2" />
        <text x="170" y="150" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Katkılı Isıtma Şapı (45-50 mm)</text>

        <!-- Nihai Kaplama -->
        <rect x="20" y="80" width="300" height="30" fill="#10b981" />
        <text x="170" y="100" fill="#064e3b" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">Parke / Seramik Zemin</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#0284c7" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ISITMA &amp; SOĞUTMA STANDARTLARI (TS EN 1264 / TS EN 378)</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Yerden Isıtma Kuralları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Boru Modülasyon Aralığı: Dış cephe kenarlarında 10-15 cm, iç alanlarda 15-20 cm.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Devre Uzunluğu: Tek bir devrenin uzunluğu max. 80-100 metreyi aşmamalıdır.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Şap Dökümü Sırasında Basınç: Şap dökülürken borular 6 bar basınç altında tutulmalıdır.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. VRF ve Klima Tesisatı Esasları:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Bakır Boru Kaynakları: Oksitlenmeyi önlemek için boru içine azot gazı üflenerek kaynak yapılır.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Vakum Testi: Gaz şarjı öncesi sistem min. 500 mikron seviyesine kadar vakumlanmalıdır.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Drenaj Eğimi: İç ünite yoğuşma suyu giderlerine min. %1-2 kesintisiz eğim verilmelidir.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• İlk Çalıştırma: Şap kuruduktan sonra zemin ısıtma kademeli olarak (günde 5°C artırılarak) ısıtılır.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("isitma-sogutma", generateHvacSvg("Isıtma ve Soğutma Sistemleri Genel Şeması", "• Kollektör debimetreleri ile her odanın debi balansı bağımsız olarak ayarlanmalıdır."));
save("yerden-isitma", generateHvacSvg("Yerden Isıtma Boru Serpantini ve Kollektör Detayı", "• Oksijen bariyerli boru kombi ve kazanın paslanarak korozyona uğramasını engeller."));
save("klima-tesisat", generateHvacSvg("VRF ve Split Klima Bakır Borulama & Drenaj Kesiti", "• Dış üniteler kauçuk titreşim emici takozlar üzerine monte edilmelidir."));

// 5. yangin-tesisati.svg / yangin-sprinkler.svg / yangin-dolabi.svg
function generateYanginSvg(title, specText) {
  return svgWrapper(title, MEP_CAT, MEP_COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#ef4444" stroke-width="1.5" />
        <text x="170" y="30" fill="#ef4444" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">YANGIN GÜVENLİK SİSTEMİ</text>
        
        <!-- Yangın Kolonu -->
        <rect x="40" y="60" width="25" height="250" fill="#b91c1c" stroke="#ef4444" />
        <text x="52" y="190" fill="#fef2f2" font-family="system-ui, sans-serif" font-size="11" font-weight="700" transform="rotate(-90 52 190)">Yangın Ana Kolonu DN100</text>

        <!-- Yangın Dolabı -->
        <rect x="100" y="70" width="90" height="110" fill="#991b1b" stroke="#f87171" rx="4" />
        <circle cx="145" cy="120" r="30" fill="none" stroke="#fef2f2" stroke-width="4" />
        <text x="145" y="124" fill="#fef2f2" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Yangın Dolabı</text>

        <!-- Sprinkler Başlığı -->
        <line x1="40" y1="220" x2="280" y2="220" stroke="#ef4444" stroke-width="5" />
        <polygon points="260,220 280,220 270,245" fill="#f59e0b" />
        <circle cx="270" cy="250" r="4" fill="#ef4444" />
        <text x="270" y="275" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">68°C Sprinkler</text>
        <text x="270" y="290" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Kapsama: 12 m²</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#ef4444" font-family="system-ui, sans-serif" font-size="16" font-weight="800">YANGIN TESİSATI YÖNETMELİK VE NFPA 13 KRİTERLERİ</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Sprinkler ve Yangın Dolabı Tasarımı:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Sprinkler Zorunluluğu: Yapı yüksekliği 30.50 m üzeri konutlarda ve 5000 m² üzeri binalarda.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Başlık Yerleşimi: Başlıklar arası mesafe max. 4.0 - 4.6 m, duvardan max. 2.0 - 2.3 m olmalıdır.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yangın Dolabı Basıncı: Nozul çıkışında min. 4 bar dinamik basınç ve 100 lt/dk debi sağlanmalıdır.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. Pompa İstasyonu ve Hidrolik Güvenlik:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yangın Pompası: 1 Asıl (Elektrikli) + 1 Yedek (Dizel) + 1 Jokey pompa kurgulanmalıdır.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Su Rezervi: Yangın anında min. 60-90 dakika kesintisiz su verecek yangın su deposu ayrılır.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• İtfaiye Bağlantı Ağzı: İtfaiye araçlarının dışarıdan sisteme su basabileceği çift ağızlı çekvalf.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Sismik Askılama: Ana boru hatları deprem anında kırılmaması için sismik askılarla sabitlenir.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("yangin-tesisati", generateYanginSvg("Yangın Söndürme Tesisatı ve Hidrolik Sistem Şeması", "• Zon kontrol vanaları akış anahtarı (flow switch) ve izleme anahtarlı kelebek vana ile donatılır."));
save("yangin-sprinkler", generateYanginSvg("Otomatik Yangın Sprinkler Başlığı ve Zon Kontrolü", "• Asma tavan sarkık (pendent) başlıklar tavan kotuna uygun ayarlı rozet ile takılır."));
save("yangin-dolabi", generateYanginSvg("Bina İçi Yangın Dolabı ve Islak Kolon Bağlantısı", "• Yangın dolapları her katta kaçış merdiveni çıkışına ve kolay erişilebilir koridorlara konur."));

// 6. peyzaj-teslim.svg / peyzaj-ve-cevre-duzenleme.svg / sert-zemin.svg / bitkisel-peyzaj.svg / iskan-ruhsati.svg
function generatePeyzajSvg(title, specText) {
  return svgWrapper(title, PEYZAJ_CAT, PEYZAJ_COLOR, `
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="1040" height="430" rx="12" fill="#1e293b" fill-opacity="0.6" stroke="#334155" stroke-width="1.2" />
      
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="340" height="340" rx="8" fill="#0f172a" stroke="#84cc16" stroke-width="1.5" />
        <text x="170" y="30" fill="#a3e635" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">PEYZAJ VE SERT ZEMİN KESİTİ</text>
        
        <!-- Sıkıştırılmış Zemin -->
        <rect x="20" y="260" width="300" height="50" fill="#78350f" fill-opacity="0.5" />
        <text x="170" y="290" fill="#fde68a" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Sıkıştırılmış Doğal Zemin (%95 Proctor)</text>

        <!-- Grobeton / Blokaj -->
        <rect x="20" y="210" width="300" height="50" fill="#475569" stroke="#64748b" />
        <text x="170" y="240" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">10-15 cm Taş Blokaj / C16 Grobeton</text>

        <!-- Taş Tozu / Harç Yatağı -->
        <rect x="20" y="170" width="300" height="40" fill="#ca8a04" />
        <text x="170" y="195" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">4-5 cm Taş Tozu / Kum Yatağı</text>

        <!-- Kilitli Parke / Granit Küp Taş -->
        <rect x="20" y="110" width="200" height="60" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="120" y="145" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle">8 cm Parke Taşı</text>

        <!-- Beton Bordür ve Harç Desteği -->
        <rect x="220" y="70" width="40" height="140" fill="#64748b" stroke="#cbd5e1" stroke-width="2" />
        <text x="240" y="140" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 240 140)">Bordür Taşı</text>

        <!-- Bitkisel Toprak ve Çim -->
        <rect x="260" y="130" width="60" height="80" fill="#15803d" />
        <text x="290" y="175" fill="#dcfce7" font-family="system-ui, sans-serif" font-size="10" transform="rotate(-90 290 175)">Bitkisel Toprak</text>
      </g>

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="570" height="340" rx="8" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        <text x="20" y="35" fill="#84cc16" font-family="system-ui, sans-serif" font-size="16" font-weight="800">ÇEVRE DÜZENLEME VE İSKAN TESLİM ESASLARI</text>
        
        <g transform="translate(20, 60)">
          <text x="0" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">1. Sert Zemin ve Drenaj Standartları:</text>
          <text x="15" y="45" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yüzey Eğimi: Yaya yollarında binadan dışa doğru min. %1.5 - %2 su tahliye eğimi.</text>
          <text x="15" y="70" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Bordür Yataklama: Bordürler C20 harç kilit desteği ile sabitlenmeli, derzler harçlanmalıdır.</text>
          <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Yağmur Suyu Mazgalları: Otopark ve meydanlarda noktasal / çizgisel drenaj kanalları.</text>

          <text x="0" y="130" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">2. İskan (Yapı Kullanma İzni) Kapanış Zinciri:</text>
          <text x="15" y="155" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• Asansör Tescili: A Tipi muayene kuruluşu tarafından 'Yeşil Etiket' verilmesi.</text>
          <text x="15" y="180" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• İtfaiye Uygunluk Raporu: Yangın merdiveni, sprinkler, yangın dolabı ve duman tahliyesi onayı.</text>
          <text x="15" y="205" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• SGK İlişiksizlik Belgesi: Şantiye işçilik prim borcunun bulunmadığının belgelenmesi.</text>
          <text x="15" y="230" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• As-Built Proje Arşivi: Sahada yapılan son revizyonların belediye onayına sunulması.</text>
          <text x="15" y="255" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">${specText}</text>
        </g>
      </g>
    </g>
  `);
}

save("peyzaj-teslim", generatePeyzajSvg("Peyzaj, Çevre Düzenleme ve İskan Teslim Şeması", "• Çevre aydınlatma armatürleri ve otomatik sulama otomasyonu devreye alınmalıdır."));
save("peyzaj-ve-cevre-duzenleme", generatePeyzajSvg("Peyzaj ve Çevre Düzenleme Katman Kesiti", "• Bitkisel toprak serimi öncesi kaba inşaat molozları ve kimyasal atıklar temizlenmelidir."));
save("sert-zemin", generatePeyzajSvg("Sert Zemin, Kilit Taşı ve Bordür Detayı", "• Taş aralarına süpürme elenmiş kuru kum doldurularak kompaktör ile sıkıştırılmalıdır."));
save("bitkisel-peyzaj", generatePeyzajSvg("Bitkisel Peyzaj, Rulo Çim ve Otomatik Sulama", "• Ağaç dikim çukurlarına kök havalandırma borusu ve kazık herekleme sistemi kurulmalıdır."));
save("iskan-ruhsati", generatePeyzajSvg("İskan Ruhsatı (Yapı Kullanma İzni) Onay Akışı", "• Yapı denetim ve belediye heyetinin yerinde mahal ve proje uygunluk denetimi tamamlanır."));

console.log("Tesisat & Peyzaj SVGs completed successfully!");
