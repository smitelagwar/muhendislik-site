"use client";
import { useState } from "react";
import type { NativeIdeFormat } from "@/lib/hsyncad/ide-import/ide-binary-codec";
import {
  ideSourceFormatOf,
  nativeSaveRequirement,
  type NativeIdeSaveTarget,
} from "@/lib/hsyncad/ide-native-download";
import SettingsDialog from "./settings-dialog";

type SaveFormat = "hsyncad" | NativeIdeSaveTarget;

/**
 * Açık projeyi "farklı kaydet" diyaloğu.
 *
 * Hiçbir biçim kapatılmaz. Kaynak ideCAD dosyası oturumda yoksa diyalog
 * içinde bir kez seçilir; seçim çalışma alanına ve tarayıcı önbelleğine
 * iletilir. `.ide10` hedefi eşleşen ticari donör ister; `.ide10` kaynağı
 * aynı biçimde bayt kopyası olarak yazılır.
 */
export default function IdeSaveDialog({ projectName, sourceName, hasSource, sourceFormat, patchCount, onClose, onSaveHsyncad, onSaveNative, onSourcePicked, onMessage }: {
  projectName: string;
  sourceName?: string;
  hasSource: boolean;
  sourceFormat: NativeIdeFormat | null;
  patchCount: number;
  onClose: () => void;
  onSaveHsyncad: () => void;
  onSaveNative: (target: NativeIdeSaveTarget, donor?: File, source?: File) => Promise<string>;
  onSourcePicked: (file: File) => void;
  onMessage: (message: string) => void;
}) {
  const [format, setFormat] = useState<SaveFormat>(() => {
    if (sourceFormat === "ide10") return "ide10";
    if (sourceFormat === "ide11" || sourceFormat === "ide11trial") return "ide11";
    return "hsyncad";
  });
  const [pickedSource, setPickedSource] = useState<File | null>(null);
  const [donor, setDonor] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const effectiveFormat = pickedSource ? ideSourceFormatOf(pickedSource.name) : sourceFormat;
  const hasAnySource = hasSource || Boolean(pickedSource);
  const option = format === "hsyncad" ? null : nativeSaveRequirement(format, effectiveFormat);
  const donorRequired = Boolean(option?.donorRequired);
  const visibleSourceName = pickedSource?.name ?? sourceName;

  async function save() {
    if (busy) return;
    if (format !== "hsyncad" && !hasAnySource) {
      setStatus("Önce kaynak ideCAD dosyasını seçin (.ide11trial / .ide11 / .ide10).");
      return;
    }
    if (format !== "hsyncad" && option?.donorRequired && !donor) {
      setStatus(option.donorFormat === "ide11"
        ? "Ters yükseltme için eşleşen ticari .ide11 dosyasını (donör) seçin."
        : "Native .ide10 için eşleşen ticari .ide10 dosyasını (donör) seçin.");
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
        const message = await onSaveNative(format, donor ?? undefined, pickedSource ?? undefined);
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
        {visibleSourceName ? <> · kaynak: <b>{visibleSourceName}</b></> : null}
      </p>
      <fieldset style={{ border: "1px solid #d6dde6", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
        <legend><b>Kayıt biçimi</b></legend>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="radio" name="ide-save-format" value="hsyncad" checked={format === "hsyncad"}
            onChange={() => { setFormat("hsyncad"); setStatus(""); }} data-testid="ide-save-format-hsyncad" />
          <span><b>.hsyncad</b> — düzenlenebilir hsynCAD çalışma dosyası<br />
            <small>Her proje için kullanılabilir; tüm düzenlemeler korunur.</small></span>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="radio" name="ide-save-format" value="ide11" checked={format === "ide11"}
            onChange={() => { setFormat("ide11"); setStatus(""); }} data-testid="ide-save-format-ide11" />
          <span><b>.ide11</b> — native ideCAD 11<br /><small>{nativeSaveRequirement("ide11", effectiveFormat).reason}</small></span>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="radio" name="ide-save-format" value="ide10" checked={format === "ide10"}
            onChange={() => { setFormat("ide10"); setStatus(""); }} data-testid="ide-save-format-ide10" />
          <span><b>.ide10</b> — native ideCAD 10{nativeSaveRequirement("ide10", effectiveFormat).donorRequired ? " (eşleşen ticari donör gerekir)" : ""}<br />
            <small>{nativeSaveRequirement("ide10", effectiveFormat).reason}</small></span>
        </label>
      </fieldset>
      {!hasAnySource && <label style={{ display: "grid", gap: 4 }} data-testid="ide-save-source-required">
        <b>Kaynak ideCAD dosyası (gerekli)</b>
        <input type="file" accept=".ide11trial,.ide11,.ide10" data-testid="ide-save-source"
          onChange={event => {
            const file = event.target.files?.[0] ?? null;
            setPickedSource(file);
            if (file) { onSourcePicked(file); setStatus(""); }
          }} />
        <small>Açık projenin özgün dosyası; yalnız okunur, kaynak dosyaya yazılmaz. Bir kez seçilir; sonraki kayıtlarda hatırlanır.</small>
      </label>}
      {hasAnySource && <details data-testid="ide-save-source-change">
        <summary style={{ cursor: "pointer" }}><small>Kaynağı değiştir</small></summary>
        <input type="file" accept=".ide11trial,.ide11,.ide10" data-testid="ide-save-source-replace"
          onChange={event => {
            const file = event.target.files?.[0] ?? null;
            setPickedSource(file);
            if (file) { onSourcePicked(file); setStatus(""); }
          }} />
      </details>}
      {patchCount > 0 && <p className="hcad-fine" style={{ margin: 0 }} data-testid="ide-save-patch-count">
        {patchCount} native yazılabilir düzenleme (kiriş kesit yüksekliği) kayda uygulanacak.
      </p>}
      {donorRequired && option && <label style={{ display: "grid", gap: 4 }}>
        <b>{option.donorFormat === "ide11" ? "Eşleşen ticari .ide11 dosyası (donör)" : "Eşleşen ticari .ide10 dosyası (donör)"}</b>
        <input type="file" accept={option.donorFormat === "ide11" ? ".ide11" : ".ide10"} data-testid="ide-save-donor"
          onChange={event => { setDonor(event.target.files?.[0] ?? null); setStatus(""); }} />
        <small>{option.donorFormat === "ide11"
          ? "Donör, aynı projenin lisanslı ideCAD 11 dosyasıdır; v10→v11 yerleşimini güvenli biçimde tamamlar."
          : "Donör, aynı projenin lisanslı ideCAD 10 dosyasıdır; dönüşümün gövde düzenini belirler."}</small>
      </label>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" data-testid="ide-save-submit" disabled={busy} onClick={() => void save()}>
          {busy ? "Kaydediliyor…" : "Kaydet ve indir"}
        </button>
        <button type="button" onClick={onClose} disabled={busy}>Kapat</button>
        <small>Tarayıcı indirir; açık kaynak dosya değiştirilmez.</small>
      </div>
      {status && <p role="status" data-testid="ide-save-status" style={{ margin: 0 }}>{status}</p>}
    </div>
  </SettingsDialog>;
}
