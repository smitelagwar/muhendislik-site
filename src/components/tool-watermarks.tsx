"use client";

import React from "react";

export function ToolWatermarkIllustration({
  toolId,
  color,
}: {
  toolId: string;
  color: string;
}) {
  const commonClasses =
    "pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 transform transition-all duration-500 ease-out opacity-[0.08] dark:opacity-[0.12] group-hover:opacity-[0.22] group-hover:scale-110 group-hover:-translate-y-2 group-hover:-translate-x-2";

  switch (toolId) {
    case "donati-hesabi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="15" y="15" width="90" height="90" rx="14" strokeWidth="3" />
          <circle cx="32" cy="32" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="88" cy="32" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="32" cy="88" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="88" cy="88" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="60" cy="32" r="8" fill={color} fillOpacity="0.3" />
          <circle cx="60" cy="88" r="8" fill={color} fillOpacity="0.3" />
          <path d="M 32 22 L 22 32 M 88 22 L 98 32" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "kolon-on-boyutlandirma":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="35" y="30" width="50" height="80" rx="6" strokeWidth="3" />
          <line x1="45" y1="30" x2="45" y2="110" strokeDasharray="4 3" />
          <line x1="75" y1="30" x2="75" y2="110" strokeDasharray="4 3" />
          <line x1="35" y1="50" x2="85" y2="50" />
          <line x1="35" y1="70" x2="85" y2="70" />
          <line x1="35" y1="90" x2="85" y2="90" />
          <path d="M 60 5 L 60 25 M 53 18 L 60 25 L 67 18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "kiris-kesiti":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="10" y="35" width="100" height="30" rx="4" strokeWidth="3" />
          <path d="M 15 65 L 25 80 L 5 80 Z M 105 65 L 115 80 L 95 80 Z" />
          <path d="M 30 15 L 30 35 M 26 28 L 30 35 L 34 28" />
          <path d="M 60 10 L 60 35 M 56 28 L 60 35 L 64 28" strokeWidth="3" />
          <path d="M 90 15 L 90 35 M 86 28 L 90 35 L 94 28" />
          <line x1="20" y1="15" x2="100" y2="15" strokeDasharray="3 3" />
          <path d="M 15 90 Q 60 118 105 90" strokeWidth="3" strokeDasharray="5 3" />
        </svg>
      );

    case "doseme-kalinligi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2"
          className={commonClasses}
          aria-hidden="true"
        >
          <polygon points="20,40 80,20 110,60 50,80" strokeWidth="3" />
          <polygon points="20,40 50,80 50,100 20,60" strokeWidth="2.5" />
          <polygon points="50,80 110,60 110,80 50,100" strokeWidth="2.5" />
          <line x1="35" y1="35" x2="65" y2="75" strokeDasharray="3 3" />
          <line x1="50" y1="30" x2="80" y2="70" strokeDasharray="3 3" />
          <line x1="65" y1="25" x2="95" y2="65" strokeDasharray="3 3" />
          <line x1="35" y1="55" x2="95" y2="35" strokeDasharray="3 3" />
          <line x1="42" y1="65" x2="102" y2="45" strokeDasharray="3 3" />
        </svg>
      );

    case "pas-payi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 15 15 L 105 15 L 105 105" strokeWidth="3.5" />
          <circle cx="65" cy="65" r="22" strokeWidth="3" />
          <circle cx="65" cy="65" r="10" fill={color} fillOpacity="0.3" />
          <line x1="15" y1="65" x2="43" y2="65" strokeWidth="2.5" />
          <path d="M 22 60 L 15 65 L 22 70 M 36 60 L 43 65 L 36 70" strokeWidth="2" />
          <line x1="65" y1="15" x2="65" y2="43" strokeWidth="2.5" />
          <path d="M 60 22 L 65 15 L 70 22 M 60 36 L 65 43 L 70 36" strokeWidth="2" />
          <path d="M 85 80 C 85 95 100 105 100 105 C 100 105 115 95 115 80 L 115 70 L 100 65 L 85 70 Z" strokeWidth="2" />
        </svg>
      );

    case "zimbalama-kontrolu":
      // Concentric punching shear perimeter rings with column in middle
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="42" y="42" width="36" height="36" rx="4" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <rect x="25" y="25" width="70" height="70" rx="10" strokeWidth="2.5" strokeDasharray="5 3" />
          <rect x="12" y="12" width="96" height="96" rx="16" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="60" y1="10" x2="60" y2="25" strokeWidth="2" />
          <line x1="60" y1="95" x2="60" y2="110" strokeWidth="2" />
          <line x1="10" y1="60" x2="25" y2="60" strokeWidth="2" />
          <line x1="95" y1="60" x2="110" y2="60" strokeWidth="2" />
        </svg>
      );

    case "kiris-kesme-etriye":
      // Shear stirrups spacing diagram with diagonal crack line
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="15" y="30" width="90" height="60" rx="6" strokeWidth="3" />
          <line x1="30" y1="30" x2="30" y2="90" strokeWidth="2.5" />
          <line x1="45" y1="30" x2="45" y2="90" strokeWidth="2.5" />
          <line x1="60" y1="30" x2="60" y2="90" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="80" y1="30" x2="80" y2="90" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 25 80 L 85 40" strokeWidth="3" strokeDasharray="4 2" />
        </svg>
      );

    case "kenetlenme-boyu":
      // Rebar lap splice lb, lbd overlap length detail
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 10 45 L 85 45 L 85 30 L 95 30" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 110 75 L 35 75 L 35 90 L 25 90" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="35" y1="20" x2="35" y2="100" strokeDasharray="2 2" strokeWidth="1.5" />
          <line x1="85" y1="20" x2="85" y2="100" strokeDasharray="2 2" strokeWidth="1.5" />
          <line x1="35" y1="60" x2="85" y2="60" strokeWidth="2" />
          <path d="M 42 55 L 35 60 L 42 65 M 78 55 L 85 60 L 78 65" strokeWidth="2" />
        </svg>
      );

    case "deprem-periyot-hesabi":
      // Spectral response acceleration curve Sae(T) with period T
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 15 15 L 15 105 L 105 105" strokeWidth="3" strokeLinecap="round" />
          <path d="M 15 80 L 35 30 L 65 30 Q 85 65 105 85" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="35" y1="30" x2="35" y2="105" strokeDasharray="3 3" />
          <line x1="65" y1="30" x2="65" y2="105" strokeDasharray="3 3" />
        </svg>
      );

    case "goreli-kat-otelemesi":
      // Story drift displacement delta_i / h_i shear deformation diagram
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <line x1="15" y1="105" x2="105" y2="105" strokeWidth="3" />
          <path d="M 30 105 Q 45 65 65 25" strokeWidth="3" />
          <path d="M 75 105 Q 90 65 110 25" strokeWidth="3" />
          <line x1="30" y1="25" x2="110" y2="25" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="30" y1="65" x2="100" y2="65" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="65" y1="25" x2="65" y2="105" strokeDasharray="2 2" strokeWidth="1.5" />
          <path d="M 40 20 L 65 20 M 55 16 L 65 20 L 55 24" strokeWidth="2" />
        </svg>
      );

    case "tekil-birlesik-temel":
      // Spread footing pad with column pedestal and trapezoidal soil pressure
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="45" y="15" width="30" height="35" rx="3" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <polygon points="15,75 45,50 75,50 105,75" strokeWidth="3" />
          <rect x="15" y="75" width="90" height="20" rx="3" strokeWidth="3" />
          <line x1="15" y1="108" x2="105" y2="108" strokeWidth="2" />
          <path d="M 25 108 L 25 97 M 50 108 L 50 97 M 75 108 L 75 97 M 95 108 L 95 97" strokeWidth="2" />
        </svg>
      );

    case "radye-temel-hesabi":
      // Mat raft foundation thick slab with column grid points
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="15" y="25" width="90" height="70" rx="10" strokeWidth="3" />
          <rect x="30" y="40" width="18" height="18" rx="2" strokeWidth="2.5" fill={color} fillOpacity="0.3" />
          <rect x="72" y="40" width="18" height="18" rx="2" strokeWidth="2.5" fill={color} fillOpacity="0.3" />
          <rect x="51" y="65" width="18" height="18" rx="2" strokeWidth="2.5" fill={color} fillOpacity="0.3" />
          <line x1="15" y1="60" x2="105" y2="60" strokeDasharray="3 3" strokeWidth="1.5" />
          <line x1="60" y1="25" x2="60" y2="95" strokeDasharray="3 3" strokeWidth="1.5" />
        </svg>
      );

    case "iksa-toprak-basinci":
      // Retaining wall / soldier pile with active soil pressure triangle Ka
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="20" y="15" width="15" height="90" rx="3" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <line x1="35" y1="15" x2="105" y2="105" strokeWidth="2" strokeDasharray="4 3" />
          <polygon points="35,15 105,105 35,105" fill={color} fillOpacity="0.1" strokeWidth="2" />
          <path d="M 35 45 L 55 45 M 48 40 L 55 45 L 48 50" strokeWidth="2" />
          <path d="M 35 75 L 75 75 M 68 70 L 75 75 L 68 80" strokeWidth="2.5" />
          <path d="M 35 95 L 95 95 M 88 90 L 95 95 L 88 100" strokeWidth="3" />
        </svg>
      );

    case "sev-stabilitesi":
      // Slope embankment with circular slip arc surface and slice slices
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 10 25 L 45 25 L 90 95 L 115 95" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 25 25 Q 60 70 100 95" strokeWidth="3" strokeDasharray="5 3" />
          <line x1="45" y1="25" x2="45" y2="52" strokeDasharray="2 2" />
          <line x1="60" y1="48" x2="60" y2="72" strokeDasharray="2 2" />
          <line x1="75" y1="71" x2="75" y2="86" strokeDasharray="2 2" />
        </svg>
      );

    case "celik-profil-secimi":
      // IPE / HEA I-beam steel cross-section with flange and web dimensions
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path
            d="M 25 20 L 95 20 L 95 38 L 68 38 L 68 82 L 95 82 L 95 100 L 25 100 L 25 82 L 52 82 L 52 38 L 25 38 Z"
            strokeWidth="3"
            fill={color}
            fillOpacity="0.15"
          />
          <line x1="60" y1="10" x2="60" y2="110" strokeDasharray="3 3" strokeWidth="1.5" />
          <line x1="15" y1="60" x2="105" y2="60" strokeDasharray="3 3" strokeWidth="1.5" />
        </svg>
      );

    case "celik-birlestesi-hesabi":
      // Bolt pattern & weld seam bead line on steel gusset plate
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <polygon points="15,20 85,20 105,85 15,85" strokeWidth="3" fill={color} fillOpacity="0.15" />
          <circle cx="35" cy="40" r="7" strokeWidth="2.5" />
          <circle cx="65" cy="40" r="7" strokeWidth="2.5" />
          <circle cx="35" cy="65" r="7" strokeWidth="2.5" />
          <circle cx="65" cy="65" r="7" strokeWidth="2.5" />
          <path d="M 85 20 L 105 85" strokeWidth="5" strokeDasharray="4 4" strokeLinecap="round" />
        </svg>
      );

    case "ahsap-eleman-hesabi":
      // Timber beam cross-section with wood ring texture
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="25" y="15" width="70" height="90" rx="8" strokeWidth="3.5" />
          <ellipse cx="60" cy="60" rx="25" ry="35" strokeWidth="1.5" strokeDasharray="4 3" />
          <ellipse cx="60" cy="60" rx="14" ry="20" strokeWidth="1.5" strokeDasharray="3 3" />
          <ellipse cx="60" cy="60" rx="5" ry="7" fill={color} fillOpacity="0.4" />
        </svg>
      );

    case "kalip-sokum-suresi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <circle cx="60" cy="65" r="42" strokeWidth="3" />
          <path d="M 52 14 L 68 14 M 60 14 L 60 23" strokeWidth="3" strokeLinecap="round" />
          <path d="M 85 30 L 92 23" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="65" x2="80" y2="48" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="65" r="5" fill={color} />
          <line x1="60" y1="30" x2="60" y2="36" strokeWidth="3" />
          <line x1="95" y1="65" x2="89" y2="65" strokeWidth="3" />
          <line x1="60" y1="100" x2="60" y2="94" strokeWidth="3" />
          <line x1="25" y1="65" x2="31" y2="65" strokeWidth="3" />
        </svg>
      );

    case "dis-cephe-yalitim-kalinligi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="15" y="20" width="30" height="80" rx="3" strokeWidth="3" />
          <line x1="20" y1="20" x2="40" y2="40" strokeWidth="1.5" />
          <line x1="20" y1="50" x2="40" y2="70" strokeWidth="1.5" />
          <line x1="20" y1="80" x2="35" y2="95" strokeWidth="1.5" />
          <rect x="45" y="20" width="25" height="80" rx="2" strokeWidth="3" fill={color} fillOpacity="0.15" />
          <path d="M 50 25 L 65 35 M 50 45 L 65 55 M 50 65 L 65 75 M 50 85 L 65 95" strokeWidth="1.5" />
          <rect x="70" y="20" width="8" height="80" rx="1" strokeWidth="2" />
          <path d="M 88 35 Q 98 42 88 50 Q 98 58 88 65" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 100 30 Q 110 40 100 50 Q 110 60 100 70" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "imar-hesaplayici":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="15" y="15" width="90" height="90" rx="8" strokeWidth="3" strokeDasharray="6 4" />
          <rect x="35" y="35" width="50" height="50" rx="4" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <line x1="15" y1="35" x2="35" y2="35" strokeDasharray="2 2" />
          <line x1="85" y1="35" x2="105" y2="35" strokeDasharray="2 2" />
          <line x1="35" y1="15" x2="35" y2="35" strokeDasharray="2 2" />
          <line x1="35" y1="85" x2="35" y2="105" strokeDasharray="2 2" />
          <line x1="35" y1="35" x2="85" y2="85" strokeWidth="1.5" />
          <line x1="85" y1="35" x2="35" y2="85" strokeWidth="1.5" />
        </svg>
      );

    case "beton-metraj-hesabi":
      // Concrete mixer truck drum & cubic volume m3
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <polygon points="25,35 75,25 95,60 45,70" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <ellipse cx="35" cy="52.5" rx="10" ry="17.5" strokeWidth="2.5" />
          <ellipse cx="85" cy="42.5" rx="10" ry="17.5" strokeWidth="2.5" />
          <path d="M 25 85 L 95 85 M 35 85 L 35 105 M 85 85 L 85 105" strokeWidth="3" strokeLinecap="round" />
          <text x="60" y="52" textAnchor="middle" fontSize="11" fill={color} fontWeight="900">m³</text>
        </svg>
      );

    case "hafriyat-metraj-hesabi":
      // Excavation pit & dump truck tipper body
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 10 30 L 35 30 L 55 85 L 110 85" strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="45,35 95,25 85,65 35,65" strokeWidth="3" fill={color} fillOpacity="0.2" />
          <circle cx="45" cy="75" r="7" strokeWidth="2.5" />
          <circle cx="75" cy="75" r="7" strokeWidth="2.5" />
        </svg>
      );

    case "taban-kesme-kuvveti":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <line x1="10" y1="105" x2="110" y2="105" strokeWidth="4" />
          <path d="M 30 105 L 42 25 L 82 25 L 90 105" strokeWidth="3" />
          <line x1="33" y1="85" x2="88" y2="85" strokeWidth="2.5" />
          <line x1="36" y1="65" x2="86" y2="65" strokeWidth="2.5" />
          <line x1="39" y1="45" x2="84" y2="45" strokeWidth="2.5" />
          <path d="M 5 45 L 33 45 M 23 40 L 33 45 L 23 50" strokeWidth="2.5" />
          <path d="M 5 25 L 38 25 M 28 20 L 38 25 L 28 30" strokeWidth="3" />
          <path d="M 15 113 Q 25 108 35 113 Q 45 118 55 113 Q 65 108 75 113 Q 85 118 95 113" strokeWidth="2" />
        </svg>
      );

    case "duzensizlik-kontrolu":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <path d="M 20 20 L 95 20 L 95 60 L 60 60 L 60 100 L 20 100 Z" strokeWidth="3" />
          <circle cx="45" cy="45" r="7" fill={color} fillOpacity="0.4" strokeWidth="2" />
          <text x="45" y="48" textAnchor="middle" fontSize="8" fill={color} fontWeight="900">M</text>
          <circle cx="68" cy="38" r="7" strokeWidth="2.5" />
          <text x="68" y="41" textAnchor="middle" fontSize="8" fill={color} fontWeight="900">R</text>
          <line x1="45" y1="45" x2="68" y2="38" strokeDasharray="3 3" strokeWidth="2" />
          <path d="M 85 75 A 30 30 0 0 1 45 92" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 45 92 L 53 87 M 45 92 L 51 98" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "zemin-sinifi":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <rect x="25" y="15" width="70" height="90" rx="4" strokeWidth="3" />
          <line x1="25" y1="40" x2="95" y2="40" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="38" cy="28" r="2" fill={color} />
          <circle cx="55" cy="32" r="3" fill={color} />
          <circle cx="78" cy="26" r="2" fill={color} />
          <line x1="25" y1="70" x2="95" y2="70" strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1="35" y1="48" x2="55" y2="62" strokeWidth="1.5" />
          <line x1="60" y1="48" x2="80" y2="62" strokeWidth="1.5" />
          <path d="M 25 80 L 40 105 M 45 70 L 70 105 M 70 70 L 95 105" strokeWidth="2" />
          <path d="M 10 20 Q 22 55 10 90" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="40" strokeWidth="3" />
          <path d="M 60 20 L 60 100 M 20 60 L 100 60" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      );
  }
}
