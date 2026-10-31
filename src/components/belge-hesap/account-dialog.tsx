"use client";

import { useState, type FormEvent } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Eye, EyeOff, X } from "lucide-react";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };
/** Stage 1 UI only. Never claim success without a real server response. */
export function BelgeAccountDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [reveal, setReveal] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-black/60" />
        <DialogPrimitive.Content
          data-testid="belge-hesap-dialog"
          className="fixed inset-x-0 bottom-0 z-[1201] max-h-[calc(100dvh-env(safe-area-inset-top))] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-background p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-foreground shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,420px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="text-xl font-bold">Hesabım</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                Bilgilerinizi belgelerde tekrar kullanın.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close type="button" aria-label="Giriş penceresini kapat"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-amber-500">
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary/70 p-1" role="tablist" aria-label="Hesap işlemi">
            <button type="button" role="tab" aria-selected={tab === "login"} data-testid="belge-hesap-tab-login"
              onClick={() => setTab("login")}
              className="min-h-11 rounded-lg text-sm font-semibold transition aria-selected:bg-background aria-selected:shadow-sm">Giriş yap</button>
            <button type="button" role="tab" aria-selected={tab === "register"} data-testid="belge-hesap-tab-register"
              onClick={() => setTab("register")}
              className="min-h-11 rounded-lg text-sm font-semibold transition aria-selected:bg-background aria-selected:shadow-sm">Kayıt ol</button>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4" aria-label={tab === "login" ? "Giriş formu" : "Kayıt formu"}>
            <div className="space-y-1.5">
              <label htmlFor="belge-hesap-username" className="text-sm font-medium">Kullanıcı adı</label>
              <input id="belge-hesap-username" data-testid="belge-hesap-username"
                type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={2} maxLength={32}
                placeholder="hsyn" className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="belge-hesap-password" className="text-sm font-medium">Şifre</label>
              <div className="relative">
                <input id="belge-hesap-password" data-testid="belge-hesap-password"
                  type={reveal ? "text" : "password"} autoComplete={tab === "login" ? "current-password" : "new-password"}
                  minLength={3} maxLength={128} placeholder="Şifreniz"
                  className="min-h-12 w-full rounded-xl border border-border bg-background px-3 pr-12 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-500" />
                <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-muted-foreground">
                  {reveal ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled data-testid="belge-hesap-submit"
              className="min-h-12 w-full cursor-not-allowed rounded-xl bg-amber-500 px-4 text-sm font-bold text-zinc-950 opacity-50">
              {tab === "login" ? "Giriş yap" : "Hesap oluştur"}
            </button>
            <p role="status" className="text-center text-xs text-muted-foreground">Hesap işlemleri henüz etkin değil.</p>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
