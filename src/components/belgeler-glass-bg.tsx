"use client";

export function BelgelerGlassBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Light Mode Subtle Base Tint / Dark Mode Cosmic Radial Base */}
      <div
        className="absolute inset-0 opacity-100 transition-colors duration-500 dark:opacity-100"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, var(--site-surface-raised, rgba(255,255,255,0.8)) 0%, var(--site-bg, transparent) 100%)",
        }}
      />

      {/* --- High-Vibrancy Glowing Volumetric Chromatic Blobs --- */}

      {/* Blob 1: Radiant Amber Gold (Top Right & Hero) */}
      <div
        className="absolute -right-20 -top-20 h-[650px] w-[650px] rounded-full opacity-35 dark:opacity-55"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.85) 0%, rgba(217,119,6,0.35) 45%, rgba(245,158,11,0.05) 70%, transparent 85%)",
          filter: "blur(90px)",
          WebkitFilter: "blur(90px)",
          animation: "orb-drift-1 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 2: Electric Cobalt Blue (Bottom Left Behind Cards) */}
      <div
        className="absolute -bottom-24 -left-24 h-[620px] w-[620px] rounded-full opacity-30 dark:opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.35) 45%, rgba(59,130,246,0.05) 70%, transparent 85%)",
          filter: "blur(95px)",
          WebkitFilter: "blur(95px)",
          animation: "orb-drift-2 26s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 3: Neon Violet / Purple (Center Hub Area) */}
      <div
        className="absolute left-1/3 top-1/3 h-[550px] w-[550px] rounded-full opacity-25 dark:opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.75) 0%, rgba(124,58,237,0.3) 45%, rgba(139,92,246,0.05) 70%, transparent 85%)",
          filter: "blur(90px)",
          WebkitFilter: "blur(90px)",
          animation: "orb-drift-3 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 4: Vivid Cyan & Turquoise (Right Middle Behind Cards) */}
      <div
        className="absolute -right-16 top-1/2 h-[500px] w-[500px] rounded-full opacity-25 dark:opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.75) 0%, rgba(14,165,233,0.3) 45%, rgba(6,182,212,0.05) 70%, transparent 85%)",
          filter: "blur(85px)",
          WebkitFilter: "blur(85px)",
          animation: "orb-drift-4 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Blob 5: Sunset Coral / Rose (Bottom Center) */}
      <div
        className="absolute bottom-10 left-1/3 h-[480px] w-[480px] rounded-full opacity-20 dark:opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(244,63,94,0.7) 0%, rgba(236,72,153,0.25) 45%, transparent 80%)",
          filter: "blur(90px)",
          WebkitFilter: "blur(90px)",
          animation: "orb-drift-5 28s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* --- Floating Frosted Glass Shapes Behind Cards --- */}
      {/* Floating Glass Sphere 1 */}
      <div
        className="absolute left-[10%] top-[28%] h-32 w-32 rounded-full border border-black/5 bg-white/40 opacity-70 shadow-lg backdrop-blur-md dark:border-white/25 dark:bg-white/10 dark:opacity-65"
        style={{
          animation: "orb-drift-1 18s ease-in-out infinite reverse",
          willChange: "transform",
        }}
      />

      {/* Floating Glass Prism 2 */}
      <div
        className="absolute right-[12%] top-[42%] h-36 w-36 rotate-45 rounded-[32px] border border-black/5 bg-white/30 opacity-65 shadow-lg backdrop-blur-md dark:border-white/20 dark:bg-white/[0.08] dark:opacity-60"
        style={{
          animation: "orb-drift-4 24s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Floating Glass Pill 3 */}
      <div
        className="absolute left-[38%] bottom-[22%] h-20 w-52 -rotate-12 rounded-full border border-cyan-500/15 bg-cyan-500/10 opacity-60 shadow-lg backdrop-blur-md dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:opacity-50"
        style={{
          animation: "orb-drift-3 22s ease-in-out infinite reverse",
          willChange: "transform",
        }}
      />

      {/* Blueprint Grid Overlay for Structural Aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
