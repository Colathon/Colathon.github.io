import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} 个人主页. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Built with Next.js, Tailwind CSS & AI Agents.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              首页
            </Link>
            <Link href="/blog" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              博客
            </Link>
            <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              项目
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
