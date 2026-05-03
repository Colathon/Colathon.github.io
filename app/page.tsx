import Link from "next/link";
import { ArrowRight, BookText, Code2, BookOpen, Mail, Link2, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                </span>
                Available for collaboration
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                Researcher, Developer, <span className="italic">Explorer.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                Hi, I&apos;m <span className="text-white font-medium">Colathon</span>. I build autonomous systems and explore the frontier of human-AI collaboration.
              </p>

              {/* Contact Info Chips */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
                <a href="lhz7269874@gmail.com" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:border-zinc-600 transition-all">
                  <Mail className="h-4 w-4" />
                  lhz7269874@gmail.com
                </a>
                <a href="https://github.com/Colathon" target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:border-zinc-600 transition-all">
                  <Link2 className="h-4 w-4" />
                  @Colathon
                </a>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  View Projects <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-zinc-800 bg-transparent text-white font-bold hover:bg-zinc-900 transition-all"
                >
                  Biography
                </Link>
              </div>
            </div>

            <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full rounded-full border-[6px] border-zinc-900 overflow-hidden shadow-2xl group transition-all duration-700 hover:rotate-3">
                 <img src="/avatar.jpg" alt="Colathon" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Subtle Elements */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-30 pointer-events-none hero-gradient" />
      </section>

      {/* Grid Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { 
              icon: BookText, 
              title: "Technical Blog", 
              desc: "Deep dives into algorithms, AI research, and software architecture.", 
              link: "/blog",
              label: "Articles"
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
              className="group p-10 rounded-[2.5rem] border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-500"
            >
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-white/20 transition-all duration-500">
                <item.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed font-light">
                {item.desc}
              </p>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-white transition-colors flex items-center gap-2">
                {item.label} <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
