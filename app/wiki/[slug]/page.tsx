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
    <article className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-[1760px]">
      <ReadingProgressBar />
      <Link
        href="/wiki"
        className="inline-flex items-center text-sm font-medium tracking-wide text-zinc-500 hover:text-white mb-12 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Garden
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-2 text-blue-500 mb-4">
          <Book className="h-5 w-5" />
          <span className="label-editorial">Wiki Note</span>
        </div>
        <h1 className="heading-display text-4xl text-white mb-6 sm:text-5xl leading-tight">
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
                  <span key={tag} className="text-zinc-400 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="prose prose-invert prose-zinc prose-custom max-w-none prose-headings:text-white prose-headings:font-display prose-p:text-zinc-400 prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-a:text-blue-400 hover:prose-a:text-blue-300 lg:columns-2 lg:gap-x-24 [&_pre]:break-inside-avoid [&_table]:break-inside-avoid [&_.katex-display]:break-inside-avoid [&_blockquote]:break-inside-avoid [&_h2]:break-after-avoid [&_h3]:break-after-avoid">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {entryData.content || ""}
        </ReactMarkdown>
      </div>

      <footer className="mt-20 pt-10 border-t border-zinc-800">
        <p className="text-sm text-zinc-500 italic">
          Note: This wiki entry is managed by an AI Agent as part of a Digital Garden experiment.
        </p>
      </footer>
    </article>
  );
}
