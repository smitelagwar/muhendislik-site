"use client";

import { UserRound } from "lucide-react";
import { useBelgeAccountOptional } from "./account-provider";

type Props = { variant: "navbar" | "studio" | "menu"; onBeforeOpen?: () => void };
export function BelgeAccountTrigger({ variant, onBeforeOpen }: Props) {
  const account = useBelgeAccountOptional();
  if (!account) return null;
  const handleClick = () => {
    onBeforeOpen?.();
    account.openDialog();
  };
  if (variant === "menu") return (
    <button type="button" data-testid="belge-hesap-trigger-menu" onClick={handleClick}
      className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>Giriş / Kayıt ol</span>
    </button>
  );
  return (
    <button type="button" onClick={handleClick}
      data-testid={variant === "navbar" ? "belge-hesap-trigger-navbar" : "belge-hesap-trigger-studio"}
      aria-label="Giriş yap veya kayıt ol" title="Giriş / Kayıt ol"
      className={variant === "navbar"
        ? "hidden min-[390px]:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background/50 px-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        : "hidden lg:inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-secondary/40 px-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"}>
      <UserRound aria-hidden="true" className="h-5 w-5" />
      <span className="hidden 2xl:inline text-xs font-medium">Giriş</span>
    </button>
  );
}
