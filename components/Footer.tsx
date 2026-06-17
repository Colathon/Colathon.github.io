import Link from "next/link";
import { Link2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-zinc-400">
              &copy; {new Date().getFullYear()} Colathon. All rights reserved.
            </p>
            <p className="mt-1 label-editorial">
              Built with Next.js, Tailwind CSS & AI Agents.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://github.com/Colathon" className="text-zinc-500 hover:text-white transition-colors" title="GitHub">
              <Link2 className="h-5 w-5" />
            </a>
            <a href="mailto:your-email@example.com" className="text-zinc-500 hover:text-white transition-colors" title="Email">
              <Mail className="h-5 w-5" />
            </a>
            <Link href="/about" className="text-sm font-display font-medium text-zinc-400 hover:text-white transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
