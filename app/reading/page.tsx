import { ExternalLink, Bookmark, FileText } from "lucide-react";
import Link from "next/link";

type Paper = {
  title: string;
  authors: string;
  source: string;
  link: string;
  tags: string[];
  note: string;
  reportHref?: string;
};

const papers: Paper[] = [
  {
    title: "3D Gaussian Splatting for Real-Time Radiance Field Rendering",
    authors: "Bernhard Kerbl, et al.",
    source: "SIGGRAPH 2023",
    link: "https://arxiv.org/abs/2308.04079",
    tags: ["Computer Graphics", "Gaussian Splatting", "Neural Rendering"],
    note: "Represents scenes as a collection of 3D Gaussians and uses tile-based rasterization for real-time, high-quality novel-view synthesis at 1080p.",
    reportHref: "/reading/3d-gaussian-splatting"
  },
  {
    title: "Simplifying Surfaces with Color and Texture using Quadric Error Metrics",
    authors: "Michael Garland, Paul Heckbert",
    source: "IEEE Visualization 1998",
    link: "https://www.cs.cmu.edu/~garland/Papers/quadric2.pdf",
    tags: ["Computer Graphics", "Mesh Simplification", "Geometry Processing"],
    note: "Extends the original QEM to handle vertex attributes (color, texture, normals), enabling appearance-aware mesh simplification via generalized quadric matrices.",
    reportHref: "/reading/generalized-qem"
  },
  {
    title: "Single Edge Collapse Quad-Dominant Mesh Reduction",
    authors: "Julian Knodt",
    source: "arXiv 2024 / ACM ToG",
    link: "https://arxiv.org/abs/2411.16874",
    tags: ["Computer Graphics", "Geometry Processing", "Mesh Decimation"],
    note: "Demonstrates that single edge collapse can preserve quad-dominant mesh topology during decimation without sacrificing geometric quality.",
    reportHref: "/reading/mesh-reduction-knodt"
  },
  {
    title: "Voyager: An Open-Ended Embodied Agent with Large Language Models",
    authors: "Guanzhi Wang, et al.",
    source: "arXiv 2023",
    link: "https://arxiv.org/abs/2305.16291",
    tags: ["AI Agents", "Reinforcement Learning"],
    note: "A seminal paper on how LLMs can explore open-ended worlds (Minecraft) using code as actions."
  },
  {
    title: "Generative Agents: Interactive Simulacra of Human Behavior",
    authors: "Joon Sung Park, et al.",
    source: "arXiv 2023 / CHI 2023",
    link: "https://arxiv.org/abs/2304.03442",
    tags: ["Social Simulation", "Generative Agents"],
    note: "Explores long-term memory and social dynamics in autonomous agents."
  },
  {
    title: "A Survey on Large Language Model based Autonomous Agents",
    authors: "Lei Wang, et al.",
    source: "arXiv 2023",
    link: "https://arxiv.org/abs/2308.11432",
    tags: ["Survey", "LLM Agents"],
    note: "A comprehensive overview of the current state of AI agents."
  },
  {
    title: "GimmBO: Interactive Generative Image Model Merging via Bayesian Optimization",
    authors: "Zhengyuan Yang, et al.",
    source: "arXiv 2026",
    link: "https://arxiv.org/abs/2601.18585",
    tags: ["Bayesian Optimization", "Diffusion Models", "Human-in-the-loop"],
    note: "Introduces a sample-efficient framework for merging diffusion adapters using Preferential Bayesian Optimization and a two-stage search strategy.",
    reportHref: "/reading/gimmbo"
  },
  {
    title: "Inverse Rendering for Discrete X-Ray Computed Tomography",
    authors: "Zhengyuan Yang, et al.",
    source: "SIGGRAPH Asia 2025",
    link: "https://arxiv.org/abs/2510.05432",
    tags: ["Inverse Rendering", "Computed Tomography", "Differentiable Rendering"],
    note: "Formulates discrete CT reconstruction as a continuous probabilistic optimization problem, using expectation surrogates and modified natural gradients for high-fidelity material decomposition.",
    reportHref: "/reading/discrete-ct-inverse-rendering"
  }
];

export default function ReadingPage() {
  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-5xl">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Reading List</h1>
        <p className="text-lg text-zinc-500">
          A curated collection of research papers and technical articles I find influential.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {papers.map((paper) => (
          <div key={paper.title} className="group relative bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-all shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{paper.source}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  <a href={paper.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    {paper.title} <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h3>
                <p className="text-zinc-400 text-sm mb-4 italic">{paper.authors}</p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  {paper.note}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {paper.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-500 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {paper.reportHref && (
                    <Link
                      href={paper.reportHref}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 text-xs font-medium hover:bg-indigo-900/60 hover:text-indigo-300 transition-all shrink-0"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      阅读报告
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
