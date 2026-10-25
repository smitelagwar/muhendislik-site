export default function SimulationLoading() {
  return (
    <div className="tool-page-shell py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-36 animate-pulse rounded-3xl border border-border/80 dark:border-purple-500/20 bg-card/80 dark:bg-[#0f0d22]/80 p-6" />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="h-[520px] animate-pulse rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/80 dark:bg-[#0b0a18]" />
          <div className="h-[520px] animate-pulse rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/80 dark:bg-[#0f0d22]/80" />
        </div>
      </div>
    </div>
  );
}
