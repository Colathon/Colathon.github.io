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
    title: "LODGE: Level-of-Detail Large-Scale Gaussian Splatting with Efficient Rendering",
    authors: "Jonas Kulhanek, Marie-Julie Rakotosaona, Fabian Manhardt, Christina Tsalicoglou, Michael Niemeyer, Torsten Sattler, Songyou Peng, Federico Tombari",
    source: "NeurIPS 2025 (Spotlight)",
    link: "https://arxiv.org/abs/2505.23158",
    tags: ["Computer Graphics", "Gaussian Splatting", "Large-scale Rendering"],
    note: "Builds distance-aware Gaussian LoD levels with depth-aware 3D smoothing, importance pruning, and tile-cost-driven thresholds; camera-space chunks then precompute and stream only the relevant active Gaussians, while opacity blending between the two nearest chunks avoids popping on transitions.",
    reportHref: "/reading/lodge"
  },
  {
    title: "LightGaussian: Unbounded 3D Gaussian Compression with 15x Reduction and 200+ FPS",
    authors: "Zhiwen Fan, Kevin Wang, Kairun Wen, Zehao Zhu, Dejia Xu, Zhangyang Wang",
    source: "NeurIPS 2024",
    link: "https://arxiv.org/abs/2311.17245",
    tags: ["Computer Graphics", "Gaussian Splatting", "Model Compression"],
    note: "A post-hoc compression pipeline that shrinks a trained 3DGS ~15x while doubling FPS, driven by a single rendering-aware global significance score: it prunes low-significance Gaussians (then fine-tunes to recover), distills high-degree spherical harmonics into a low-degree student model via pseudo-view augmentation, and applies significance-weighted vector quantization to only the least-significant SH coefficients.",
    reportHref: "/reading/lightgaussian"
  },
  {
    title: "CLoD-GS: Continuous Level-of-Detail via 3D Gaussian Splatting",
    authors: "Zhigang Cheng, Mingchao Sun, Yu Liu, Zengye Ge, Luyang Tang, Mu Xu, Yangyan Li, Peng Pan",
    source: "ICLR 2026",
    link: "https://arxiv.org/abs/2510.09997",
    tags: ["Computer Graphics", "Gaussian Splatting", "Level of Detail"],
    note: "Replaces discrete LoD (multiple model copies + popping on transitions) with a continuous LoD baked into a single 3DGS model: each Gaussian learns a distance-decay factor that smoothly fades out less-important primitives, driven by a user-controllable virtual distance scale s_v, and trained coarse-to-fine with a primitive-count regularization loss for quality-scalable rendering at reduced primitive count.",
    reportHref: "/reading/clod-gs"
  },
  {
    title: "2D Gaussian Splatting for Geometrically Accurate Radiance Fields",
    authors: "Binbin Huang, et al.",
    source: "SIGGRAPH 2024",
    link: "https://arxiv.org/abs/2403.17888",
    tags: ["Computer Graphics", "Gaussian Splatting", "Neural Rendering"],
    note: "Approximates primitives as 2D Gaussians to achieve geometrically accurate surface reconstruction while maintaining real-time rendering speeds.",
    reportHref: "/reading/2d-gaussian-splatting"
  },
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
    title: "Mip-Splatting: Alias-free 3D Gaussian Splatting",
    authors: "Zehao Yu, Anpei Chen, Binbin Huang, Torsten Sattler, Andreas Geiger",
    source: "CVPR 2024",
    link: "https://arxiv.org/abs/2311.16493",
    tags: ["Computer Graphics", "Gaussian Splatting", "Anti-aliasing"],
    note: "Diagnoses why 3DGS's screen-space dilation causes erosion, high-frequency artifacts and dilation-brightening when zooming, then replaces it with a Nyquist-bounded 3D smoothing filter (baked into the representation) plus a 2D Mip filter approximating the imaging box filter — enabling alias-free rendering across sampling rates.",
    reportHref: "/reading/mip-splatting"
  },
  {
    title: "Gaussian Opacity Fields: Efficient Adaptive Surface Reconstruction in Unbounded Scenes",
    authors: "Zehao Yu, Torsten Sattler, Andreas Geiger",
    source: "SIGGRAPH Asia 2024 / ACM ToG",
    link: "https://arxiv.org/abs/2404.10772",
    tags: ["Computer Graphics", "Gaussian Splatting", "Surface Reconstruction"],
    note: "Defines an opacity field via explicit ray-Gaussian intersection (evaluable at any 3D point) and a per-view minimum, then extracts a compact, detail-rich mesh directly from its level set using a tetrahedral grid + Marching Tetrahedra with binary search — no Poisson reconstruction or TSDF fusion.",
    reportHref: "/reading/gaussian-opacity-fields"
  },
  {
    title: "SuGaR: Surface-Aligned Gaussian Splatting for Efficient 3D Mesh Reconstruction and High-Quality Mesh Rendering",
    authors: "Antoine Guédon, Vincent Lepetit",
    source: "CVPR 2024",
    link: "https://arxiv.org/abs/2311.12775",
    tags: ["Computer Graphics", "Gaussian Splatting", "Mesh Reconstruction"],
    note: "Regularizes 3D Gaussians to be flat and surface-aligned, then extracts a mesh via density level-set sampling and Poisson reconstruction, finally binding thin Gaussians back to triangles for an editable, high-quality mesh + Gaussian hybrid.",
    reportHref: "/reading/sugar"
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
        <h1 className="heading-display text-4xl text-zinc-900 mb-4">Reading List</h1>
        <p className="text-lg text-zinc-500 tracking-tight">
          A curated collection of research papers and technical articles I find influential.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {papers.map((paper) => (
          <div key={paper.title} className="group relative bg-white border border-zinc-200 p-8 rounded-3xl hover:border-zinc-300 hover:shadow-md transition-all shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="h-4 w-4 text-blue-600" />
                  <span className="label-editorial">{paper.source}</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900 mb-2 group-hover:text-blue-700 transition-colors">
                  <a href={paper.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    {paper.title} <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h3>
                <p className="text-zinc-500 text-sm mb-4 italic">{paper.authors}</p>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                  {paper.note}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {paper.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 text-xs font-medium tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {paper.reportHref && (
                    <Link
                      href={paper.reportHref}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium hover:bg-indigo-100 hover:text-indigo-800 transition-all shrink-0"
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
