"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const AccountDialog = dynamic(
  () => import("./account-dialog").then((mod) => mod.BelgeAccountDialog),
  { ssr: false },
);
type AccountState = { status: "guest"; openDialog: () => void };
const Context = createContext<AccountState | null>(null);

/** Aşama 1: Guest-only state; authentication is connected in stage 2. */
export function BelgeAccountProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);
  const context = useMemo<AccountState>(() => ({ status: "guest", openDialog }), [openDialog]);
  return (
    <Context.Provider value={context}>
      {children}
      {open ? <AccountDialog open={open} onOpenChange={setOpen} /> : null}
    </Context.Provider>
  );
}
export const useBelgeAccountOptional = () => useContext(Context);
