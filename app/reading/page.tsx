import type { Metadata } from "next";
import { Suspense } from "react";
import { papers } from "@/lib/papers";
import { getSortedReportsData } from "@/lib/blog.server";
import ReadingListClient from "./ReadingListClient";

export const metadata: Metadata = { title: "Reading Reports" };

export default function ReadingPage() {
  return <Suspense fallback={<div className="site-shell py-20">Loading reading reports…</div>}><ReadingListClient papers={papers} reports={getSortedReportsData()} /></Suspense>;
}
