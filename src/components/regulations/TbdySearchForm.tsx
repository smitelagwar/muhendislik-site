import { Search } from "lucide-react";
import { TBDY_BASE_ROUTE } from "@/lib/regulations/tbdy-reader";

export function TbdySearchForm({ query = "" }: { query?: string }) {
  return (
    <form role="search" action={`${TBDY_BASE_ROUTE}/ara`} method="get" className="flex min-w-0 flex-wrap items-stretch gap-2">
      <label htmlFor="tbdy-source-search" className="sr-only">TBDY içinde madde ve metin ara</label>
      <div className="relative min-w-[190px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-muted)]" aria-hidden />
        <input
          id="tbdy-source-search"
          type="search"
          name="q"
          required
          minLength={2}
          maxLength={100}
          defaultValue={query}
          autoComplete="off"
          placeholder="4.7.2, burulma, göreli kat ötelemesi…"
          className="min-h-11 w-full rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] pl-10 pr-3 text-sm text-[var(--home-fg)] outline-none placeholder:text-[var(--home-muted)] focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20"
        />
      </div>
      <button type="submit" className="min-h-11 rounded-lg bg-amber-600 px-5 text-sm font-bold text-white transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
        Ara
      </button>
    </form>
  );
}
