"use client";
import { useState } from "react";
import type { NativeIdeSaveOption, NativeIdeSaveTarget } from "@/lib/hsyncad/ide-native-download";
import SettingsDialog from "./settings-dialog";

type SaveFormat = "hsyncad" | NativeIdeSaveTarget;

/**
 * Açık projeyi "farklı kaydet" diyaloğu.
 *
 * Kaynak yeniden seçilmez: açık hsynCAD modeli ya da açık ideCAD kaynağının
 * baytları kullanılır. `.ide11` donörsüz, `.ide10` eşleşen ticari donörle
 * üretilir; kanıtlanmamış hedefler kapalı ve gerekçeli gösterilir.
 */
export default function IdeSaveDialog({ projectName, sourceName, patchCount, options, onClose, onSaveHsyncad, onSaveNative, onMessage }: {
  projectName: string;
  sourceName?: string;
  patchCount: number;
  options: Record<NativeIdeSaveTarget, NativeIdeSaveOption>;
  onClose: () => void;
  onSaveHsyncad: () => void;
  onSaveNative: (target: NativeIdeSaveTarget, donor?: File) => Promise<string>;
  onMessage: (message: string) => void;
}) {
  const [format, setFormat] = useState<SaveFormat>(options.ide11.enabled ? "ide11" : "hsyncad");
  const [donor, setDonor] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const option = format === "hsyncad" ? null : options[format];
  const donorRequired = Boolean(option?.donorRequired);

  async function save() {
    if (busy) return;
    if (format !== "hsyncad" && !options[format].enabled) { setStatus(options[format].reason); return; }
    if (format !== "hsyncad" && options[format].donorRequired && !donor) {
      setStatus("Native .ide10 için eşleşen ticari .ide10 dosyasını (donör) seçin.");
      return;
    }
    setBusy(true);
    setStatus("Kayıt hazırlanıyor…");
    try {
      if (format === "hsyncad") {
        onSaveHsyncad();
        const message = ".hsyncad çalışma dosyası indirildi; tüm düzenlemeler korunur.";
        setStatus(message);
        onMessage(message);
      } else {
        const message = await onSaveNative(format, donor ?? undefined);
        setStatus(message);
        onMessage(message);
      }
    } catch (error) {
      setStatus(`Kaydetme reddedildi: ${error instanceof Error ? error.message : "bilinmeyen hata"}`);
    } finally { setBusy(false); }
  }

  return <SettingsDialog title="Kaydet · biçim seç" onClose={onClose}>
    <div data-testid="ide-save-dialog" style={{ display: "grid", gap: 12, minWidth: 360, maxWidth: 600 }}>
      <p style={{ margin: 0 }}>
        <b>{projectName || "Adsız proje"}</b>
        {sourceName ? <> · kaynak: <b>{sourceName}</b></> : null}
      </p>
      <fieldset style={{ border: "1px solid #d6dde6", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
        <legend><b>Kayıt biçimi</b></legend>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="radio" name="ide-save-format" value="hsyncad" checked={format === "hsyncad"}
            onChange={() => { setFormat("hsyncad"); setStatus(""); }} data-testid="ide-save-format-hsyncad" />
          <span><b>.hsyncad</b> — düzenlenebilir hsynCAD çalışma dosyası<br />
            <small>Her proje için kullanılabilir; tüm düzenlemeler korunur.</small></span>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", opacity: options.ide11.enabled ? 1 : .55 }}>
          <input type="radio" name="ide-save-format" value="ide11" disabled={!options.ide11.enabled}
            checked={format === "ide11"} onChange={() => { setFormat("ide11"); setStatus(""); }} data-testid="ide-save-format-ide11" />
          <span><b>.ide11</b> — native ideCAD 11 (donörsüz)<br /><small>{options.ide11.reason}</small></span>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", opacity: options.ide10.enabled ? 1 : .55 }}>
          <input type="radio" name="ide-save-format" value="ide10" disabled={!options.ide10.enabled}
            checked={format === "ide10"} onChange={() => { setFormat("ide10"); setStatus(""); }} data-testid="ide-save-format-ide10" />
          <span><b>.ide10</b> — native ideCAD 10{options.ide10.donorRequired ? " (eşleşen ticari donör gerekir)" : ""}<br />
            <small>{options.ide10.reason}</small></span>
        </label>
      </fieldset>
      {patchCount > 0 && <p className="hcad-fine" style={{ margin: 0 }} data-testid="ide-save-patch-count">
        {patchCount} native yazılabilir düzenleme (kiriş kesit yüksekliği) kayda uygulanacak.
      </p>}
      {donorRequired && <label style={{ display: "grid", gap: 4 }}>
        <b>Eşleşen ticari .ide10 dosyası (donör)</b>
        <input type="file" accept=".ide10" data-testid="ide-save-donor"
          onChange={event => { setDonor(event.target.files?.[0] ?? null); setStatus(""); }} />
        <small>Donör, aynı projenin lisanslı ideCAD 10 dosyasıdır; dönüşümün gövde düzenini belirler.</small>
      </label>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" data-testid="ide-save-submit" disabled={busy || (donorRequired && !donor)} onClick={() => void save()}>
          {busy ? "Kaydediliyor…" : "Kaydet ve indir"}
        </button>
        <button type="button" onClick={onClose} disabled={busy}>Kapat</button>
        <small>Tarayıcı indirir; açık kaynak dosya değiştirilmez.</small>
      </div>
      {status && <p role="status" data-testid="ide-save-status" style={{ margin: 0 }}>{status}</p>}
    </div>
  </SettingsDialog>;
}
