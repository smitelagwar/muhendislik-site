import type { SVGProps } from "react";

export interface OceanEcosystemIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  active?: boolean;
}

/**
 * Okyanus Yaşamı (Balık sürüleri, deniz canlıları ve deniz tabanı florası)
 * mimari blueprint simgesi.
 */
export function OceanEcosystemIcon({
  size = 20,
  className = "",
  active = false,
  ...props
}: OceanEcosystemIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "1.8" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* ─── Ana Öncü Balık (Pelajik Gövde ve Çatal Kuyruk) ─── */}
      <path
        d="M 4.5 9.5 C 7 6.8 11.5 6.8 14.5 9.5 C 16.2 10.8 17.8 11.2 19.5 9.2 L 18.8 11.8 L 19.5 14.2 C 17.8 12.2 16.2 12.5 14.5 13.8 C 11.5 16.2 7 16.2 4.5 13.5 C 3.2 12.2 3.2 10.8 4.5 9.5 Z"
        className={active ? "text-emerald-600 dark:text-cyan-400" : ""}
      />
      {/* Balık Gözü ve Solungaç Yay Çizgisi */}
      <circle cx="6.6" cy="11.2" r="0.7" fill="currentColor" />
      <path d="M 8.6 9.2 C 9.2 10.8 9.2 12.2 8.6 13.8" strokeWidth="1.1" opacity="0.75" />
      <line x1="11.5" y1="8.3" x2="11.5" y2="14.7" strokeWidth="0.9" strokeDasharray="1 1" opacity="0.65" />

      {/* ─── Üst Artçı Sürü Balığı ─── */}
      <path
        d="M 11.5 4.2 C 13.2 2.8 15.8 2.8 17.5 4.2 L 19.4 3.1 L 18.9 4.8 L 19.4 6.4 L 17.5 5.3 C 15.8 6.6 13.2 6.6 11.5 5.2 Z"
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* ─── Alt Deniz Bitkisi / Kelp Filizleri ─── */}
      <path
        d="M 3.2 21.5 C 2.6 19.2 4.2 17.8 3.5 15.6"
        strokeWidth={active ? "1.6" : "1.3"}
        className={active ? "text-amber-600 dark:text-amber-400" : ""}
      />
      <path
        d="M 6.4 21.5 C 5.8 19.5 7.4 18.2 6.8 16.4"
        strokeWidth={active ? "1.5" : "1.2"}
        className={active ? "text-amber-600 dark:text-amber-400" : ""}
      />
      <path
        d="M 14.5 21.5 C 15.2 19.4 13.8 18.0 14.6 16.2"
        strokeWidth="1.2"
        opacity="0.75"
      />
    </svg>
  );
}
