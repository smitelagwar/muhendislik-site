"use client";

import { useState } from "react";
import { Lock, KeyRound, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PasswordScreenProps {
  rawToken: string;
  title?: string | null;
  totalFiles: number;
}

export function SharePasswordScreen({
  rawToken,
  title,
  totalFiles,
}: PasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dokumantasyon/public/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawToken,
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Şifre doğrulanamadı.");
        setLoading(false);
        return;
      }

      // Başarılı: çerez set edildi, sayfayı yenile
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
          <Lock className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Şifre Korumalı Paylaşım
        </h1>

        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {title ? (
            <span className="font-semibold text-foreground">"{title}"</span>
          ) : (
            "Bu dosya paketi"
          )}{" "}
          ({totalFiles} dosya) şifrelenmiştir. Devam etmek için şifreyi girin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Erişim Şifresi
          </label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi yazın..."
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full gap-2 bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Doğrulanıyor...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Dosyalara Eriş</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
