"use client";

import { useEffect, useState } from "react";

interface RotatingItem {
  text: string;
  icon: string;
  color: string;
}

const ROTATING_ITEMS: RotatingItem[] = [
  { text: "Şantiye Şefleri", icon: "👷", color: "text-amber-500 dark:text-amber-400" },
  { text: "İnşaat Mühendisleri", icon: "🏗️", color: "text-blue-500 dark:text-blue-400" },
  { text: "Mimarlar", icon: "📐", color: "text-violet-500 dark:text-violet-400" },
  { text: "Proje Yöneticileri", icon: "📋", color: "text-emerald-500 dark:text-emerald-400" },
  { text: "Yapı Denetçileri", icon: "🔍", color: "text-cyan-500 dark:text-cyan-400" },
];

export function TextRotater() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_ITEMS.length);
        setIsTransitioning(false);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const currentItem = ROTATING_ITEMS[index];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-1 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-300 dark:border-white/15 dark:bg-white/[0.06]"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <span
        className={`inline-flex items-center gap-2 transition-all duration-350 ${
          isTransitioning
            ? "translate-y-3 scale-95 opacity-0"
            : "translate-y-0 scale-100 opacity-100"
        } ${currentItem.color}`}
      >
        <span>{currentItem.text}</span>
        <span className="text-xl" aria-hidden="true">
          {currentItem.icon}
        </span>
      </span>
    </span>
  );
}
