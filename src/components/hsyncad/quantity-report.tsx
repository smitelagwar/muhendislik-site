"use client";
import { useMemo, useState } from "react";
import type { CadModel } from "@/lib/hsyncad/model";
import type { JunctionResult } from "@/lib/hsyncad/junctions";
import { ELEMENT_NAMES, quantityReport, reportCsv, type ReportOptions, type ReportGrouping } from "@/lib/hsyncad/reports";

export default function QuantityReport({ model, junctions }: { model: CadModel; junctions: JunctionResult }) {
  const [options, setOptions] = useState<ReportOptions>({ grouping: "floor-type", floorId: "", types: ["column", "beam", "wall", "slab"] });
  const rows = useMemo(() => quantityReport(model, junctions, options), [model, junctions, options]);
  const n = (v: number | null) => v === null ? "—" : v.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  function download() {
    const url = URL.createObjectURL(new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "hsyncad-metraj.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="hcad-property-form"><div className="hcad-fields"><label className="hcad-field"><span>Metraj gruplaması</span><select value={options.grouping} onChange={e => setOptions({ ...options, grouping: e.target.value as ReportGrouping })}>{Object.entries({ type: "Eleman tipine göre", floor: "Kata göre", "floor-type": "Kat → eleman tipi", "type-floor": "Eleman tipi → kat", material: "Malzemeye göre", element: "Detaylı · tek tek eleman" }).map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select></label><label className="hcad-field"><span>Rapor katı</span><select value={options.floorId} onChange={e => setOptions({ ...options, floorId: e.target.value })}><option value="">Tüm katlar</option>{model.floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label></div><div className="hcad-settings-actions">{Object.entries(ELEMENT_NAMES).map(([type, name]) => <label className="hcad-toggle" key={type}><input type="checkbox" checked={options.types.includes(type as typeof options.types[number])} onChange={e => setOptions({ ...options, types: e.target.checked ? [...options.types, type as typeof options.types[number]] : options.types.filter(t => t !== type) })} />{name}</label>)}</div>
    {junctions.status === "failed" && <p role="alert" className="hcad-warning">{junctions.error} Net hacimler gösterilmiyor.</p>}
    <div className="hcad-settings-table"><table data-testid="hsyncad-report"><thead><tr><th>Grup</th><th>Adet</th><th>Brüt m³</th><th>Net m³</th><th>Kalıp m²</th><th>Donatı kg *</th><th>Kaplama kN</th><th>Hareketli kN</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><th>{r.key}</th><td>{r.count}</td><td>{n(r.gross)}</td><td>{n(r.net)}</td><td>{n(r.formwork)}</td><td>{n(r.rebarKg)}</td><td>{n(r.finishKN)}</td><td>{n(r.liveKN)}</td></tr>)}</tbody><tfoot><tr><th>Toplam</th><td>{rows.reduce((s, r) => s + r.count, 0)}</td>{(["gross", "net", "formwork", "rebarKg", "finishKN", "liveKN"] as const).map(k => <td key={k}>{n(k === "net" && junctions.status === "failed" ? null : rows.reduce((s, r) => s + (r[k] ?? 0), 0))}</td>)}</tr></tfoot></table></div>
    {!rows.length && <p>Seçilen filtrelerde eleman yok.</p>}<p className="hcad-fine">Net hacim, bütün modelin birleşiminden sonra ilgili elemanlara atanır; filtreleme birleşim önceliğini değiştirmez. Kalıp brüttür. * Donatı yalnız elle girilen miktardır. Yükler plan alanına göre toplanır; analiz sonucu değildir.</p><button type="button" onClick={download}>CSV metraj indir</button>
  </div>;
}
