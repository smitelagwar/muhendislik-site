"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const AccountDialog = dynamic(
  () => import("./account-dialog").then((mod) => mod.BelgeAccountDialog),
  { ssr: false },
);
export type BelgeIdentity = { id: string; username: string; role: "user" | "admin" };
type AccountState = {
  status: "loading" | "guest" | "authenticated" | "unavailable";
  user: BelgeIdentity | null;
  openDialog: () => void;
  refresh: () => Promise<void>;
  applySession: (user: BelgeIdentity | null) => void;
};
const Context = createContext<AccountState | null>(null);
const CHANNEL = "belge-hesap-session-change";

/** Account state is held only in memory, with server-owned HttpOnly cookies. */
export function BelgeAccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountState["status"]>("loading");
  const [user, setUser] = useState<BelgeIdentity | null>(null);
  const [open, setOpen] = useState(false);
  const epoch = useRef(0);
  const openDialog = useCallback(() => setOpen(true), []);
  const refresh = useCallback(async () => {
    const current = ++epoch.current;
    try {
      const res = await fetch("/api/belgeler/hesap/oturum", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("unavailable");
      const state = await res.json() as { available: boolean; authenticated: boolean; user?: BelgeIdentity | null };
      if (epoch.current !== current) return;
      if (!state.available) {
        setUser(null);
        setStatus("unavailable");
      } else if (state.authenticated && state.user) {
        setUser(state.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("guest");
      }
    } catch {
      if (epoch.current === current) {
        setUser(null);
        setStatus("unavailable");
      }
    }
  }, []);
  const applySession = useCallback((identity: BelgeIdentity | null) => {
    ++epoch.current;
    setUser(identity);
    setStatus(identity ? "authenticated" : "guest");
    try {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage("refresh");
      channel.close();
    } catch { /* Browser may not support cross-tab messaging. */ }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => { void refresh(); };
    return () => channel.close();
  }, [refresh]);
  const context = useMemo<AccountState>(
    () => ({ status, user, openDialog, refresh, applySession }),
    [status, user, openDialog, refresh, applySession],
  );
  return (
    <Context.Provider value={context}>
      {children}
      {open ? <AccountDialog open={open} onOpenChange={setOpen} /> : null}
    </Context.Provider>
  );
}
export const useBelgeAccountOptional = () => useContext(Context);
