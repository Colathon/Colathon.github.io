import Link from "next/link";
import { getSortedWikiData } from "@/lib/blog";
import { Calendar, Tag, BookOpen, Search } from "lucide-react";

export default function WikiListPage() {
  const wikiEntries = getSortedWikiData();

  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-5xl">
      <div className="mb-16 border-b border-zinc-800 pb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4 flex items-center gap-3">
          <BookOpen className="h-10 w-10 text-blue-500" />
          Digital Garden
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl">
          A collection of interconnected notes, research, and technical snippets. 
          Everything here is a work in progress.
        </p>
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
                <span className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  {entry.tags[0]}
                </span>
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
          <p className="text-zinc-500 italic">The garden is currently empty. Planting seeds soon...</p>
        </div>
      )}
    </div>
  );
}
