import type { ReactNode } from "react";

type BelgeStudioPageShellProps = {
  children: ReactNode;
  title?: string;
};

export function BelgeStudioPageShell({
  children,
}: BelgeStudioPageShellProps) {
  return (
    <section className="box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] lg:px-2 lg:pb-2">
      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden">
        {children}
      </div>
    </section>
  );
}
