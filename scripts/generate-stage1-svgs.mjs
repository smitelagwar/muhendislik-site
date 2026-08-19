import fs from "fs";
import path from "path";

const targetDir = path.resolve(process.cwd(), "public/bina-asamalari/topics");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function svgWrapper(title, category, categoryColor, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#f87171" />
    </linearGradient>
    <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" stroke-opacity="0.3" />
      <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#334155" stroke-width="1.5" stroke-opacity="0.5" />
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />
  <rect width="1200" height="675" fill="url(#blueprintGrid)" />

  <!-- Outer Tech Border Frame -->
  <rect x="24" y="24" width="1152" height="627" rx="16" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.6" />
  
  <!-- Header Bar -->
  <g transform="translate(48, 44)">
    <rect x="0" y="0" width="1104" height="64" rx="12" fill="url(#panelGrad)" stroke="#334155" stroke-width="1.2" />
    <!-- Category Badge -->
    <rect x="16" y="14" width="140" height="36" rx="8" fill="${categoryColor}" fill-opacity="0.18" stroke="${categoryColor}" stroke-width="1.5" />
    <text x="86" y="37" fill="${categoryColor}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.2">${category}</text>
    
    <!-- Title -->
    <text x="176" y="40" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800">${title}</text>
    
    <!-- Standard/Status Badge -->
    <rect x="940" y="14" width="148" height="36" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
    <circle cx="958" cy="32" r="4" fill="#10b981" />
    <text x="1018" y="37" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle">TEKNİK ŞARTNAME</text>
  </g>

  <!-- Main Content Drawing Area -->
  ${content}

  <!-- Footer Info Bar -->
  <g transform="translate(48, 605)">
    <line x1="0" y1="0" x2="1104" y2="0" stroke="#334155" stroke-width="1" opacity="0.6" />
    <text x="0" y="24" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">BİNA AŞAMALARI TEKNİK REHBERİ • MÜHENDİSLİK &amp; MİMARLIK PORTALI</text>
    <text x="1104" y="24" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="end">ÖLÇEK: ŞANTİYE UYGULAMA DETAYI</text>
  </g>
</svg>`;
}

const SVGS = {
  // 1. PROJE & İZİNLER
  "proje-hazirlik": svgWrapper(
    "Proje & İzinler Ana Koordinasyon Akışı",
    "PROJE FAZI",
    "#6366f1",
    `<g transform="translate(48, 128)">
      <!-- Step Boxes -->
      <g transform="translate(0, 40)">
        <rect x="0" y="0" width="190" height="360" rx="14" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#6366f1" />
        <text x="40" y="35" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">01</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700">İmar &amp; Harita</text>
        <line x1="16" y1="92" x2="174" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• İmar Çapı Belgesi</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Aplikasyon Krokisi</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Plankote Haritası</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kot-Kesit Belgesi</text>
        <rect x="16" y="280" width="158" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="95" y="310" fill="#a5b4fc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">TAKS/KAKS Tespiti</text>
      </g>

      <path d="M 200 220 L 220 220" stroke="#6366f1" stroke-width="3" stroke-linecap="round" marker-end="url(#arrow)" />

      <g transform="translate(230, 40)">
        <rect x="0" y="0" width="190" height="360" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#38bdf8" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">02</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700">Mimari Tasarım</text>
        <line x1="16" y1="92" x2="174" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kat Planları 1/50</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kesit ve Görünüş</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Mahal Listesi</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Yangın Tahliye Planı</text>
        <rect x="16" y="280" width="158" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="95" y="310" fill="#7dd3fc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Mekan &amp; Hacim Seti</text>
      </g>

      <path d="M 430 220 L 450 220" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(460, 40)">
        <rect x="0" y="0" width="190" height="360" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#f59e0b" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">03</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700">Statik &amp; Geoteknik</text>
        <line x1="16" y1="92" x2="174" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Zemin Etüd Raporu</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• TBDY 2018 Analizi</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kalıp &amp; Donatı Paftası</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• İksa Projelendirme</text>
        <rect x="16" y="280" width="158" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="95" y="310" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Taşıyıcı Güvenlik</text>
      </g>

      <path d="M 660 220 L 680 220" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(690, 40)">
        <rect x="0" y="0" width="190" height="360" rx="14" fill="#1e293b" stroke="#10b981" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#10b981" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">04</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700">Mekanik &amp; Elektrik</text>
        <line x1="16" y1="92" x2="174" y2="92" stroke="#334155" stroke-width="1" />
        <text x="16" y="125" fill="#94a3b8" font-family="sans-serif" font-size="13">• Sıhhi &amp; Yangın Hatları</text>
        <text x="16" y="155" fill="#94a3b8" font-family="sans-serif" font-size="13">• Isıtma / Soğutma (HVAC)</text>
        <text x="16" y="185" fill="#94a3b8" font-family="sans-serif" font-size="13">• Kuvvetli/Zayıf Akım</text>
        <text x="16" y="215" fill="#94a3b8" font-family="sans-serif" font-size="13">• Şaft &amp; Asma Tavan BIM</text>
        <rect x="16" y="280" width="158" height="50" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="95" y="310" fill="#6ee7b7" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">Çakışmasız MEP</text>
      </g>

      <path d="M 890 220 L 910 220" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

      <g transform="translate(920, 40)">
        <rect x="0" y="0" width="184" height="360" rx="14" fill="#312e81" stroke="#818cf8" stroke-width="2" />
        <rect x="16" y="16" width="48" height="28" rx="6" fill="#818cf8" />
        <text x="40" y="35" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">05</text>
        <text x="16" y="76" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="700">Ruhsat &amp; Saha</text>
        <line x1="16" y1="92" x2="168" y2="92" stroke="#4338ca" stroke-width="1" />
        <text x="16" y="125" fill="#c7d2fe" font-family="sans-serif" font-size="13">• Yapı Denetim Onayı</text>
        <text x="16" y="155" fill="#c7d2fe" font-family="sans-serif" font-size="13">• Belediye İncelemesi</text>
        <text x="16" y="185" fill="#c7d2fe" font-family="sans-serif" font-size="13">• İtfaiye / Sığınak Vizesi</text>
        <text x="16" y="215" fill="#c7d2fe" font-family="sans-serif" font-size="13">• Şantiye Şefi Ataması</text>
        <rect x="16" y="280" width="152" height="50" rx="8" fill="#1e1b4b" stroke="#6366f1" />
        <text x="92" y="310" fill="#a5b4fc" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">YAPI RUHSATI ✓</text>
      </g>
    </g>`
  ),

  "mimari-proje": svgWrapper(
    "Mimari Proje & Mahal Organizasyonu Paftası",
    "MİMARİ PROJE",
    "#6366f1",
    `<g transform="translate(60, 130)">
      <!-- Blueprint Plan Drawing Box -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="2" />
      
      <!-- Axis Lines Grid -->
      <g stroke="#3b82f6" stroke-width="1" stroke-dasharray="6 4" opacity="0.4">
        <line x1="80" y1="40" x2="80" y2="380" />
        <line x1="260" y1="40" x2="260" y2="380" />
        <line x1="440" y1="40" x2="440" y2="380" />
        <line x1="600" y1="40" x2="600" y2="380" />
        <line x1="40" y1="80" x2="640" y2="80" />
        <line x1="40" y1="220" x2="640" y2="220" />
        <line x1="40" y1="340" x2="640" y2="340" />
      </g>

      <!-- Axis Bubbles -->
      <circle cx="80" cy="24" r="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="80" y="29" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">A</text>
      <circle cx="260" cy="24" r="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="260" y="29" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">B</text>
      <circle cx="440" cy="24" r="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="440" y="29" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">C</text>
      <circle cx="600" cy="24" r="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="600" y="29" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">D</text>

      <!-- Outer Walls -->
      <rect x="80" y="80" width="520" height="260" fill="none" stroke="#f8fafc" stroke-width="4" />
      <rect x="84" y="84" width="512" height="252" fill="none" stroke="#64748b" stroke-width="1.5" />

      <!-- Columns at Axis Crossings -->
      <rect x="70" y="70" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="250" y="70" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="430" y="70" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="590" y="70" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="70" y="210" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="250" y="210" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="430" y="210" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="590" y="210" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="70" y="330" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="250" y="330" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="430" y="330" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <rect x="590" y="330" width="20" height="20" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />

      <!-- Interior Partitions -->
      <line x1="260" y1="84" x2="260" y2="210" stroke="#94a3b8" stroke-width="3" />
      <line x1="84" y1="220" x2="250" y2="220" stroke="#94a3b8" stroke-width="3" />
      <line x1="440" y1="84" x2="440" y2="336" stroke="#94a3b8" stroke-width="3" />

      <!-- Rooms Labels & Dimensions -->
      <g fill="#38bdf8" font-family="sans-serif" font-weight="700">
        <text x="170" y="145" font-size="14" text-anchor="middle">SALON</text>
        <text x="170" y="165" font-size="11" fill="#94a3b8" text-anchor="middle">A: 28.50 m² • Parke</text>

        <text x="170" y="275" font-size="14" text-anchor="middle">MUTFAK</text>
        <text x="170" y="295" font-size="11" fill="#94a3b8" text-anchor="middle">A: 14.20 m² • Seramik</text>

        <text x="350" y="145" font-size="14" text-anchor="middle">YATAK ODASI</text>
        <text x="350" y="165" font-size="11" fill="#94a3b8" text-anchor="middle">A: 18.40 m² • Parke</text>

        <text x="350" y="275" font-size="14" text-anchor="middle">BANYO / WC</text>
        <text x="350" y="295" font-size="11" fill="#94a3b8" text-anchor="middle">A: 6.80 m² • Seramik</text>

        <text x="520" y="210" font-size="14" text-anchor="middle">BALKON / TERAS</text>
        <text x="520" y="230" font-size="11" fill="#94a3b8" text-anchor="middle">A: 12.00 m²</text>
      </g>

      <!-- Door Swing Arcs -->
      <path d="M 230 220 A 30 30 0 0 1 260 190" stroke="#38bdf8" stroke-width="1.5" fill="none" />
      <line x1="230" y1="220" x2="260" y2="220" stroke="#38bdf8" stroke-width="2" />

      <!-- Section Line A-A -->
      <line x1="40" y1="180" x2="640" y2="180" stroke="#ef4444" stroke-width="2" stroke-dasharray="12 4" />
      <polygon points="40,174 40,186 28,180" fill="#ef4444" />
      <text x="24" y="184" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="900">A</text>
      <polygon points="640,174 640,186 652,180" fill="#ef4444" />
      <text x="660" y="184" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="900">A</text>

      <!-- Right Side Specification Panel -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">MİMARİ KONTROL MATRİSİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="13">
          <rect x="0" y="0" width="330" height="48" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="14" y="20" fill="#f8fafc" font-weight="700">Net / Brüt Alan Hesabı</text>
          <text x="14" y="38" fill="#94a3b8" font-size="11">TAKS: 0.35 • KAKS: 1.75 Uygunluğu</text>
          <text x="310" y="30" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="58" width="330" height="48" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="14" y="78" fill="#f8fafc" font-weight="700">Yangın Kaçış Genişliği</text>
          <text x="14" y="96" fill="#94a3b8" font-size="11">Koridor min. 1.20 m • Merdiven 1.20 m</text>
          <text x="310" y="88" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="116" width="330" height="48" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="14" y="136" fill="#f8fafc" font-weight="700">Islak Hacim Şaftları</text>
          <text x="14" y="154" fill="#94a3b8" font-size="11">Mekanik rezervasyon çakışma analizi</text>
          <text x="310" y="146" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="174" width="330" height="48" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="14" y="194" fill="#f8fafc" font-weight="700">Tavan Yükseklikleri</text>
          <text x="14" y="212" fill="#94a3b8" font-size="11">Net kat yüksekliği h = 2.80 m</text>
          <text x="310" y="204" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="232" width="330" height="85" rx="6" fill="#312e81" stroke="#6366f1" />
          <text x="14" y="254" fill="#ffffff" font-weight="800">Şantiye Koordinasyon Kuralı</text>
          <text x="14" y="274" fill="#c7d2fe" font-size="11">Duvar örümü öncesinde statik akslarla</text>
          <text x="14" y="292" fill="#c7d2fe" font-size="11">kapı-pencere boşlukları sahada çakıştırılmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "statik-proje": svgWrapper(
    "Statik Proje, Taşıyıcı Sistem & Yük Aktarımı",
    "STATİK PROJE",
    "#f59e0b",
    `<g transform="translate(60, 130)">
      <!-- Left: 3D Frame & Load Diagram -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
      
      <!-- Frame Structure -->
      <g transform="translate(80, 50)">
        <!-- Slab Mesh -->
        <polygon points="120,40 460,40 380,140 40,140" fill="#1e293b" stroke="#38bdf8" stroke-width="2" fill-opacity="0.8" />
        <polygon points="120,180 460,180 380,280 40,280" fill="#1e293b" stroke="#38bdf8" stroke-width="2" fill-opacity="0.8" />

        <!-- Vertical Columns -->
        <g stroke="#f59e0b" stroke-width="4">
          <line x1="120" y1="40" x2="120" y2="340" />
          <line x1="460" y1="40" x2="460" y2="340" />
          <line x1="40" y1="140" x2="40" y2="340" />
          <line x1="380" y1="140" x2="380" y2="340" />
        </g>

        <!-- Foundation Footings -->
        <rect x="105" y="330" width="30" height="15" fill="#64748b" stroke="#f8fafc" stroke-width="1" />
        <rect x="445" y="330" width="30" height="15" fill="#64748b" stroke="#f8fafc" stroke-width="1" />
        <rect x="25" y="330" width="30" height="15" fill="#64748b" stroke="#f8fafc" stroke-width="1" />
        <rect x="365" y="330" width="30" height="15" fill="#64748b" stroke="#f8fafc" stroke-width="1" />

        <!-- Load Vectors (Arrows) -->
        <g fill="#ef4444" stroke="#ef4444" stroke-width="2">
          <!-- Gravity Load G+Q -->
          <line x1="250" y1="10" x2="250" y2="36" marker-end="url(#arrow)" />
          <polygon points="250,38 245,28 255,28" />
          <text x="260" y="24" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="800">Düşey Yük (G + Q)</text>

          <!-- Seismic Force E -->
          <line x1="-30" y1="90" x2="30" y2="90" />
          <polygon points="36,90 24,85 24,95" />
          <text x="-25" y="80" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="800">Deprem Yükü (E)</text>
        </g>

        <!-- Moment Diagram Overlay on Beam -->
        <path d="M 40 140 Q 210 180 380 140" fill="none" stroke="#a855f7" stroke-width="3" stroke-dasharray="4 2" />
        <text x="210" y="165" fill="#c084fc" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">M(+) Açıklık Momenti</text>
        <text x="80" y="125" fill="#c084fc" font-family="sans-serif" font-size="11" font-weight="700">M(-) Mesnet</text>
        <text x="340" y="125" fill="#c084fc" font-family="sans-serif" font-size="11" font-weight="700">M(-) Mesnet</text>
      </g>

      <!-- Right Panel: Design Rules & Standards -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#f59e0b" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">STATİK HESAP PARAMETRELERİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">TBDY 2018 Deprem Tasarımı</text>
          <text x="12" y="40" fill="#94a3b8">Bina Önem Katsayısı I = 1.0 • DTS = 1</text>
          <text x="310" y="32" fill="#f59e0b" font-weight="800" text-anchor="end">R = 8</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">Beton ve Donatı Sınıfı</text>
          <text x="12" y="102" fill="#94a3b8">Beton: C30/37 • Çelik: B420C Nervürlü</text>
          <text x="310" y="94" fill="#10b981" font-weight="800" text-anchor="end">TS 500</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">Düzensizlik Kontrolleri</text>
          <text x="12" y="164" fill="#94a3b8">A1 Burulma (ηbi &lt; 1.2) • B2 Yumuşak Kat</text>
          <text x="310" y="156" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">Sehim ve Çatlak Sınırları</text>
          <text x="12" y="226" fill="#94a3b8">Konsol L/250 • Kiriş L/500 • wk ≤ 0.3mm</text>
          <text x="310" y="218" fill="#10b981" font-weight="800" text-anchor="end">✓ OK</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#451a03" stroke="#f59e0b" />
          <text x="12" y="270" fill="#fef3c7" font-weight="800">Saha Donatı Teslim İlkesi</text>
          <text x="12" y="290" fill="#fed7aa" font-size="11">Kolon düşey donatı bindirme boyu (l0)</text>
          <text x="12" y="308" fill="#fed7aa" font-size="11">orta bölgede yapılmalı; mafsal bölgesinde yapılamaz.</text>
        </g>
      </g>
    </g>`
  ),

  "tesisat-projesi": svgWrapper(
    "Mekanik Tesisat, Şaft & Asma Tavan Koordinasyonu",
    "MEKANİK TESİSAT",
    "#06b6d4",
    `<g transform="translate(60, 130)">
      <!-- Left: Cross Section of MEP Plenum -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
      
      <!-- Concrete Slab Top & Bottom -->
      <rect x="40" y="30" width="600" height="40" fill="#334155" stroke="#64748b" stroke-width="1.5" />
      <text x="340" y="55" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle">ÜST KAT BETONARME DÖŞEME (KOD: +3.20)</text>

      <line x1="40" y1="260" x2="640" y2="260" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4" />
      <text x="630" y="250" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">ASMA TAVAN ÇİZGİSİ (KOD: +2.60)</text>

      <rect x="40" y="350" width="600" height="40" fill="#334155" stroke="#64748b" stroke-width="1.5" />
      <text x="340" y="375" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle">ALT KAT DÖŞEME / TEMİZ DÖŞEME (KOD: ±0.00)</text>

      <!-- MEP Services inside False Ceiling Plenum (h=60cm) -->
      <!-- HVAC Duct -->
      <rect x="80" y="90" width="160" height="80" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="2" fill-opacity="0.85" />
      <line x1="80" y1="90" x2="240" y2="170" stroke="#38bdf8" stroke-width="1" />
      <line x1="80" y1="170" x2="240" y2="90" stroke="#38bdf8" stroke-width="1" />
      <text x="160" y="135" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">HVAC HAVA KANALI</text>

      <!-- Fire Sprinkler Line (Red Pipe) -->
      <line x1="60" y1="190" x2="620" y2="190" stroke="#ef4444" stroke-width="8" stroke-linecap="round" />
      <circle cx="280" cy="190" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
      <circle cx="480" cy="190" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
      <text x="280" y="225" fill="#f87171" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">Sprinkler Başlığı</text>

      <!-- Cable Tray (Orange) -->
      <rect x="280" y="100" width="140" height="30" rx="4" fill="#d97706" stroke="#fbbf24" stroke-width="2" />
      <text x="350" y="120" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">KABLO TAVASI</text>

      <!-- Drainage Gravity Pipe with Slope -->
      <line x1="460" y1="95" x2="620" y2="125" stroke="#10b981" stroke-width="10" stroke-linecap="round" />
      <text x="540" y="90" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="800">PİS SU (%1.5 EĞİM)</text>

      <!-- Hangers / Rods -->
      <line x1="160" y1="70" x2="160" y2="90" stroke="#cbd5e1" stroke-width="3" />
      <line x1="350" y1="70" x2="350" y2="100" stroke="#cbd5e1" stroke-width="3" />

      <!-- Right Panel: Coordination Checklist -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#06b6d4" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">MEP KOORDİNASYON İLKELERİ</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Eğilimli Hatlar Önceliği</text>
          <text x="12" y="40" fill="#94a3b8">Pis su ve yağmur hatları yön değiştiremez.</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Büyük Kesitli Kanallar</text>
          <text x="12" y="102" fill="#94a3b8">Hava kanalları döşeme altına en yakın asılır.</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Yangın ve Basınçlı Hatlar</text>
          <text x="12" y="164" fill="#94a3b8">Sprinkler ve temiz su kolay by-pass yapabilir.</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Kablo Tavaları Ayrımı</text>
          <text x="12" y="226" fill="#94a3b8">Boru hatlarının üstünde veya izole güzergahta.</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#083344" stroke="#06b6d4" />
          <text x="12" y="270" fill="#cffafe" font-weight="800">Kiriş Delme Yasağı (TS 500)</text>
          <text x="12" y="290" fill="#a5f3fc" font-size="11">Taşıyıcı kiriş gövdesinden habersiz boru geçişi</text>
          <text x="12" y="308" fill="#a5f3fc" font-size="11">kesinlikle yasaktır; rezervasyon projede çözülür.</text>
        </g>
      </g>
    </g>`
  ),

  "elektrik-projesi": svgWrapper(
    "Elektrik Projesi, Tek Hat & Dağıtım Şeması",
    "ELEKTRİK PROJESİ",
    "#eab308",
    `<g transform="translate(60, 130)">
      <!-- Left: Electrical Single Line Diagram -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#eab308" stroke-width="2" />
      
      <!-- Power Source & Transformer -->
      <g transform="translate(40, 40)">
        <rect x="0" y="0" width="130" height="60" rx="8" fill="#1e293b" stroke="#eab308" stroke-width="1.5" />
        <text x="65" y="25" fill="#fef08a" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">ŞEBEKE (OG/AG)</text>
        <text x="65" y="45" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">34.5 kV / 400 V</text>

        <rect x="170" y="0" width="130" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
        <text x="235" y="25" fill="#fed7aa" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">JENERATÖR</text>
        <text x="235" y="45" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Otomatik Transfer (ATS)</text>

        <!-- Main Switchboard ADP -->
        <path d="M 65 60 L 65 100 L 150 100 L 150 130" stroke="#eab308" stroke-width="3" fill="none" />
        <path d="M 235 60 L 235 100 L 150 100" stroke="#f59e0b" stroke-width="3" fill="none" />

        <rect x="50" y="130" width="500" height="70" rx="8" fill="#365314" stroke="#84cc16" stroke-width="2" />
        <text x="300" y="158" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="800" text-anchor="middle">ANA DAĞITIM PANOSU (ADP) - 630 A</text>
        <text x="300" y="182" fill="#d9f99d" font-family="sans-serif" font-size="12" text-anchor="middle">Kompansasyon Panosu • Kaçak Akım Koruma (300 mA)</text>

        <!-- Sub Distribution Panels -->
        <!-- Panel 1: Lighting -->
        <line x1="100" y1="200" x2="100" y2="250" stroke="#84cc16" stroke-width="3" />
        <rect x="30" y="250" width="140" height="80" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <text x="100" y="275" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">AYDINLATMA (AP)</text>
        <text x="100" y="295" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">LED Armatürler</text>
        <text x="100" y="315" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Acil Yönlendirme</text>

        <!-- Panel 2: Power Sockets -->
        <line x1="240" y1="200" x2="240" y2="250" stroke="#84cc16" stroke-width="3" />
        <rect x="180" y="250" width="120" height="80" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
        <text x="240" y="275" fill="#fbbf24" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">PRİZ PANOSU</text>
        <text x="240" y="295" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">30 mA Hayat Koruma</text>
        <text x="240" y="315" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Topraklı Prizler</text>

        <!-- Panel 3: Mechanical -->
        <line x1="360" y1="200" x2="360" y2="250" stroke="#84cc16" stroke-width="3" />
        <rect x="310" y="250" width="110" height="80" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
        <text x="365" y="275" fill="#f87171" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">MEKANİK (MCC)</text>
        <text x="365" y="295" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Pompalar / HVAC</text>
        <text x="365" y="315" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Yangın Hidroforu</text>

        <!-- Panel 4: Weak Current -->
        <line x1="480" y1="200" x2="480" y2="250" stroke="#84cc16" stroke-width="3" />
        <rect x="430" y="250" width="120" height="80" rx="6" fill="#1e293b" stroke="#a855f7" stroke-width="1.5" />
        <text x="490" y="275" fill="#c084fc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">ZAYIF AKIM</text>
        <text x="490" y="295" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Yangın Algılama</text>
        <text x="490" y="315" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Data / CCTV</text>
      </g>

      <!-- Right Panel: Rules & Standards -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#eab308" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">TS HD 60364 ELEKTRİK ESASLARI</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">Kaçak Akım Rölesi (KAR)</text>
          <text x="12" y="40" fill="#94a3b8">Ana pano 300 mA (yangın) • Linye 30 mA (can)</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">Temel Topraklaması</text>
          <text x="12" y="102" fill="#94a3b8">30x3.5 mm galvaniz şerit radye temel hasırında</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">Gerilim Düşümü Sınırları</text>
          <text x="12" y="164" fill="#94a3b8">Aydınlatma: max %1.5 • Güç/Motor: max %3.0</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">Halogen Free (HFFR) Kablo</text>
          <text x="12" y="226" fill="#94a3b8">Yangında zehirli gaz çıkarmayan LSZH tip</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#422006" stroke="#eab308" />
          <text x="12" y="270" fill="#fef08a" font-weight="800">Eşpotansiyel Kuşaklama</text>
          <text x="12" y="290" fill="#fef9c3" font-size="11">Tüm metal borular, mekanik gövdeler ve</text>
          <text x="12" y="308" fill="#fef9c3" font-size="11">asansör rayları ana topraklama barasına bağlanmalıdır.</text>
        </g>
      </g>
    </g>`
  ),

  "yapi-ruhsati": svgWrapper(
    "3194 Sayılı İmar Kanunu & Yapı Ruhsatı Aşamaları",
    "YAPI RUHSATI",
    "#818cf8",
    `<g transform="translate(60, 130)">
      <!-- Left: Step by Step Permit Workflow -->
      <rect x="0" y="0" width="680" height="420" rx="12" fill="#0f172a" stroke="#818cf8" stroke-width="2" />
      
      <g transform="translate(40, 30)">
        <!-- Step 1 -->
        <rect x="0" y="0" width="180" height="90" rx="8" fill="#1e293b" stroke="#6366f1" stroke-width="1.5" />
        <circle cx="24" cy="24" r="12" fill="#6366f1" />
        <text x="24" y="29" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">1</text>
        <text x="44" y="28" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="700">İmar Durum Belgesi</text>
        <text x="14" y="52" fill="#94a3b8" font-family="sans-serif" font-size="11">Belediye İmar Md.</text>
        <text x="14" y="70" fill="#a5b4fc" font-family="sans-serif" font-size="11">Çap, Kot-Kesit, Yol Terkleri</text>

        <line x1="180" y1="45" x2="210" y2="45" stroke="#6366f1" stroke-width="2" />

        <!-- Step 2 -->
        <rect x="210" y="0" width="180" height="90" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="234" cy="24" r="12" fill="#38bdf8" />
        <text x="234" y="29" fill="#0f172a" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">2</text>
        <text x="254" y="28" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="700">Zemin &amp; Projeler</text>
        <text x="224" y="52" fill="#94a3b8" font-family="sans-serif" font-size="11">Mühendis / Mimar</text>
        <text x="224" y="70" fill="#7dd3fc" font-family="sans-serif" font-size="11">Mimari, Statik, MEP, Zemin</text>

        <line x1="390" y1="45" x2="420" y2="45" stroke="#38bdf8" stroke-width="2" />

        <!-- Step 3 -->
        <rect x="420" y="0" width="180" height="90" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
        <circle cx="444" cy="24" r="12" fill="#f59e0b" />
        <text x="444" y="29" fill="#0f172a" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">3</text>
        <text x="464" y="28" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="700">Yapı Denetim</text>
        <text x="434" y="52" fill="#94a3b8" font-family="sans-serif" font-size="11">YDS Sistemi (E-Dağıtım)</text>
        <text x="434" y="70" fill="#fcd34d" font-family="sans-serif" font-size="11">Proje Uygunluk Raporu</text>

        <!-- Downward arrow to Step 4 -->
        <path d="M 510 90 L 510 130 L 90 130 L 90 160" stroke="#f59e0b" stroke-width="2" fill="none" />

        <!-- Step 4 -->
        <rect x="0" y="160" width="180" height="90" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5" />
        <circle cx="24" cy="184" r="12" fill="#a855f7" />
        <text x="24" y="189" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">4</text>
        <text x="44" y="188" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="700">Kurum Görüşleri</text>
        <text x="14" y="212" fill="#94a3b8" font-family="sans-serif" font-size="11">İtfaiye, İSKİ/ASKİ, TEDAŞ</text>
        <text x="14" y="230" fill="#d8b4fe" font-family="sans-serif" font-size="11">Sığınak &amp; Otopark Onayı</text>

        <line x1="180" y1="205" x2="210" y2="205" stroke="#a855f7" stroke-width="2" />

        <!-- Step 5 -->
        <rect x="210" y="160" width="180" height="90" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />
        <circle cx="234" cy="184" r="12" fill="#10b981" />
        <text x="234" y="189" fill="#0f172a" font-family="sans-serif" font-size="12" font-weight="800" text-anchor="middle">5</text>
        <text x="254" y="188" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="700">Harç ve Teminatlar</text>
        <text x="224" y="212" fill="#94a3b8" font-family="sans-serif" font-size="11">Belediye Gelirleri</text>
        <text x="224" y="230" fill="#6ee7b7" font-family="sans-serif" font-size="11">Otopark, Kanal, Harç Ödeme</text>

        <line x1="390" y1="205" x2="420" y2="205" stroke="#10b981" stroke-width="2" />

        <!-- Step 6 (Final Milestone) -->
        <rect x="420" y="150" width="180" height="110" rx="10" fill="#312e81" stroke="#818cf8" stroke-width="2.5" />
        <rect x="430" y="160" width="40" height="22" rx="4" fill="#818cf8" />
        <text x="450" y="176" fill="#0f172a" font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle">SON</text>
        <text x="478" y="177" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="900">YAPI RUHSATI</text>
        <line x1="430" y1="192" x2="590" y2="192" stroke="#6366f1" stroke-width="1" />
        <text x="430" y="212" fill="#c7d2fe" font-family="sans-serif" font-size="11">Şantiye Şefi Sözleşmesi</text>
        <text x="430" y="230" fill="#c7d2fe" font-family="sans-serif" font-size="11">Müteahhitlik Sicili</text>
        <text x="430" y="248" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="700">İnşaata Başlama İzni ✓</text>

        <!-- Validity Period Badge -->
        <rect x="100" y="280" width="400" height="50" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="300" y="302" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">RUHSAT GEÇERLİLİK SÜRELERİ (3194 Md. 29)</text>
        <text x="300" y="320" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Başlama: 2 Yıl • Tamamlama: 5 Yıl (Ruhsat Yenileme Şartı)</text>
      </g>

      <!-- Right Panel: Legal Checklist -->
      <g transform="translate(710, 0)">
        <rect x="0" y="0" width="370" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="20" y="20" width="330" height="36" rx="6" fill="#0f172a" />
        <text x="185" y="43" fill="#818cf8" font-family="sans-serif" font-size="13" font-weight="800" text-anchor="middle">RUHSAT EKLERİ VE KONTROLLER</text>
        
        <g transform="translate(20, 75)" font-family="sans-serif" font-size="12">
          <rect x="0" y="0" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="22" fill="#f8fafc" font-weight="700">1. Tapu ve Mülkiyet Kontrolü</text>
          <text x="12" y="40" fill="#94a3b8">Hissedar onayları, vekaletnameler, şerhler</text>

          <rect x="0" y="62" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="84" fill="#f8fafc" font-weight="700">2. Proje Müellifleri Sicil Durumu</text>
          <text x="12" y="102" fill="#94a3b8">Mimar/Mühendis Oda Sicil Durum Belgeleri (SMM)</text>

          <rect x="0" y="124" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="146" fill="#f8fafc" font-weight="700">3. Yapı Müteahhidi Yetki Belgesi</text>
          <text x="12" y="164" fill="#94a3b8">ÇŞİDB YAMBİS Grup Yeterlilik Kontrolü (A-H)</text>

          <rect x="0" y="186" width="330" height="52" rx="6" fill="#0f172a" stroke="#334155" />
          <text x="12" y="208" fill="#f8fafc" font-weight="700">4. Şantiye Şefi Taahhütnamesi</text>
          <text x="12" y="226" fill="#94a3b8">Aktif şantiye sayısı ve m² sınırları kontrolü</text>

          <rect x="0" y="248" width="330" height="75" rx="6" fill="#1e1b4b" stroke="#818cf8" />
          <text x="12" y="270" fill="#e0e7ff" font-weight="800">Ruhsatsız Başlama Cezası</text>
          <text x="12" y="290" fill="#c7d2fe" font-size="11">Ruhsat alınmadan hafriyat veya temel atılması</text>
          <text x="12" y="308" fill="#c7d2fe" font-size="11">3194 Md. 32/42 gereğince mühürleme ve ceza sebebidir.</text>
        </g>
      </g>
    </g>`
  )
};

// Write out all generated SVGs
let count = 0;
for (const [key, svgContent] of Object.entries(SVGS)) {
  const filePath = path.join(targetDir, `${key}.svg`);
  fs.writeFileSync(filePath, svgContent, "utf-8");
  count++;
  console.log(`Generated: ${filePath}`);
}
console.log(`Successfully generated ${count} bespoke SVGs.`);
