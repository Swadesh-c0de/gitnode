import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GitNode — The Interactive GitHub Visualizer',
  description:
    'Visualize any GitHub repository as an interactive dependency graph. Explore file structures, imports, tech stacks, and code — all in one beautifully animated canvas.',
  keywords: ['GitHub', 'GitNode', 'repository', 'visualizer', 'dependency graph', 'code analysis'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen selection:bg-white/20 selection:text-white`}
      >
        <div className="fixed inset-0 bg-black -z-50" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_80%)] -z-40 pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
