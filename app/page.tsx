import Link from "next/link";
import { ArrowRight, BookText, Code2, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32 bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-8">
              Researcher, Developer, <span className="text-zinc-600 italic">Explorer.</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 leading-relaxed max-w-2xl">
              I build autonomous systems and explore the frontier of human-AI collaboration. Currently focused on the next generation of AI Agents.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all shadow-lg"
              >
                View Projects <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-zinc-800 bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all"
              >
                More About Me
              </Link>
            </div>
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -z-10 w-2/3 h-full opacity-20 pointer-events-none">
           <div className="w-full h-full bg-gradient-to-bl from-blue-500/20 via-transparent to-transparent blur-3xl" />
        </div>
      </section>

      {/* Featured Sections Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group p-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <BookText className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Technical Blog</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Deep dives into algorithms, AI research, and software architecture.
            </p>
            <Link href="/blog" className="text-sm font-semibold inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
              Read Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="group p-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Code2 className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Open Source</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Experimental projects and contributions to the developer community.
            </p>
            <Link href="/projects" className="text-sm font-semibold inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
              Explore Code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="group p-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Reading List</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Curated research papers and articles that shape my thinking.
            </p>
            <Link href="/reading" className="text-sm font-semibold inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
              Browse Library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
