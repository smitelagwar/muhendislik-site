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
      // Rebar bundle cross-section dial
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Stirrup outline */}
          <rect x="15" y="15" width="90" height="90" rx="14" strokeWidth="3" />
          {/* Corner rebars */}
          <circle cx="32" cy="32" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="88" cy="32" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="32" cy="88" r="10" fill={color} fillOpacity="0.4" />
          <circle cx="88" cy="88" r="10" fill={color} fillOpacity="0.4" />
          {/* Intermediate rebars */}
          <circle cx="60" cy="32" r="8" fill={color} fillOpacity="0.3" />
          <circle cx="60" cy="88" r="8" fill={color} fillOpacity="0.3" />
          {/* Stirrup hook */}
          <path d="M 32 22 L 22 32 M 88 22 L 98 32" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "kolon-on-boyutlandirma":
      // Column elevation pillar with axial load force arrows
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Column pillar outline */}
          <rect x="35" y="30" width="50" height="80" rx="6" strokeWidth="3" />
          {/* Rebar lines */}
          <line x1="45" y1="30" x2="45" y2="110" strokeDasharray="4 3" />
          <line x1="75" y1="30" x2="75" y2="110" strokeDasharray="4 3" />
          {/* Stirrup ties */}
          <line x1="35" y1="50" x2="85" y2="50" />
          <line x1="35" y1="70" x2="85" y2="70" />
          <line x1="35" y1="90" x2="85" y2="90" />
          {/* Axial load P arrow */}
          <path d="M 60 5 L 60 25 M 53 18 L 60 25 L 67 18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "kiris-kesiti":
      // Beam bending moment curve & shear force diagram
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Beam outline */}
          <rect x="10" y="35" width="100" height="30" rx="4" strokeWidth="3" />
          {/* Supports */}
          <path d="M 15 65 L 25 80 L 5 80 Z M 105 65 L 115 80 L 95 80 Z" />
          {/* Distributed load arrows */}
          <path d="M 30 15 L 30 35 M 26 28 L 30 35 L 34 28" />
          <path d="M 60 10 L 60 35 M 56 28 L 60 35 L 64 28" strokeWidth="3" />
          <path d="M 90 15 L 90 35 M 86 28 L 90 35 L 94 28" />
          <line x1="20" y1="15" x2="100" y2="15" strokeDasharray="3 3" />
          {/* Parabolic moment curve */}
          <path d="M 15 90 Q 60 118 105 90" strokeWidth="3" strokeDasharray="5 3" />
        </svg>
      );

    case "doseme-kalinligi":
      // Two-way slab grid & mesh reinforcement
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Slab perspective slab box */}
          <polygon points="20,40 80,20 110,60 50,80" strokeWidth="3" />
          <polygon points="20,40 50,80 50,100 20,60" strokeWidth="2.5" />
          <polygon points="50,80 110,60 110,80 50,100" strokeWidth="2.5" />
          {/* Mesh reinforcement grid inside */}
          <line x1="35" y1="35" x2="65" y2="75" strokeDasharray="3 3" />
          <line x1="50" y1="30" x2="80" y2="70" strokeDasharray="3 3" />
          <line x1="65" y1="25" x2="95" y2="65" strokeDasharray="3 3" />
          <line x1="35" y1="55" x2="95" y2="35" strokeDasharray="3 3" />
          <line x1="42" y1="65" x2="102" y2="45" strokeDasharray="3 3" />
        </svg>
      );

    case "pas-payi":
      // Concrete cover dimension detail & protective shield
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Concrete corner boundary */}
          <path d="M 15 15 L 105 15 L 105 105" strokeWidth="3.5" />
          {/* Rebar circle */}
          <circle cx="65" cy="65" r="22" strokeWidth="3" />
          <circle cx="65" cy="65" r="10" fill={color} fillOpacity="0.3" />
          {/* Concrete cover distance arrows c_nom */}
          <line x1="15" y1="65" x2="43" y2="65" strokeWidth="2.5" />
          <path d="M 22 60 L 15 65 L 22 70 M 36 60 L 43 65 L 36 70" strokeWidth="2" />
          <line x1="65" y1="15" x2="65" y2="43" strokeWidth="2.5" />
          <path d="M 60 22 L 65 15 L 70 22 M 60 36 L 65 43 L 70 36" strokeWidth="2" />
          {/* Protective shield emblem */}
          <path d="M 85 80 C 85 95 100 105 100 105 C 100 105 115 95 115 80 L 115 70 L 100 65 L 85 70 Z" strokeWidth="2" />
        </svg>
      );

    case "kalip-sokum-suresi":
      // Formwork removal calendar & strength curve stopwatch
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Timer dial circle */}
          <circle cx="60" cy="65" r="42" strokeWidth="3" />
          {/* Top stopwatch button */}
          <path d="M 52 14 L 68 14 M 60 14 L 60 23" strokeWidth="3" strokeLinecap="round" />
          <path d="M 85 30 L 92 23" strokeWidth="3" strokeLinecap="round" />
          {/* Gauge hand pointing at 70% fck */}
          <line x1="60" y1="65" x2="80" y2="48" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="65" r="5" fill={color} />
          {/* Calendar ticks */}
          <line x1="60" y1="30" x2="60" y2="36" strokeWidth="3" />
          <line x1="95" y1="65" x2="89" y2="65" strokeWidth="3" />
          <line x1="60" y1="100" x2="60" y2="94" strokeWidth="3" />
          <line x1="25" y1="65" x2="31" y2="65" strokeWidth="3" />
        </svg>
      );

    case "dis-cephe-yalitim-kalinligi":
      // Wall insulation layers & thermal heat waves
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Concrete wall layer */}
          <rect x="15" y="20" width="30" height="80" rx="3" strokeWidth="3" />
          <line x1="20" y1="20" x2="40" y2="40" strokeWidth="1.5" />
          <line x1="20" y1="50" x2="40" y2="70" strokeWidth="1.5" />
          <line x1="20" y1="80" x2="35" y2="95" strokeWidth="1.5" />
          {/* Insulation layer (hatched) */}
          <rect x="45" y="20" width="25" height="80" rx="2" strokeWidth="3" fill={color} fillOpacity="0.15" />
          <path d="M 50 25 L 65 35 M 50 45 L 65 55 M 50 65 L 65 75 M 50 85 L 65 95" strokeWidth="1.5" />
          {/* Plaster finish layer */}
          <rect x="70" y="20" width="8" height="80" rx="1" strokeWidth="2" />
          {/* Thermal heat waves */}
          <path d="M 88 35 Q 98 42 88 50 Q 98 58 88 65" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 100 30 Q 110 40 100 50 Q 110 60 100 70" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "imar-hesaplayici":
      // Cadastral plot map & TAKS/KAKS footprint box
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Gross parcel boundary */}
          <rect x="15" y="15" width="90" height="90" rx="8" strokeWidth="3" strokeDasharray="6 4" />
          {/* Setback lines (Ön, arka, yan çekme) */}
          <rect x="35" y="35" width="50" height="50" rx="4" strokeWidth="3" fill={color} fillOpacity="0.2" />
          {/* Dimension lines */}
          <line x1="15" y1="35" x2="35" y2="35" strokeDasharray="2 2" />
          <line x1="85" y1="35" x2="105" y2="35" strokeDasharray="2 2" />
          <line x1="35" y1="15" x2="35" y2="35" strokeDasharray="2 2" />
          <line x1="35" y1="85" x2="35" y2="105" strokeDasharray="2 2" />
          {/* Building roof cross diagonal */}
          <line x1="35" y1="35" x2="85" y2="85" strokeWidth="1.5" />
          <line x1="85" y1="35" x2="35" y2="85" strokeWidth="1.5" />
        </svg>
      );

    case "taban-kesme-kuvveti":
      // Seismic lateral force waves & building oscillation frame
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Base ground line */}
          <line x1="10" y1="105" x2="110" y2="105" strokeWidth="4" />
          {/* Building frame oscillating sideways */}
          <path d="M 30 105 L 42 25 L 82 25 L 90 105" strokeWidth="3" />
          {/* Story floor slabs */}
          <line x1="33" y1="85" x2="88" y2="85" strokeWidth="2.5" />
          <line x1="36" y1="65" x2="86" y2="65" strokeWidth="2.5" />
          <line x1="39" y1="45" x2="84" y2="45" strokeWidth="2.5" />
          {/* Seismic lateral force arrows (F_i) */}
          <path d="M 5 45 L 33 45 M 23 40 L 33 45 L 23 50" strokeWidth="2.5" />
          <path d="M 5 25 L 38 25 M 28 20 L 38 25 L 28 30" strokeWidth="3" />
          {/* Seismic ground waves at bottom */}
          <path d="M 15 113 Q 25 108 35 113 Q 45 118 55 113 Q 65 108 75 113 Q 85 118 95 113" strokeWidth="2" />
        </svg>
      );

    case "duzensizlik-kontrolu":
      // Torsional irregularity center of mass vs rigidity & rotation
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Irregular plan layout shape */}
          <path d="M 20 20 L 95 20 L 95 60 L 60 60 L 60 100 L 20 100 Z" strokeWidth="3" />
          {/* Center of Mass (M) */}
          <circle cx="45" cy="45" r="7" fill={color} fillOpacity="0.4" strokeWidth="2" />
          <text x="45" y="48" textAnchor="middle" fontSize="8" fill={color} fontWeight="900">M</text>
          {/* Center of Rigidity (R) */}
          <circle cx="68" cy="38" r="7" strokeWidth="2.5" />
          <text x="68" y="41" textAnchor="middle" fontSize="8" fill={color} fontWeight="900">R</text>
          {/* Eccentricity offset line e_x */}
          <line x1="45" y1="45" x2="68" y2="38" strokeDasharray="3 3" strokeWidth="2" />
          {/* Torsional rotation arc arrow */}
          <path d="M 85 75 A 30 30 0 0 1 45 92" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 45 92 L 53 87 M 45 92 L 51 98" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "zemin-sinifi":
      // Stratified geotechnical soil log & Vs30 velocity wave
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          className={commonClasses}
          aria-hidden="true"
        >
          {/* Borehole container */}
          <rect x="25" y="15" width="70" height="90" rx="4" strokeWidth="3" />
          {/* Soil stratum layer 1 (loose soil) */}
          <line x1="25" y1="40" x2="95" y2="40" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="38" cy="28" r="2" fill={color} />
          <circle cx="55" cy="32" r="3" fill={color} />
          <circle cx="78" cy="26" r="2" fill={color} />
          {/* Soil stratum layer 2 (dense clay) */}
          <line x1="25" y1="70" x2="95" y2="70" strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1="35" y1="48" x2="55" y2="62" strokeWidth="1.5" />
          <line x1="60" y1="48" x2="80" y2="62" strokeWidth="1.5" />
          {/* Soil stratum layer 3 (bedrock ZA/ZB) */}
          <path d="M 25 80 L 40 105 M 45 70 L 70 105 M 70 70 L 95 105" strokeWidth="2" />
          {/* Shear wave velocity Vs30 profile curve */}
          <path d="M 10 20 Q 22 55 10 90" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    default:
      // Generic fallback engineering icon
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
