"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { Paper } from "@/lib/papers";
import type { ContentData } from "@/lib/blog.server";
import CollectionControls from "@/components/CollectionControls";
import { collectionTags, matchesQuery, normalizeTag } from "@/lib/collections";

type ReadingEntry = Partial<Paper> & { title: string; tags: string[]; report?: ContentData };

export default function ReadingListClient({ papers, reports }: { papers: Paper[]; reports: ContentData[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = normalizeTag(searchParams.get("tag") ?? "");
  const [query, setQuery] = useState("");
  const entries: ReadingEntry[] = papers.map((paper) => {
    const report = reports.find((report) => paper.reportHref === `/reading/${report.slug}`);
    const tags = [...new Map([...paper.tags, ...(report?.tags ?? [])].map((value) => [normalizeTag(value), value])).values()];
    return { ...paper, report, tags };
  });
  // Keep new Markdown reports discoverable even before bibliography details are added.
  for (const report of reports) {
    if (!entries.some((entry) => entry.report?.slug === report.slug)) entries.push({ title: report.title, tags: report.tags ?? [], report });
  }
  entries.sort((a, b) => (b.report?.date ?? "").localeCompare(a.report?.date ?? ""));
  const tags = collectionTags(entries);
  const visible = entries.filter((entry) => (!tag || entry.tags.some((value) => normalizeTag(value) === tag)) && matchesQuery(query, [entry.title, entry.authors, entry.note, entry.source, entry.report?.title, entry.report?.excerpt, ...entry.tags]));
  function setTag(value: string) {
    router.replace(value ? `/reading?tag=${encodeURIComponent(value)}` : "/reading", { scroll: false });
  }

  return (
    <div className="site-shell pb-24">
      <header className="collection-header">
        <p className="eyebrow mb-5">The reading desk / {reports.length} reports</p>
        <h1 className="heading-display text-4xl sm:text-6xl">Reading Reports<span className="text-accent">.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-500">A closer look at the papers I read. Algorithms unpacked, derivations worked through, and ideas connected back to the <Link href="/wiki" className="text-accent underline underline-offset-4">wiki</Link>.</p>
      </header>
      <CollectionControls query={query} onQueryChange={setQuery} tag={tag} onTagChange={setTag} tags={tags} placeholder="Search papers, authors, and summaries…" />
      <div className="mb-2 flex items-center justify-between gap-4 text-xs text-stone-500"><p role="status">{visible.length} {visible.length === 1 ? "paper" : "papers"}{tag ? ` in ${tags.find((item) => item.value === tag)?.label ?? tag}` : " on the reading desk"}</p><span>Latest reports first</span></div>
      <div>
        {visible.map((entry) => (
          <article key={entry.report?.slug ?? entry.title} className="grid gap-4 border-b border-border py-8 sm:grid-cols-[105px_1fr] sm:gap-7">
            <div className="flex items-center gap-4 sm:block"><span className="text-[10px] font-semibold uppercase tracking-widest text-accent">{entry.report ? "Reading report" : "Paper"}</span>{entry.report && <time dateTime={entry.report.date} className="block text-[11px] text-stone-500 sm:mt-3">{entry.report.date}</time>}</div>
            <div className="min-w-0">
              {entry.source && <p className="mb-3 text-xs text-stone-500">{entry.source}</p>}
              <h2 className="font-display text-xl leading-snug sm:text-2xl">{entry.report ? <Link href={`/reading/${entry.report.slug}`} className="hover:text-accent">{entry.title}</Link> : entry.link ? <a href={entry.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{entry.title}</a> : entry.title}</h2>
              {entry.authors && <p className="mt-3 text-xs leading-6 text-stone-500">{entry.authors}</p>}
              <p className="mt-4 max-w-4xl text-sm leading-7 text-stone-600">{entry.note ?? entry.report?.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">{entry.tags.map((value) => <Link key={value} href={`/reading?tag=${encodeURIComponent(value)}`} className="rounded bg-[#eeeae2] px-2 py-1 text-[10px] leading-5 text-stone-600 hover:bg-[#e0e7dc]">{value}</Link>)}</div>
              <div className="mt-5 flex flex-wrap items-center gap-6">
                {entry.report && <Link href={`/reading/${entry.report.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-[#284738]">Read report / 阅读报告 <ArrowRight className="h-3.5 w-3.5" /></Link>}
                {entry.link && <a href={entry.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-xs text-stone-500 hover:text-accent">Original paper <ArrowUpRight className="h-3.5 w-3.5" /></a>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {visible.length === 0 && <div className="mt-8 rounded-md border border-dashed border-border px-6 py-16 text-center"><h2 className="font-display text-2xl">No papers found</h2><p className="mt-3 text-sm text-stone-500">Try a title, author, or a broader topic.</p><button onClick={() => { setQuery(""); setTag(""); }} className="mt-6 min-h-11 text-sm font-medium text-accent underline underline-offset-4">Clear all filters</button></div>}
    </div>
  );
}
