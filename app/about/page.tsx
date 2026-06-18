import { Mail, Link2, MapPin, GraduationCap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="w-full md:w-1/3">
          <div className="aspect-square rounded-3xl overflow-hidden border-2 border-zinc-200 bg-zinc-100 mb-6 shadow-lg">
            <img src="/avatar.jpg" alt="Colathon" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-600 hover:text-zinc-950 transition-colors">
              <Mail className="h-5 w-5" />
              <a href="mailto:your-email@example.com" className="text-sm tracking-wide">lhz7269874@gmail.com</a>
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
        </div>

        <div className="w-full md:w-2/3">
          <h1 className="heading-display text-4xl text-zinc-900 mb-6">About Me</h1>
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
        </div>
      </div>
    </div>
  );
}
