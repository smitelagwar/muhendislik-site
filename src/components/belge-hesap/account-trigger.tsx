"use client";

import { UserRound } from "lucide-react";
import { useBelgeAccountOptional } from "./account-provider";

type Props = { variant: "navbar" | "studio" | "menu"; onBeforeOpen?: () => void };
export function BelgeAccountTrigger({ variant, onBeforeOpen }: Props) {
  const account = useBelgeAccountOptional();
  if (!account || account.status === "unavailable") return null;
  const ready = account.status !== "loading";
  const label = account.user ? account.user.username : "Giriş / Kayıt ol";
  const handleClick = () => {
    if (!ready) return;
    onBeforeOpen?.();
    account.openDialog();
  };
  if (variant === "menu") return (
    <button type="button" data-testid="belge-hesap-trigger-menu" onClick={handleClick} disabled={!ready}
      className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50">
      <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{account.user ? "Hesabım: " + label : label}</span>
    </button>
  );
  return (
    <button type="button" onClick={handleClick} disabled={!ready}
      data-testid={variant === "navbar" ? "belge-hesap-trigger-navbar" : "belge-hesap-trigger-studio"}
      aria-label={account.user ? "Hesabım: " + label : "Giriş yap veya kayıt ol"}
      title={account.user ? "Hesabım: " + label : "Giriş / Kayıt ol"}
      className={variant === "navbar"
        ? "hidden min-[390px]:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background/50 px-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
        : "hidden lg:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-secondary/40 px-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"}>
      {account.user
        ? <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-700 dark:text-amber-300">{label.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
        : <UserRound aria-hidden="true" className="h-5 w-5" />}
      <span className="hidden 2xl:inline text-xs font-medium">{account.user ? label : "Giriş"}</span>
    </button>
  );
}
