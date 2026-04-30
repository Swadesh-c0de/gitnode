import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileNodeData } from '@/types';

function DotNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FileNodeData;
  const [isHovered, setIsHovered] = useState(false);

  // Generate a random delay for the floating animation so they don't all float in sync
  const floatDelay = React.useMemo(() => Math.random() * 2, []);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: 40, height: 40 }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {/* Floating Orb */}
      <motion.div
        animate={{
          y: [0, -5, 0],
          scale: selected ? 1.3 : isHovered ? 1.2 : 1,
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatDelay,
          },
          scale: { type: 'spring', stiffness: 400, damping: 20 }
        }}
        className={`w-4 h-4 rounded-full border cursor-pointer z-10 ${
          selected ? 'border-white bg-opacity-100' : 'border-white/50 bg-opacity-80'
        }`}
        style={{
          backgroundColor: nodeData.color,
          boxShadow: `0 0 ${selected || isHovered ? '20px' : '10px'} ${nodeData.glowColor}`,
        }}
      />

      {/* Hover Label Expand */}
      <AnimatePresence>
        {(isHovered || selected) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 15 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute top-full mt-1 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl z-50 pointer-events-none whitespace-nowrap"
          >
            <span className="text-xs font-medium text-white/90">{nodeData.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default memo(DotNode);
