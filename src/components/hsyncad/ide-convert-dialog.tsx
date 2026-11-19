"use client";
import { useState } from "react";
import { ideExportBasename } from "@/lib/hsyncad/ide-export";
import { convertIdeSourceToNative } from "@/lib/hsyncad/ide-native-download";
import SettingsDialog from "./settings-dialog";

/**
 * Trial → Native dönüştürücü (Dosya menüsünden açılır).
 *
 * - Kaynak: `.ide11trial` veya `.ide11` (v11 gövdesi). `.ide11` hedefi donör
 *   gerektirmez; `.ide10` hedefi eşleşen ticari `.ide10` donörü ister.
 * - Kaynak dosyaya yazılmaz; dönüşüm yeni dosya olarak indirilir.
 * - Transcoder'ın güvenli-red hataları (ör. 218 ada kayıt eşleşmezliği)
 *   dürüstçe gösterilir; yanlış dosya üretilmez.
 */
export default function IdeConvertDialog({ open, onClose, onMessage }: { open: boolean; onClose: () => void; onMessage: (message: string) => void }) {
  const [source, setSource] = useState<File | null>(null);
  const [donor, setDonor] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  if (!open) return null;

  async function convert(target: "ide11" | "ide10") {
    if (!source || busy) return;
    if (target === "ide10" && !donor) {
      setStatus("Native .ide10 için eşleşen ticari .ide10 dosyasını (donör) seçin.");
      return;
    }
    setBusy(true);
    setStatus(`Native .${target} dönüşümü hazırlanıyor…`);
    try {
      const bytes = convertIdeSourceToNative(await source.arrayBuffer(), target, donor ? await donor.arrayBuffer() : undefined);
      const filename = `${ideExportBasename(source.name)}.${target}`;
      const payload = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? bytes.buffer as ArrayBuffer : bytes.slice().buffer as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([payload], { type: "application/octet-stream" }));
      const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      setStatus(`${filename} indirildi. Kaynak dosya değişmedi.`);
      onMessage(`${filename} indirildi: ${target === "ide10" ? "eşleşen ticari .ide10 donörüyle" : "donörsüz"} dönüşüm; kaynak dosya değişmedi.`);
    } catch (error) {
      setStatus(`Dönüşüm reddedildi: ${error instanceof Error ? error.message : "bilinmeyen hata"}`);
    } finally { setBusy(false); }
  }

  return <SettingsDialog title="ideCAD dosyası dönüştür · trial → native" onClose={onClose}>
    <div style={{ display: "grid", gap: 12, minWidth: 360, maxWidth: 560 }}>
      <p className="hcad-fine" style={{ margin: 0 }}>
        Deneme sürümünde kaydedilen <b>.ide11trial</b> (veya <b>.ide11</b>) dosyayı native formata çevirir.
        Dönüşüm tarayıcıda yapılır; dosya sunucuya yüklenmez ve kaynak dosya değiştirilmez.
      </p>
      <label style={{ display: "grid", gap: 4 }}>
        <b>1) Kaynak dosya (.ide11trial / .ide11)</b>
        <input type="file" accept=".ide11trial,.ide11" data-testid="ide-convert-source"
          onChange={(event) => { setSource(event.target.files?.[0] ?? null); setStatus(""); }} />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" data-testid="ide-convert-to-ide11" disabled={!source || busy} onClick={() => void convert("ide11")}>Native .ide11 indir</button>
        <button type="button" data-testid="ide-convert-to-ide10" disabled={!source || !donor || busy} onClick={() => void convert("ide10")}>Native .ide10 indir</button>
      </div>
      <label style={{ display: "grid", gap: 4 }}>
        <b>2) Yalnız .ide10 için: eşleşen ticari .ide10 (donör)</b>
        <input type="file" accept=".ide10" data-testid="ide-convert-donor"
          onChange={(event) => { setDonor(event.target.files?.[0] ?? null); setStatus(""); }} />
      </label>
      <p className="hcad-fine" style={{ margin: 0 }}>
        .ide11 hedefi donörsüz çalışır (lisanslı ideCAD 11 için). .ide10 hedefi, aynı projenin ticari
        .ide10 dosyasını donör olarak ister; donörsüz üretim yanlış gövde düzeni yazacağı için engellenir.
      </p>
      {status && <p role="status" data-testid="ide-convert-status" style={{ margin: 0 }}>{status}</p>}
    </div>
  </SettingsDialog>;
}
