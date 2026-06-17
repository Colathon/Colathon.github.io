@AGENTS.md

# CLAUDE.md — 项目操作手册

> 本文件是 Claude 在此仓库工作的主指引。事实部分已于 2026-06-03 对照源码核实。
> 配套文档：[`GEMINI.md`](./GEMINI.md)（早期 agent 规则）、[`PROJECT_STATE.md`](./PROJECT_STATE.md)（技术栈与历史）、[`GUIDE.md`](./GUIDE.md)（非技术文案修改指引）。早期文档由低版本模型生成，含若干已知错误——以本文件为准。

## 1. 项目是什么

Colathon 的个人主页 + **数字花园（Digital Garden）Wiki**。Next.js 静态导出，部署到 GitHub Pages。内容由 Markdown 驱动，我担任维护者 / 技术写作 / 知识图谱管理者。

## 2. 技术栈（已核实）

- **Next.js 16.2.4**（App Router, Turbopack）+ **React 19.2.4** + TypeScript 5
- **Tailwind CSS 4** + `@tailwindcss/typography`（文章用 `prose` 渲染）
- **Markdown 管线**：`gray-matter`（frontmatter）→ `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex`
- **图标**：`lucide-react` 1.14.0
- **字体**：自托管 `@fontsource-variable/*`，在 `app/layout.tsx` 顶部 `import` 引入，CSS 变量在 `app/globals.css` 的 `@theme` 里定义：
  - 标题（display）= **Fraunces Variable**（衬线，启用 `opsz` 光学尺寸轴）→ `--font-display`，类名 `.heading-display` / `prose` 标题
  - 正文（sans）= **Inter Variable** → `--font-sans`，`body` 默认
  - 代码（mono）= **JetBrains Mono** → `--font-mono`
- **部署**：`output: 'export'` → `out/` → GitHub Actions（Node 24）→ GitHub Pages（仓库 `Colathon/Colathon.github.io`，push `main` 即触发）

> ⚠️ 这是改过的 Next.js（见 AGENTS.md）。写代码前，遇到不确定的 API 先查 `node_modules/next/dist/docs/`，不要凭训练记忆。

## 3. 硬约束（违反 = 构建失败或线上报错）

1. **静态导出**：禁用任何需要运行时 Node 服务端的特性——`cookies()`、`headers()`、动态 SSR、未配置的 `next/image`（已设 `images.unoptimized: true`）。需要 `useSearchParams` 的客户端组件必须包在 `<Suspense>` 里。
2. **图标**：`lucide-react` 1.14.0 **没有 `Github` 图标**（品牌图标已被移除）。一律用 `Link2` 代替；引入新图标前先确认 export 存在。
3. **JSX 正文里的英文单引号** `'` 写成 `&apos;`，否则 lint / 构建报错。
4. **Markdown 不支持 Mermaid**：渲染器只挂了 `remark-gfm`/`remark-math`/`rehype-katex`，` ```mermaid ` 会原样显示成代码块。流程图用 **ASCII 代码块** 或 prose。
5. **数学**：一律 `$...$`（行内）/ `$$...$$`（块）。`katex/dist/katex.min.css` 已在 `app/layout.tsx` 导入，勿重复导入。
6. **块级公式的 `$$` 必须各自单独占一行**（开、闭定界符前后都不能跟正文），否则 `remark-math` 会把它当成**行内公式**渲染。后果：`\tag{}` 等只在 display 模式有效的命令报 `\tag works only in display equations`；`rehype-katex`（默认 `throwOnError: false`）把整段源码连同后续被错位吞入的中文正文 / `####` / `**` 一起**红色原样输出**。正确写法（含多行矩阵、`\tag`）：
   ```
   $$
   公式 \tag{N}
   $$
   ```
   ❌ 错误：`$$公式 \tag{N}$$`（单行）、`$$公式 =` … `\tag{5}$$`（定界符与正文同行）。新增/修改公式后用 `npm run build` 验证，红色乱码即此问题。

## 4. 内容架构

| 路径 | 用途 | 数据来源 |
|------|------|---------|
| `content/blog/*.md` | 长文、线性、按时间 | 页面 import `@/lib/blog` |
| `content/wiki/*.md` | 数字花园、网状互链 | 页面 import `@/lib/blog.server` |
| `content/reports/*.md` | 论文阅读报告（算法精读） | `@/lib/blog.server`（`getReportData`） |
| `app/reading/page.tsx` | 阅读清单 + 报告入口 | 文件顶部 `const papers = [...]` |
| `app/projects/page.tsx` | 项目展示 | 文件顶部 `const projects = [...]` |

- **frontmatter**（blog / wiki / reports 通用）：`title` / `date`（`YYYY-MM-DD`）/ `excerpt` / `tags: [...]`。`excerpt` 缺失会在列表页留空。
- `content/wiki/welcome.md` 由 `app/wiki/page.tsx` **固定置顶**，是分类入口。
- `app/wiki/[slug]/page.tsx` 用 `generateStaticParams` 预渲染每个 `.md`，文件名即 slug。
- **wiki vs reports 边界**：通用知识概念 → `wiki`；针对某篇具体论文的算法精读 → `reports`。

## 5. 新增阅读报告的标准流程

> 用户提供报告正文内容；Agent 负责联网查论文链接并完成以下步骤。

1. **建报告文件**：`content/reports/<slug>.md`，写全 frontmatter（`title` 用论文全名，`tags` 与论文领域一致）。技术内容**不删减、不截断**，保留完整推导。
2. **在阅读清单注册论文**：编辑 `app/reading/page.tsx` 顶部的 `papers` 数组，新增一条或为已有条目补充 `reportHref: "/reading/<slug>"`。字段说明：
   ```ts
   {
     title: "论文全名",
     authors: "第一作者, et al.",
     source: "arXiv YYYY / 会议名 YYYY",
     link: "https://arxiv.org/abs/...",   // 联网查询
     tags: ["领域1", "领域2"],
     note: "一两句话概括核心贡献",
     reportHref: "/reading/<slug>",        // 有报告才加此行
   }
   ```
3. **验证**：`npm run build` 通过（`/reading/<slug>` 会出现在静态页列表里）。
4. **提交**：仅在用户明确要求时提交。

**注意**：`content/reports/` 里必须存在对应 `.md` 文件，`generateStaticParams` 才会生成该路由。若只在 `papers` 里填了 `reportHref` 但没建文件，构建不报错，但访问时 404。

## 6. 新增 Wiki 笔记的标准流程

1. **判断归属**：成熟长文 → `blog`；碎片化 / 互链知识 → `wiki`。
2. **建文件**：`content/wiki/<slug>.md`，写全 frontmatter。技术内容**不删减、不截断**，保留完整推导。
3. **主动互链**：扫描已有 `content/` 页面，正文里插入相关的 `[概念](/wiki/<slug>)`，文末加「相关链接」小节。
4. **更新入口**：在 `content/wiki/welcome.md` 对应分类行补上新页面链接。
5. **验证**：`npm run build` 必须通过（会跑 TypeScript + 静态生成全部页面）再收尾。
6. **提交**：仅在用户明确要求时 `git add` / `commit` / `push`。

## 6. 常用命令

```powershell
npm run dev     # 本地预览 http://localhost:3000
npm run build   # 生产构建 + 静态导出到 out/（收尾前必跑）
npm run lint    # eslint
```

## 7. 已知偏差 / 待清理（背景信息，勿擅自重构）

- `lib/blog.ts` 与 `lib/blog.server.ts` 内容几乎完全重复（blog 用前者，wiki 用后者），可择机去重。
- 文章正文（blog / wiki / reports 的 `[slug]/page.tsx`）统一用**单列**布局，外层 `<article>` 宽度 `max-w-[1100px]`，`prose` 用 `max-w-none` 填满。三处保持一致；改宽度记得三个文件一起改。（历史上曾是 `lg:columns-2` 双栏，已废弃。）
