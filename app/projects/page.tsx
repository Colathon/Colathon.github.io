import { Code2, ExternalLink, Link2 } from "lucide-react";

const projects = [
  {
    title: "AI-Powered Personal Homepage",
    description: "A modern, responsive portfolio built using Next.js 15, Tailwind CSS, and AI Agents. Designed for researchers and developers.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    github: "https://github.com/Colathon/Colathon.github.io",
    demo: "/",
  },
  {
    title: "Autonomous Agent Hub",
    description: "A centralized platform for deploying and monitoring autonomous AI agents in specialized environments.",
    tags: ["Python", "FastAPI", "Docker"],
    github: "#",
    demo: "#",
  },
   {
    title: "Framework3D of Ruzino",
    description: "The CG homework in terms of 3D on the basis of Ruzino from an upperclassman, and the branch work is what I have done.",
    tags: ["3D", "CG", "Interaction"],
    github: "https://github.com/Colathon/Ruzino_HW",
    demo: "#",
  },
];

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-5xl">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
          Featured Projects
        </h1>
        <p className="text-lg text-zinc-500">
          A showcase of my technical experiments, open-source contributions, and research prototypes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {projects.map((project) => (
          <div key={project.title} className="group p-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{project.title}</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-10">
              {project.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-500 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-6">
              <a href={project.github} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
                <Link2 className="h-4 w-4" /> Source Code
              </a>
              <a href={project.demo} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
                <ExternalLink className="h-4 w-4" /> Live Demo
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
