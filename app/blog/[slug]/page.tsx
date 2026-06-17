import { getPostData, getSortedPostsData } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import ReadingProgressBar from "@/components/ReadingProgressBar";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  return (
    <article className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-[1100px]">
      <ReadingProgressBar />
      <Link
        href="/blog"
        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-white mb-12 transition-colors tracking-wide"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Link>

      <header className="mb-16">
        <h1 className="text-4xl heading-display text-white mb-6 sm:text-5xl leading-tight">
          {postData.title}
        </h1>
        <div className="flex flex-wrap items-center text-sm text-zinc-500 gap-6">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <time dateTime={postData.date}>{postData.date}</time>
          </div>
          {postData.tags && (
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              <div className="flex gap-2">
                {postData.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="prose prose-invert prose-zinc prose-custom max-w-none prose-headings:text-white prose-headings:font-display prose-p:text-zinc-400 prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {postData.content || ""}
        </ReactMarkdown>
      </div>
    </article>
  );
}
