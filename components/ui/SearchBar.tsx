'use client';

/**
 * SearchBar — GitHub URL input with technical monochromatic aesthetic.
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, AlertCircle, GitGraph, Loader2 } from 'lucide-react';

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

export default function SearchBar() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0">
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          className="relative flex items-center border transition-all duration-500 backdrop-blur-2xl"
          animate={{ scale: isFocused ? 1.01 : 1 }}
        >
          <div className="flex items-center pl-4 md:pl-6 pr-1 md:pr-2">
            <Search className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${isFocused ? 'text-white' : 'text-white/20'}`} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter GitHub Repository"
            className="flex-1 bg-transparent py-4 md:py-5 px-2 md:px-3 text-white placeholder:text-white/10 outline-none text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]"
            id="repo-search-input"
          />
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
            className={`m-1 px-4 md:px-8 py-3 md:py-4 bg-white/5 border border-white/10 text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-3 transition-all ${isLoading ? 'w-[100px] md:w-[120px] justify-center overflow-hidden' : ''}`}
            id="repo-search-submit"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,1)]" />
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </div>
            ) : (
              <>
                <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
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
            className="flex items-center gap-3 mt-4 px-5 py-3 bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest"
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
            onClick={() => setInput(example)}
            className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors border-b border-white/0 hover:border-white/20 pb-0.5"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
