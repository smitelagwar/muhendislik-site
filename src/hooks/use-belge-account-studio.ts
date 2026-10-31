"use client";

import { useMemo } from "react";
import { useBelgeAccountOptional } from "@/components/belge-hesap/account-provider";
import type { BelgeDraftScope } from "@/lib/belge-ux-config";
import type { BelgeProfile } from "@/lib/belge-hesap/profile-schema";

export type BelgeStudioIdentity = {
  profile: BelgeProfile | null;
  scope: BelgeDraftScope;
  warning: boolean;
  skipGuestRestore: boolean;
};
type DocumentAccount = BelgeStudioIdentity & { ready: boolean };

/** Never mount a studio against guest drafts while a real session is loading. */
export function useBelgeStudioAccount(): DocumentAccount {
  const account = useBelgeAccountOptional();
  const ready = !account || account.status === "guest" ||
    account.status === "unavailable" ||
    (account.status === "authenticated" && account.profileStatus !== "loading");
  const usableProfile = account?.status === "authenticated" && account.profileStatus === "ready"
    ? account.profile
    : null;
  const accountId = account?.status === "authenticated" ? account.user?.id : null;
  const warning = Boolean(account && (
    account.status === "unavailable" ||
    (account.status === "authenticated" && account.profileStatus === "unavailable")
  ));
  const skipGuestRestore = warning || Boolean(
    account?.status === "guest" && account.justSignedOut
  );
  // Scope object must remain stable when the profile is refreshed: otherwise
  // the draft hook would re-run its boot effect and risk a stale flush.
  const scope = useMemo<BelgeDraftScope>(
    () => accountId ? { kind: "account", accountId } : { kind: "guest" },
    [accountId],
  );
  return useMemo(() => ({
    ready,
    profile: usableProfile ?? null,
    scope,
    warning,
    skipGuestRestore,
  }), [ready, usableProfile, scope, warning, skipGuestRestore]);
}
