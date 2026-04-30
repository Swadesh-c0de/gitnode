'use client';

/**
 * FolderNode — Custom React Flow node for directories.
 * Semi-transparent group node with file count badge.
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import type { FolderNodeData } from '@/types';

function FolderNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FolderNodeData;

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-0 !w-2 !h-2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer backdrop-blur-xl
          ${selected
            ? 'border-cyan-500/50 bg-cyan-500/[0.1] shadow-[0_0_35px_rgba(6,182,212,0.2)] z-10'
            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
          }
        `}
      >
        {/* Folder icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10">
          <Folder className="w-4 h-4 text-cyan-400/70" />
        </div>

        {/* Label + count */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-white/70 truncate max-w-[130px]">
            {nodeData.label}
          </span>
          <span className="text-[10px] text-white/25">
            {nodeData.fileCount} file{nodeData.fileCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Count badge */}
        <div className="ml-auto px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] text-white/30 font-mono">
          {nodeData.fileCount}
        </div>
      </motion.div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-black/90 border border-white/10 text-[11px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-xl">
        {nodeData.filePath}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !border-0 !w-2 !h-2" />
    </div>
  );
}

export default memo(FolderNode);
