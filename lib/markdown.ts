import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface MarkdownNode {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
}

export interface ArticleHeading { id: string; title: string; depth: number }

function headingText(node: MarkdownNode): string {
  return node.value ?? (node.children ?? []).map(headingText).join("");
}

// Both the outline and rendered headings use the same Markdown parser and IDs.
function collectHeadings(tree: MarkdownNode) {
  const headings: ArticleHeading[] = [];
  function visit(node: MarkdownNode) {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const id = `section-${headings.length + 1}`;
      headings.push({ id, title: headingText(node), depth: node.depth });
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    }
    node.children?.forEach(visit);
  }
  visit(tree);
  return headings;
}

export function getArticleHeadings(content: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(content);
  return collectHeadings(tree);
}

export function remarkHeadingIds() {
  return (tree: MarkdownNode) => { collectHeadings(tree); };
}
