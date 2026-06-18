import { getReportData, getSortedReportsData } from "@/lib/blog.server";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft, FileText } from "lucide-react";
import ReadingProgressBar from "@/components/ReadingProgressBar";

interface ReportPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const entries = getSortedReportsData();
  return entries.map((entry) => ({
    slug: entry.slug,
  }));
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug } = await params;
  const reportData = await getReportData(slug);

  return (
    <article className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-[1100px]">
      <ReadingProgressBar />
      <Link
        href="/reading"
        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-950 mb-12 transition-colors tracking-wide"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回阅读清单
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-2 text-indigo-600 mb-4">
          <FileText className="h-5 w-5" />
          <span className="label-editorial">阅读报告</span>
        </div>
        <h1 className="heading-display text-4xl text-zinc-900 mb-6 sm:text-5xl leading-tight">
          {reportData.title}
        </h1>
        <div className="flex flex-wrap items-center text-sm text-zinc-500 gap-6">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <time dateTime={reportData.date}>{reportData.date}</time>
          </div>
          {reportData.tags && (
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              <div className="flex gap-2">
                {reportData.tags.map((tag) => (
                  <span key={tag} className="text-zinc-600 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="prose prose-custom prose-zinc max-w-none prose-headings:text-zinc-900 prose-headings:font-display prose-p:text-zinc-700 prose-p:leading-relaxed prose-pre:bg-zinc-100 prose-pre:text-zinc-800 prose-pre:border prose-pre:border-zinc-200 prose-a:text-blue-600 hover:prose-a:text-blue-700">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {reportData.content || ""}
        </ReactMarkdown>
      </div>

      <footer className="mt-20 pt-10 border-t border-zinc-200">
        <Link
          href="/reading"
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors tracking-wide"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回阅读清单
        </Link>
      </footer>
    </article>
  );
}
