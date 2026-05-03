import Link from "next/link";
import { getSortedPostsData } from "@/lib/blog";
import { Calendar, Tag, ArrowRight } from "lucide-react";

export default function BlogListPage() {
  const posts = getSortedPostsData();

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
          技术博客
        </h1>
        <p className="text-lg text-zinc-500">
          分享我在 AI、算法以及软件工程领域的研究与实践。
        </p>
      </div>

      <div className="space-y-12">
        {posts.map((post) => (
          <article key={post.slug} className="group relative flex flex-col items-start">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">
              <Link href={`/blog/${post.slug}`}>
                <span className="absolute -inset-x-4 -inset-y-6 z-20 sm:-inset-x-6 sm:rounded-2xl" />
                <span className="relative z-10">{post.title}</span>
              </Link>
            </h2>
            <div className="relative z-10 order-first mb-3 flex items-center text-sm text-zinc-400">
              <Calendar className="mr-1.5 h-4 w-4" />
              <time dateTime={post.date}>{post.date}</time>
              {post.tags && (
                <div className="ml-4 flex items-center">
                  <Tag className="mr-1.5 h-3 w-3" />
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="relative z-10 mt-2 text-sm text-zinc-600 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="relative z-10 mt-4 flex items-center text-sm font-medium text-zinc-900 group-hover:underline">
              阅读全文
              <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
