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
- **字体**：`next/font/google` 的 Geist / Geist Mono（`app/layout.tsx`）
- **部署**：`output: 'export'` → `out/` → GitHub Actions（Node 24）→ GitHub Pages（仓库 `Colathon/Colathon.github.io`，push `main` 即触发）

> ⚠️ 这是改过的 Next.js（见 AGENTS.md）。写代码前，遇到不确定的 API 先查 `node_modules/next/dist/docs/`，不要凭训练记忆。

## 3. 硬约束（违反 = 构建失败或线上报错）

1. **静态导出**：禁用任何需要运行时 Node 服务端的特性——`cookies()`、`headers()`、动态 SSR、未配置的 `next/image`（已设 `images.unoptimized: true`）。需要 `useSearchParams` 的客户端组件必须包在 `<Suspense>` 里。
2. **图标**：`lucide-react` 1.14.0 **没有 `Github` 图标**（品牌图标已被移除）。一律用 `Link2` 代替；引入新图标前先确认 export 存在。
3. **JSX 正文里的英文单引号** `'` 写成 `&apos;`，否则 lint / 构建报错。
4. **Markdown 不支持 Mermaid**：渲染器只挂了 `remark-gfm`/`remark-math`/`rehype-katex`，` ```mermaid ` 会原样显示成代码块。流程图用 **ASCII 代码块** 或 prose。
5. **数学**：一律 `$...$`（行内）/ `$$...$$`（块）。`katex/dist/katex.min.css` 已在 `app/layout.tsx` 导入，勿重复导入。

## 4. 内容架构

| 路径 | 用途 | 数据来源 |
|------|------|---------|
| `content/blog/*.md` | 长文、线性、按时间 | 页面 import `@/lib/blog` |
| `content/wiki/*.md` | 数字花园、网状互链 | 页面 import `@/lib/blog.server` |
| `app/reading/page.tsx` | 阅读清单 | 文件顶部 `const papers = [...]` |
| `app/projects/page.tsx` | 项目展示 | 文件顶部 `const projects = [...]` |

- **frontmatter**（blog 与 wiki 通用）：`title` / `date`（`YYYY-MM-DD`）/ `excerpt` / `tags: [...]`。`excerpt` 缺失会在列表页留空。
- `content/wiki/welcome.md` 由 `app/wiki/page.tsx` **固定置顶**，是分类入口。
- `app/wiki/[slug]/page.tsx` 用 `generateStaticParams` 预渲染每个 `.md`，文件名即 slug。

## 5. 新增 Wiki 笔记的标准流程

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
- `globals.css` 把 `Inter` / `JetBrains Mono` 写成首选字体族，但 `@fontsource/inter`、`@fontsource/jetbrains-mono` 这两个已安装的包**没有任何地方 import**，实际生效的是 next/font 的 Geist 回退。
