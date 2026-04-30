'use client';

/**
 * FileNode — Custom React Flow node for files.
 * Features glowing borders color-coded by extension, hover tooltip.
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { FileText, FileCode, FileJson, FileType, Image as ImageIcon } from 'lucide-react';
import type { FileNodeData } from '@/types';

const FILE_ICONS: Record<string, React.ReactNode> = {
  ts: <FileCode className="w-3.5 h-3.5" />,
  tsx: <FileCode className="w-3.5 h-3.5" />,
  js: <FileCode className="w-3.5 h-3.5" />,
  jsx: <FileCode className="w-3.5 h-3.5" />,
  py: <FileCode className="w-3.5 h-3.5" />,
  rs: <FileCode className="w-3.5 h-3.5" />,
  go: <FileCode className="w-3.5 h-3.5" />,
  json: <FileJson className="w-3.5 h-3.5" />,
  md: <FileText className="w-3.5 h-3.5" />,
  css: <FileType className="w-3.5 h-3.5" />,
  scss: <FileType className="w-3.5 h-3.5" />,
  png: <ImageIcon className="w-3.5 h-3.5" />,
  jpg: <ImageIcon className="w-3.5 h-3.5" />,
  svg: <ImageIcon className="w-3.5 h-3.5" />,
};

function FileNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FileNodeData;
  const icon = FILE_ICONS[nodeData.extension] || <FileText className="w-3.5 h-3.5" />;
  const sizeStr = nodeData.size ? formatSize(nodeData.size) : '';

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-0 !w-2 !h-2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer backdrop-blur-md
          ${selected
            ? 'border-white/40 shadow-[0_0_30px_var(--glow)] z-10'
            : 'border-white/[0.08] hover:border-white/30 hover:shadow-[0_0_25px_var(--glow)]'
          }
        `}
        style={{
          background: `linear-gradient(135deg, ${nodeData.color}20, ${nodeData.color}05)`,
          '--glow': nodeData.glowColor,
        } as React.CSSProperties}
      >
        {/* Glow pulse on selected */}
        {selected && (
          <div
            className="absolute inset-0 rounded-xl animate-pulse opacity-20"
            style={{ background: nodeData.glowColor }}
          />
        )}

        {/* Icon */}
        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${nodeData.color}25`, color: nodeData.color }}
        >
          {icon}
        </div>

        {/* Label */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-white/80 truncate max-w-[130px]">
            {nodeData.label}
          </span>
          {sizeStr && (
            <span className="text-[10px] text-white/25">{sizeStr}</span>
          )}
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default memo(FileNode);
