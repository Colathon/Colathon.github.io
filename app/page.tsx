import Link from "next/link";
import { ArrowRight, BookText, Code2, BookOpen, Mail, Link2 } from "lucide-react";
import FallingPetals from "@/components/FallingPetals";

export default function Home() {
  return (
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Photo background (homepage only) */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-magnolia.jpg')" }}
        />
        {/* Readability scrim: lifts the warm-white so black text stays legible */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/95 via-background/75 to-background/35 sm:from-background/92 sm:via-background/60 sm:to-background/20" />
        {/* Falling petals over the photo, behind the content */}
        <FallingPetals />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-zinc-300 backdrop-blur-sm text-[0.625rem] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Available for collaboration
              </div>

              <h1 className="heading-display text-6xl md:text-8xl font-bold tracking-tight text-zinc-900 mb-8 leading-[1.1]">
                Researcher, Developer, Explorer.
              </h1>

              <p className="text-lg md:text-xl text-zinc-700 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light tracking-tight">
                Hi, I&apos;m <span className="text-zinc-900 font-display font-semibold">Colathon</span>, exploring Computer Graphics and Deep Learning.
              </p>

              {/* Contact Info Chips */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
                <a href="mailto:lhz7269874@gmail.com" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-zinc-300 backdrop-blur-sm text-sm text-zinc-700 hover:border-zinc-400 transition-all">
                  <Mail className="h-4 w-4" />
                  lhz7269874@gmail.com
                </a>
                <a href="https://github.com/Colathon" target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-zinc-300 backdrop-blur-sm text-sm text-zinc-700 hover:border-zinc-400 transition-all">
                  <Link2 className="h-4 w-4" />
                  @Colathon
                </a>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-zinc-900 text-white font-display font-bold tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  View Projects <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-zinc-300 bg-white/60 backdrop-blur-sm text-zinc-900 font-display font-bold tracking-tight hover:bg-white transition-all"
                >
                  Biography
                </Link>
              </div>
            </div>

            <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/30 to-transparent rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full rounded-full border-[6px] border-white overflow-hidden shadow-2xl group transition-all duration-700 hover:rotate-3">
                 <img src="/avatar.jpg" alt="Colathon" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: BookText,
              title: "Technical Blog",
              desc: "Deep dives into algorithms, AI research, and software architecture.",
              link: "/blog",
              label: "Articles"
            },
            {
              icon: BookOpen,
              title: "Digital Garden",
              desc: "My personal wiki of interconnected notes and technical snippets.",
              link: "/wiki",
              label: "Explore Garden"
            },
            {
              icon: Code2,
              title: "Open Source",
              desc: "Experimental projects and some of my homeworks.",
              link: "/projects",
              label: "Explore"
            },
            {
              icon: BookOpen,
              title: "Reading List",
              desc: "Curated research papers and articles that shape my thinking.",
              link: "/reading",
              label: "Library"
            }
          ].map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className="group p-8 rounded-[2rem] border border-zinc-200 bg-white/60 hover:bg-white hover:border-zinc-300 hover:shadow-md transition-all duration-500"
            >
              <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-zinc-300 transition-all duration-500">
                <item.icon className="h-6 w-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-display font-bold text-zinc-900 mb-3">{item.title}</h3>
              <p className="text-zinc-600 mb-6 leading-relaxed font-light text-sm">
                {item.desc}
              </p>
              <div className="text-[0.625rem] font-bold tracking-[0.25em] uppercase text-zinc-500 group-hover:text-zinc-900 transition-colors flex items-center gap-2">
                {item.label} <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
