import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-border py-9">
      <div className="site-shell flex flex-col justify-between gap-6 text-sm sm:flex-row sm:items-center">
        <div><Link href="/" className="font-display text-lg font-semibold">Colathon.</Link><p className="mt-1 text-xs text-stone-500">A personal corner of the internet. &copy; {new Date().getFullYear()}</p></div>
        <div className="flex items-center gap-7 text-stone-600"><a href={site.github} className="inline-flex min-h-11 items-center gap-1 hover:text-accent">GitHub <ArrowUpRight className="h-3.5 w-3.5" /></a><a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center gap-1 hover:text-accent">Email <ArrowUpRight className="h-3.5 w-3.5" /></a><Link href="/about" className="hover:text-accent">About</Link></div>
      </div>
    </footer>
  );
}
