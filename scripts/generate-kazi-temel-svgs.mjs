import fs from "fs";
import path from "path";
import { targetDir, svgWrapper } from "./svg-helpers.mjs";

const KAZI_SVGS = {
  "kazi-temel": svgWrapper(
    "Kazı ve Temel Fazı İmalat Yol Haritası",
    "KAZI & TEMEL",
    "#0d9488",
    `<g transform="translate(48, 128)">
      <g transform="translate(0, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#0d9488" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#0d9488" />
        <text x="40" y="35" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">01</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Zemin Etüdü</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Sondaj &amp; Loglar</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• SPT N30 Deneyleri</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Yeraltı Suyu (YASS)</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Taşıma Gücü (qa)</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#5eead4" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Geoteknik Rapor</text>
      </g>

      <line x1="180" y1="220" x2="200" y2="220" stroke="#0d9488" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(210, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#f59e0b" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">02</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">İksa &amp; Hafriyat</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Fore Kazık / Ankraj</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kademeli Kazı</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Şev Stabilitesi</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Geçici Drenaj</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Kazı Tabanı Kotu</text>
      </g>

      <line x1="390" y1="220" x2="410" y2="220" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#38bdf8" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">03</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Grobeton</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• C16/20 10 cm</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Tesviye &amp; Şap</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kot Kontrolü</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Temiz Platform</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#7dd3fc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Yalıtım Altlığı</text>
      </g>

      <line x1="600" y1="220" x2="620" y2="220" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(630, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#10b981" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#10b981" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">04</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Su Yalıtımı</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Çift Kat Membran</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Bohçalama Detayı</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Pah &amp; Köşe Takviye</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Koruma Şapı 5 cm</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#6ee7b7" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Sızdırmaz Havuz</text>
      </g>

      <line x1="810" y1="220" x2="830" y2="220" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(840, 40)">
        <rect x="0" y="0" width="260" height="360" rx="14" fill="#042f2e" stroke="#14b8a6" stroke-width="2.5" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#14b8a6" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">05</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="800">Radye Temel &amp; Döküm</text>
        <line x1="16" y1="92" x2="244" y2="92" stroke="#0f766e" stroke-width="1" />
        <text x="16" y="125" fill="#ccfbf1" font-family="sans-serif" font-size="13">• Alt &amp; Üst Donatı Hasırları</text>
        <text x="16" y="155" fill="#ccfbf1" font-family="sans-serif" font-size="13">• Kolon/Perde Filizleri</text>
        <text x="16" y="185" fill="#ccfbf1" font-family="sans-serif" font-size="13">• C30/37 Kütle Betonu</text>
        <text x="16" y="215" fill="#ccfbf1" font-family="sans-serif" font-size="13">• Çatlak &amp; Kürleme Yönetimi</text>
        <rect x="16" y="280" width="228" height="50" rx="8" fill="#134e4a" stroke="#2dd4bf" />
        <text x="130" y="310" fill="#5eead4" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">TEMEL TAMAMLANDI ✓</text>
      </g>
    </g>`
  ),

  "zemin-etudu": svgWrapper(
    "Geoteknik Zemin Etüdü, Sondaj & SPT Logu",
    "ZEMİN ETÜDÜ",
    "#0d9488",
    `<g transform="translate(60, 130)">
      <!-- Left: Stratigraphic Borehole Log -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" />
      
      <g transform="translate(40, 30)">
        <!-- Depth Scale -->
        <line x1="30" y1="20" x2="30" y2="340" stroke="#94a3b8" stroke-width="2" />
        <text x="20" y="25" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">0.0 m</text>
        <text x="20" y="95" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">-2.5 m</text>
        <text x="20" y="175" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">-6.0 m</text>
        <text x="20" y="255" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">-10.0 m</text>
        <text x="20" y="340" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">-15.0 m</text>

        <!-- Soil Strata Boxes -->
        <!-- Layer 1: Fill / Topsoil -->
        <rect x="40" y="20" width="220" height="70" fill="#78350f" stroke="#b45309" stroke-width="1.5" />
        <text x="150" y="55" fill="#fef3c7" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Bitkisel Toprak &amp; Dolgu</text>

        <!-- Layer 2: Silty Clay -->
        <rect x="40" y="90" width="220" height="80" fill="#854d0e" stroke="#ca8a04" stroke-width="1.5" />
        <text x="150" y="130" fill="#fef9c3" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Yüksek Plastisiteli Kil (CH)</text>
        <text x="150" y="150" fill="#fef08a" font-family="sans-serif" font-size="11" text-anchor="middle">Orta Katı - Katı Kıvam</text>

        <!-- Water Table Line -->
        <line x1="30" y1="120" x2="580" y2="120" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="8 4" />
        <polygon points="280,114 290,114 285,124" fill="#38bdf8" />
        <text x="300" y="118" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800">YASS: Yeraltı Su Seviyesi (-3.50 m)</text>

        <!-- Layer 3: Dense Sand/Gravel -->
        <rect x="40" y="170" width="220" height="80" fill="#365314" stroke="#65a30d" stroke-width="1.5" />
        <text x="150" y="210" fill="#d9f99d" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Kumlu Çakıl (GW/GP)</text>
        <text x="150" y="230" fill="#bef264" font-family="sans-serif" font-size="11" text-anchor="middle">Sıkı - Çok Sıkı Tabaka</text>

        <!-- Layer 4: Bedrock / Siltstone -->
        <rect x="40" y="250" width="220" height="90" fill="#1e293b" stroke="#64748b" stroke-width="1.5" />
        <text x="150" y="295" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Ayrışmış Kireçtaşı Kayası</text>
        <text x="150" y="315" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">RQD = %65 • Sağlam Zemin</text>

        <!-- SPT-N30 Curve Plot -->
        <g transform="translate(300, 20)">
          <rect x="0" y="0" width="280" height="320" rx="8" fill="#0f172a" stroke="#334155" />
          <text x="140" y="25" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">SPT N30 DARBE SAYISI</text>
          
          <line x1="40" y1="40" x2="240" y2="40" stroke="#475569" stroke-width="1" />
          <text x="40" y="38" fill="#64748b" font-family="sans-serif" font-size="10">0</text>
          <text x="140" y="38" fill="#64748b" font-family="sans-serif" font-size="10">25</text>
          <text x="240" y="38" fill="#64748b" font-family="sans-serif" font-size="10">50+</text>

          <!-- SPT Line Graph -->
          <polyline points="60,60 100,120 180,200 240,280" fill="none" stroke="#f59e0b" stroke-width="3" />
          <circle cx="60" cy="60" r="4" fill="#f59e0b" />
          <text x="70" y="65" fill="#fcd34d" font-family="sans-serif" font-size="11">N=6</text>

          <circle cx="100" cy="120" r="4" fill="#f59e0b" />
          <text x="110" y="125" fill="#fcd34d" font-family="sans-serif" font-size="11">N=14</text>

          <circle cx="180" cy="200" r="4" fill="#f59e0b" />
          <text x="190" y="205" fill="#fcd34d" font-family="sans-serif" font-size="11">N=32</text>

          <circle cx="240" cy="280" r="4" fill="#f59e0b" />
          <text x="245" y="285" fill="#fcd34d" font-family="sans-serif" font-size="11">N&gt;50 (Refü)</text>
        </g>
      </g>

      <!-- Right Panel: Soil Parameters -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#0d9488" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">TBDY 2018 GEOTEKNİK DEĞERLER</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">Zemin Sınıfı (TBDY 2018)</text>
          <text x="12" y="40" fill="#94a3b8">Ortalama kayma dalgası hızı Vs30 = 380 m/s</text>
          <text x="310" y="32" fill="#0d9488" font-weight="800" text-anchor="end">ZC</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">Zemin Emniyet Gerilmesi (qa)</text>
          <text x="12" y="102" fill="#94a3b8">Karakteristik taşıma gücü qk / Fs</text>
          <text x="310" y="94" fill="#10b981" font-weight="800" text-anchor="end">220 kPa</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">Yatak Katsayısı (ks)</text>
          <text x="12" y="164" fill="#94a3b8">Radye temel elastik zemin yay sabiti</text>
          <text x="310" y="156" fill="#10b981" font-weight="800" text-anchor="end">25.000 kN/m³</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">Sıvılaşma Potansiyeli</text>
          <text x="12" y="226" fill="#94a3b8">Yeraltı suyu ve dane dağılımı analizi</text>
          <text x="310" y="218" fill="#10b981" font-weight="800" text-anchor="end">GÜVENLİ</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#042f2e" stroke="#0d9488" />
          <text x="12" y="270" fill="#ccfbf1" font-weight="800">Saha Doğrulama Zorunluluğu</text>
          <text x="12" y="290" fill="#99f6e4" font-size="11">Kazı tabanına inildiğinde geoteknik mühendisi</text>
          <text x="12" y="308" fill="#99f6e4" font-size="11">tarafından zemin uygunluk tutanağı imzalanmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "hafriyat": svgWrapper(
    "Kademeli Hafriyat, Şev Güvenliği & Drenaj",
    "HAFRİYAT",
    "#f59e0b",
    `<g transform="translate(60, 130)">
      <!-- Left: Excavation Slope Section -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
      
      <!-- Ground Profile with Berms and Slopes -->
      <path d="M 40 80 L 180 80 L 260 180 L 360 180 L 440 320 L 640 320" fill="none" stroke="#f59e0b" stroke-width="4" />
      
      <!-- Soil Hatching below line -->
      <polygon points="40,80 180,80 260,180 360,180 440,320 640,320 640,380 40,380" fill="#78350f" fill-opacity="0.3" />

      <!-- Original Natural Ground Level Line -->
      <line x1="40" y1="80" x2="640" y2="80" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4" />
      <text x="50" y="70" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="700">Tabii Zemin Kotu: ±0.00</text>

      <!-- Berm 1 Callout -->
      <rect x="250" y="160" width="120" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="310" y="180" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">Palye Genişliği (1.5 m)</text>

      <!-- Slope Ratio 1:1 -->
      <text x="210" y="140" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="800">Şev 1:1.25</text>

      <!-- Excavation Bottom Level -->
      <line x1="440" y1="320" x2="640" y2="320" stroke="#10b981" stroke-width="4" />
      <rect x="470" y="330" width="150" height="30" rx="4" fill="#064e3b" stroke="#10b981" />
      <text x="545" y="350" fill="#6ee7b7" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">Kazı Tabanı: -4.80 m</text>

      <!-- Sump Pit & Pump (Geçici Drenaj Çukuru) -->
      <rect x="580" y="320" width="50" height="40" fill="#0369a1" stroke="#38bdf8" stroke-width="2" />
      <text x="605" y="345" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="800" text-anchor="middle">Terfi</text>

      <!-- Water Sump Pump Arrow -->
      <path d="M 605 320 L 605 60 L 640 60" stroke="#38bdf8" stroke-width="3" fill="none" marker-end="url(#arrow)" />
      <text x="590" y="50" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="700">Tahliye Hattı</text>

      <!-- Right Panel: Field Rules -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">HAFRİYAT SAHA KONTROL KRİTERLERİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Aşırı Kazı Yasağı</text>
          <text x="12" y="40" fill="#94a3b8">Temel altı zemin bozulursa gevşek dolgu yapılamaz.</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Şev Güvenlik Mesafesi</text>
          <text x="12" y="102" fill="#94a3b8">Kazı kenarına min. 2.0 m hafriyat kamyonu yanaşamaz.</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. 24 Saat Su Tahliyesi</text>
          <text x="12" y="164" fill="#94a3b8">Tabanda su göllenmesi killi zemini yumuşatır (şişme).</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Lazer Nivo Kot Takibi</text>
          <text x="12" y="226" fill="#94a3b8">Son 20 cm kazı operatörle değil, hassas tesviyeyle.</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#451a03" stroke="#f59e0b" />
          <text x="12" y="270" fill="#fef3c7" font-weight="800">Komşu Parsel Çökme Riski</text>
          <text x="12" y="290" fill="#fed7aa" font-size="11">Yol veya komşu bina sınırında şev açılamıyorsa</text>
          <text x="12" y="308" fill="#fed7aa" font-size="11">derhal iksa (fore kazık / mini kazık) uygulanmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "fore-kazik": svgWrapper(
    "Fore Kazık Kesiti, Donatı Kafesi & Tremi Betonu",
    "FORE KAZIK",
    "#06b6d4",
    `<g transform="translate(60, 130)">
      <!-- Left: Bored Pile Construction Cross Section -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
      
      <g transform="translate(60, 20)">
        <!-- Cap Beam (Başlık Kirişi) -->
        <rect x="40" y="20" width="220" height="50" rx="4" fill="#334155" stroke="#64748b" stroke-width="2" />
        <text x="150" y="50" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">BAŞLIK KİRİŞİ (80x100 cm)</text>

        <!-- Pile Shaft -->
        <rect x="80" y="70" width="140" height="300" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        
        <!-- Steel Rebar Cage Inside Pile -->
        <g stroke="#f59e0b" stroke-width="3">
          <line x1="95" y1="50" x2="95" y2="350" />
          <line x1="205" y1="50" x2="205" y2="350" />
          
          <!-- Spiral / Ties -->
          <line x1="95" y1="100" x2="205" y2="100" stroke-dasharray="4 2" />
          <line x1="95" y1="140" x2="205" y2="140" stroke-dasharray="4 2" />
          <line x1="95" y1="180" x2="205" y2="180" stroke-dasharray="4 2" />
          <line x1="95" y1="220" x2="205" y2="220" stroke-dasharray="4 2" />
          <line x1="95" y1="260" x2="205" y2="260" stroke-dasharray="4 2" />
          <line x1="95" y1="300" x2="205" y2="300" stroke-dasharray="4 2" />
        </g>

        <!-- Tremie Pipe Pouring System -->
        <rect x="135" y="10" width="30" height="320" fill="#ef4444" stroke="#f87171" stroke-width="1.5" fill-opacity="0.8" />
        <polygon points="120,10 180,10 165,30 135,30" fill="#ef4444" />
        <text x="150" y="160" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="900" transform="rotate(-90, 150, 160)" text-anchor="middle">TREMİ BORUSU (Ø250 mm)</text>

        <!-- Concrete Level Rising Arrow -->
        <path d="M 120 330 Q 150 310 180 330" fill="#64748b" stroke="#94a3b8" stroke-width="2" />
        <text x="150" y="355" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">Taze C30/37 Betonu</text>

        <!-- Dimension Callout: Diameter -->
        <line x1="80" y1="380" x2="220" y2="380" stroke="#06b6d4" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <text x="150" y="398" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">Kazık Çapı: Ø80 cm - Ø100 cm</text>
      </g>

      <!-- Right Panel: TS EN 1536 Standards -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#06b6d4" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">TS EN 1536 FORE KAZIK ESASLARI</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Bentonit / Muhafaza Borusu</text>
          <text x="12" y="40" fill="#94a3b8">Gevşek/sulu zeminde kuyu göçmesini önler.</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Tremi Daldırma Derinliği</text>
          <text x="12" y="102" fill="#94a3b8">Boru ucu taze beton içine min. 2.0 m gömülü kalmalı.</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Kazık Başı Kırım (Pus Pası)</text>
          <text x="12" y="164" fill="#94a3b8">Kirlenmiş üst 50-80 cm beton başlık öncesi kırılır.</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Süreklilik (PIT) ve Yük Testi</text>
          <text x="12" y="226" fill="#94a3b8">Sonic logging tüpleri veya sonic yankı deneyi.</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#083344" stroke="#06b6d4" />
          <text x="12" y="270" fill="#cffafe" font-weight="800">Donatı Kafesi Paspayı</text>
          <text x="12" y="290" fill="#a5f3fc" font-size="11">Kazık boyunca dairesel plastik takozlar (min 7.5 cm)</text>
          <text x="12" y="308" fill="#a5f3fc" font-size="11">kullanılarak çeliğin kuyu cidarına sürtünmesi engellenir.</text>
        </g>
      </g>
    </g>`
  ),

  "radye-temel": svgWrapper(
    "Radye Temel Katman Kesiti & Donatı Sehpaları",
    "RADYE TEMEL",
    "#10b981",
    `<g transform="translate(60, 130)">
      <!-- Left: Layered Mat Foundation Cross Section -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" />
      
      <g transform="translate(40, 20)">
        <!-- Column Starter Dowels -->
        <g stroke="#ef4444" stroke-width="4">
          <line x1="280" y1="10" x2="280" y2="180" />
          <line x1="280" y1="180" x2="240" y2="180" />
          <line x1="360" y1="10" x2="360" y2="180" />
          <line x1="360" y1="180" x2="400" y2="180" />
        </g>
        <rect x="260" y="0" width="120" height="40" fill="none" stroke="#f8fafc" stroke-width="2" stroke-dasharray="4 2" />
        <text x="320" y="-8" fill="#f87171" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">Kolon Filizleri (lb Kenetlenme)</text>

        <!-- Main Raft Concrete Plaque (h=80cm) -->
        <rect x="0" y="40" width="600" height="180" fill="#334155" stroke="#64748b" stroke-width="2" />
        <text x="80" y="135" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="800">C30/37 RADYE BETONU (H = 80-120 cm)</text>

        <!-- Top Rebar Mesh -->
        <line x1="20" y1="65" x2="580" y2="65" stroke="#f59e0b" stroke-width="3" />
        <circle cx="100" cy="65" r="4" fill="#f59e0b" />
        <circle cx="200" cy="65" r="4" fill="#f59e0b" />
        <circle cx="300" cy="65" r="4" fill="#f59e0b" />
        <circle cx="400" cy="65" r="4" fill="#f59e0b" />
        <circle cx="500" cy="65" r="4" fill="#f59e0b" />
        <text x="510" y="58" fill="#fcd34d" font-family="sans-serif" font-size="11" font-weight="700">Üst Donatı Hasırı (Ø20/15)</text>

        <!-- Rebar Spacer Chair (Donatı Sehpası) -->
        <path d="M 120 195 L 140 70 L 180 70 L 200 195" fill="none" stroke="#e2e8f0" stroke-width="3" />
        <path d="M 420 195 L 440 70 L 480 70 L 500 195" fill="none" stroke="#e2e8f0" stroke-width="3" />
        <text x="160" y="115" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">SEHPA (Ø16)</text>

        <!-- Bottom Rebar Mesh -->
        <line x1="20" y1="195" x2="580" y2="195" stroke="#f59e0b" stroke-width="3" />
        <circle cx="100" cy="195" r="4" fill="#f59e0b" />
        <circle cx="200" cy="195" r="4" fill="#f59e0b" />
        <circle cx="300" cy="195" r="4" fill="#f59e0b" />
        <circle cx="400" cy="195" r="4" fill="#f59e0b" />
        <circle cx="500" cy="195" r="4" fill="#f59e0b" />
        <text x="510" y="190" fill="#fcd34d" font-family="sans-serif" font-size="11" font-weight="700">Alt Donatı Hasırı (Ø20/15)</text>

        <!-- Paspayı Takozları -->
        <rect x="80" y="210" width="20" height="10" fill="#94a3b8" />
        <rect x="280" y="210" width="20" height="10" fill="#94a3b8" />
        <rect x="480" y="210" width="20" height="10" fill="#94a3b8" />
        <text x="510" y="218" fill="#94a3b8" font-family="sans-serif" font-size="10">Paspayı: 5.0 cm</text>

        <!-- Protection Screed (Koruma Şapı) -->
        <rect x="0" y="220" width="600" height="20" fill="#475569" />
        <text x="20" y="235" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="700">Koruma Şapı (C20 - 5 cm)</text>

        <!-- Waterproofing Membrane Layer (Çift Kat Membran) -->
        <line x1="0" y1="243" x2="600" y2="243" stroke="#10b981" stroke-width="5" />
        <text x="20" y="258" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="800">BOHÇALAMA SU YALITIMI (2 KAT BİTÜMLÜ MEMBRAN)</text>

        <!-- Lean Concrete (Grobeton) -->
        <rect x="0" y="260" width="600" height="40" fill="#1e293b" stroke="#334155" />
        <text x="20" y="285" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="700">C16/20 Grobeton (10 cm)</text>

        <!-- Compacted Gravel / Subgrade -->
        <rect x="0" y="300" width="600" height="50" fill="#78350f" fill-opacity="0.4" />
        <text x="20" y="330" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="700">Sıkıştırılmış Blokaj / Zemin Tabanı (min %95 Proktor)</text>
      </g>

      <!-- Right Panel: Checklist -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">RADYE TEMEL KRİTİK KONTROLLER</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Zımbalama Donatısı</text>
          <text x="12" y="40" fill="#94a3b8">Kolon altlarında kesme donatısı (stud/kapalı etriye)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Donatı Sehpa Sıklığı</text>
          <text x="12" y="102" fill="#94a3b8">m²'ye min. 1.0-1.5 adet rijit sehpa (ezilmeye karşı)</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Kolon &amp; Perde Aplikasyonu</text>
          <text x="12" y="164" fill="#94a3b8">Döküm öncesi aks ipi ve şakül doğrulaması</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Temel Topraklama Ağı</text>
          <text x="12" y="226" fill="#94a3b8">Galvaniz şeridin donatıya klemens ile irtibatı</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#064e3b" stroke="#10b981" />
          <text x="12" y="270" fill="#d1fae5" font-weight="800">Kesintisiz Döküm Planı</text>
          <text x="12" y="290" fill="#a7f3d0" font-size="11">Büyük metrajlı radye betonunda 2 hazır beton santrali</text>
          <text x="12" y="308" fill="#a7f3d0" font-size="11">ve 2 ayrı pompa ile soğuk derzsiz döküm sağlanmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "temel-su-yalitimi": svgWrapper(
    "Temel Bohçalama Su Yalıtımı & Drenaj Sistemi",
    "SU YALITIMI",
    "#06b6d4",
    `<g transform="translate(60, 130)">
      <!-- Left: Full Tanking & Perimeter Drainage Section -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
      
      <g transform="translate(60, 30)">
        <!-- Basement Shear Wall (Bodrum Perdesi) -->
        <rect x="180" y="20" width="100" height="220" fill="#334155" stroke="#64748b" stroke-width="2" />
        <text x="230" y="120" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="800" transform="rotate(-90, 230, 120)" text-anchor="middle">BODRUM PERDESİ</text>

        <!-- Raft Foundation Toe (Radye Temel) -->
        <rect x="40" y="240" width="240" height="90" fill="#334155" stroke="#64748b" stroke-width="2" />
        <text x="160" y="290" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">RADYE TEMEL</text>

        <!-- Chamfer / Fillet (Pah Detayı R=5cm) -->
        <path d="M 280 210 L 310 240 L 280 240 Z" fill="#10b981" />
        <text x="330" y="235" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="800">45° Pah Harcı</text>

        <!-- Continuous Membrane Wrap (Bohçalama) -->
        <path d="M 20 330 L 340 330 L 340 240 L 300 240 L 300 20" fill="none" stroke="#10b981" stroke-width="5" />
        
        <!-- Dimpled Drainage Sheet (Drenaj Levhası) -->
        <line x1="310" y1="20" x2="310" y2="240" stroke="#f59e0b" stroke-width="4" stroke-dasharray="4 2" />
        <text x="320" y="100" fill="#fbbf24" font-family="sans-serif" font-size="11" font-weight="700">Drenaj Levhası (Kabarcıklı)</text>

        <!-- XPS Insulation Layer -->
        <rect x="285" y="20" width="10" height="200" fill="#38bdf8" />
        <text x="290" y="60" fill="#38bdf8" font-family="sans-serif" font-size="9" transform="rotate(-90, 290, 60)" text-anchor="middle">XPS ISI YALITIMI</text>

        <!-- Perforated Drainage Pipe in Gravel Bed -->
        <circle cx="380" cy="300" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 3" />
        <text x="380" y="304" fill="#38bdf8" font-family="sans-serif" font-size="9" font-weight="800" text-anchor="middle">Ø150 DRENAJ</text>
        <text x="380" y="345" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Yıkanmış Çakıl Dolgu</text>
      </g>

      <!-- Right Panel: Rules -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#06b6d4" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">BOHÇALAMA YALITIM İLKELERİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Kesintisiz Bohçalama</text>
          <text x="12" y="40" fill="#94a3b8">Yatay yalıtım dikey perde yalıtımına bindirilir (min 15 cm)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Pah Yapılma Zorunluluğu</text>
          <text x="12" y="102" fill="#94a3b8">90° keskin köşelerde membran kırılmasını önler</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Koruma Şapı / Levhası</text>
          <text x="12" y="164" fill="#94a3b8">Donatı montajında membranın delinmesini engeller</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Çevre Drenajı (Drenflex)</text>
          <text x="12" y="226" fill="#94a3b8">Su basıncını düşürerek hidrostatik yükü sıfırlar</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#083344" stroke="#06b6d4" />
          <text x="12" y="270" fill="#cffafe" font-weight="800">Soğuk Derz Su Tutucu Bant</text>
          <text x="12" y="290" fill="#a5f3fc" font-size="11">Temel-perde birleşiminde şişen bant (bentonit)</text>
          <text x="12" y="308" fill="#a5f3fc" font-size="11">veya PVC su tutucu bant zorunludur.</text>
        </g>
      </g>
    </g>`
  ),

  // Remaining Kazi-Temel subtopics
  "iksa-sistemi": svgWrapper("Derin Kazı İksa Sistemleri Mukayesesi", "İKSA SİSTEMİ", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Fore Kazıklı, Mini Kazıklı &amp; Ankrajlı İksa Analizi</text></g>`),
  "ankrajli-iksa": svgWrapper("Öngermeli Zemin Ankrajı & Göğüsleme Kirişi Detayı", "ANKRAJLI İKSA", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Serbest Boy (Lf), Kök Enjeksiyonu (Lb) &amp; Germe Testi</text></g>`),
  "palplans": svgWrapper("Kilitli Çelik Palplanş Perdesi & Sızdırmazlık Sistemi", "PALPLANŞ", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Larssen Çelik Profil Kilitlenme &amp; Yüksek YASS İksa Çözümü</text></g>`),
  "temel-turleri": svgWrapper("Bina Temel Türleri Karşılaştırma Kesitleri", "TEMEL TÜRLERİ", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Radye, Sürekli (Mütemadi), Tekil &amp; Kazıklı Temel Sistemleri</text></g>`),
  "grobeton": svgWrapper("C16/20 Grobeton Tesviye & Çalışma Platformu", "GROBETON", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Zemin İzolasyon Altlığı, Kot Hassasiyeti &amp; Pürüzsüz Yüzey</text></g>`),
  "temel-donati": svgWrapper("Temel Donatı Ağı, Zımbalama Donatıları & Filizler", "TEMEL DONATISI", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Alt/Üst Donatı Hasırları, Zımbalama Etriyeleri &amp; Sehpa Düzeni</text></g>`),
  "temel-betonlama": svgWrapper("Kütle Betonu Döküm Sırası & Termal Çatlak Kontrolü", "TEMEL BETONLAMA", "#0d9488", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#0d9488" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Pompa Yerleşimi, Soğuk Derz Önleme &amp; Hidratasyon Isısı Yönetimi</text></g>`)
};

let count = 0;
for (const [key, svgContent] of Object.entries(KAZI_SVGS)) {
  const filePath = path.join(targetDir, `${key}.svg`);
  fs.writeFileSync(filePath, svgContent, "utf-8");
  count++;
  console.log(`Generated Kazı-Temel SVG: ${filePath}`);
}
console.log(`Generated ${count} Kazı-Temel SVGs.`);
