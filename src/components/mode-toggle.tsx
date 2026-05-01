"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rgb-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .rgb-border-wrapper {
          background: linear-gradient(90deg, #ff0000, #ff8c00, #ffe400, #008000, #0000ff, #4b0082, #ee82ee, #ff0000);
          background-size: 300% 300%;
          animation: rgb-flow 6s linear infinite;
        }
        @keyframes planet-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-planet {
          animation: planet-spin 15s linear infinite;
        }
      `}} />
      <div className="rgb-border-wrapper rounded-full p-[2px] inline-flex shadow-[0_0_12px_rgba(255,255,255,0.2)] dark:shadow-[0_0_12px_rgba(255,255,255,0.1)]">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          data-testid="theme-toggle"
          aria-label="Tema görünümünü değiştir"
          onClick={handleToggle}
          className={`
            relative inline-flex h-10 w-20 shrink-0 items-center rounded-full 
            transition-colors duration-[800ms] ease-in-out overflow-hidden
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
            ${isDark ? 'bg-[#1e293b]' : 'bg-[#38bdf8]'}
          `}
        >
          {/* Background Elements Container */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            
            {/* Sky / Clouds (Light Mode) */}
            <div 
              className={`
                absolute inset-0 transition-transform duration-[800ms] ease-in-out
                ${isDark ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
              `}
            >
              {/* Cloud SVG 1 (Bottom Right) */}
              <svg className="absolute bottom-[4px] right-[6px] w-[28px] h-[14px] text-white opacity-95" viewBox="0 0 24 12" fill="currentColor">
                <path d="M17.5 12A4.5 4.5 0 0 0 17.5 3c-.22 0-.44.02-.65.06A6.5 6.5 0 0 0 4.5 6.5c0 .32.03.63.08.93A3.5 3.5 0 0 0 4.5 12h13z" />
              </svg>
              
              {/* Cloud SVG 2 (Top Left/Mid, behind sun slightly) */}
              <svg className="absolute top-[8px] left-[32px] w-[16px] h-[8px] text-white opacity-80" viewBox="0 0 24 12" fill="currentColor">
                <path d="M17.5 12A4.5 4.5 0 0 0 17.5 3c-.22 0-.44.02-.65.06A6.5 6.5 0 0 0 4.5 6.5c0 .32.03.63.08.93A3.5 3.5 0 0 0 4.5 12h13z" />
              </svg>

              {/* Bird Silhouette (Top Right) */}
              <svg className="absolute top-[8px] right-[20px] w-[14px] h-[10px] text-white opacity-70" viewBox="0 0 24 16" fill="currentColor">
                <path d="M 2 12 Q 6 4 12 10 Q 18 4 22 12 Q 18 8 12 13 Q 6 8 2 12 Z" />
              </svg>
            </div>

            {/* Stars (Dark Mode) */}
            <div 
              className={`
                absolute inset-0 transition-opacity duration-[800ms] ease-in-out
                ${isDark ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <div className="absolute top-[10px] left-[12px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.7)] animate-[pulse_2s_ease-in-out_infinite]"></div>
              <div className="absolute top-[20px] left-[24px] h-[1px] w-[1px] rounded-full bg-slate-200"></div>
              <div className="absolute top-[26px] left-[14px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]"></div>
              <div className="absolute top-[8px] left-[28px] h-[1.5px] w-[1.5px] rounded-full bg-slate-100"></div>
              <div className="absolute top-[18px] left-[34px] h-[1px] w-[1px] rounded-full bg-white opacity-50"></div>
            </div>
          </div>

          {/* Thumb (Sun / Moon) */}
          <div
            className={`
              absolute flex h-[32px] w-[32px] transform items-center justify-center rounded-full 
              transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-10
              shadow-[0_2px_4px_rgba(0,0,0,0.2)]
              ${isDark 
                ? 'left-[4px] translate-x-[40px] rotate-[360deg]' 
                : 'left-[4px] translate-x-0 rotate-0'}
            `}
          >
            {/* Sun details */}
            <div 
              className={`
                absolute inset-0 rounded-full transition-opacity duration-[800ms]
                bg-[#fbbf24]
                shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(251,191,36,0.6)]
                ${isDark ? 'opacity-0' : 'opacity-100'}
              `}
            >
              {/* Sparkle 1 */}
              <svg className="absolute top-[4px] right-[6px] w-[6px] h-[6px] text-white animate-pulse opacity-90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
              </svg>
              {/* Sparkle 2 */}
              <svg className="absolute bottom-[6px] left-[6px] w-[4px] h-[4px] text-white/80 animate-[pulse_2s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
              </svg>
            </div>

            {/* Moon details */}
            <div 
              className={`
                absolute inset-0 rounded-full transition-opacity duration-[800ms] overflow-hidden
                bg-gradient-to-br from-[#f8fafc] via-[#cbd5e1] to-[#64748b]
                shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.4),inset_2px_2px_6px_rgba(255,255,255,0.9),0_0_10px_rgba(255,255,255,0.3)]
                ${isDark ? 'opacity-100' : 'opacity-0'}
              `}
            >
              {/* Rotating Craters Container */}
              <div className="absolute inset-0 animate-planet">
                {/* Büyük Krater */}
                <div className="absolute top-[4px] right-[4px] h-[10px] w-[10px] rounded-full bg-[#94a3b8] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),0_1px_2px_rgba(255,255,255,0.8)]"></div>
                {/* Orta Krater */}
                <div className="absolute bottom-[4px] left-[8px] h-[7px] w-[7px] rounded-full bg-[#94a3b8] shadow-[inset_1px_2px_3px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.7)]"></div>
                {/* Küçük Krater */}
                <div className="absolute top-[14px] left-[4px] h-[4px] w-[4px] rounded-full bg-[#cbd5e1] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.8)]"></div>
                {/* Minik Krater 1 */}
                <div className="absolute top-[14px] right-[10px] h-[3px] w-[3px] rounded-full bg-[#94a3b8] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.6)]"></div>
                {/* Minik Krater 2 */}
                <div className="absolute bottom-[6px] right-[6px] h-[4px] w-[4px] rounded-full bg-[#94a3b8] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.6)]"></div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
