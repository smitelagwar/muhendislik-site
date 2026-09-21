"use client";

import React, { useId } from "react";
import {
  FILE_ICON_META,
  resolveFileIconKind,
  type FileIconKind,
} from "./icon-registry";

export type FileIconSize = "list" | "grid" | "detail" | number;

export type FileTypeIconProps = {
  extension?: string | null;
  mimeType?: string | null;
  kind?: FileIconKind;
  size?: FileIconSize;
  className?: string;
  title?: string;
};

function resolveSize(size: FileIconSize): number {
  if (typeof size === "number") return size;
  if (size === "grid") return 40;
  if (size === "detail") return 48;
  return 24;
}

function FileSymbol({ kind, color }: { kind: FileIconKind; color: string }) {
  const strokeProps = {
    stroke: color,
    fill: "none",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "dwg":
      return (
        <g {...strokeProps}>
          <circle cx="29" cy="25" r="9" />
          <circle cx="29" cy="25" r="2.6" />
          <path d="M29 11v7M29 32v7M15 25h7M36 25h7" />
          <path d="M22 18l-3-3M36 18l3-3M22 32l-3 3M36 32l3 3" opacity=".72" />
        </g>
      );
    case "dxf":
      return (
        <g {...strokeProps}>
          <path d="M16 37 29 13l13 24H16Z" />
          <path d="m22 33 7-13 7 13H22Z" opacity=".72" />
          <path d="M18 37h22M29 13v24" opacity=".55" />
        </g>
      );
    case "pdf":
      return (
        <g {...strokeProps}>
          <path d="M20 35c8-3 13-7 16-12 3-5 1-9-2-8-4 1-3 10 0 16 2 4 6 7 10 8" />
          <path d="M20 35c-5 2-7 6-5 8 2 2 7-1 10-5" />
        </g>
      );
    case "markdown":
      return (
        <g {...strokeProps}>
          <path d="M16 34V20l7 9 7-9v14" />
          <path d="M39 19v15M34 29l5 5 5-5" />
        </g>
      );
    case "image":
      return (
        <g fill={color}>
          <circle cx="39" cy="20" r="4" />
          <path d="m15 37 9-12 7 8 5-6 8 10H15Z" />
        </g>
      );
    case "document":
    case "text":
      return (
        <g {...strokeProps}>
          <path d="M18 19h22M18 26h22M18 33h16" />
        </g>
      );
    case "spreadsheet":
      return (
        <g {...strokeProps}>
          <rect x="17" y="16" width="24" height="20" rx="1" />
          <path d="M25 16v20M33 16v20M17 23h24M17 30h24" />
        </g>
      );
    case "presentation":
      return (
        <g {...strokeProps}>
          <circle cx="29" cy="25" r="11" />
          <path d="M29 14v11h11M29 25l7 8" />
        </g>
      );
    case "archive":
      return (
        <g {...strokeProps}>
          <path d="M28 13h5M28 18h5M28 23h5M28 28h5M28 33h5" />
          <rect x="27" y="34" width="7" height="7" rx="1.5" />
        </g>
      );
    case "code":
      return (
        <g {...strokeProps}>
          <path d="m24 19-7 7 7 7M34 19l7 7-7 7M31 16l-4 20" />
        </g>
      );
    case "video":
      return <path d="m23 17 18 10-18 10V17Z" fill={color} />;
    case "audio":
      return (
        <g {...strokeProps}>
          <path d="M35 15v20M35 18l10-3v17" />
          <circle cx="29" cy="36" r="5" fill={color} stroke="none" />
          <circle cx="40" cy="33" r="5" fill={color} stroke="none" />
        </g>
      );
    case "database":
      return (
        <g {...strokeProps}>
          <ellipse cx="29" cy="18" rx="13" ry="5" />
          <path d="M16 18v14c0 3 6 5 13 5s13-2 13-5V18M16 25c0 3 6 5 13 5s13-2 13-5" />
        </g>
      );
    case "model3d":
      return (
        <g {...strokeProps}>
          <path d="m29 14 12 7-12 7-12-7 12-7Z" />
          <path d="m17 21 12 7 12-7v14l-12 7-12-7V21ZM29 28v14" />
        </g>
      );
    case "cad":
      return (
        <g {...strokeProps}>
          <path d="M16 35c5-13 13-18 27-17" />
          <circle cx="16" cy="35" r="2.5" fill={color} stroke="none" />
          <circle cx="29" cy="24" r="2.5" fill={color} stroke="none" />
          <circle cx="43" cy="18" r="2.5" fill={color} stroke="none" />
          <path d="M17 18h9M21.5 13.5v9" opacity=".7" />
        </g>
      );
    case "config":
      return (
        <g {...strokeProps}>
          <circle cx="29" cy="26" r="6" />
          <path d="M29 13v5M29 34v5M16 26h5M37 26h5M20 17l4 4M34 31l4 4M38 17l-4 4M24 31l-4 4" />
        </g>
      );
    case "font":
      return (
        <g fill={color}>
          <text x="29" y="34" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700">Aa</text>
        </g>
      );
    case "unknown":
    default:
      return (
        <g fill={color}>
          <text x="29" y="35" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="29" fontWeight="800">?</text>
        </g>
      );
  }
}

export function FileTypeIcon({
  extension,
  mimeType,
  kind,
  size = "list",
  className,
  title,
}: FileTypeIconProps) {
  const resolvedKind = kind ?? resolveFileIconKind(extension, mimeType);
  const meta = FILE_ICON_META[resolvedKind];
  const gradientId = `file-icon-gradient-${useId().replace(/:/g, "")}`;
  const shadowId = `file-icon-shadow-${useId().replace(/:/g, "")}`;
  const px = resolveSize(size);

  return (
    <svg
      viewBox="0 0 64 64"
      width={px}
      height={px}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ display: "block", flexShrink: 0 }}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={meta.top} />
          <stop offset="1" stopColor={meta.bottom} />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.3"
            floodColor="#0f172a"
            floodOpacity=".20"
          />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <path
          d="M13 4h26l12 12v38a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6Z"
          fill={`url(#${gradientId})`}
        />
        <path d="M39 4v10a4 4 0 0 0 4 4h8Z" fill="#fff" fillOpacity=".30" />
        <path
          d="M39 4v10a4 4 0 0 0 4 4h8"
          fill="none"
          stroke="#0f172a"
          strokeOpacity=".12"
          strokeWidth="1"
        />
        <path
          d="M7 45h44v9a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6Z"
          fill={meta.band}
        />
      </g>

      <FileSymbol kind={resolvedKind} color={meta.symbol} />

      <text
        x="29"
        y="56.2"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={meta.label.length > 3 ? 7.2 : 9.5}
        fontWeight="800"
        fill="#fff"
        letterSpacing=".2"
      >
        {meta.label}
      </text>
    </svg>
  );
}
