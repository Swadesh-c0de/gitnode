import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, FileJson, FileText, FileType, Image as ImageIcon, Box } from 'lucide-react';
import type { FileNodeData } from '@/types';

const FILE_ICONS: Record<string, React.ReactNode> = {
  js: <FileCode className="w-4 h-4" />,
  jsx: <FileCode className="w-4 h-4" />,
  ts: <FileCode className="w-4 h-4" />,
  tsx: <FileCode className="w-4 h-4" />,
  json: <FileJson className="w-4 h-4" />,
  css: <FileType className="w-4 h-4" />,
  html: <FileType className="w-4 h-4" />,
  md: <FileText className="w-4 h-4" />,
  png: <ImageIcon className="w-4 h-4" />,
  jpg: <ImageIcon className="w-4 h-4" />,
  svg: <ImageIcon className="w-4 h-4" />,
};

function CyberNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FileNodeData;
  const [isHovered, setIsHovered] = useState(false);
  const icon = FILE_ICONS[nodeData.extension] || <Box className="w-4 h-4" />;

  // Generate a random delay for the floating animation so they don't all float in sync
  const floatDelay = React.useMemo(() => Math.random() * 2, []);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {/* Outer Glow Ring */}
      <AnimatePresence>
        {(selected || isHovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-full blur-xl z-0"
            style={{ backgroundColor: `${nodeData.color}40` }}
          />
        )}
      </AnimatePresence>

      {/* Main Node Body */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          scale: selected ? 1.2 : isHovered ? 1.1 : 1,
          rotateZ: isHovered ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          y: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatDelay,
          },
          scale: { type: 'spring', stiffness: 300, damping: 15 },
          rotateZ: { duration: 0.5, repeat: isHovered ? Infinity : 0 }
        }}
        className={`relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center z-10 backdrop-blur-xl transition-colors duration-300 ${
          selected 
            ? 'border-white bg-white/20' 
            : 'border-white/20 bg-white/5 hover:border-white/50'
        }`}
        style={{
          boxShadow: selected ? `0 0 20px ${nodeData.glowColor}` : 'none',
        }}
      >
        <div style={{ color: nodeData.color }}>
          {icon}
        </div>
        
        {/* Connection points indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white/50 animate-pulse" />
        </div>
      </motion.div>

      {/* Floating Label */}
      <AnimatePresence>
        {(isHovered || selected) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 40, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute whitespace-nowrap pointer-events-none z-20"
          >
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">{nodeData.extension || 'file'}</span>
                <span className="text-xs font-semibold text-white/90">{nodeData.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default memo(CyberNode);
