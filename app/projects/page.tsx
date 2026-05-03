import { Code2, ExternalLink, Link2 } from "lucide-react";

const projects = [
  {
    title: "AI 驱动的个人主页",
    description: "使用 Next.js 14+, Tailwind CSS 和 AI Agent 辅助开发的现代化响应式个人主页。",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    github: "#",
    demo: "/",
  },
  {
    title: "算法可视化工具",
    description: "一个交互式的算法可视化平台，帮助学生更好地理解数据结构与算法。",
    tags: ["React", "Canvas", "Algorithms"],
    github: "#",
    demo: "#",
  },
  {
    title: "智能托管平台 (规划中)",
    description: "旨在为开发者提供一键式的 AI 模型部署与托管服务。",
    tags: ["Python", "Docker", "FastAPI"],
    github: "#",
    demo: "#",
  },
];

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
          开源项目
        </h1>
        <p className="text-lg text-zinc-500">
          这里展示了我的一些技术尝试和正在进行的实验。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <div key={project.title} className="group p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center mb-6">
              <Code2 className="h-5 w-5 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
            <p className="text-zinc-500 mb-6 leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-md bg-zinc-50 text-zinc-600 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-4">
              <a href={project.github} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                <Link2 className="h-4 w-4" /> 源码
              </a>
              <a href={project.demo} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                <ExternalLink className="h-4 w-4" /> 预览
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
