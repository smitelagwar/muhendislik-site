"use client";

import React, { type ReactNode } from "react";

interface ChromaticGlassButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}

export function ChromaticGlassButton({
  children,
  href,
  onClick,
  className = "",
  icon,
}: ChromaticGlassButtonProps) {
  const content = (
    <div className={`chromatic-btn group relative cursor-pointer px-7 py-3.5 ${className}`}>
      {/* 4 Blurry Chromatic Color Nodes underneath glass */}
      <div className="chromatic-layer">
        {/* Color 1: Cyan / Blue */}
        <div
          className="absolute -left-2 -top-2 h-12 w-12 rounded-full opacity-80"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, rgba(6,182,212,0) 70%)",
            animation: "chromatic-spin 8s linear infinite",
          }}
        />
        {/* Color 2: Magenta / Rose */}
        <div
          className="absolute -bottom-2 -right-2 h-14 w-14 rounded-full opacity-85"
          style={{
            background: "radial-gradient(circle, #ec4899 0%, rgba(236,72,153,0) 70%)",
            animation: "chromatic-spin 7s linear infinite reverse",
          }}
        />
        {/* Color 3: Amber / Gold */}
        <div
          className="absolute left-1/3 -top-3 h-10 w-10 rounded-full opacity-90"
          style={{
            background: "radial-gradient(circle, #f59e0b 0%, rgba(245,158,11,0) 70%)",
            animation: "chromatic-pulse 4s ease-in-out infinite",
          }}
        />
        {/* Color 4: Violet / Indigo */}
        <div
          className="absolute -bottom-2 left-1/4 h-12 w-12 rounded-full opacity-75"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, rgba(139,92,246,0) 70%)",
            animation: "chromatic-spin 9s linear infinite",
          }}
        />
      </div>

      {/* Frosted Glass Pill Surface */}
      <div className="chromatic-btn-bg" />

      {/* Text Label & Icon Content */}
      <span className="relative z-10 flex items-center gap-2.5 font-sans text-sm font-black tracking-tight text-foreground transition-transform duration-200 group-hover:scale-[1.02] dark:text-white">
        {children}
        {icon && (
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            {icon}
          </span>
        )}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block no-underline">
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="border-0 bg-transparent p-0">
      {content}
    </button>
  );
}
