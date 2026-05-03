import { getPostData, getSortedPostsData } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft } from "lucide-react";

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
    <article className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <Link
        href="/blog"
        className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4 sm:text-5xl">
          {postData.title}
        </h1>
        <div className="flex flex-wrap items-center text-sm text-zinc-400 gap-4">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-4 w-4" />
            <time dateTime={postData.date}>{postData.date}</time>
          </div>
          {postData.tags && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4" />
              <div className="flex gap-2">
                {postData.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="prose prose-zinc max-w-none prose-headings:font-bold prose-headings:text-zinc-900 prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
        <ReactMarkdown>{postData.content}</ReactMarkdown>
      </div>
    </article>
  );
}
