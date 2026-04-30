'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-hidden flex flex-col items-center justify-center">
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-8 md:px-16 md:py-10 flex items-center justify-between">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 md:gap-10 group cursor-pointer"
        >
          <div className="flex flex-col gap-2">
            <motion.div
              initial="initial"
              whileHover="hover"
              className="flex items-center cursor-pointer"
            >
              {"GitNode".split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    initial: { y: 0, opacity: 0.9, filter: "blur(0px)" },
                    hover: {
                      y: -3,
                      opacity: 1,
                      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))",
                      transition: { duration: 0.3, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }
                    }
                  }}
                  className="text-[13px] md:text-[15px] font-bold tracking-[0.1em] uppercase text-white inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Navigation */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 md:gap-16"
        >
          <div className="flex items-center gap-4 md:gap-12">
            <motion.a
              href="https://github.com/swadesh-c0de"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-4 py-2 md:px-8 md:py-3 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-colors duration-500 hover:border-white/30 hover:bg-white/[0.05]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.15)_0%,transparent_50%)]"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--x', `${x}px`);
                  e.currentTarget.style.setProperty('--y', `${y}px`);
                }}
              />

              <div className="relative flex items-center gap-2 md:gap-4">
                <span className="text-[9px] md:text-[11px] font-extralight uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/60 group-hover:text-white transition-colors duration-500">
                  GitHub
                </span>
                <div className="relative w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                  <ArrowUpRight className="w-3 md:w-3.5 h-3 md:h-3.5 text-white/20 group-hover:text-white transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </motion.a>
          </div>
        </motion.div>
      </nav>

      {/* Central Manifold */}
      <div className="relative z-10 w-full max-w-5xl px-6 md:px-8 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-12 md:space-y-24 w-full"
        >
          <div className="relative inline-block group">
            <motion.h1
              initial={{ opacity: 0, filter: "blur(20px)", letterSpacing: "0em" }}
              animate={{ opacity: 1, filter: "blur(0px)", letterSpacing: "-0.05em" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[18vw] md:text-[12rem] font-extralight leading-none uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10 bg-[size:100%_200%] transition-all duration-1000 group-hover:bg-[position:0_100%]"
            >
              GitNode
            </motion.h1>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-4 md:-bottom-6 left-0 h-[px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-6 md:mt-12 text-[8px] md:text-[10px] font-extralight text-white/30 uppercase tracking-[1em] md:tracking-[2em] md:ml-[2em] group-hover:text-white/60 transition-all duration-1000"
            >
              Architectural <span className="hidden sm:inline">Repository</span> Intelligence
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full relative"
          >
            <SearchBar />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
