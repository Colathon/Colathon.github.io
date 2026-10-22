"use client";

import { Search, X } from "lucide-react";

interface CollectionControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  tag: string;
  onTagChange: (tag: string) => void;
  tags: { value: string; label: string; count: number }[];
  placeholder: string;
}

export default function CollectionControls({ query, onQueryChange, tag, onTagChange, tags, placeholder }: CollectionControlsProps) {
  return (
    <div className="mb-7 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input type="search" aria-label={placeholder} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-md border border-border bg-white/70 pl-11 pr-12 text-sm placeholder:text-stone-400" />
          {query && <button type="button" onClick={() => onQueryChange("")} aria-label="Clear search" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-stone-500"><X className="h-4 w-4" /></button>}
        </div>
        <select aria-label="Filter by topic" value={tag} onChange={(event) => onTagChange(event.target.value)} className="h-12 w-full rounded-md border border-border bg-white/70 px-4 text-sm text-stone-600 sm:w-60">
          <option value="">All topics</option>
          {tag && !tags.some((item) => item.value === tag) && <option value={tag}>{tag}</option>}
          {tags.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Popular topics">
        <button type="button" className="topic-chip" aria-pressed={!tag} onClick={() => onTagChange("")}>All topics</button>
        {tags.slice(0, 4).map((item) => <button key={item.value} type="button" className="topic-chip" aria-pressed={tag === item.value} onClick={() => onTagChange(tag === item.value ? "" : item.value)}>{item.label}<span className="opacity-60">{item.count}</span></button>)}
      </div>
    </div>
  );
}
