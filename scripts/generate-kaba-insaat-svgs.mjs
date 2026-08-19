import fs from "fs";
import path from "path";
import { targetDir, svgWrapper } from "./svg-helpers.mjs";

const KABA_SVGS = {
  "kaba-insaat": svgWrapper(
    "Kaba İnşaat Taşıyıcı Karkas Döngüsü",
    "KABA İNŞAAT",
    "#ef4444",
    `<g transform="translate(48, 128)">
      <g transform="translate(0, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#ef4444" />
        <text x="40" y="35" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">01</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Kalıp İşleri</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kolon &amp; Perde</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kiriş &amp; Döşeme</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Şakül &amp; Aks Kontrolü</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• İskele Taşıyıcılığı</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#fca5a5" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Geometri &amp; Rijitlik</text>
      </g>

      <line x1="180" y1="220" x2="200" y2="220" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(210, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#f59e0b" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">02</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Donatı İşleri</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• B420C Nervürlü Çelik</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Etriye Sıklaştırma</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Paspayı Takozları</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kenetlenme Boyu (lb)</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Süneklik &amp; Dayanım</text>
      </g>

      <line x1="390" y1="220" x2="410" y2="220" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(420, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#38bdf8" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">03</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Beton İşleri</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• C30/37 Hazır Beton</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Slump &amp; Numune Alımı</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• İğne Vibrasyon</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kür &amp; Islatma</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#7dd3fc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Monolitik Gövde</text>
      </g>

      <line x1="600" y1="220" x2="620" y2="220" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(630, 40)">
        <rect x="0" y="0" width="170" height="360" rx="14" fill="#1e293b" stroke="#10b981" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#10b981" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">04</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="700">Duvar Örme</text>
        <line x1="16" y1="92" x2="154" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Tuğla &amp; Gazbeton</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Şaşırtmalı Derz</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kolon Ankraj Demiri</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kapı/Pencere Lentosu</text>
        <rect x="16" y="280" width="138" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="85" y="310" fill="#6ee7b7" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Mekan Sınırları</text>
      </g>

      <line x1="810" y1="220" x2="830" y2="220" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(840, 40)">
        <rect x="0" y="0" width="260" height="360" rx="14" fill="#450a0a" stroke="#f87171" stroke-width="2.5" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#ef4444" />
        <text x="40" y="35" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">05</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="800">Çatı &amp; Karkas Kapanışı</text>
        <line x1="16" y1="92" x2="244" y2="92" stroke="#991b1b" stroke-width="1" />
        <text x="16" y="125" fill="#fecaca" font-family="sans-serif" font-size="13">• Ahşap / Çelik Makaslar</text>
        <text x="16" y="155" fill="#fecaca" font-family="sans-serif" font-size="13">• Teras Su/Isı Katmanları</text>
        <text x="16" y="185" fill="#fecaca" font-family="sans-serif" font-size="13">• Yağmur Drenajı &amp; Parapet</text>
        <text x="16" y="215" fill="#fecaca" font-family="sans-serif" font-size="13">• Taşıyıcı Karkas Teslimi</text>
        <rect x="16" y="280" width="228" height="50" rx="8" fill="#7f1d1d" stroke="#f87171" />
        <text x="130" y="310" fill="#fca5a5" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">KABA YAPI TAMAMLANDI ✓</text>
      </g>
    </g>`
  ),

  "kolon-kalibi": svgWrapper(
    "Kolon Kalıbı Montajı, Kelepçe & Şakül Düzeni",
    "KOLON KALIBI",
    "#ef4444",
    `<g transform="translate(60, 130)">
      <!-- Left: Column Formwork Section & Bracing -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="2" />
      
      <g transform="translate(120, 20)">
        <!-- Concrete Slab Base -->
        <rect x="-40" y="330" width="460" height="40" fill="#334155" stroke="#64748b" stroke-width="2" />
        <text x="180" y="355" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">ALT KAT BETONARME DÖŞEME</text>

        <!-- Column Plywood Panels (40x60 cm) -->
        <rect x="110" y="30" width="140" height="300" fill="#854d0e" stroke="#facc15" stroke-width="2" />
        <text x="180" y="180" fill="#fef08a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">PLYWOOD (18 mm)</text>

        <!-- Steel Column Clamps (Kelepçeler) -->
        <g stroke="#38bdf8" stroke-width="4">
          <line x1="90" y1="70" x2="270" y2="70" />
          <line x1="90" y1="130" x2="270" y2="130" />
          <line x1="90" y1="190" x2="270" y2="190" />
          <line x1="90" y1="240" x2="270" y2="240" />
          <line x1="90" y1="280" x2="270" y2="280" />
          <line x1="90" y1="315" x2="270" y2="315" />
        </g>
        <text x="280" y="285" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="700">Alt Sıklaştırma</text>

        <!-- Push-Pull Struts (İtme-Çekme Payandaları) -->
        <line x1="20" y1="330" x2="110" y2="150" stroke="#f59e0b" stroke-width="4" />
        <line x1="340" y1="330" x2="250" y2="150" stroke="#f59e0b" stroke-width="4" />
        <text x="50" y="240" fill="#fbbf24" font-family="sans-serif" font-size="11" font-weight="700">Payanda</text>

        <!-- Cleanout Pocket at Bottom (Temizlik Cebi) -->
        <rect x="130" y="295" width="40" height="35" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
        <text x="150" y="318" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="800" text-anchor="middle">TEMİZLİK</text>

        <!-- Plumb Line (Şakül İpi) -->
        <line x1="95" y1="20" x2="95" y2="320" stroke="#a855f7" stroke-width="2" stroke-dasharray="6 3" />
        <circle cx="95" cy="320" r="6" fill="#a855f7" />
        <text x="75" y="50" fill="#c084fc" font-family="sans-serif" font-size="11" font-weight="700">Şakül</text>
      </g>

      <!-- Right Panel: Rules -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#ef4444" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">KOLON KALIBI KONTROL LİSTESİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Hidrostatik Basınç Sıklaştırması</text>
          <text x="12" y="40" fill="#94a3b8">Taze beton basıncı tabanda pik yapar; kelepçe aralığı 25-35 cm</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Çift Yönlü Şakül Kontrolü</text>
          <text x="12" y="102" fill="#94a3b8">X ve Y eksenlerinde düşeylik toleransı max ±3 mm / kat</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Etek Kalıbı &amp; Şerbet Sızdırmazlığı</text>
          <text x="12" y="164" fill="#94a3b8">Döşeme birleşimine harç sızdırmaz sünger / çıta çekilmelidir</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Kalıp Ayırıcı Yağ</text>
          <text x="12" y="226" fill="#94a3b8">Plywood yüzeyine ince homojen sürülür; donatıya değdirilmez</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#450a0a" stroke="#ef4444" />
          <text x="12" y="270" fill="#fee2e2" font-weight="800">Döküm Öncesi Dip Temizliği</text>
          <text x="12" y="290" fill="#fca5a5" font-size="11">Temizlik cebinden hava veya su tutularak</text>
          <text x="12" y="308" fill="#fca5a5" font-size="11">kolon dibindeki tel, ahşap ve molozlar tahliye edilmelidir.</text>
        </g>
      </g>
    </g>`
  ),

  "kolon-donati": svgWrapper(
    "TBDY 2018 Kolon Donatı Kafesi & Etriye Sıklaştırması",
    "KOLON DONATISI",
    "#f59e0b",
    `<g transform="translate(60, 130)">
      <!-- Left: Column Rebar Elevation & Cross Section -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
      
      <g transform="translate(40, 20)">
        <!-- Column Rebar Elevation (h=3.0m) -->
        <rect x="20" y="20" width="160" height="340" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4 2" />
        
        <!-- Longitudinal Rebar (Boyuna Donatılar) -->
        <line x1="40" y1="0" x2="40" y2="380" stroke="#38bdf8" stroke-width="5" />
        <line x1="160" y1="0" x2="160" y2="380" stroke="#38bdf8" stroke-width="5" />

        <!-- Top Confinement Zone (Üst Sıklaştırma Bölgesi ln/6) -->
        <rect x="25" y="20" width="150" height="70" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1" />
        <line x1="40" y1="35" x2="160" y2="35" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="50" x2="160" y2="50" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="65" x2="160" y2="65" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="80" x2="160" y2="80" stroke="#f59e0b" stroke-width="3" />
        <text x="185" y="55" fill="#fcd34d" font-family="sans-serif" font-size="11" font-weight="700">Üst Sıklaştırma (s ≤ 8 cm)</text>

        <!-- Middle Zone (Orta Bölge) -->
        <line x1="40" y1="120" x2="160" y2="120" stroke="#94a3b8" stroke-width="2" />
        <line x1="40" y1="160" x2="160" y2="160" stroke="#94a3b8" stroke-width="2" />
        <line x1="40" y1="200" x2="160" y2="200" stroke="#94a3b8" stroke-width="2" />
        <line x1="40" y1="240" x2="160" y2="240" stroke="#94a3b8" stroke-width="2" />
        <text x="185" y="185" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="700">Orta Bölge (s ≤ 15 cm)</text>

        <!-- Bottom Confinement Zone (Alt Sıklaştırma Bölgesi ln/6) -->
        <rect x="25" y="270" width="150" height="90" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1" />
        <line x1="40" y1="285" x2="160" y2="285" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="300" x2="160" y2="300" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="315" x2="160" y2="315" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="330" x2="160" y2="330" stroke="#f59e0b" stroke-width="3" />
        <line x1="40" y1="345" x2="160" y2="345" stroke="#f59e0b" stroke-width="3" />
        <text x="185" y="320" fill="#fcd34d" font-family="sans-serif" font-size="11" font-weight="700">Alt Sıklaştırma (s ≤ 8 cm)</text>

        <!-- Cross Section View (Enkesit 40x60 cm) -->
        <g transform="translate(380, 50)">
          <rect x="0" y="0" width="180" height="240" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2" />
          <text x="90" y="-15" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">KOLON ENKESİTİ (40x60 cm)</text>

          <!-- Outer Stirrup Tie (Kapalı Etriye) -->
          <rect x="15" y="15" width="150" height="210" rx="4" fill="none" stroke="#f59e0b" stroke-width="4" />
          
          <!-- 135 Degree Hook Detail -->
          <line x1="15" y1="30" x2="35" y2="50" stroke="#f59e0b" stroke-width="4" />
          <text x="35" y="70" fill="#fcd34d" font-family="sans-serif" font-size="10" font-weight="800">135° Kanca</text>

          <!-- Longitudinal Bars (8x Ø20) -->
          <circle cx="20" cy="20" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="90" cy="20" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="160" cy="20" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="20" cy="120" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="160" cy="120" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="20" cy="220" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="90" cy="220" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
          <circle cx="160" cy="220" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />

          <!-- Internal Cross-Tie (Çiroz Donatısı) -->
          <line x1="90" y1="20" x2="90" y2="220" stroke="#10b981" stroke-width="3" />
          <path d="M 85 20 A 10 10 0 0 1 95 10" stroke="#10b981" stroke-width="3" fill="none" />
          <text x="90" y="160" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">ÇİROZ</text>
        </g>
      </g>

      <!-- Right Panel: TBDY 2018 Limits -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">TBDY 2018 KOLON DONATI KURALLARI</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">Boyuna Donatı Oranı (ρ)</text>
          <text x="12" y="40" fill="#94a3b8">Min: %1.0 • Max: %4.0 (Bindirmede max %6.0)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">Sıklaştırma Boyu (lcr)</text>
          <text x="12" y="102" fill="#94a3b8">lcr = max [kolon boyutu, ln/6, 500 mm]</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">Etriye Adımı (s)</text>
          <text x="12" y="164" fill="#94a3b8">Sıklaştırmada s ≤ min [b/3, 150 mm, 6Øl]</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">135° Kanca Uzunluğu</text>
          <text x="12" y="226" fill="#94a3b8">Kanca düz boyu min. 10Øe veya 80 mm</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#451a03" stroke="#f59e0b" />
          <text x="12" y="270" fill="#fef3c7" font-weight="800">Mafsal Bölgesinde Bindirme Yasağı</text>
          <text x="12" y="290" fill="#fed7aa" font-size="11">Boyuna donatı ekleri kolon alt/üst uç mafsal bölgelerinde</text>
          <text x="12" y="308" fill="#fed7aa" font-size="11">yapılamaz; orta üçte birlik bölgede şaşırtmalı yapılmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "beton-dokumu": svgWrapper(
    "Beton Döküm Tekniği: Doğru ve Yanlış Uygulama",
    "BETON DÖKÜMÜ",
    "#38bdf8",
    `<g transform="translate(60, 130)">
      <!-- Left: Correct vs Incorrect Casting Methods -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
      
      <!-- Split View: Left Wrong, Right Correct -->
      <g transform="translate(30, 20)">
        <!-- WRONG METHOD -->
        <rect x="0" y="20" width="290" height="340" rx="8" fill="#450a0a" fill-opacity="0.3" stroke="#ef4444" stroke-width="2" />
        <rect x="15" y="30" width="90" height="24" rx="4" fill="#ef4444" />
        <text x="60" y="46" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">HATALI ✗</text>

        <!-- Pump hose high drop -->
        <rect x="120" y="60" width="20" height="40" fill="#64748b" />
        <text x="150" y="80" fill="#fca5a5" font-family="sans-serif" font-size="11" font-weight="700">h &gt; 2.5 m Serbest Düşüş</text>
        
        <!-- Segregation Splash -->
        <path d="M 90 240 Q 130 140 170 240" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 2" />
        <text x="130" y="190" fill="#ef4444" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">AYRIŞMA (Segregasyon)</text>
        
        <!-- Coarse aggregate pile -->
        <ellipse cx="130" cy="270" rx="50" ry="20" fill="#78350f" />
        <text x="130" y="310" fill="#fca5a5" font-family="sans-serif" font-size="11" text-anchor="middle">• İri agrega ayrışır (peteklenme)</text>
        <text x="130" y="330" fill="#fca5a5" font-family="sans-serif" font-size="11" text-anchor="middle">• Donatıya çarpıp harçtan kopar</text>

        <!-- CORRECT METHOD -->
        <rect x="330" y="20" width="290" height="340" rx="8" fill="#064e3b" fill-opacity="0.3" stroke="#10b981" stroke-width="2" />
        <rect x="345" y="30" width="90" height="24" rx="4" fill="#10b981" />
        <text x="390" y="46" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">DOĞRU ✓</text>

        <!-- Pump hose low drop -->
        <rect x="450" y="60" width="20" height="120" fill="#64748b" />
        <text x="480" y="100" fill="#86efac" font-family="sans-serif" font-size="11" font-weight="700">h ≤ 1.5 m Yakın Döküm</text>

        <!-- Layered pour 30-40cm -->
        <rect x="350" y="240" width="250" height="40" fill="#334155" stroke="#10b981" stroke-width="1.5" />
        <text x="475" y="265" fill="#f8fafc" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">Tabaka 2 (30-40 cm)</text>

        <rect x="350" y="280" width="250" height="40" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />
        <text x="475" y="305" fill="#f8fafc" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">Tabaka 1 (30-40 cm)</text>
        
        <text x="475" y="345" fill="#86efac" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">Homojen ve Boşluksuz Yerleşim</text>
      </g>

      <!-- Right Panel: Rules -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">BETON DÖKÜM ŞARTNAMESİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">Döküm Sıcaklığı Sınırları</text>
          <text x="12" y="40" fill="#94a3b8">Min: +5 °C • Max: +32 °C (Taze beton sıcaklığı)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">Su İlavesi Yasağı</text>
          <text x="12" y="102" fill="#94a3b8">Mikser içine su eklemek basınç dayanımını %30 düşürür</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">Tabakalar Arası Süre (Priz)</text>
          <text x="12" y="164" fill="#94a3b8">İki tabaka arası max 60-90 dk (soğuk derz sınırı)</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">Kalıp Islatma</text>
          <text x="12" y="226" fill="#94a3b8">Kalıp ve donatı dökümden önce nemlendirilir</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#082f49" stroke="#38bdf8" />
          <text x="12" y="270" fill="#e0f2fe" font-weight="800">Rüzgarda Plastik Rötre Önlemi</text>
          <text x="12" y="290" fill="#bae6fd" font-size="11">Rüzgarlı ve sıcak havalarda mastar sonrası</text>
          <text x="12" y="308" fill="#bae6fd" font-size="11">buharlaşmayı kesmek için sıvı kür derhal uygulanır.</text>
        </g>
      </g>
    </g>`
  ),

  "vibrasyon": svgWrapper(
    "Daldırma İğne Vibratör Tekniği & Etki Yarıçapı",
    "VİBRASYON",
    "#10b981",
    `<g transform="translate(60, 130)">
      <!-- Left: Vibrator Action Diagram -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" />
      
      <g transform="translate(60, 30)">
        <!-- Concrete Mass -->
        <rect x="40" y="40" width="480" height="280" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="2" />

        <!-- Vibrator 1 (Active) -->
        <line x1="140" y1="0" x2="140" y2="240" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />
        <circle cx="140" cy="240" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2" />

        <!-- Compaction Radius Waves -->
        <circle cx="140" cy="240" r="60" fill="#10b981" fill-opacity="0.25" stroke="#10b981" stroke-width="2" stroke-dasharray="4 2" />
        <circle cx="140" cy="240" r="90" fill="#10b981" fill-opacity="0.1" stroke="#10b981" stroke-width="1.5" stroke-dasharray="6 3" />
        <text x="140" y="165" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">Etki Alanı (R ≈ 30-40 cm)</text>

        <!-- Vibrator 2 (Overlapping Zone) -->
        <line x1="280" y1="0" x2="280" y2="240" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />
        <circle cx="280" cy="240" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
        <circle cx="280" cy="240" r="60" fill="#10b981" fill-opacity="0.25" stroke="#10b981" stroke-width="2" stroke-dasharray="4 2" />
        <circle cx="280" cy="240" r="90" fill="#10b981" fill-opacity="0.1" stroke="#10b981" stroke-width="1.5" stroke-dasharray="6 3" />

        <!-- Overlap Distance Arrow -->
        <line x1="140" y1="20" x2="280" y2="20" stroke="#38bdf8" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <text x="210" y="12" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">Daldırma Aralığı: 1.5 x R (40-50 cm)</text>

        <!-- Penetration into previous layer -->
        <line x1="40" y1="200" x2="520" y2="200" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 2" />
        <text x="440" y="190" fill="#94a3b8" font-family="sans-serif" font-size="11">Alt Tabakaya 10 cm Giriş</text>
        <text x="440" y="270" fill="#94a3b8" font-family="sans-serif" font-size="11">Bekleme: 10-15 saniye</text>
      </g>

      <!-- Right Panel: Rules -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">VİBRASYON UYGULAMA İLKELERİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Dikey Daldırma &amp; Çekme</text>
          <text x="12" y="40" fill="#94a3b8">Hızlı batırılır, boşluk bırakmadan yavaşça çekilir (3-5 cm/sn)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Yatay Sürükleme Yasağı</text>
          <text x="12" y="102" fill="#94a3b8">Vibratör ucu betonu taşımak/yaymak için kullanılamaz</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Donatı ve Kalıba Değmeme</text>
          <text x="12" y="164" fill="#94a3b8">Donatıya temas aderansı bozar, kalıba temas yüzeyi açar</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Aşırı Vibrasyon Tehlikesi</text>
          <text x="12" y="226" fill="#94a3b8">20 sn üzeri vibrasyon agrega çökmesi ve su kusması yapar</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#064e3b" stroke="#10b981" />
          <text x="12" y="270" fill="#d1fae5" font-weight="800">Yeterli Vibrasyonun Belirtisi</text>
          <text x="12" y="290" fill="#a7f3d0" font-size="11">Beton yüzeyinin parlaklaşması ve büyük hava kabarcıklarının</text>
          <text x="12" y="308" fill="#a7f3d0" font-size="11">çıkışının durması işlemin tamamlandığını gösterir.</text>
        </g>
      </g>
    </g>`
  ),

  // Remaining Kaba-Insaat subtopics
  "kalip-isleri": svgWrapper("Kalıp ve İskele Sistemi Genel Kesiti", "KALIP İŞLERİ", "#ef4444", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Plywood, H20 Kirişler, Çelik Kuşak, Teleskopik Dikmeler &amp; Tie-Rod</text></g>`),
  "kiris-kalibi": svgWrapper("Kiriş Kalıbı, Yan Kanatlar & Ters Sehim Desteği", "KİRİŞ KALIBI", "#ef4444", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Kiriş Tabanı, Yan Kanat Kuşakları, Çiroz &amp; İskele Yük Aktarımı</text></g>`),
  "doseme-kalibi": svgWrapper("Döşeme Masa Kalıp & Kule İskele Düzeni", "DÖŞEME KALIBI", "#ef4444", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">H20 Ahşap Izgara, Plywood Kaplama &amp; Kenar Güvenlik Korkuluğu</text></g>`),
  "kalip-sokumu": svgWrapper("TS 500 Kalıp Söküm ve Aktarma Dikmesi Sırası", "KALIP SÖKÜMÜ", "#ef4444", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Sıcaklık/Dayanım Eğrileri, Kolon (3 Gün), Döşeme (7-14 Gün), Kiriş (21-28 Gün)</text></g>`),
  "donati-isleri": svgWrapper("Nervürlü Donatı B420C/B500C İşleme & Montaj", "DONATI İŞLERİ", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Bükme Çapları (db), Bindirme Boyları (l0 = 1.5 lb) &amp; Paspayı Takozları</text></g>`),
  "kiris-donati": svgWrapper("Kiriş Donatısı & Kolon-Kiriş Birleşim Düğümü", "KİRİŞ DONATISI", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Çekme/Basınç Çelikleri, Gövde Donatısı &amp; Kolon Düğüm Kenetlenmesi</text></g>`),
  "doseme-donati": svgWrapper("Döşeme Donatısı: Çift Hasır & Mesnet İlaveleri", "DÖŞEME DONATISI", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Tek ve Çift Doğrultulu Plaklar, Pilye/Hasır &amp; Şaft Boşluğu Donatıları</text></g>`),
  "pas-payi": svgWrapper("TS EN 1992 Paspayı Takozları & Örtü Kalınlığı", "PAS PAYI", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">XC, XD, XS Çevresel Etki Sınıfları, Plastik Kilitler &amp; Beton Takozlar</text></g>`),
  "beton-isleri": svgWrapper("Taze Beton Lojistiği, Santral & Pompa Kabulü", "BETON İŞLERİ", "#38bdf8", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Transmikser Dönme Süresi, İrsaliye Kontrolü &amp; Saha Kabul Testleri</text></g>`),
  "beton-sinifi": svgWrapper("Beton Sınıfları (C25/30 - C50/60) & Dayanım Eğrisi", "BETON SINIFI", "#38bdf8", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">fck Karakteristik Basınç Dayanımı, Su/Çimento Oranı &amp; Çevresel Dayanıklılık</text></g>`),
  "kur-islemi": svgWrapper("Beton Kür Yöntemleri & Hidratasyon Sıcaklık Kontrolü", "KÜR İŞLEMİ", "#38bdf8", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Islak Çuval / Jeotekstil, Kimyasal Kür Membranı &amp; 7 Günlük Sulama</text></g>`),
  "beton-testi": svgWrapper("Şantiye Beton Deneyleri: Slump, Küp Numune & Pres Kırımı", "BETON TESTLERİ", "#38bdf8", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Abrams Hunisi, 150x150 mm Küp Alımı, 20°C Kür Havuzu &amp; 7/28 Gün Dayanım</text></g>`),
  "duvar-orme": svgWrapper("Dolgu Duvar İmalatı, Şakül & Taşıyıcı Bağlantısı", "DUVAR ÖRME", "#10b981", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Mastar, Şakül İpi, Kolon-Duvar Lamba/L-Demir Bağlantısı &amp; Lento</text></g>`),
  "tugla-duvar": svgWrapper("Yatay Delikli Tuğla Duvar Örümü & Şaşırtmalı Derz", "TUĞLA DUVAR", "#10b981", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">10-15 mm Harç Yatağı, Yarım Tuğla Şaşırtma &amp; Tavan Esnek Dolgusu</text></g>`),
  "ytong-gazbeton": svgWrapper("Gazbeton (AAC) Duvar & İnce Harç Montajı", "YTONG / GAZBETON", "#10b981", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">İnce Harç Tarağı (2-3 mm), Kauçuk Tokmak, L-Ankraj &amp; U-Blok Lento</text></g>`),
  "briket": svgWrapper("Bims ve Briket Blok Duvar İmalatı", "BRİKET / BİMS", "#10b981", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Geçmeli Kilit Düzeni, Ses/Isı İzolasyonu &amp; Tesisat Kanalı Kuralları</text></g>`),
  "cati-iskeleti": svgWrapper("Çatı Karkas Taşıyıcı Geometrisi & Elemanları", "ÇATI İSKELETİ", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Beşik/Kırma Çatı, Makas, Aşık, Mertek, Mahya &amp; Rüzgar Çaprazları</text></g>`),
  "ahsap-cati": svgWrapper("Ahşap Çatı Karkası & Birleşim Plakası Detayları", "AHŞAP ÇATI", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Emprenyeli Çam Kereste, Çivili Metal Levhalar, Mertek Aralığı &amp; Buhar Örtüsü</text></g>`),
  "celik-cati": svgWrapper("Çelik Çatı Makası, Aşıklar & Flanş Ankrajı", "ÇELİK ÇATI", "#f59e0b", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Kafes Kiriş Makas, C/Z Aşıklar, Gergi Çubukları &amp; Taban Plakası Ankrajları</text></g>`),
  "teras-cati": svgWrapper("Teras Çatı Katman Kesiti & Çift Kat Yalıtım", "TERAS ÇATI", "#06b6d4", `<g transform="translate(60, 130)"><rect x="0" y="0" width="1080" height="420" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="2" /><text x="540" y="210" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="700" text-anchor="middle">Betonarme Döşeme, %2 Eğim Betonu, Buhar Kesici, XPS, 2 Kat Membran &amp; Drenaj</text></g>`)
};

let count = 0;
for (const [key, svgContent] of Object.entries(KABA_SVGS)) {
  const filePath = path.join(targetDir, `${key}.svg`);
  fs.writeFileSync(filePath, svgContent, "utf-8");
  count++;
  console.log(`Generated Kaba-İnşaat SVG: ${filePath}`);
}
console.log(`Generated ${count} Kaba-İnşaat SVGs.`);
