import { getWikiData, getSortedWikiData } from "@/lib/blog.server";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft, Book } from "lucide-react";
import ReadingProgressBar from "@/components/ReadingProgressBar";

interface WikiPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const entries = getSortedWikiData();
  return entries.map((entry) => ({
    slug: entry.slug,
  }));
}

export default async function WikiEntryPage({ params }: WikiPageProps) {
  const { slug } = await params;
  const entryData = await getWikiData(slug);

  return (
    <article className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-[1100px]">
      <ReadingProgressBar />
      <Link
        href="/wiki"
        className="inline-flex items-center text-sm font-medium tracking-wide text-zinc-500 hover:text-zinc-950 mb-12 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Garden
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <Book className="h-5 w-5" />
          <span className="label-editorial">Wiki Note</span>
        </div>
        <h1 className="heading-display text-4xl text-zinc-900 mb-6 sm:text-5xl leading-tight">
          {entryData.title}
        </h1>
        <div className="flex flex-wrap items-center text-sm text-zinc-500 gap-6">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <time dateTime={entryData.date}>{entryData.date}</time>
          </div>
          {entryData.tags && (
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              <div className="flex gap-2">
                {entryData.tags.map((tag) => (
                  <span key={tag} className="text-zinc-600 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="prose prose-zinc prose-custom max-w-none prose-headings:text-zinc-900 prose-headings:font-display prose-p:text-zinc-700 prose-p:leading-relaxed prose-pre:bg-zinc-100 prose-pre:text-zinc-800 prose-pre:border prose-pre:border-zinc-200 prose-a:text-blue-600 hover:prose-a:text-blue-700">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {entryData.content || ""}
        </ReactMarkdown>
      </div>

      <footer className="mt-20 pt-10 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 italic">
          Note: This wiki entry is managed by an AI Agent as part of a Digital Garden experiment.
        </p>
      </footer>
    </article>
  );
}
