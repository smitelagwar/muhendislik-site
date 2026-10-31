"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { BelgeProfile } from "@/lib/belge-hesap/profile-schema";
import { clearLocalAccountDrafts } from "@/lib/belge-hesap/account-draft-cleanup";

const AccountDialog = dynamic(
  () => import("./account-dialog").then((mod) => mod.BelgeAccountDialog),
  { ssr: false },
);

export type BelgeIdentity = { id: string; username: string; role: "user" | "admin" };
type AccountStatus = "loading" | "guest" | "authenticated" | "unavailable";
export type ProfileStatus = "idle" | "loading" | "ready" | "unavailable";
type AccountState = {
  status: AccountStatus;
  user: BelgeIdentity | null;
  profile: BelgeProfile | null;
  profileStatus: ProfileStatus;
  profileVersion: number | null;
  justSignedOut: boolean;
  openDialog: () => void;
  refresh: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  applySession: (user: BelgeIdentity | null) => void;
};
const Context = createContext<AccountState | null>(null);
const CHANNEL = "belge-hesap-session-change";

/** Session identity is server-verified. Profile values are stored in memory only. */
export function BelgeAccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [user, setUser] = useState<BelgeIdentity | null>(null);
  const [profile, setProfile] = useState<BelgeProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [profileVersion, setProfileVersion] = useState<number | null>(null);
  const [justSignedOut, setJustSignedOut] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sessionEpoch = useRef(0);
  const profileEpoch = useRef(0);
  const activeUserId = useRef<string | null>(null);
  const lastUser = useRef<string | null>(null);

  const openDialog = useCallback(() => setDialogOpen(true), []);

  const setIdentity = useCallback((identity: BelgeIdentity | null) => {
    const id = identity?.id ?? null;
    if (activeUserId.current && !id) setJustSignedOut(true);
    if (id) setJustSignedOut(false);
    if (activeUserId.current !== id) {
      ++profileEpoch.current;
      setProfile(null);
      setProfileVersion(null);
      setProfileStatus(identity ? "loading" : "idle");
    }
    activeUserId.current = id;
    setUser(identity);
    setStatus(identity ? "authenticated" : "guest");
  }, []);

  const fetchProfile = useCallback(async (identity: BelgeIdentity) => {
    const expectedId = identity.id;
    const request = ++profileEpoch.current;
    try {
      const response = await fetch("/api/belgeler/hesap/profil", {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("PROFILE_UNAVAILABLE");
      const data = await response.json() as {
        profile?: BelgeProfile;
        version?: number;
      };
      if (!data.profile || typeof data.version !== "number" || !Number.isSafeInteger(data.version)) {
        throw new Error("PROFILE_INVALID");
      }
      if (request !== profileEpoch.current || activeUserId.current !== expectedId) return;
      setProfile(data.profile);
      setProfileVersion(data.version);
      setProfileStatus("ready");
    } catch {
      if (request !== profileEpoch.current || activeUserId.current !== expectedId) return;
      // Keep a previously verified in-memory profile on transient network errors.
      setProfileStatus((previous) => previous === "ready" ? previous : "unavailable");
    }
  }, []);

  const refresh = useCallback(async () => {
    const request = ++sessionEpoch.current;
    try {
      const response = await fetch("/api/belgeler/hesap/oturum", {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("SESSION_UNAVAILABLE");
      const data = await response.json() as {
        available: boolean;
        authenticated: boolean;
        user?: BelgeIdentity | null;
      };
      if (request !== sessionEpoch.current) return;
      if (!data.available) {
        setIdentity(null);
        setStatus("unavailable");
        return;
      }
      if (data.authenticated && data.user?.id) {
        setIdentity(data.user);
        await fetchProfile(data.user);
      } else {
        setIdentity(null);
      }
    } catch {
      if (request !== sessionEpoch.current) return;
      setIdentity(null);
      setStatus("unavailable");
    }
  }, [fetchProfile, setIdentity]);

  const reloadProfile = useCallback(async () => {
    const id = activeUserId.current;
    if (!id) return;
    await fetchProfile({ id, username: "", role: "user" });
  }, [fetchProfile]);

  const applySession = useCallback((identity: BelgeIdentity | null) => {
    ++sessionEpoch.current;
    setIdentity(identity);
    if (identity) void fetchProfile(identity);
    try {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage("refresh");
      channel.close();
    } catch { /* Cross-tab notification is best-effort. */ }
  }, [fetchProfile, setIdentity]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => { void refresh(); };
    return () => channel.close();
  }, [refresh]);

  // Child studios unmount on identity change before this effect clears old local drafts.
  useEffect(() => {
    const previous = lastUser.current;
    const current = user?.id ?? null;
    lastUser.current = current;
    if (previous && previous !== current) clearLocalAccountDrafts(previous);
  }, [user?.id]);

  const context = useMemo<AccountState>(
    () => ({
      status, user, profile, profileStatus, profileVersion, justSignedOut,
      openDialog, refresh, reloadProfile, applySession,
    }),
    [status, user, profile, profileStatus, profileVersion, justSignedOut, openDialog, refresh, reloadProfile, applySession],
  );
  return (
    <Context.Provider value={context}>
      {children}
      {dialogOpen ? <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} /> : null}
    </Context.Provider>
  );
}
export const useBelgeAccountOptional = () => useContext(Context);
