"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import type { ContentData } from "@/lib/blog.server";
import CollectionControls from "@/components/CollectionControls";
import { collectionTags, matchesQuery, normalizeTag } from "@/lib/collections";

export default function WikiListClient({ initialEntries }: { initialEntries: ContentData[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = normalizeTag(searchParams.get("tag") ?? "");
  const [query, setQuery] = useState("");
  const notes = initialEntries.filter((entry) => entry.slug !== "welcome");
  const tags = collectionTags(notes);
  const entries = notes.filter((entry) => (!tag || entry.tags?.some((value) => normalizeTag(value) === tag)) && matchesQuery(query, [entry.title, entry.excerpt, ...(entry.tags ?? [])]));
  function setTag(value: string) {
    router.replace(value ? `/wiki?tag=${encodeURIComponent(value)}` : "/wiki", { scroll: false });
  }

  return (
    <div className="site-shell pb-24">
      <header className="collection-header">
        <p className="eyebrow mb-5">The wiki / {notes.length} connected notes</p>
        <h1 className="heading-display text-4xl sm:text-6xl">Digital Garden<span className="text-accent">.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-500">A growing notebook of concepts, derivations, and useful tools.<br className="hidden sm:block" /> Start with a topic, or look up something you&apos;re curious about.</p>
      </header>
      <Link href="/wiki/welcome" className="mb-8 flex items-center gap-4 rounded-md border border-[#d5dfcf] bg-[#e9eee3] px-5 py-4 text-accent">
        <Compass className="h-5 w-5 shrink-0" /><span className="flex-1 text-sm"><strong className="font-medium">New to the garden?</strong><span className="mt-1 block text-xs text-stone-600 sm:ml-2 sm:inline">Open the topic map and find a place to start.</span></span><ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
      <CollectionControls query={query} onQueryChange={setQuery} tag={tag} onTagChange={setTag} tags={tags} placeholder="Search notes, summaries, and tags…" />
      <div className="mb-5 flex items-center justify-between gap-4 text-xs text-stone-500"><p role="status">{entries.length} {entries.length === 1 ? "note" : "notes"}{tag ? ` in ${tags.find((item) => item.value === tag)?.label ?? tag}` : " in the garden"}</p><span>Newest first</span></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <article key={entry.slug} className="note-card group">
            <time dateTime={entry.date} className="font-mono text-[11px] text-stone-500">{entry.date}</time>
            <h2 className="mt-4 text-lg font-semibold leading-8 text-stone-800 group-hover:text-accent"><Link href={`/wiki/${entry.slug}`}>{entry.title}</Link></h2>
            <p className="mb-6 mt-3 line-clamp-3 text-sm leading-7 text-stone-500">{entry.excerpt}</p>
            <div className="mt-auto flex flex-wrap gap-2">{entry.tags?.slice(0, 2).map((value) => <Link key={value} href={`/wiki?tag=${encodeURIComponent(value)}`} className="rounded bg-stone-100 px-2 py-1 text-[10px] leading-5 text-stone-600 hover:bg-[#e6ebe1]">{value}</Link>)}</div>
            <Link href={`/wiki/${entry.slug}`} aria-label={`Read note: ${entry.title}`} className="mt-5 flex min-h-10 items-center justify-between border-t border-border pt-3 text-xs font-medium text-accent">Read note <ArrowUpRight className="h-4 w-4" /></Link>
          </article>
        ))}
      </div>
      {entries.length === 0 && <div className="rounded-md border border-dashed border-border px-6 py-16 text-center"><h2 className="font-display text-2xl">No notes found</h2><p className="mt-3 text-sm text-stone-500">Try a different keyword or explore another topic.</p><button onClick={() => { setQuery(""); setTag(""); }} className="mt-6 min-h-11 text-sm font-medium text-accent underline underline-offset-4">Clear all filters</button></div>}
    </div>
  );
}
