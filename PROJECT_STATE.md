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
3.  **V3 (Final)**: Aesthetic polish. Large avatar in Hero section, refined typography (Researcher aesthetic), integrated contact chips, and Node 24 deployment pipeline.

## Important Configurations
- **Next Config**: Static export enabled, image optimization disabled (unoptimized: true) for GitHub Pages compatibility.
- **CI/CD**: `.github/workflows/nextjs.yml` configured for Node 24.
- **Linting**: Relaxed in `next.config.ts` during build to prevent minor warnings from blocking deployment.

## Structural Notes
- `content/blog/`: Markdown source for blog posts.
- `app/reading/page.tsx`: Static data array for the library list.
- `app/projects/page.tsx`: Static data array for projects.
- `public/avatar.jpg`: Personal profile photo.

## Past Issues Resolved
- **Billing**: Deployment failed due to account locking on previous user `Colath`. Switched to `Colathon`.
- **Linting**: JSX single quotes must be escaped (`&apos;`).
- **Icons**: Non-existent exports in `lucide-react` (specifically `Github`) caused build failures; replaced with `Link2`.
- **Pages Source**: GitHub repository must be set to "GitHub Actions" as the source in Settings > Pages.
