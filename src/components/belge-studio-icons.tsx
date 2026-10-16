import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Uzaklaştır (Zoom Out) — Kalibrasyon çentikli optik mercek ve eksi skala çizgisi
 */
export function BelgeZoomOutIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Mercek cam dolgusu */}
      <circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" fillOpacity="0.12" />
      {/* Dış kalibrasyon çentikleri (N, S, W, E) */}
      <path
        d="M10.5 2.25v1.5M10.5 17.25v1.5M2.25 10.5h1.5M17.25 10.5h1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Ana optik halka */}
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* İç mercek yansıma yayı */}
      <path
        d="M6.8 8.2a4.6 4.6 0 0 1 3.7-1.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Eksi skala çubuğu */}
      <path
        d="M7.75 10.5h5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Mühendislik mercek sapı ve bilezik detayı */}
      <path
        d="M15.3 15.3L20.5 20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.1 18.3l2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

/**
 * Yakınlaştır (Zoom In) — Kalibrasyon çentikli optik mercek ve artı hedef odaklama
 */
export function BelgeZoomInIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Mercek cam dolgusu */}
      <circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" fillOpacity="0.12" />
      {/* Dış kalibrasyon çentikleri (N, S, W, E) */}
      <path
        d="M10.5 2.25v1.5M10.5 17.25v1.5M2.25 10.5h1.5M17.25 10.5h1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Ana optik halka */}
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* Artı hedef odaklama çubukları */}
      <path
        d="M10.5 7.75v5.5M7.75 10.5h5.5"
        stroke="currentColor"
        strokeWidth="1.95"
        strokeLinecap="round"
      />
      {/* Mühendislik mercek sapı ve bilezik detayı */}
      <path
        d="M15.3 15.3L20.5 20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.1 18.3l2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

/**
 * Sığdır (Fit to Page) — Dört köşe pafta vizör kadrajı içinde A4 belge sayfası
 */
export function BelgeFitPageIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Merkez A4 sayfa silüeti */}
      <path
        d="M8.25 6.75h5.25l2.25 2.25v8.25h-7.5V6.75Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* A4 kıvrık köşe detayı */}
      <path
        d="M13.5 6.75V9h2.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      {/* Dört köşe kadraj braketleri (Blueprint Viewfinder) */}
      <path
        d="M3.75 8.25V4.5a.75.75 0 0 1 .75-.75h3.75M15.75 3.75h3.75a.75.75 0 0 1 .75.75v3.75M20.25 15.75v3.75a.75.75 0 0 1-.75.75h-3.75M8.25 20.25H4.5a.75.75 0 0 1-.75-.75v-3.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Köşe diyagonal genleşme vektörleri */}
      <path
        d="M4.5 4.5l2.1 2.1M19.5 4.5l-2.1 2.1M4.5 19.5l2.1-2.1M19.5 19.5l-2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/**
 * PDF'yi Yeni Sekmede Aç — A4 teknik pafta içinden çıkan diyagonal portal oku
 */
export function BelgeOpenExternalIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* A4 Belge Gövdesi */}
      <path
        d="M11.5 4.75H6.25A1.5 1.5 0 0 0 4.75 6.25v11.5a1.5 1.5 0 0 0 1.5 1.5h11.5a1.5 1.5 0 0 0 1.5-1.5V12.5"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Belge içi teknik satır çizgileri */}
      <path
        d="M7.75 12h3.5M7.75 15.25h5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Diyagonal çıkış oku */}
      <path
        d="M12.25 11.75L19.75 4.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M14.75 4.25h5v5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Önceki Sayfa — Sayfa durdurma kenarı ve çift katmanlı teknik şevron
 */
export function BelgePrevPageIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M6.25 6.5v11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M14.75 6.5L9.25 12l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8.75L14.75 12 18 15.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * Sonraki Sayfa — Sayfa durdurma kenarı ve çift katmanlı teknik şevron
 */
export function BelgeNextPageIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M17.75 6.5v11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M9.25 6.5l5.5 5.5-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 8.75L9.25 12 6 15.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * Aydınlık Mod (Sun / Helios) — Çift halkalı güneş çekirdeği ve kalibrasyon ışınları
 */
export function BelgeSunIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="4.25"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      {/* Ana eksen ışınları */}
      <path
        d="M12 2.5v2.25M12 19.25v2.25M2.5 12h2.25M19.25 12h2.25"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      {/* Diyagonal verniyer ışınları */}
      <path
        d="M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/**
 * Koyu Mod (Moon / Polaris) — Geometrik hilal, krater yayı ve Kutup yıldızı
 */
export function BelgeMoonIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M20.2 14.3A8.25 8.25 0 0 1 9.7 3.8a8.25 8.25 0 1 0 10.5 10.5Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Kutup yıldızı (4 köşeli parıltı) */}
      <path
        d="M16.5 4.25l.65 1.6 1.6.65-1.6.65-.65 1.6-.65-1.6-1.6-.65 1.6-.65.65-1.6Z"
        fill="currentColor"
      />
      {/* Küçük yörünge yıldızı */}
      <circle cx="19.5" cy="9.5" r="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/**
 * Belgelere Dön — Pafta çerçevesinden çıkan hassas geri dönüş oku
 */
export function BelgeBackIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M15.5 4.75h3a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M10.25 6.75L5 12l5.25 5.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 12h11"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Sıfırla — Örnek verilere geri döndürme döngüsü ve merkez kalibrasyon noktası
 */
export function BelgeResetIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M4.5 10.5A7.75 7.75 0 1 1 6.8 17.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.25 5.75v4.75H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.25"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/**
 * Temizle — Teknik silgi / alan temizleme ikonu
 */
export function BelgeClearIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M5 7h14M9.5 7V5.25A1.25 1.25 0 0 1 10.75 4h2.5A1.25 1.25 0 0 1 14.5 5.25V7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 7l.85 11.5a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4L17.25 7"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 11v5M13.75 11v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * Geri Al — Zaman çizgisi düğümlü geri dönüş yayı
 */
export function BelgeUndoIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M8.5 7L4.25 11.25 8.5 15.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 11.25h9.5a5.25 5.25 0 1 1 0 10.5H11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="16.5" r="1.25" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/**
 * Boş Form İndir — Noktalı şablon satırlı A4 sayfası
 */
export function BelgeBlankFormIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M6.5 3.75h7.25L18.5 8.5v11a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5 19.5V5.25A1.5 1.5 0 0 1 6.5 3.75Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 3.75V8.5h4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 12h7.5M8.25 15.25h4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 2"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * Yazdır — Teknik plotter / yazıcı ve çıkan belge sayfası
 */
export function BelgePrintIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M7.25 8V4.5a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 .75.75V8"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <rect
        x="3.75"
        y="8"
        width="16.5"
        height="8"
        rx="2"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7.25 14h9.5v5.5a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V14Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle cx="17" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * PDF İndir — Mühürlü A4 belge ve hassas indirme vektörü
 */
export function BelgeDownloadPdfIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M6.5 3.5h7.25L18.5 8.25v7.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path
        d="M5.5 3.5h8.25L18.5 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5v6.75M9.25 13.75L12 16.5l2.75-2.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Diğer İşlemler — Üçlü elmas kalibrasyon düğümü
 */
export function BelgeMoreIcon({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect
        x="4"
        y="10.5"
        width="3"
        height="3"
        rx="0.75"
        transform="rotate(45 5.5 12)"
        fill="currentColor"
      />
      <rect
        x="10.5"
        y="10.5"
        width="3"
        height="3"
        rx="0.75"
        transform="rotate(45 12 12)"
        fill="currentColor"
      />
      <rect
        x="17"
        y="10.5"
        width="3"
        height="3"
        rx="0.75"
        transform="rotate(45 18.5 12)"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Canlı PDF Önizle — Optik vizör göz ikonu
 */
export function BelgePreviewEyeIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </svg>
  );
}

/**
 * Formu Düzenle — Teknik kalem ve form cetveli
 */
export function BelgeFormEditIcon({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M11 4.75H6A1.25 1.25 0 0 0 4.75 6v12A1.25 1.25 0 0 0 6 19.25h12A1.25 1.25 0 0 0 19.25 18v-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16.25 3.75a1.77 1.77 0 0 1 2.5 2.5L11.5 13.5l-3.25.75.75-3.25 7.25-7.25Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
