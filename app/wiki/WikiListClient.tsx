"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Tag, BookOpen, X, ArrowRight } from "lucide-react";
import { ContentData } from "@/lib/blog.server";

export default function WikiListClient({ initialEntries }: { initialEntries: ContentData[] }) {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get("tag");

  const wikiEntries = tagFilter
    ? initialEntries.filter((entry) => 
        entry.tags?.some(t => t.toLowerCase() === tagFilter.toLowerCase())
      )
    : initialEntries;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {wikiEntries.map((entry) => (
          <article 
            key={entry.slug} 
            className="group glass-card p-6 rounded-3xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center text-[10px] text-zinc-500 mb-4 gap-3 uppercase tracking-widest font-bold">
                <span className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {entry.date}
                </span>
                {entry.tags && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{entry.tags[0]}</span>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3 group-hover:text-zinc-300 transition-colors line-clamp-2">
                <Link href={`/wiki/${entry.slug}`}>
                  {entry.title}
                </Link>
              </h2>
              
              <p className="text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-3 font-light">
                {entry.excerpt}
              </p>
            </div>

            <Link 
              href={`/wiki/${entry.slug}`}
              className="mt-auto inline-flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white group-hover:bg-white group-hover:text-black transition-all"
            >
              Explore Note
              <ArrowRight className="h-3 w-3" />
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
