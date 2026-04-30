'use client';

/**
 * ErrorBoundary — Friendly technical error display.
 */

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Lock, RefreshCw, Home, ZapOff } from 'lucide-react';
import Link from 'next/link';
import type { AppError } from '@/types';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const config = getErrorConfig(error);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-12 px-8 py-20 bg-black text-center"
    >
      {/* Icon Section */}
      <div className="relative">
        <motion.div
          className="w-24 h-24 border border-white/10 flex items-center justify-center relative z-10 bg-black"
          animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {config.icon}
        </motion.div>
        
        {/* Decorative corner borders */}
        <div className="absolute -top-4 -left-4 w-6 h-6 border-t border-l border-white/40" />
        <div className="absolute -bottom-4 -right-4 w-6 h-6 border-b border-r border-white/40" />
      </div>

      {/* Message Section */}
      <div className="space-y-4 max-w-lg">
        <div className="flex flex-col items-center gap-2">
            <span className="technical-label">Error Detected</span>
            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">{config.title}</h2>
        </div>
        <p className="text-[11px] font-mono text-white/20 uppercase tracking-widest leading-relaxed">
            {error.message.toUpperCase()}
        </p>
      </div>

      {/* Rate limit info */}
      {error.type === 'rate_limit' && error.retryAfter && (
        <div className="flex items-center gap-3 px-6 py-3 border border-white/10 bg-white/5">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">RETRY IN: {error.retryAfter}S</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full h-14 border border-white/20 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
          >
            Try Again
          </button>
        )}
        <Link
          href="/"
          className="w-full h-14 border border-white flex items-center justify-center bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-transparent hover:text-white transition-all"
        >
          Go Home
        </Link>
      </div>

      {/* Technical Footnote */}
      <div className="pt-8">
        <p className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
            System Status: Error // Location: Repository Graph
        </p>
      </div>
    </motion.div>
  );
}

function getErrorConfig(error: AppError) {
  switch (error.type) {
    case 'not_found':
      return {
        title: 'Repository Not Found',
        icon: <ZapOff className="w-8 h-8 text-white/40" />,
      };
    case 'rate_limit':
      return {
        title: 'Rate Limit Exceeded',
        icon: <Clock className="w-8 h-8 text-white/40" />,
      };
    case 'private_repo':
      return {
        title: 'Access Denied',
        icon: <Lock className="w-8 h-8 text-white/40" />,
      };
    default:
      return {
        title: 'System Error',
        icon: <AlertTriangle className="w-8 h-8 text-white/40" />,
      };
  }
}
