import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const WIKI_DIR = path.join(process.cwd(), "content/wiki");
const REPORTS_DIR = path.join(process.cwd(), "content/reports");

export interface ContentData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
  content?: string;
}

function getSortedContentData(directory: string) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const fileNames = fs.readdirSync(directory);
  const allData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(directory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);

      return {
        slug,
        ...(matterResult.data as { title: string; date: string; excerpt: string; tags?: string[] }),
      };
    });

  return allData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getContentData(directory: string, slug: string): Promise<ContentData> {
  const fullPath = path.join(directory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Content not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  return {
    slug,
    content: matterResult.content,
    ...(matterResult.data as { title: string; date: string; excerpt: string; tags?: string[] }),
  };
}

// Blog specialized functions
export function getSortedPostsData() {
  return getSortedContentData(BLOG_DIR);
}

export async function getPostData(slug: string) {
  return getContentData(BLOG_DIR, slug);
}

// Wiki specialized functions
export function getSortedWikiData() {
  return getSortedContentData(WIKI_DIR);
}

export async function getWikiData(slug: string) {
  return getContentData(WIKI_DIR, slug);
}

// Reading report specialized functions
export function getSortedReportsData() {
  return getSortedContentData(REPORTS_DIR);
}

export async function getReportData(slug: string) {
  return getContentData(REPORTS_DIR, slug);
}
