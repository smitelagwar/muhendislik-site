import type { SVGProps } from "react";

export interface WhaleBlueprintIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  active?: boolean;
}

/**
 * Custom architectural blueprint icon depicting the iconic humpback whale (Megaptera novaeangliae)
 * with its curved rostrum, long scalloped pectoral flippers, bifurcated caudal fluke,
 * and internal structural blueprint contour lines.
 */
export function WhaleBlueprintIcon({
  size = 20,
  className = "",
  active = false,
  ...props
}: WhaleBlueprintIconProps) {
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
      {/* ─── Main Body Dorsal & Fluke Contour ─── */}
      <path
        d="M 2 11.5 C 3.5 8.5 7.5 7.5 11.5 7.5 C 14.8 7.5 17.5 9 19.5 11 C 20.8 12 21.8 12.2 23 11 C 22.8 13 21.2 13.8 19.8 13 C 17.2 13.8 14.5 14.5 11 14.5 C 7 14.5 4 13.5 2 11.5 Z"
        className={active ? "text-amber-500 dark:text-cyan-400" : ""}
      />

      {/* ─── Caudal Flukes (Tail Wing & Notch) ─── */}
      <path d="M 21.5 11.8 C 22.8 9.5 23.5 9 23.8 9.2 C 23.5 10.8 22.8 12 21.8 12.2 C 22.8 12.8 23.5 14 23.8 14.8 C 23.2 15 22.5 14.2 21.2 12.6" />

      {/* ─── Dorsal Fin (Stubby Humpback fin at STA 6+50) ─── */}
      <path d="M 15 7.8 C 15.6 6.8 16.5 6.6 16.8 6.7 C 16.5 7.4 16.2 8.1 16.2 8.4" />

      {/* ─── Iconic Megaptera Pectoral Flipper (with leading-edge tubercles) ─── */}
      <path
        d="M 7.8 13.2 C 7 15.2 5.5 18 3.8 19.8 C 4.5 18.2 6.2 16.2 8.5 14.2"
        strokeWidth={active ? "1.8" : "1.5"}
        className={active ? "text-amber-600 dark:text-amber-400" : ""}
      />
      {/* Leading edge scalloped tubercles */}
      <circle
        cx="5.2"
        cy="17.2"
        r="0.6"
        fill="currentColor"
        className={active ? "text-amber-600 dark:text-amber-400" : ""}
      />
      <circle
        cx="6.5"
        cy="15.2"
        r="0.6"
        fill="currentColor"
        className={active ? "text-amber-600 dark:text-amber-400" : ""}
      />

      {/* ─── Internal Blueprint Ribs (Wireframe Stations) ─── */}
      <line x1="5.2" y1="9.2" x2="5.2" y2="12.8" strokeWidth="1" strokeDasharray="1 1" opacity="0.65" />
      <line x1="8.2" y1="7.9" x2="8.2" y2="14.2" strokeWidth="1" opacity="0.75" />
      <line x1="11.2" y1="7.6" x2="11.2" y2="14.4" strokeWidth="1" opacity="0.75" />
      <line x1="14.2" y1="8.2" x2="14.2" y2="13.8" strokeWidth="1" strokeDasharray="1 1" opacity="0.65" />
      <line x1="17.2" y1="9.5" x2="17.2" y2="12.5" strokeWidth="1" opacity="0.6" />

      {/* ─── Longitudinal Spine Axis & Ventral Pleats ─── */}
      <path d="M 2.8 11.2 Q 11 11.2 19 11.8" strokeWidth="1" opacity="0.5" />
      <path d="M 4.2 12.6 Q 7.5 13.4 10.5 13.4" strokeWidth="0.8" opacity="0.55" />

      {/* ─── Technical Station Reticle (STA 0+00 Eye / Rostrum) ─── */}
      <circle cx="3.8" cy="10.4" r="0.8" fill="currentColor" />
    </svg>
  );
}
