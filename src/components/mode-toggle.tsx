"use client";

import { useTheme } from "next-themes";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = resolvedTheme !== undefined;

  const handleToggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mounted ? resolvedTheme === "dark" : false}
      data-testid="theme-toggle"
      aria-label="Tema görünümünü değiştir"
      onClick={handleToggle}
      className="relative inline-flex h-8 w-16 shrink-0 items-center rounded-full transition-all duration-500 ease-in-out bg-gradient-to-br from-sky-400 to-sky-300 dark:from-slate-900 dark:to-slate-800 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-sky-300/50 dark:border-slate-800/50"
    >
      {/* Gökyüzü Katmanı (Bulutlar ve Yıldızlar) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bulutlar */}
        <div className="absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] translate-y-0 dark:translate-y-full opacity-100 dark:opacity-0">
          {/* Büyük Bulut */}
          <div className="absolute top-[12px] right-[4px] w-[22px] h-[6px] bg-white rounded-full opacity-95 shadow-[0_2px_3px_rgba(0,0,0,0.1)]">
            <div className="absolute bottom-0 right-[4px] w-[12px] h-[12px] bg-white rounded-full"></div>
            <div className="absolute bottom-0 left-[2px] w-[8px] h-[8px] bg-white rounded-full"></div>
          </div>
          {/* Küçük Bulut */}
          <div className="absolute top-[21px] right-[26px] w-[10px] h-[3px] bg-white/90 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="absolute bottom-0 right-[2px] w-[5px] h-[5px] bg-white/90 rounded-full"></div>
          </div>
        </div>

        {/* Yıldızlar */}
        <div className="absolute inset-0 transition-opacity duration-500 ease-in-out opacity-0 dark:opacity-100">
          <div className="absolute top-[6px] left-[10px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.8)] animate-pulse"></div>
          <div className="absolute top-[14px] left-[24px] h-[1.5px] w-[1.5px] rounded-full bg-white shadow-[0_0_2px_1px_rgba(255,255,255,0.6)]"></div>
          <div className="absolute top-[20px] left-[8px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.9)] animate-[pulse_2s_ease-in-out_infinite]"></div>
          <div className="absolute top-[10px] left-[18px] h-[1px] w-[1px] rounded-full bg-white shadow-[0_0_1px_1px_rgba(255,255,255,0.4)] animate-[pulse_3s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Dönen ve Hareket Eden Güneş/Ay (Thumb) */}
      <div
        className="absolute left-[3px] flex h-[26px] w-[26px] transform items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] dark:translate-x-[26px] dark:rotate-[360deg] bg-gradient-to-br from-teal-300 to-teal-400 dark:from-slate-200 dark:to-slate-300 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_2px_5px_rgba(252,211,77,0.6)] dark:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_5px_rgba(0,0,0,0.5)] z-10"
      >
        {/* Güneş Işıltısı (Gündüz) */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_6px_rgba(255,255,255,0.8)] opacity-100 dark:opacity-0 transition-opacity duration-500"></div>

        {/* Ay Kraterleri (Gece) */}
        <div className="absolute inset-0 rounded-full opacity-0 dark:opacity-100 transition-opacity duration-500">
          <div className="absolute top-[5px] right-[6px] h-[6px] w-[6px] rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="absolute bottom-[5px] right-[13px] h-[4px] w-[4px] rounded-full bg-slate-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="absolute top-[14px] left-[5px] h-[3px] w-[3px] rounded-full bg-slate-300 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
        </div>
      </div>
    </button>
  );
}
