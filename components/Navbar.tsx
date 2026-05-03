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
  { name: "Projects", href: "/projects", icon: Code2 },
  { name: "Reading", href: "/reading", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/about" className="group flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-800 transition-all group-hover:border-zinc-500">
               {/* Replace with <img src="/avatar.jpg" /> later */}
               <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">
                 C
               </div>
            </div>
            <span className="hidden text-sm font-semibold text-zinc-200 sm:block group-hover:text-white transition-colors">
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
                "text-sm font-medium transition-colors hover:text-white",
                pathname === item.href ? "text-white" : "text-zinc-400"
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
                  pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-500"
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
