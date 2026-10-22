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
  title: { default: "Colathon | Notes & Reading", template: "%s | Colathon" },
  description: "A personal digital garden of interconnected wiki notes and detailed paper reading reports on graphics, mathematics, and machine learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="relative isolate min-h-screen flex flex-col bg-background text-foreground">
        <AuroraBackground />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-grow min-w-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
