"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderArchive, LogOut, User, Loader2, ShieldCheck, ShieldAlert, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokumantasyonFileManager } from "./file-manager";

interface AdminShellProps {
  username: string;
  children?: React.ReactNode;
}

export function DokumantasyonAdminShell({ username, children }: AdminShellProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/dokumantasyon/cikis", {
        method: "POST",
      });
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Üst Bar / Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <FolderArchive className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Dökümantasyon Modülü
              </h1>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Admin
              </span>
              {readiness && (
                readiness.storageMode === "durable" ? (
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Kalıcı Depolama (Neon + Blob)</span>
                  </span>
                ) : readiness.storageMode === "local_dev" ? (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                    <Laptop className="h-3 w-3" />
                    <span>Yerel Geliştirme (Local)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Depolama Eksik (Korumalı)</span>
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Özel dosya depolama, klasörleme ve süreli link paylaşım paneli
            </p>
          </div>
        </div>

        {/* Kullanıcı Rozeti ve Çıkış Yap Butonu */}
        <div className="flex items-center gap-3 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground">
            <User className="h-3.5 w-3.5 text-amber-500" />
            <span>{username}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-1.5 border-border hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Çıkış Yap</span>
          </Button>
        </div>
      </div>

      {/* İçerik veya Drive Benzeri Dosya Yöneticisi */}
      {children ? children : <DokumantasyonFileManager />}
    </div>
  );
}
