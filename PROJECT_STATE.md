# Project State & History - PROJECT_STATE.md

## Project Identity
- **Owner:** Colathon
- **GitHub Repository:** `Colathon/Colathon.github.io`
- **Live URL:** `https://Colathon.github.io`

## Current Tech Stack
- **Framework:** Next.js 15.1.4 (App Router)
- **Styling:** Tailwind CSS 4.0
- **Language:** TypeScript
- **Icons:** Lucide React (Note: Use `Link2` instead of `Github` to avoid build errors)
- **Fonts:** Inter (Sans), JetBrains Mono (Mono)
- **Deployment:** Static Export (`output: 'export'`) via GitHub Actions.

## Key Evolution
1.  **V1**: Initial scaffold in Chinese.
2.  **V2**: English-first redesign, Dark theme, added `About` and `Reading` pages.
3.  **V3**: Aesthetic polish, Large avatar, Node 24 deployment.
4.  **V4 (Latest)**: Integrated **Digital Garden (Wiki)** with tag-based filtering. Implemented Server/Client separation for data fetching to support static export with search params.

## Important Configurations
- **Next Config**: Static export enabled, image optimization disabled.
- **CI/CD**: `.github/workflows/nextjs.yml` configured for Node 24.
- **Data Fetching**: 
    - `lib/blog.server.ts`: Server-only file system operations.
    - `app/wiki/page.tsx`: Server Component fetching initial data.
    - `app/wiki/WikiListClient.tsx`: Client Component handling dynamic tag filtering via `useSearchParams`.

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
