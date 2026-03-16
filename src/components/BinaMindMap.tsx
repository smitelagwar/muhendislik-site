import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BINA_BRANCH_COLORS, BINA_MINDMAP_DATA, type BinaMindMapNode } from "@/lib/bina-asamalari";
import { cn } from "@/lib/utils";

function getBranchColor(node: BinaMindMapNode): string {
  if (node.id === "root") {
    return "#6c63ff";
  }

  return BINA_BRANCH_COLORS[node.id as keyof typeof BINA_BRANCH_COLORS] ?? "#94a3b8";
}

function countBranchItems(node: BinaMindMapNode): number {
  return 1 + (node.children?.reduce((total, child) => total + countBranchItems(child), 0) ?? 0);
}

function renderLabel(label: string): ReactNode {
  const lines = label.split("\n");

  return lines.map((line, index) => (
    <span key={`${label}-${index}`} className="block">
      {line}
    </span>
  ));
}

function getAccentStyle(color: string): CSSProperties {
  return {
    borderColor: `${color}33`,
    backgroundColor: `${color}12`,
    color,
  };
}

function LeafLink({ node, branchColor }: { node: BinaMindMapNode; branchColor: string }) {
  return (
    <Link
      href={node.url}
      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white dark:hover:bg-slate-800"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: branchColor, opacity: 0.78 }} />
      <span className="leading-tight">{renderLabel(node.label)}</span>
    </Link>
  );
}

function NestedNode({
  node,
  branchColor,
  depth,
}: {
  node: BinaMindMapNode;
  branchColor: string;
  depth: number;
}) {
  const children = node.children ?? [];
  const childrenAreLeaves = children.every((child) => !child.children?.length);
  const isLeaf = children.length === 0;

  if (isLeaf) {
    return <LeafLink node={node} branchColor={branchColor} />;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50",
        depth >= 3 && "shadow-none",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={node.url}
          className="group min-w-0 flex-1 rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 h-3 w-3 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(15,23,42,0.05)] dark:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]"
              style={{ backgroundColor: branchColor, opacity: depth === 2 ? 1 : 0.82 }}
            />
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 transition group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-white">
                {renderLabel(node.label)}
              </h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Alt dal
              </p>
            </div>
          </div>
        </Link>

        <span
          className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
          style={getAccentStyle(branchColor)}
        >
          {countBranchItems(node) - 1} konu
        </span>
      </div>

      {childrenAreLeaves ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {children.map((child) => (
            <LeafLink key={child.id} node={child} branchColor={branchColor} />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4 dark:border-slate-800/60">
          {children.map((child) => (
            <NestedNode key={child.id} node={child} branchColor={branchColor} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchCard({ node }: { node: BinaMindMapNode }) {
  const branchColor = getBranchColor(node);
  const children = node.children ?? [];

  return (
    <article
      id={node.id}
      className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.15)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40 dark:shadow-[0_20px_60px_-42px_rgba(2,8,23,0.6)] md:p-6"
    >
      <div
        className="mb-5 rounded-[24px] border px-4 py-4"
        style={{
          borderColor: `${branchColor}3b`,
          background: `linear-gradient(135deg, ${branchColor}16, rgba(255,255,255,0.72))`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <Link
            href={node.url}
            className="group min-w-0 flex-1 rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: branchColor }}
              />
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-tight text-slate-950 transition group-hover:text-blue-700 dark:text-slate-50 dark:group-hover:text-white">
                  {renderLabel(node.label)}
                </h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Ana dal
                </p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
              style={getAccentStyle(branchColor)}
            >
              {countBranchItems(node) - 1} konu
            </span>
            <Link
              href={node.url}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate-700 transition hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={`${node.label.replace(/\n/g, " ")} sayfasına git`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {node.summary}
        </p>
      </div>

      <div className="space-y-4">
        {children.map((child) => (
          <NestedNode key={child.id} node={child} branchColor={branchColor} depth={2} />
        ))}
      </div>
    </article>
  );
}

export default function BinaMindMap() {
  const branches = BINA_MINDMAP_DATA.children ?? [];

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/50 md:p-5">
        <div className="grid gap-4 xl:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard key={branch.id} node={branch} />
          ))}
        </div>
      </div>
    </section>
  );
}
