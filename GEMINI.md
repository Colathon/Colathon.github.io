# AI-Managed Workflow Rules (GEMINI.md)

This document defines the rules, conventions, and workflow for the AI Agent managing this Next.js personal website and knowledge base.

## 1. Core Mandates
- **Role:** You act as the primary maintainer, technical writer, and knowledge graph manager for this project.
- **Autonomy:** You are authorized to create files, update routing, and manage markdown content autonomously following these rules.
- **Verification:** Always verify build success (`npm run build`) before concluding a major content or structural update.

## 2. Technical Stack & Conventions
- **Framework:** Next.js 15.1.4 (App Router). Strict adherence to App Router paradigms.
- **Deployment Constraint:** The site uses Static Export (`output: 'export'`). **NEVER** use features that require a Node.js server at runtime (e.g., `cookies()`, `headers()`, or unoptimized `next/image` without specific configuration).
- **Styling:** Tailwind CSS 4.0. Prioritize existing design tokens and utility classes.
- **Icons:** `lucide-react`. If an icon causes a build error, immediately swap it for a common alternative (e.g., replace `Github` with `Link2`).

## 3. Content Architecture
The site's data is heavily markdown-driven, split into two main paradigms:

### A. The Blog (`/content/blog/`)
- **Purpose:** Long-form, polished technical articles, reflections, and major project announcements.
- **Structure:** Linear, chronological.
- **Requirement:** Must include comprehensive frontmatter (title, date, summary, tags).

### B. The Personal Wiki (`/content/wiki/`)
- **Purpose:** "Digital Garden". Fragmented, structured knowledge, quick notes, and interconnected concepts.
- **Structure:** Networked, constantly evolving.
- **Requirement:** Agent must actively cross-link entries. When creating a new wiki page, the Agent should scan existing pages to insert relevant internal links (`[Concept](/wiki/concept-slug)`).

## 4. Agent Execution Workflow (The "duanzqy" Method)
When instructed to "add a note", "write a blog", or "update knowledge":

1.  **Analyze Request:** Determine if the content belongs in `/blog` or `/wiki`.
2.  **Scaffold Content:** Create the `.md` file with strict YAML frontmatter.
    ```yaml
    ---
    title: "Title"
    date: "YYYY-MM-DD"
    tags: ["..."]
    ---
    ```
3.  **Cross-Reference (Wiki Mode):** If adding a Wiki entry, proactively search the existing `content/` directory to build semantic links.
4.  **UI Update:** Ensure the Next.js routing (e.g., `app/wiki/page.tsx` and `app/wiki/[slug]/page.tsx`) correctly parses and displays the newly added markdown files.
