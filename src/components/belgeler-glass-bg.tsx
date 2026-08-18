"use client";

export function BelgelerGlassBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Light Mode Subtle Warm Radial / Dark Mode Cosmic Radial Base */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: "radial-gradient(ellipse at 50% 10%, var(--site-surface-raised, rgba(255,255,255,0.9)) 0%, var(--site-bg, transparent) 100%)",
        }}
      />

      {/* --- Radiant Volumetric Ambient Blobs --- */}

      {/* Blob 1: Warm Amber Gold (Top Right / Hero) */}
      <div
        className="absolute -right-20 -top-20 h-[700px] w-[700px] rounded-full opacity-30 dark:opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.85) 0%, rgba(217,119,6,0.35) 45%, transparent 75%)",
          filter: "blur(110px)",
          WebkitFilter: "blur(110px)",
          animation: "orb-drift-1 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 2: Electric Cobalt Blue (Bottom Left Behind Cards) */}
      <div
        className="absolute -bottom-24 -left-24 h-[650px] w-[650px] rounded-full opacity-25 dark:opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.3) 45%, transparent 75%)",
          filter: "blur(110px)",
          WebkitFilter: "blur(110px)",
          animation: "orb-drift-2 26s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 3: Neon Violet / Purple (Center Hub Area) */}
      <div
        className="absolute left-1/3 top-1/3 h-[580px] w-[580px] rounded-full opacity-20 dark:opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.7) 0%, rgba(124,58,237,0.25) 45%, transparent 75%)",
          filter: "blur(100px)",
          WebkitFilter: "blur(100px)",
          animation: "orb-drift-3 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 4: Vivid Cyan & Turquoise (Right Middle Behind Cards) */}
      <div
        className="absolute -right-16 top-1/2 h-[540px] w-[540px] rounded-full opacity-20 dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.75) 0%, rgba(14,165,233,0.25) 45%, transparent 75%)",
          filter: "blur(100px)",
          WebkitFilter: "blur(100px)",
          animation: "orb-drift-4 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}
