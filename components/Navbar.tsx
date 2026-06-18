"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Home, BookText, Code2, BookOpen } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Blog", href: "/blog", icon: BookText },
  { name: "Wiki", href: "/wiki", icon: BookOpen },
  { name: "Projects", href: "/projects", icon: Code2 },
  { name: "Reading", href: "/reading", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/about" className="group flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-zinc-300 bg-zinc-200 transition-all group-hover:border-zinc-500">
               <img src="/avatar.jpg" alt="C" className="h-full w-full object-cover" />
            </div>
            <span className="hidden text-sm font-display font-bold text-zinc-700 sm:block group-hover:text-zinc-950 transition-colors">
              Colathon
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium tracking-wide transition-colors hover:text-zinc-950",
                pathname === item.href ? "text-zinc-950" : "text-zinc-500"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="md:hidden flex items-center gap-2">
           <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  pathname === item.href ? "bg-zinc-200 text-zinc-950" : "text-zinc-500"
                )}
                title={item.name}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
