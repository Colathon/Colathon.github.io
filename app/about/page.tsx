import { Mail, Link2, MapPin, GraduationCap } from "lucide-react";
import { site } from "@/lib/site";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="site-shell py-12 sm:py-16">
      <header className="about-header">
        <Image src="/avatar.jpg" alt="Colathon" width={96} height={96} className="about-avatar" />
        <div>
          <p className="eyebrow mb-3">A little about me</p>
          <h1 className="heading-display text-4xl text-zinc-900 sm:text-5xl">About Me</h1>
        </div>
      </header>
      <div className="about-layout">
        <section aria-label="Biography">
          <div className="prose prose-zinc max-w-none">
            <p className="text-lg text-zinc-700 leading-relaxed mb-6">
              Hi, I&apos;m <strong className="font-display">Colathon</strong>. I&apos;m a student in USTC and major in CG, specifically Mesh-Simplification for now.
            </p>
            <p className="text-zinc-700 leading-relaxed mb-6">
              Currently, I also have an interest in three-dimensional generation and reconstruction, besides doing some improvements for the experience and efficiency while utilizing AI Agents.
            </p>

            <h3 className="font-display font-semibold text-zinc-900 mt-8 mb-4">Research Interests</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
              <li className="bg-white border border-zinc-200 p-4 rounded-xl text-sm font-medium tracking-wide text-zinc-700">
                Three-dimensional Generation and Construction
              </li>
              <li className="bg-white border border-zinc-200 p-4 rounded-xl text-sm font-medium tracking-wide text-zinc-700">
                Computer Graphics
              </li>
              <li className="bg-white border border-zinc-200 p-4 rounded-xl text-sm font-medium tracking-wide text-zinc-700">
                Mesh Simplification
              </li>
              <li className="bg-white border border-zinc-200 p-4 rounded-xl text-sm font-medium tracking-wide text-zinc-700">
                Autonomous AI Agents
              </li>
            </ul>

            <h3 className="font-display font-semibold text-zinc-900 mt-12 mb-4">Background</h3>
            <p className="text-zinc-700 leading-relaxed">
              I spend most of my time reading research papers, experimenting with new frameworks, and thinking about the future of computing. Outside of tech, I enjoy watching movies.
            </p>
          </div>
        </section>
        <aside aria-label="Contact and background" className="rounded-xl border border-border bg-white/60 p-5">
          <h2 className="eyebrow mb-5">Find me here</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-600 hover:text-zinc-950 transition-colors">
              <Mail className="h-5 w-5" />
              <a href={`mailto:${site.email}`} className="text-sm tracking-wide break-all">{site.email}</a>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 hover:text-zinc-950 transition-colors">
              <Link2 className="h-5 w-5" />
              <a href="https://github.com/Colathon" className="text-sm tracking-wide">github.com/Colathon</a>
            </div>
            <div className="flex items-center gap-3 text-zinc-600">
              <MapPin className="h-5 w-5" />
              <span className="text-sm tracking-wide">Hefei, China</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm tracking-wide">University of Science and Technology of China</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
