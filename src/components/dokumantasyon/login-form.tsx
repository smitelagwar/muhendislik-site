"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DokumantasyonLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);

  const submitLogin = async () => {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/dokumantasyon/giris", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError({
          message: data.error || "Kullanıcı adı veya şifre hatalı.",
          retryable: res.status === 503,
        });
        setLoading(false);
        return;
      }

      // Başarılı giriş -> sayfayı yenileyerek admin shell'e geçiş yap
      router.refresh();
    } catch {
      setError({
        message: navigator.onLine
          ? "Bağlantı hatası oluştu. Lütfen tekrar deneyin."
          : "İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin.",
        retryable: true,
      });
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitLogin();
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Başlık ve Rozet */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-amber-500 dark:text-amber-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Güvenli Yönetici Alanı</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dökümantasyon Modülü
          </h1>
          <p className="text-sm text-muted-foreground">
            Dosya ve süreli paylaşım yönetimi için lütfen oturum açın.
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span>{error.message}</span>
                  {error.retryable && (
                    <button
                      type="button"
                      onClick={() => void submitLogin()}
                      disabled={loading}
                      className="mt-2 block text-xs font-semibold underline underline-offset-2 hover:text-red-700 disabled:opacity-50 dark:hover:text-red-300"
                    >
                      Tekrar dene
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Kullanıcı Adı
              </label>
              <input
                id="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin kullanıcı adı"
                className="w-full rounded-lg border border-input bg-background/80 px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background/80 px-3.5 py-2.5 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 rounded-lg bg-amber-500 font-semibold text-zinc-950 transition-all hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Giriş Yap</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
            Tek yönetici hesabı desteklenmektedir. Güvenlik amacıyla başarısız denemeler sınırlandırılır.
          </div>
        </div>
      </div>
    </div>
  );
}
