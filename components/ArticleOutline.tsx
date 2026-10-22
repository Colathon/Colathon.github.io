import { List, ArrowUp } from "lucide-react";
import { getArticleHeadings } from "@/lib/markdown";

export default function ArticleOutline({ content }: { content: string }) {
  const headings = getArticleHeadings(content);
  if (headings.length < 2) return null;
  return (
    <>
      <details id="article-outline" className="article-outline mb-12 rounded-md border border-border bg-white/50">
        <summary className="flex min-h-14 items-center gap-3 px-5 py-4 text-sm font-medium text-accent"><List className="h-4 w-4" /><span className="flex-1">On this page / 本文目录</span><span className="text-xs font-normal text-stone-500">{headings.length} sections</span><span className="outline-toggle text-lg" aria-hidden="true">+</span></summary>
        <nav aria-label="Table of contents" className="max-h-80 overflow-y-auto border-t border-border px-5 py-4">
          <ol className="space-y-1">{headings.map((heading) => <li key={heading.id} className={heading.depth === 3 ? "ml-4" : ""}><a href={`#${heading.id}`} className={`block rounded px-2 py-2 text-sm leading-6 hover:bg-[#e6ebe1] hover:text-accent ${heading.depth === 3 ? "text-stone-500" : "font-medium text-stone-700"}`}>{heading.title}</a></li>)}</ol>
        </nav>
      </details>
      <a href="#article-outline" aria-label="Back to article contents" className="fixed bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/95 text-accent shadow-sm backdrop-blur-sm hover:bg-[#e6ebe1] sm:right-6" title="Back to contents"><ArrowUp className="h-4 w-4" /></a>
    </>
  );
}
