import { Mail, Link2, MapPin, GraduationCap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="w-full md:w-1/3">
          <div className="aspect-square rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 mb-6 shadow-2xl">
            <img src="/avatar.jpg" alt="Colathon" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
              <Mail className="h-5 w-5" />
              <a href="mailto:your-email@example.com" className="text-sm">your-email@example.com</a>
            </div>
            <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
              <Link2 className="h-5 w-5" />
              <a href="https://github.com/Colathon" className="text-sm">github.com/Colathon</a>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Beijing, China</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm">Tsinghua University (Example)</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-6">About Me</h1>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-lg text-zinc-400 leading-relaxed mb-6">
              Hi, I&apos;m <strong>Colathon</strong>. I&apos;m a student and developer passionate about Artificial Intelligence, Software Engineering, and building tools that matter. 
            </p>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Currently, my research focus is on <strong>AI Agents</strong> and their applications in software development lifecycles. I enjoy exploring how large language models can be transformed into autonomous agents capable of complex reasoning and tool usage.
            </p>
            
            <h3 className="text-white mt-8 mb-4">Research Interests</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
              <li className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-300">
                Large Language Models (LLMs)
              </li>
              <li className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-300">
                Autonomous AI Agents
              </li>
              <li className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-300">
                Software Engineering Automation
              </li>
              <li className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-300">
                Human-AI Collaboration
              </li>
            </ul>

            <h3 className="text-white mt-12 mb-4">Background</h3>
            <p className="text-zinc-400 leading-relaxed">
              I spend most of my time reading research papers, experimenting with new frameworks, and thinking about the future of computing. Outside of tech, I enjoy gaming and digital arts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
