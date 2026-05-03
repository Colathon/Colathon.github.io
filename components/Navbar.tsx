"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Home, BookText, Code2, Cpu } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "首页", href: "/", icon: Home },
  { name: "博客", href: "/blog", icon: BookText },
  { name: "项目", href: "/projects", icon: Code2 },
  { name: "AI 服务", href: "/ai-services", icon: Cpu },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900 hover:opacity-90">
            个人主页
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-zinc-900",
                pathname === item.href ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        {/* Mobile Nav could be added here if needed */}
        <div className="md:hidden flex items-center gap-4">
           {/* Simple mobile list for now */}
           <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  pathname === item.href ? "bg-zinc-100 text-zinc-900" : "text-zinc-500"
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
