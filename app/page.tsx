import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, NotebookPen, Link2, Mail } from "lucide-react";
import { getSortedReportsData, getSortedWikiData } from "@/lib/blog.server";
import FallingPetals from "@/components/FallingPetals";
import { site } from "@/lib/site";

const topics = [
  { title: "Computer graphics", description: "Rendering, geometry & reconstruction", tag: "Computer Graphics" },
  { title: "Mathematics", description: "Linear algebra, probability & analysis", tag: "Mathematics" },
  { title: "Machine learning", description: "Models, foundations & optimization", tag: "Machine Learning" },
  { title: "Tools & systems", description: "Practical notes for everyday work", tag: "Tools" },
];

export default function Home() {
  const notes = getSortedWikiData().filter((entry) => entry.slug !== "welcome");
  const reports = getSortedReportsData();
  const collections = [
    { href: "/wiki", title: "Digital Garden", label: "Wiki", count: notes.length, unit: "notes", icon: NotebookPen, description: "Concepts, derivations, and practical notes. Follow a topic and see how the pieces connect.", action: "Explore the wiki", className: "collection-garden" },
    { href: "/reading", title: "Reading Reports", label: "Reading", count: reports.length, unit: "reports", icon: BookOpen, description: "Working through papers, one idea at a time. Detailed explanations, algorithms, and the reasoning behind them.", action: "Browse reading reports", className: "collection-reading" },
  ];

  return (
    <div className="site-shell pb-20 sm:pb-28">
      <section className="home-intro" aria-labelledby="home-title">
        <Image src="/hero-magnolia.jpg" alt="" fill sizes="100vw" preload className="home-intro-photo" />
        <div className="home-intro-shade" aria-hidden="true" />
        <FallingPetals />
        <div className="home-intro-content">
          <p className="eyebrow mb-6"><span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" /> Colathon&apos;s notebook</p>
          <h1 id="home-title" className="heading-display text-[clamp(2.75rem,5.3vw,4.75rem)]">A place for ideas<br />to take <em className="font-normal text-accent">root.</em></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-stone-600">Notes to connect the dots. Papers to understand them better.<br className="hidden sm:block" /> My growing collection of things learned along the way.</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link href="/wiki" className="inline-flex min-h-11 items-center gap-3 rounded-md bg-accent px-5 text-sm font-medium text-white hover:bg-[#284738]">Open wiki <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/reading" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent">Reading reports <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-stone-700">
            <a href={site.github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium hover:text-accent">
              <Link2 className="h-4 w-4" /> GitHub <span className="text-stone-500">@Colathon</span><ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center gap-2 hover:text-accent"><Mail className="h-4 w-4" /> Email</a>
          </div>
        </div>
      </section>

      <section id="collections" aria-labelledby="collections-title" className="scroll-mt-28">
        <div className="section-heading"><h2 id="collections-title" className="eyebrow">01 / The collections</h2><span className="hidden text-xs text-stone-500 sm:block">Two ways into the notebook</span></div>
        <div className="grid gap-5 md:grid-cols-2">
          {collections.map((collection) => (
            <Link key={collection.href} href={collection.href} className={`collection-card group ${collection.className}`}>
              <div className="mb-8 flex items-center justify-between"><collection.icon className="h-6 w-6" strokeWidth={1.5} /><span className="text-xs tabular-nums">{collection.count} {collection.unit}</span></div>
              <p className="eyebrow mb-3 !text-current opacity-70">{collection.label}</p>
              <h3 className="heading-display text-3xl sm:text-4xl">{collection.title}</h3>
              <p className="mt-4 max-w-md text-sm leading-7 opacity-80">{collection.description}</p>
              <div className="mt-8 flex items-center justify-between border-t border-current/15 pt-5 text-sm font-medium">{collection.action}<ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="topics-title">
        <div className="section-heading"><h2 id="topics-title" className="eyebrow">02 / Follow a thread</h2></div>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => (
            <Link key={topic.tag} href={`/wiki?tag=${encodeURIComponent(topic.tag)}`} className="group border-b border-border py-5">
              <div className="flex items-center justify-between gap-2 text-sm font-medium">{topic.title}<ArrowUpRight className="h-4 w-4 text-stone-400 transition-colors group-hover:text-accent" /></div>
              <p className="mt-2 text-xs leading-5 text-stone-500">{topic.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="recent-title">
        <div className="section-heading"><h2 id="recent-title" className="eyebrow">03 / Recently added</h2><span className="text-xs text-stone-500">From the notebook</span></div>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {[
            { title: "Wiki notes", href: "/wiki", entries: notes.slice(0, 3) },
            { title: "Reading reports", href: "/reading", entries: reports.slice(0, 3) },
          ].map((collection) => (
            <div key={collection.href}>
              <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-2xl">{collection.title}</h3><Link href={collection.href} aria-label={`View all ${collection.title.toLowerCase()}`} className="inline-flex min-h-11 items-center gap-2 text-xs text-accent">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
              {collection.entries.map((entry) => (
                <Link key={entry.slug} href={`${collection.href}/${entry.slug}`} className="group flex gap-4 border-b border-border py-6">
                  <div className="min-w-0 flex-1"><time dateTime={entry.date} className="font-mono text-[11px] text-stone-500">{entry.date}</time><h4 className="mt-2 text-base font-medium leading-7 transition-colors group-hover:text-accent">{entry.title}</h4><p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">{entry.excerpt}</p></div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-stone-400 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7 text-sm text-stone-500"><p>A notebook, always in progress.</p><div className="flex gap-6"><Link href="/blog" className="hover:text-accent">Occasional writing ↗</Link><Link href="/projects" className="hover:text-accent">Things I build ↗</Link></div></div>
    </div>
  );
}
