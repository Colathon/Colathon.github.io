import { getSortedWikiData, type ContentData } from "@/lib/blog.server";
import WikiListClient from "./WikiListClient";
import { Suspense } from "react";

export default async function WikiListPage() {
  // Fetch data on the server
  const allWikiEntries = getSortedWikiData();

  // Pin 'welcome' to the top
  const pinnedSlug = "welcome";
  const sortedWithPin = [
    ...allWikiEntries.filter((e) => e.slug === pinnedSlug),
    ...allWikiEntries.filter((e) => e.slug !== pinnedSlug),
  ];

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-white">Loading Garden...</div>}>
      <WikiListClient initialEntries={sortedWithPin} />
    </Suspense>
  );
}
