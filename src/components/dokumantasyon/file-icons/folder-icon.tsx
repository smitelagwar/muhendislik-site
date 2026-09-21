"use client";

import React, { useId } from "react";
import type { FileIconSize } from "./file-type-icon";

function resolveSize(size: FileIconSize): number {
  if (typeof size === "number") return size;
  if (size === "grid") return 40;
  if (size === "detail") return 48;
  return 28;
}

export function FolderIcon({
  size = "list",
  className,
  title,
}: {
  size?: FileIconSize;
  className?: string;
  title?: string;
}) {
  const px = resolveSize(size);
  const base = useId().replace(/:/g, "");
  const backId = `folder-back-${base}`;
  const frontId = `folder-front-${base}`;
  const shadowId = `folder-shadow-${base}`;

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
        <linearGradient id={backId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb21a" />
          <stop offset="1" stopColor="#f48a05" />
        </linearGradient>
        <linearGradient id={frontId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd057" />
          <stop offset="1" stopColor="#ffae1a" />
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
          d="M7 18a5 5 0 0 1 5-5h13l5 6h22a5 5 0 0 1 5 5v23a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6Z"
          fill={`url(#${backId})`}
        />
        <path
          d="M10 26h44a4 4 0 0 1 4 5l-4 18a6 6 0 0 1-6 5H12a6 6 0 0 1-6-7l3-18a4 4 0 0 1 1-3Z"
          fill={`url(#${frontId})`}
        />
        <path d="M11 26h43" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
