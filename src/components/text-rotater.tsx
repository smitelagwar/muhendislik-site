"use client";

import { useEffect, useState } from "react";

const ROLES = [
  "Şantiye Şefleri",
  "İnşaat Mühendisleri",
  "Mimarlar",
  "Proje Yöneticileri",
  "Yapı Denetçileri",
];

export function TextRotater() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROLES.length);
        setFade(false);
      }, 200);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block min-w-[280px] sm:min-w-[340px] text-amber-500 dark:text-amber-400">
      <span
        className={`inline-block transition-all duration-200 ${
          fade ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {ROLES[index]}
      </span>
    </span>
  );
}
