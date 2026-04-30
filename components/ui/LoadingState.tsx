'use client';

import { motion } from 'framer-motion';
import { GitGraph } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading analysis...' }: LoadingStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[300px] space-y-16 overflow-hidden">
      {/* The GitNode Core */}
      <div className="relative flex items-center justify-center z-10">
        {/* Core Node */}
        <motion.div
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <GitGraph className="w-6 h-6 text-white/80" />
        </motion.div>
      </div>

      {/* Minimal Typography */}
      <div className="flex flex-col items-center gap-6 z-10">
        <motion.span
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-[9px] font-black uppercase tracking-[1em] text-white text-center"
        >
          {message}
        </motion.span>

        {/* The Perfect Line */}
        <div className="w-8 h-[1px] bg-white/10 relative overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-4 bg-white/40"
          />
        </div>
      </div>
    </div>
  );
}
