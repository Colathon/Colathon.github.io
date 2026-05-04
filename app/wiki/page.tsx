"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSortedWikiData } from "@/lib/blog";
import { Calendar, Tag, BookOpen, Search, X } from "lucide-react";
import { Suspense } from "react";

function WikiList() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get("tag");
  const allWikiEntries = getSortedWikiData();

  const wikiEntries = tagFilter
    ? allWikiEntries.filter((entry) => 
        entry.tags?.some(t => t.toLowerCase() === tagFilter.toLowerCase())
      )
    : allWikiEntries;

  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-5xl">
      <div className="mb-16 border-b border-zinc-800 pb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4 flex items-center gap-3">
          <BookOpen className="h-10 w-10 text-blue-500" />
          Digital Garden
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mb-6">
          A collection of interconnected notes, research, and technical snippets. 
        </p>

        {tagFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm w-fit">
            <Tag className="h-3.5 w-3.5" />
            Filtering by: <span className="font-bold">{tagFilter}</span>
            <Link href="/wiki" className="ml-1 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {wikiEntries.map((entry) => (
          <article 
            key={entry.slug} 
            className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center text-xs text-zinc-500 mb-4 gap-4">
              <span className="flex items-center">
                <Calendar className="mr-1.5 h-3 w-3" />
                {entry.date}
              </span>
              {entry.tags && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <div className="flex gap-1.5">
                    {entry.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="hover:text-blue-400 transition-colors cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
              <Link href={`/wiki/${entry.slug}`}>
                {entry.title}
              </Link>
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-2">
              {entry.excerpt}
            </p>
            
            <Link 
              href={`/wiki/${entry.slug}`}
              className="text-xs font-semibold text-zinc-200 flex items-center gap-1 group-hover:text-white"
            >
              Explore Note
              <Search className="h-3 w-3 transition-transform group-hover:scale-110" />
            </Link>
          </article>
        ))}
      </div>

      {wikiEntries.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500 italic">No notes found for this category.</p>
          <Link href="/wiki" className="text-blue-500 hover:underline mt-4 inline-block">View all notes</Link>
        </div>
      )}
    </div>
  );
}

export default function WikiListPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-white">Loading Garden...</div>}>
      <WikiList />
    </Suspense>
  );
}
