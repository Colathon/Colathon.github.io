import Link from "next/link";
import { getSortedPostsData } from "@/lib/blog";
import { Calendar, Tag, ArrowRight } from "lucide-react";

export default function BlogListPage() {
  const posts = getSortedPostsData();

  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
          Technical Blog
        </h1>
        <p className="text-lg text-zinc-500">
          Insights into AI research, software engineering, and the future of technology.
        </p>
      </div>

      <div className="space-y-16">
        {posts.map((post) => (
          <article key={post.slug} className="group relative flex flex-col items-start">
            <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              <Link href={`/blog/${post.slug}`}>
                <span className="absolute -inset-x-4 -inset-y-6 z-20 sm:-inset-x-6 sm:rounded-2xl" />
                <span className="relative z-10">{post.title}</span>
              </Link>
            </h2>
            <div className="relative z-10 order-first mb-4 flex items-center text-sm text-zinc-500">
              <Calendar className="mr-2 h-4 w-4" />
              <time dateTime={post.date}>{post.date}</time>
              {post.tags && (
                <div className="ml-6 flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <div className="flex gap-3">
                    {post.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="relative z-10 mt-2 text-zinc-400 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="relative z-10 mt-6 flex items-center text-sm font-semibold text-zinc-200 group-hover:text-white">
              Read More
              <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
