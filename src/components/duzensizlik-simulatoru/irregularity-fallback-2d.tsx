"use client";

import type { IrregularityScenario } from "./building-viewer";

const LABELS: Record<IrregularityScenario, string> = {
  A1: "Burulma — plan şeması",
  A2: "Döşeme süreksizliği — plan şeması",
  A3: "Planda çıkıntı — plan şeması",
  B1: "Zayıf kat — görünüş şeması",
  B2: "Yumuşak kat — görünüş şeması",
  B3: "Düşey süreksizlik — görünüş şeması",
};

export function IrregularityFallback2D({ scenario }: { scenario: IrregularityScenario }) {
  const plan = scenario.startsWith("A");
  return (
    <div data-testid="irregularity-2d-diagram" className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-auto px-5 py-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">2B öğretici şema</p>
      <h2 className="text-base font-bold text-slate-100">{LABELS[scenario]}</h2>
      <svg viewBox="0 0 420 330" className="max-h-[min(64vh,490px)] w-full max-w-[620px]" role="img" aria-label={LABELS[scenario]}>
        <rect width="420" height="330" rx="16" fill="#102236"/>
        {plan ? (
          <>
            {scenario === "A3" ? (
              <path d="M90 55H282V135H345V280H90Z" fill="#35546d" stroke="#b9e7fc" strokeWidth="4"/>
            ) : (
              <rect x="90" y="55" width="245" height="225" rx="3" fill="#35546d" stroke="#b9e7fc" strokeWidth="4"/>
            )}
            {[142, 215, 285].map(x => <path key={x} d={`M${x} 55V280`} stroke="#86aac4" opacity=".45" strokeDasharray="4 6"/>)}
            {[112, 190, 250].map(y => <path key={y} d={`M90 ${y}H335`} stroke="#86aac4" opacity=".45" strokeDasharray="4 6"/>)}
            {scenario === "A1" && (
              <>
                <rect x="102" y="112" width="31" height="110" fill="#f4ad69"/>
                <circle cx="215" cy="167" r="9" fill="#59d5dc"/>
                <circle cx="118" cy="167" r="9" fill="#f4ad69"/>
                <path d="M188 85A94 94 0 0 1 301 169" fill="none" stroke="#ff7977" strokeWidth="6" strokeLinecap="round"/>
                <path d="M297 145L302 174L321 150" fill="none" stroke="#ff7977" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="210" y="310" textAnchor="middle" fill="#d8e9f4" fontSize="13">Asimetrik rijitlik ve burulma etkisi</text>
              </>
            )}
            {scenario === "A2" && (
              <>
                <rect x="168" y="120" width="94" height="100" fill="#102236" stroke="#ff7977" strokeWidth="5" strokeDasharray="8 5"/>
                <text x="215" y="176" fill="#ffe6e6" textAnchor="middle" fontSize="15">BOŞLUK</text>
                <text x="210" y="310" textAnchor="middle" fill="#d8e9f4" fontSize="13">Döşeme süreksizliği</text>
              </>
            )}
            {scenario === "A3" && (
              <>
                <circle cx="282" cy="135" r="13" fill="none" stroke="#ff7977" strokeWidth="5"/>
                <path d="M304 111L345 75" stroke="#ff7977" strokeWidth="3"/>
                <text x="305" y="61" textAnchor="middle" fill="#ffd6d6" fontSize="13">İç köşe</text>
                <text x="210" y="310" textAnchor="middle" fill="#d8e9f4" fontSize="13">Çıkıntılı plan geometrisi</text>
              </>
            )}
          </>
        ) : (
          <>
            <rect x="77" y="265" width="272" height="17" fill="#56738a"/>
            {[83, 124, 165, 206, 247].map((y, i) => (
              <g key={i}>
                <rect x="90" y={y} width="240" height="10" rx="2" fill="#91b8d0"/>
                {scenario === "B1" && i === 4 && <rect x="90" y={y + 10} width="240" height="31" fill="#f16f68" opacity=".36"/>}
                {scenario === "B2" && i === 4 && <rect x="90" y={y + 10} width="240" height="31" fill="#f4ad69" opacity=".27"/>}
              </g>
            ))}
            {[95, 210, 325].map((x, col) => (
              <g key={x}>
                {Array.from({ length: 5 }, (_, floor) => {
                  const y = 93 + floor * 41;
                  const gap = scenario === "B3" && col === 2 && floor === 4;
                  return gap ? null : <rect key={floor} x={x} y={y} width="9" height="41" fill={scenario === "B1" && floor === 4 ? "#f16f68" : "#7dc7d6"}/>;
                })}
              </g>
            ))}
            {scenario === "B3" && (
              <>
                <rect x="290" y="247" width="44" height="11" fill="#ffb66a"/>
                <path d="M327 247L372 222" stroke="#ff7977" strokeWidth="3"/>
                <text x="365" y="210" fill="#ffd6d6" textAnchor="middle" fontSize="12">Kesinti</text>
              </>
            )}
            <text x="210" y="308" textAnchor="middle" fill="#d8e9f4" fontSize="13">
              {scenario === "B1" ? "Düşük dayanımlı kat" : scenario === "B2" ? "Göreli kat ötelenmesi yoğunlaşması" : "Düşey taşıyıcıda süreksizlik"}
            </text>
          </>
        )}
      </svg>
      <p className="max-w-md text-xs leading-5 text-slate-400">Ölçeksiz eğitim çizimi. Mühendislik hesabı değildir.</p>
    </div>
  );
}
