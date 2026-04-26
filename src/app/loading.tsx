const articlePlaceholders = ["one", "two", "three"] as const;
const sidebarPlaceholders = ["tools", "standards"] as const;

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="sr-only" role="status" aria-live="polite">
        Sayfa yükleniyor
      </div>

      <div className="space-y-12 animate-pulse" aria-hidden="true">
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/20 lg:col-span-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13, 148, 136,0.18),transparent_35%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(9,9,11,0.95))]" />
            <div className="relative space-y-6">
              <div className="h-4 w-28 rounded-full bg-teal-400/25" />
              <div className="space-y-3">
                <div className="h-10 w-11/12 rounded-2xl bg-zinc-800" />
                <div className="h-10 w-7/12 rounded-2xl bg-zinc-800" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded-full bg-zinc-800/80" />
                <div className="h-4 w-5/6 rounded-full bg-zinc-800/80" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-24 rounded-3xl border border-zinc-800 bg-zinc-900/80" />
                <div className="h-24 rounded-3xl border border-zinc-800 bg-zinc-900/80" />
                <div className="h-24 rounded-3xl border border-zinc-800 bg-zinc-900/80" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:col-span-4">
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-5 h-4 w-24 rounded-full bg-zinc-800" />
              <div className="space-y-3">
                <div className="h-5 w-4/5 rounded-full bg-zinc-800" />
                <div className="h-5 w-2/3 rounded-full bg-zinc-800" />
                <div className="h-20 rounded-3xl bg-zinc-900" />
              </div>
            </div>
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-5 h-4 w-32 rounded-full bg-zinc-800" />
              <div className="space-y-3">
                <div className="h-12 rounded-2xl bg-zinc-900" />
                <div className="h-12 rounded-2xl bg-zinc-900" />
                <div className="h-12 rounded-2xl bg-zinc-900" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="h-8 w-44 rounded-2xl bg-zinc-800" />
              <div className="hidden h-10 w-40 rounded-full bg-zinc-900 sm:block" />
            </div>

            {articlePlaceholders.map((item) => (
              <div key={item} className="grid gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[12rem_1fr]">
                <div className="h-40 rounded-3xl bg-zinc-900 md:h-full" />
                <div className="space-y-4 py-1">
                  <div className="h-4 w-24 rounded-full bg-teal-400/20" />
                  <div className="space-y-2">
                    <div className="h-6 w-5/6 rounded-full bg-zinc-800" />
                    <div className="h-6 w-2/3 rounded-full bg-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded-full bg-zinc-800/80" />
                    <div className="h-4 w-3/4 rounded-full bg-zinc-800/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            {sidebarPlaceholders.map((item) => (
              <div key={item} className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-5 h-5 w-36 rounded-full bg-zinc-800" />
                <div className="space-y-3">
                  <div className="h-14 rounded-2xl bg-zinc-900" />
                  <div className="h-14 rounded-2xl bg-zinc-900" />
                  <div className="h-14 rounded-2xl bg-zinc-900" />
                </div>
              </div>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}
