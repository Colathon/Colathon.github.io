# Project State & History - PROJECT_STATE.md

## Project Identity
- **Owner:** Colathon
- **GitHub Repository:** `Colathon/Colathon.github.io`
- **Live URL:** `https://Colathon.github.io`

## Current Tech Stack
- **Framework:** Next.js 16.2.4 (App Router, Turbopack) + React 19.2.4
- **Styling:** Tailwind CSS 4 (+ `@tailwindcss/typography` for `prose` rendering)
- **Language:** TypeScript 5
- **Markdown:** `gray-matter` (frontmatter) + `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` (KaTeX). **No Mermaid plugin** — diagrams must be ASCII/prose.
- **Icons:** `lucide-react` 1.14.0 (Note: brand icons removed in this version — use `Link2` instead of `Github` to avoid build errors).
- **Fonts:** Geist Sans / Geist Mono via `next/font/google` (loaded in `app/layout.tsx`). `globals.css` declares `Inter` / `JetBrains Mono` as the nominal family names with Geist as fallback; the installed `@fontsource` packages are **not currently imported**.
- **Deployment:** Static Export (`output: 'export'`, `images.unoptimized: true`) → `out/` → GitHub Actions (Node 24) → GitHub Pages.

## Key Evolution
1.  **V1**: Initial scaffold in Chinese.
2.  **V2**: English-first redesign, Dark theme, added `About` and `Reading` pages.
3.  **V3**: Aesthetic polish, Large avatar, Node 24 deployment.
4.  **V4**: Integrated **Digital Garden (Wiki)** with tag-based filtering. Implemented Server/Client separation for data fetching to support static export with search params.
5.  **V5 (Latest)**: Upgraded to Next.js 16 (Turbopack) + React 19. Wiki cross-link graph expanded (Computer Graphics / AI Research clusters).

## Important Configurations
- **Next Config**: Static export enabled, image optimization disabled.
- **CI/CD**: `.github/workflows/nextjs.yml` configured for Node 24.
- **Data Fetching**: 
    - `lib/blog.ts` & `lib/blog.server.ts`: near-identical filesystem readers (`gray-matter`). Blog pages import `@/lib/blog`; Wiki pages import `@/lib/blog.server`. (Candidate for de-duplication.)
    - `app/wiki/page.tsx`: Server Component; fetches all entries and pins `welcome` to the top.
    - `app/wiki/WikiListClient.tsx`: Client Component handling dynamic tag filtering via `useSearchParams` (wrapped in `<Suspense>`).

## Structural Notes
- `content/blog/`: Markdown source for blog posts (Linear/Chronological).
- `content/wiki/`: Markdown source for digital garden notes (Networked/Interconnected).
- `app/reading/page.tsx`: Static data array for the library list.
- `app/projects/page.tsx`: Static data array for projects.

## Past Issues Resolved
- **Billing**: Deployment failed due to account locking on previous user `Colath`. Switched to `Colathon`.
- **Linting**: JSX single quotes must be escaped (`&apos;`).
- **Icons**: Non-existent exports in `lucide-react` (specifically `Github`) caused build failures; replaced with `Link2`.
- **Pages Source**: GitHub repository must be set to "GitHub Actions" as the source in Settings > Pages.
