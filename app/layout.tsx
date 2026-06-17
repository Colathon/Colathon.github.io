import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuroraBackground from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "Colathon | Personal Homepage",
  description: "A research-focused personal homepage built with Next.js and AI Agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <AuroraBackground />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
