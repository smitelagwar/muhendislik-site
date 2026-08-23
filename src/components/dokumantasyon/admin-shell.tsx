"use client";

import { useState, useEffect } from "react";
import { FolderArchive, User, ShieldCheck, ShieldAlert, Laptop } from "lucide-react";
import { DokumantasyonFileManager } from "./file-manager";
import styles from "./dok-workspace.module.css";

interface AdminShellProps {
  username: string;
  children?: React.ReactNode;
}

export function DokumantasyonAdminShell({ username, children }: AdminShellProps) {
  const [readiness, setReadiness] = useState<{
    storageMode?: "durable" | "local_dev" | "blocked";
    ok?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dokumantasyon/readiness")
      .then((res) => res.json())
      .then((data) => setReadiness(data))
      .catch(() => setReadiness({ storageMode: "blocked", ok: false }));
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-gradient-to-b from-amber-500/[0.03] via-background to-amber-500/[0.05]">
      {/* Ambiyans Warm Glass Işık Küreleri (Luminous Background Glow) */}
      {/* BUG-2 FIX: fixed → absolute, overflow-hidden wrapper küreler sayfaya sızmasın */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-amber-500/20 blur-[130px] dark:bg-amber-500/15" />
      <div className="pointer-events-none absolute top-1/4 -right-32 h-[36rem] w-[36rem] rounded-full bg-orange-500/15 blur-[150px] dark:bg-orange-600/12" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-[140px] dark:bg-amber-600/10" />

      <div className="relative mx-auto w-full max-w-[1920px] space-y-3 px-2 py-3 sm:space-y-4 sm:px-4 sm:py-4 lg:px-6 xl:px-8 z-10">
        {/* Üst Bar / Header */}
        <div className={`flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${styles.workspaceHeader}`}>
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Dökümantasyon Modülü
                </h1>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Admin
                </span>
                {readiness && (
                  readiness.storageMode === "durable" ? (
                    <span className="inline-flex max-w-full basis-full items-center gap-1 whitespace-normal rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 sm:basis-auto">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Kalıcı Depolama (Neon + Blob)</span>
                    </span>
                  ) : readiness.storageMode === "local_dev" ? (
                    <span className="inline-flex max-w-full basis-full items-center gap-1 whitespace-normal rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 sm:basis-auto">
                      <Laptop className="h-3 w-3" />
                      <span>Yerel Geliştirme (Local)</span>
                    </span>
                  ) : (
                    <span className="inline-flex max-w-full basis-full items-center gap-1 whitespace-normal rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500 sm:basis-auto">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Depolama Eksik (Korumalı)</span>
                    </span>
                  )
                )}
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Özel dosya depolama, klasörleme ve süreli link paylaşım paneli
              </p>
            </div>
          </div>

          {/* Kullanıcı Rozeti */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
            <div className="flex items-center gap-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-card/70 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-inner">
              <User className="h-3.5 w-3.5 text-amber-500" />
              <span>{username}</span>
            </div>
          </div>
        </div>

        {/* İçerik veya Drive Benzeri Dosya Yöneticisi */}
        {children ? children : <DokumantasyonFileManager />}
      </div>
    </div>
  );
}
