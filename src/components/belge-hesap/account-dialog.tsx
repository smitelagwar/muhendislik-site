"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Eye, EyeOff, X } from "lucide-react";
import { useBelgeAccountOptional, type BelgeIdentity } from "./account-provider";
import { BelgeAccountProfileForm } from "./account-profile-form";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };
type Page = "overview" | "profile" | "password" | "delete" | "users";
type ListedUser = { id: string; username: string; role: string; createdAt: string };

async function accountApi(action: string, method: "GET" | "POST" | "DELETE", body?: object) {
  const res = await fetch("/api/belgeler/hesap/" + action, {
    method, credentials: "same-origin", cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "İşlem başarısız.");
  return data;
}

const fieldClass = "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const actionClass = "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-left text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-amber-500";
const mainButton = "min-h-12 w-full rounded-xl bg-amber-500 px-4 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-50";

export function BelgeAccountDialog({ open, onOpenChange }: Props) {
  const account = useBelgeAccountOptional();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [page, setPage] = useState<Page>("overview");
  const [profileDirty, setProfileDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const authenticated = account?.status === "authenticated";
  const username = account?.user?.username ?? "";

  const perform = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try { await work(); }
    catch (e) { setError(e instanceof Error ? e.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }, []);
  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials = {
      username: String(form.get("username") || "").trim(),
      password: String(form.get("password") || ""),
    };
    await perform(async () => {
      const state = await accountApi(tab === "login" ? "giris" : "kayit", "POST", credentials);
      if (!state.user) throw new Error("Oturum doğrulanamadı.");
      account?.applySession(state.user as BelgeIdentity);
      onOpenChange(false);
    });
  };
  const logout = async () => perform(async () => {
    await accountApi("cikis", "POST", {});
    account?.applySession(null);
    onOpenChange(false);
  });
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      const changed = await accountApi("sifre", "POST", {
        currentPassword: String(form.get("currentPassword") || ""),
        newPassword: String(form.get("newPassword") || ""),
      });
      if (!changed.ok) throw new Error("Şifre değiştirilemedi.");
      setPage("overview");
      setSuccess("Şifre güncellendi.");
    });
  };
  const deleteOwn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform(async () => {
      await accountApi("hesap", "DELETE", {
        password: String(form.get("password") || ""),
        confirmation: String(form.get("confirmation") || ""),
      });
      account?.applySession(null);
      onOpenChange(false);
    });
  };
  const openUsers = async () => {
    await perform(async () => {
      const data = await accountApi("kullanicilar", "GET");
      setUsers((data.users || []) as ListedUser[]);
      setPage("users");
    });
  };
  const adminReset = async (userId: string) => {
    await perform(async () => {
      const data = await accountApi("yonetim-sifre", "POST", { userId });
      setTemporaryPassword(String(data.temporaryPassword || ""));
      setSuccess("Geçici şifre oluşturuldu. Kullanıcıya iletin.");
    });
  };
  const adminRemove = async (userId: string) => {
    if (!window.confirm("Bu kullanıcı hesabı kalıcı olarak silinsin mi?")) return;
    await perform(async () => {
      await accountApi("yonetim-hesap", "DELETE", { userId });
      const data = await accountApi("kullanicilar", "GET");
      setUsers((data.users || []) as ListedUser[]);
      setTemporaryPassword("");
      setSuccess("Kullanıcı silindi.");
    });
  };
  const back = () => { setProfileDirty(false); setPage("overview"); setError(""); setSuccess(""); setTemporaryPassword(""); };
  const closeDialog = (nextOpen: boolean) => {
    if (!nextOpen && page === "profile" && profileDirty &&
        !window.confirm("Kaydedilmemiş bilgiler silinsin mi?")) return;
    if (!nextOpen) setProfileDirty(false);
    onOpenChange(nextOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={closeDialog}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-black/60" />
        <DialogPrimitive.Content data-testid="belge-hesap-dialog"
          className="fixed inset-x-0 bottom-0 z-[1201] max-h-[calc(100dvh-env(safe-area-inset-top))] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-background p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-foreground shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,420px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="text-xl font-bold">
                {authenticated ? "Hesabım" : "Giriş / Kayıt ol"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                {authenticated ? username : "Belgelerde bilgilerinizi tekrar kullanın."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close type="button" aria-label="Giriş penceresini kapat"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-amber-500">
              <X aria-hidden="true" className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {!authenticated ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary/70 p-1" role="tablist" aria-label="Hesap işlemi">
                <button type="button" role="tab" aria-selected={tab === "login"} data-testid="belge-hesap-tab-login"
                  onClick={() => { setTab("login"); setError(""); }}
                  className="min-h-11 rounded-lg text-sm font-semibold aria-selected:bg-background aria-selected:shadow-sm">Giriş yap</button>
                <button type="button" role="tab" aria-selected={tab === "register"} data-testid="belge-hesap-tab-register"
                  onClick={() => { setTab("register"); setError(""); }}
                  className="min-h-11 rounded-lg text-sm font-semibold aria-selected:bg-background aria-selected:shadow-sm">Kayıt ol</button>
              </div>
              <form onSubmit={(event) => void submitCredentials(event)} className="mt-5 space-y-4"
                aria-label={tab === "login" ? "Giriş formu" : "Kayıt formu"}>
                <div className="space-y-1.5">
                  <label htmlFor="belge-hesap-username" className="text-sm font-medium">Kullanıcı adı</label>
                  <input id="belge-hesap-username" data-testid="belge-hesap-username" name="username" required
                    type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={2} maxLength={32}
                    placeholder="hsyn" className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="belge-hesap-password" className="text-sm font-medium">Şifre</label>
                  <div className="relative">
                    <input id="belge-hesap-password" data-testid="belge-hesap-password" name="password" required
                      type={showPassword ? "text" : "password"} autoComplete={tab === "login" ? "current-password" : "new-password"}
                      minLength={3} maxLength={128} placeholder="Şifreniz" className={fieldClass + " pr-12"} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-muted-foreground">
                      {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={busy} data-testid="belge-hesap-submit" className={mainButton}>
                  {busy ? "İşleniyor..." : tab === "login" ? "Giriş yap" : "Hesap oluştur"}
                </button>
              </form>
            </>
          ) : page === "overview" ? (
            <div className="mt-5 space-y-2">
              <button type="button" data-testid="belge-hesap-open-profile" className={actionClass} onClick={() => setPage("profile")}>Bilgilerim</button>
              <button type="button" className={actionClass} onClick={() => setPage("password")}>Şifre değiştir</button>
              {account?.user?.role === "admin" ? (
                <button type="button" className={actionClass} disabled={busy} onClick={() => void openUsers()}>
                  Kullanıcı yönetimi
                </button>
              ) : null}
              <button type="button" className={actionClass} disabled={busy} onClick={() => void logout()}>
                Çıkış yap
              </button>
              <button type="button" className={actionClass + " text-rose-600 dark:text-rose-400"}
                onClick={() => setPage("delete")}>Hesabımı sil</button>
            </div>
          ) : page === "profile" ? (
            <BelgeAccountProfileForm
              key={account?.user?.id ?? "guest"}
              userId={account?.user?.id ?? ""}
              onBack={back}
              onDirtyChange={setProfileDirty}
            />
          ) : page === "password" ? (
            <form className="mt-5 space-y-3" onSubmit={(event) => void changePassword(event)}>
              <label className="block space-y-1 text-sm">Mevcut şifre
                <input name="currentPassword" type="password" autoComplete="current-password" required minLength={3}
                  className={fieldClass} />
              </label>
              <label className="block space-y-1 text-sm">Yeni şifre
                <input name="newPassword" type="password" autoComplete="new-password" required minLength={3} maxLength={128}
                  className={fieldClass} />
              </label>
              <button type="submit" className={mainButton} disabled={busy}>Şifreyi değiştir</button>
              <button type="button" className={actionClass} onClick={back}>Geri</button>
            </form>
          ) : page === "delete" ? (
            <form className="mt-5 space-y-3" onSubmit={(event) => void deleteOwn(event)}>
              <p className="text-sm text-rose-600 dark:text-rose-400">Hesap ve kayıtlı bilgiler kalıcı olarak silinir.</p>
              <label className="block space-y-1 text-sm">Şifreniz
                <input name="password" type="password" autoComplete="current-password" required minLength={3}
                  className={fieldClass} />
              </label>
              <label className="block space-y-1 text-sm">Onaylamak için SIL yazın
                <input name="confirmation" type="text" required autoCapitalize="characters" pattern="SIL"
                  className={fieldClass} />
              </label>
              <button type="submit" disabled={busy} className={mainButton + " !bg-rose-500 !text-white"}>
                Hesabımı kalıcı sil
              </button>
              <button type="button" className={actionClass} onClick={back}>Vazgeç</button>
            </form>
          ) : (
            <div className="mt-5 space-y-3">
              <button type="button" className={actionClass} onClick={back}>Hesabıma dön</button>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="rounded-xl border border-border p-3">
                    <p className="font-semibold">{user.username} <span className="text-xs text-muted-foreground">{user.role}</span></p>
                    <p className="text-xs text-muted-foreground">{user.createdAt.slice(0, 10)}</p>
                    {user.role !== "admin" ? (
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={busy} onClick={() => void adminReset(user.id)}
                          className="min-h-10 rounded-lg border border-border px-3 text-xs">Şifre sıfırla</button>
                        <button type="button" disabled={busy} onClick={() => void adminRemove(user.id)}
                          className="min-h-10 rounded-lg border border-rose-500/50 px-3 text-xs text-rose-600">Sil</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {temporaryPassword ? <div className="break-all rounded-lg bg-secondary p-3 text-xs" role="status">
                Geçici şifre: <strong>{temporaryPassword}</strong>
                <button type="button" className="ml-2 underline" onClick={() => void navigator.clipboard?.writeText(temporaryPassword)}>Kopyala</button>
              </div> : null}
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-rose-600" role="alert">{error}</p> : null}
          {success ? <p className="mt-3 text-sm text-emerald-600" role="status">{success}</p> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
