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

      <div className="space-y-8 animate-fade-in">
        {posts.map((post) => (
          <article key={post.slug} className="group relative glass-card p-8 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <ArrowRight className="h-24 w-24 -rotate-45" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center text-sm text-zinc-500 mb-4">
                <Calendar className="mr-2 h-4 w-4" />
                <time dateTime={post.date}>{post.date}</time>
                {post.tags && (
                  <div className="ml-6 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <div className="flex gap-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-zinc-400 hover:text-white transition-colors cursor-default">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-zinc-300 transition-colors mb-4">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-zinc-400 leading-relaxed mb-6 max-w-2xl">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-sm font-semibold text-white group-hover:gap-3 transition-all"
              >
                Read Article
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
