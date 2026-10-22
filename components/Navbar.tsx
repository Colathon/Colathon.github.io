"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Wiki", href: "/wiki" },
  { name: "Reading", href: "/reading" },
  { name: "Blog", href: "/blog" },
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="site-shell flex flex-wrap items-center justify-between gap-x-8 pt-4 sm:h-20 sm:flex-nowrap sm:py-0">
        <Link href="/" aria-label="Colathon home" className="flex items-center gap-3">
          <Image src="/avatar.jpg" alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-full object-cover" />
          <span className="font-display text-xl font-semibold tracking-tight">Colathon<span className="text-accent">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="mt-3 flex w-full items-center justify-between gap-1 sm:mt-0 sm:w-auto sm:gap-6">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "nav-link-active" : ""}`}>{item.name}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
