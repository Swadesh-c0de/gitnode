'use client';

/**
 * SearchBar — GitHub URL input with premium holographic sci-fi visual style and morphing transition.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, AlertCircle, Terminal, Layers } from 'lucide-react';

/** Parse a GitHub URL or shorthand into owner/repo */
function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\/$/, '');

  // Full URL: https://github.com/owner/repo
  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };

  // Shorthand: owner/repo
  const shortMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

const LOADER_STATUSES = [
  "CONNECTING TO PORTAL PROTOCOL...",
  "RESOLVING TARGET REPOSITORY PATH...",
  "INDEXING ASTROLOGICAL DIRECTORY...",
  "EXTRACTING CODE CONSTELLATIONS...",
  "COMPUTING IMPORT TOPOLOGY...",
  "DECRYPTING ARCHITECTURAL INTEL..."
];

export default function SearchBar() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADER_STATUSES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = parseGitHubUrl(input);
      if (!parsed) {
        setError('Invalid GitHub URL or shorthand');
        return;
      }
      setError('');
      setIsLoading(true);
      router.push(`/repo/${parsed.owner}/${parsed.repo}`);
    },
    [input, router]
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0 relative">
      <form onSubmit={handleSubmit} className="relative z-10">
        <motion.div
          className="h-[56px] md:h-[68px] relative flex items-center border border-white/10 hover:border-white/20 bg-zinc-950/45 backdrop-blur-3xl overflow-hidden rounded-xl transition-all duration-300"
          animate={{ 
            scale: isFocused ? 1.012 : 1,
            borderColor: isFocused ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.1)"
          }}
        >

          {/* Left Icon Status */}
          <div className="flex items-center pl-4 md:pl-6 pr-1 md:pr-2 shrink-0">
            {isLoading ? (
              <Terminal className="w-3.5 h-3.5 text-white/40 animate-pulse shrink-0" />
            ) : (
              <Search className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors duration-500 ${isFocused ? 'text-white' : 'text-white/20'}`} />
            )}
          </div>

          {/* Input field or Loading display */}
          {!isLoading ? (
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter GitHub Repository (e.g. facebook/react)"
              className="h-full flex-1 bg-transparent px-2 md:px-3 text-white placeholder:text-white/10 outline-none text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] w-full"
              id="repo-search-input"
            />
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-0.5 overflow-hidden pl-2 md:pl-3 select-none">
              <motion.span
                key={statusIndex}
                initial={{ opacity: 0, filter: 'blur(3px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.3 }}
                className="text-[9px] md:text-[10px] font-mono font-black text-white/80 uppercase tracking-widest truncate"
              >
                {LOADER_STATUSES[statusIndex]}
              </motion.span>
            </div>
          )}

          {/* Morphing cyber button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className={`m-1.5 h-[calc(100%-12px)] px-4 md:px-8 bg-white/5 border border-white/10 text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-3 transition-all relative overflow-hidden shrink-0 rounded ${isLoading
              ? 'w-[70px] md:w-[80px] bg-white/10 justify-center border-white/30'
              : 'hover:bg-white hover:text-black hover:border-white'
              }`}
            id="repo-search-submit"
          >
            {isLoading ? (
              <div className="relative flex items-center justify-center w-full h-full">
                {/* Double ring holographic spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 rounded-full border border-t-white border-white/10 absolute"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 rounded-full border border-b-white border-white/5 absolute"
                />
              </div>
            ) : (
              <>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                <span className="hidden xs:inline">ANALYZE</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mt-4 px-5 py-3 bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8">
        <span className="text-[8px] md:text-[9px] font-black text-white/10 uppercase tracking-[0.4em] w-full text-center md:w-auto">Suggested:</span>
        {['facebook/react', 'vercel/next.js', 'denoland/deno'].map((example) => (
          <button
            key={example}
            disabled={isLoading}
            onClick={() => setInput(example)}
            className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors border-b border-white/0 hover:border-white/25 pb-0.5"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
