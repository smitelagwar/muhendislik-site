"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { belgeProfileSchema, type BelgeProfile } from "@/lib/belge-hesap/profile-schema";
import { formattedPhone } from "@/lib/belge-hesap/formatters";

type Key = keyof BelgeProfile;
type Draft = Record<Key, string>;
type Field = { key: Key; label: string; hint: string; max: number; multiline?: boolean; mode?: "numeric" | "tel"; autocomplete?: string };
const EMPTY: Draft = {
  ad: "", soyad: "", tcKimlikNo: "", meslekUnvani: "", odaSicilNo: "",
  telefon: "", adres: "", il: "", ilce: "",
};
const GROUPS: { title: string; fields: Field[] }[] = [
  { title: "Kimlik", fields: [
    { key: "ad", label: "Ad", hint: "Adınız", max: 80, autocomplete: "given-name" },
    { key: "soyad", label: "Soyad", hint: "Soyadınız", max: 80, autocomplete: "family-name" },
    { key: "tcKimlikNo", label: "T.C. kimlik no (isteğe bağlı)", hint: "11 haneli T.C. numarası", max: 11, mode: "numeric" },
  ] },
  { title: "Meslek", fields: [
    { key: "meslekUnvani", label: "Meslek unvanı", hint: "İnşaat Mühendisi", max: 100 },
    { key: "odaSicilNo", label: "Oda sicil no", hint: "Sicil numarası", max: 40 },
  ] },
  { title: "İletişim", fields: [
    { key: "telefon", label: "Telefon", hint: "05xx xxx xx xx", max: 30, mode: "tel", autocomplete: "tel" },
    { key: "adres", label: "İkamet adresi", hint: "Mahalle, sokak ve kapı numarası", max: 500, multiline: true, autocomplete: "street-address" },
    { key: "il", label: "İl", hint: "Ankara", max: 80, autocomplete: "address-level1" },
    { key: "ilce", label: "İlçe", hint: "Çankaya", max: 80, autocomplete: "address-level2" },
  ] },
];
const INPUT = "min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50";
function asDraft(profile: BelgeProfile): Draft {
  return Object.fromEntries(Object.keys(EMPTY).map((key) => [key, profile[key as Key] ?? ""])) as Draft;
}
function toProfile(draft: Draft): BelgeProfile {
  const result = Object.fromEntries(
    (Object.keys(draft) as Key[]).map((key) => [key, draft[key].trim()]),
  ) as Draft;
  return { ...result, telefon: formattedPhone(result.telefon) ?? "" };
}

export function BelgeAccountProfileForm({
  userId, onBack, onDirtyChange,
}: {
  userId: string;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>({ ...EMPTY });
  const [saved, setSaved] = useState<Draft>({ ...EMPTY });
  const [version, setVersion] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "conflict">("loading");
  const [busy, setBusy] = useState(false);
  const [showTc, setShowTc] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const sequence = useRef(0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const load = useCallback(async () => {
    const id = ++sequence.current;
    setStatus("loading"); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/belgeler/hesap/profil", {
        credentials: "same-origin", cache: "no-store",
      });
      const body = await response.json() as { profile?: BelgeProfile; version?: number; error?: string };
      if (!response.ok) throw new Error(body.error || "Profil yüklenemedi.");
      if (!body.profile || (typeof body.version !== "number" || !Number.isInteger(body.version))) throw new Error("Profil yanıtı geçersiz.");
      if (id !== sequence.current) return;
      const fresh = asDraft(body.profile);
      setDraft(fresh); setSaved({ ...fresh }); setVersion(body.version as number);
      setStatus("ready");
    } catch (reason) {
      if (id !== sequence.current) return;
      // A failed profile read must not keep another session's PII on-screen.
      setDraft({ ...EMPTY }); setSaved({ ...EMPTY }); setVersion(null);
      setError(reason instanceof Error ? reason.message : "Profil yüklenemedi.");
      setStatus("error");
    }
  }, []);
  useEffect(() => {
    void load();
    return () => { ++sequence.current; };
  }, [load, userId]);

  const update = (key: Key, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (version === null || busy || status !== "ready") return;
    const checked = belgeProfileSchema.safeParse(toProfile(draft));
    if (!checked.success) {
      setError(checked.error.issues[0]?.message || "Bilgileri kontrol edin."); return;
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/belgeler/hesap/profil", {
        method: "PUT",
        credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "If-Match": '"' + version + '"' },
        body: JSON.stringify(checked.data),
      });
      const body = await response.json() as { profile?: BelgeProfile; version?: number; error?: string };
      if (response.status === 409) {
        setStatus("conflict");
        setError("Başka cihazda güncellendi. Sunucudaki bilgileri yeniden yükleyin.");
        return;
      }
      if (!response.ok) throw new Error(body.error || "Profil kaydedilemedi.");
      if (!body.profile || (typeof body.version !== "number" || !Number.isInteger(body.version))) throw new Error("Kaydetme onayı alınamadı.");
      const updated = asDraft(body.profile);
      setDraft(updated); setSaved({ ...updated }); setVersion(body.version as number);
      setSuccess("Bilgileriniz kaydedildi."); onDirtyChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profil kaydedilemedi.");
    } finally { setBusy(false); }
  };

  return (
    <form data-testid="belge-hesap-profile-form" className="mt-4 space-y-4" onSubmit={(e) => void submit(e)}>
      <p className="text-xs text-muted-foreground">
        Alanlar isteğe bağlıdır. Boş bıraktığınız bilgiler belgelerdeki örneklerle tamamlanır.
      </p>
      {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">Bilgiler yükleniyor...</p> : null}
      {status === "error" || status === "conflict" ? (
        <button type="button" data-testid="belge-hesap-profile-reload" onClick={() => void load()}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold">
          <RefreshCw aria-hidden="true" className="h-4 w-4" /> Sunucudaki bilgileri yeniden yükle
        </button>
      ) : null}
      {status !== "loading" && version !== null ? GROUPS.map((group) => (
        <fieldset key={group.title} className="min-w-0 space-y-3 rounded-xl border border-border/70 p-3">
          <legend className="px-1 text-sm font-bold">{group.title}</legend>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.multiline || field.key === "tcKimlikNo" ? "sm:col-span-2" : ""}>
                <label htmlFor={"belge-profile-" + field.key} className="mb-1 block text-xs font-semibold">{field.label}</label>
                <div className="relative">
                  {field.multiline ? (
                    <textarea id={"belge-profile-" + field.key} data-testid={"belge-hesap-field-" + field.key}
                      value={draft[field.key]} onChange={(e) => update(field.key, e.target.value)}
                      maxLength={field.max} rows={3} autoComplete={field.autocomplete} placeholder={field.hint}
                      disabled={busy || status !== "ready"} className={INPUT + " resize-y py-2"} />
                  ) : (
                    <input id={"belge-profile-" + field.key} data-testid={"belge-hesap-field-" + field.key}
                      value={draft[field.key]} onChange={(e) => update(field.key, e.target.value)}
                      type={field.key === "tcKimlikNo" && !showTc ? "password" : "text"}
                      inputMode={field.mode} maxLength={field.max} autoComplete={field.autocomplete ?? "off"}
                      pattern={field.key === "tcKimlikNo" ? "[0-9]{11}" : undefined} placeholder={field.hint}
                      disabled={busy || status !== "ready"}
                      className={INPUT + (field.key === "tcKimlikNo" ? " pr-12" : "")} />
                  )}
                  {field.key === "tcKimlikNo" ? (
                    <button type="button" onClick={() => setShowTc((prev) => !prev)}
                      aria-label={showTc ? "T.C. kimlik numarasını gizle" : "T.C. kimlik numarasını göster"}
                      className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-muted-foreground">
                      {showTc ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )) : null}
      {error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {success ? <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" onClick={() => {
          if (dirty && !window.confirm("Kaydedilmemiş bilgiler silinsin mi?")) return;
          onDirtyChange(false); onBack();
        }} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold sm:flex-1">Geri</button>
        <button type="submit" disabled={busy || status !== "ready" || !dirty}
          data-testid="belge-hesap-profile-save"
          className="min-h-11 rounded-xl bg-amber-500 px-4 text-sm font-bold text-zinc-950 disabled:opacity-50 sm:flex-1">
          {busy ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
