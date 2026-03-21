"use client";

import { Pie, PieChart, Cell, Tooltip } from "recharts";
import type { CalculationResultSnapshot } from "@/lib/calculations/types";

interface ChartDatum {
  name: string;
  value: number;
  color: string;
  pct: string;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload: ChartDatum;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        {data.name}
      </p>
      <p className="text-sm font-bold tabular-nums" style={{ color: data.payload.color }}>
        {(data.value ?? 0).toLocaleString("tr-TR")} TL
      </p>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">%{data.payload.pct}</p>
    </div>
  );
}

export function MaliyetChart({ snapshot }: { snapshot: CalculationResultSnapshot }) {
  const data: ChartDatum[] = [
    {
      name: "Kaba Isler",
      value: snapshot.kabaIsToplamı,
      color: "#0ea5e9",
      pct: (snapshot.kabaIsPct * 100).toFixed(1),
    },
    {
      name: "Ince Isler",
      value: snapshot.inceIsToplamı,
      color: "#10b981",
      pct: (snapshot.inceIsPct * 100).toFixed(1),
    },
    {
      name: "Diger Giderler",
      value: snapshot.digerToplamı,
      color: "#8b5cf6",
      pct: (snapshot.digerPct * 100).toFixed(1),
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="flex min-h-56 w-full items-center justify-center">
      {data.length > 0 ? (
        <PieChart width={280} height={220}>
          <Pie
            data={data}
            cx={140}
            cy={110}
            innerRadius={56}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            cornerRadius={5}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: "transparent" }}
            content={<CustomTooltip />}
          />
        </PieChart>
      ) : (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Veri hesaplaniyor...</span>
      )}
    </div>
  );
}
