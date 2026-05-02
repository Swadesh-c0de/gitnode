'use client';

/**
 * FileTree — Technical monochromatic file structure visualization.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, File, Folder, FolderOpen, Search } from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import type { FileTreeNode } from '@/types';

interface FlatNode {
  node: FileTreeNode;
  depth: number;
  isExpanded?: boolean;
}

export default function FileTree() {
  const fileTree = useRepoStore((s) => s.fileTree);
  const selectNode = useRepoStore((s) => s.selectNode);
  const nodes = useRepoStore((s) => s.nodes);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleFileClick = useCallback(
    (node: FileTreeNode) => {
      const graphNode = nodes.find((n) => n.id === node.path);
      if (graphNode) {
        selectNode(graphNode);
      }
    },
    [nodes, selectNode]
  );

  // Flatten tree respecting expanded state
  const flatNodes = useMemo(() => {
    const result: FlatNode[] = [];
    const walk = (items: FileTreeNode[], depth: number) => {
      for (const item of items) {
        const matchesSearch =
          !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch && item.type === 'file') continue;

        const isExpanded = expandedDirs.has(item.path) || !!searchQuery;
        result.push({ node: item, depth, isExpanded });
        if (item.children && (isExpanded || searchQuery)) {
          walk(item.children, depth + 1);
        }
      }
    };
    walk(fileTree, 0);
    return result;
  }, [fileTree, expandedDirs, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md">
      {/* Search Section */}
      <div className="px-5 py-6 border-b border-white/5 bg-white/[0.01]">
        <div className="flex flex-col gap-4">
          <span className="text-[9px] font-black tracking-[0.5em] text-white/50 uppercase">Index_Structure</span>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-3 h-3 text-white/20 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Manifest..."
              className="w-full bg-white/[0.02] border border-white/5 py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10">
        {flatNodes.map(({ node, depth, isExpanded }) => (
          <TreeItem
            key={node.path}
            node={node}
            depth={depth}
            isExpanded={isExpanded}
            isSelected={selectedFilePath === node.path}
            onToggle={toggleDir}
            onClick={handleFileClick}
          />
        ))}
        {flatNodes.length === 0 && (
          <div className="px-8 py-20 text-center space-y-4">
            <div className="w-10 h-10 border border-white/5 mx-auto flex items-center justify-center opacity-20">
              <Search className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Null manifest entry</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
}: {
  node: FileTreeNode;
  depth: number;
  isExpanded?: boolean;
  isSelected: boolean;
  onToggle: (path: string) => void;
  onClick: (node: FileTreeNode) => void;
}) {
  const isDir = node.type === 'directory';

  return (
    <button
      onClick={() => (isDir ? onToggle(node.path) : onClick(node))}
      className={`relative w-full flex items-center gap-4 px-5 py-2 text-left transition-all group ${isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
        }`}
      style={{ paddingLeft: `${depth * 16 + 32}px` }}
    >
      {/* Selection indicator & Scan line */}
      {isSelected && (
        <>
          <div className="absolute left-0 top-0 w-[2px] h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          <motion.div
            layoutId="active-item-bg"
            className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none"
          />
        </>
      )}

      {/* Icon Wrapper */}
      <div className="flex items-center justify-center min-w-[14px]">
        {isDir ? (
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-white/20'}`} />
          </motion.div>
        ) : (
          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-white/10 group-hover:bg-white/40'}`} />
        )}
      </div>

      {/* Name */}
      <span
        className={`text-[11px] font-black tracking-[0.1em] uppercase truncate z-10 transition-colors ${isSelected ? 'text-white' : 'text-white/50 group-hover:text-white/80'
          }`}
      >
        {node.name}
      </span>

      {/* Size for files */}
      {!isDir && node.size && (
        <span className={`ml-auto text-[9px] font-mono flex-shrink-0 transition-opacity ${isSelected ? 'opacity-60' : 'opacity-20 group-hover:opacity-40'}`}>
          {node.size < 1024 ? `${node.size}B` : `${(node.size / 1024).toFixed(0)}KB`}
        </span>
      )}
    </button>
  );
}
