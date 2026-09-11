"use client";
import { useEffect, useRef } from "react";
// Yalnız görünüm snapshot'ları; dosya/token/işlem komutları history'ye yazılmaz.
const snapshots = new Map<string, unknown>();
export function useWorkspaceHistory<T>(
  snapshot: T,
  depth: number,
  restore: (snapshot: T) => void,
  enabled: boolean,
) {
  const latest = useRef({ snapshot, restore, depth });
  useEffect(() => {
    latest.current = { snapshot, restore, depth };
  });
  const initialized = useRef(false);
  const applying = useRef(false);
  const pendingClose = useRef<{ snapshot: T; depth: number } | null>(null);
  const signature = JSON.stringify(snapshot);
  useEffect(() => {
    if (!enabled) return;
    const current = window.history.state?.dokWorkspace as
      { id: string; depth: number } | undefined;
    if (!initialized.current) {
      initialized.current = true;
      if (current && snapshots.has(current.id)) {
        applying.current = true;
        latest.current.restore(snapshots.get(current.id) as T);
        return;
      }
    }
    if (applying.current) {
      applying.current = false;
      return;
    }
    if (current && depth < current.depth) {
      // Uygula veya bir işlemle kapatılırken yeni ayarları eski snapshot ezmemeli.
      if (!pendingClose.current) {
        pendingClose.current = { snapshot: latest.current.snapshot, depth };
        window.history.go(depth - current.depth);
      }
      return;
    }
    const entry =
      current && depth === current.depth
        ? current
        : { id: crypto.randomUUID(), depth };
    snapshots.set(entry.id, latest.current.snapshot);
    if (snapshots.size > 200) snapshots.delete(snapshots.keys().next().value!);
    const state = { ...window.history.state, dokWorkspace: entry };
    if (depth > (current?.depth ?? 0))
      window.history.pushState(state, "", window.location.href);
    else window.history.replaceState(state, "", window.location.href);
  }, [signature, depth, enabled]);
  useEffect(() => {
    if (!enabled) return;
    const pop = () => {
      const entry = window.history.state?.dokWorkspace as
        { id: string; depth: number } | undefined;
      const closing = pendingClose.current;
      if (closing) {
        pendingClose.current = null;
        const target = entry ?? {
          id: crypto.randomUUID(),
          depth: closing.depth,
        };
        snapshots.set(target.id, closing.snapshot);
        window.history.replaceState(
          {
            ...window.history.state,
            dokWorkspace: { ...target, depth: closing.depth },
          },
          "",
          window.location.href,
        );
        return;
      }
      if (entry && snapshots.has(entry.id)) {
        applying.current = true;
        latest.current.restore(snapshots.get(entry.id) as T);
      }
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [enabled]);
}
