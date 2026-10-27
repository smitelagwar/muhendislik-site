import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { addTbdyClauseAnchors, stripTbdyFrontmatter } from "@/lib/regulations/tbdy-reader";

/**
 * Read-only server-rendered markdown. No HTML passthrough or editor state.
 * Extracted tables and equations remain visibly unverified.
 */
export function TbdyMarkdown({ raw }: { raw: string }) {
  const text = addTbdyClauseAnchors(stripTbdyFrontmatter(raw));
  return (
    <article data-testid="tbdy-markdown-reader" className="min-w-0 space-y-4 break-words text-[var(--home-fg)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl">{children}</h1>,
          h2: ({ children }) => {
            const label = String(children);
            const page = label.match(/^PDF sayfa (\d+)/);
            return <h2 id={page ? `pdf-page-${page[1]}` : undefined} className="scroll-mt-24 border-t border-[var(--home-border)] pt-8 text-lg font-black text-[var(--home-fg)] sm:text-xl">{children}</h2>;
          },
          h3: ({ children }) => {
            const title = String(children);
            const clause = title.match(/^(\d+(?:\.\d+){1,3})\./);
            return <h3 id={clause ? `madde-${clause[1].replace(/\./g, "-")}` : undefined} className="scroll-mt-24 pt-4 text-base font-black leading-7 text-[var(--home-fg)]">{children}</h3>;
          },
          p: ({ children }) => <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--home-fg)]/90">{children}</p>,
          a: ({ children, href }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="break-all font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300">{children}</a>,
          blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-amber-500/70 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-[var(--home-muted)]">{children}</blockquote>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-6 text-sm leading-7">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6 text-sm leading-7">{children}</ol>,
          li: ({ children }) => <li className="break-words">{children}</li>,
          table: ({ children }) => <div className="my-5 max-w-full overflow-x-auto rounded-lg border border-[var(--home-border)]"><table className="w-max min-w-full border-collapse text-left text-xs">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-r border-[var(--home-border)] bg-[var(--home-surface-raised)] px-3 py-2 font-bold">{children}</th>,
          td: ({ children }) => <td className="border-b border-r border-[var(--home-border)] px-3 py-2 align-top">{children}</td>,
          pre: ({ children }) => <pre className="my-4 max-w-full overflow-x-auto rounded-lg bg-[var(--home-surface-raised)] p-4 text-xs leading-6">{children}</pre>,
          code: ({ children }) => <code className="rounded bg-[var(--home-surface-raised)] px-1 py-0.5 font-mono text-xs">{children}</code>,
          hr: () => <hr className="my-8 border-[var(--home-border)]" />,
        }}
      >{text}</ReactMarkdown>
    </article>
  );
}
