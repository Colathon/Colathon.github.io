// Treat legacy tag spelling (machine-learning / Machine Learning) consistently.
export function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/[-_]+/g, " ");
}

export function collectionTags(entries: { tags?: string[] }[]) {
  const tags = new Map<string, { label: string; count: number }>();
  for (const entry of entries) {
    for (const key of new Set((entry.tags ?? []).map(normalizeTag))) {
      const current = tags.get(key);
      const original = entry.tags!.find((tag) => normalizeTag(tag) === key)!;
      const label = original === original.toLowerCase()
        ? key.replace(/\b\w/g, (char) => char.toUpperCase()) : original;
      tags.set(key, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
    }
  }
  return [...tags.entries()].map(([value, tag]) => ({ value, ...tag })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function matchesQuery(query: string, fields: (string | undefined)[]) {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}
