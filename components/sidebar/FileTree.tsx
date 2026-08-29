'use client';

/**
 * FileTree — Technical monochromatic file structure visualization.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search, X, FolderTree, ChevronsUpDown } from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import type { FileTreeNode } from '@/types';
import { getExtensionColor } from '@/types';

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
  const isLoading = useRepoStore((s) => s.isLoading);
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

  const toggleAll = useCallback(() => {
    if (expandedDirs.size > 0) {
      setExpandedDirs(new Set());
    } else {
      const allDirs = new Set<string>();
      const collect = (items: FileTreeNode[]) => {
        for (const item of items) {
          if (item.type === 'directory') {
            allDirs.add(item.path);
            if (item.children) collect(item.children);
          }
        }
      };
      collect(fileTree);
      setExpandedDirs(allDirs);
    }
  }, [expandedDirs, fileTree]);

  const handleFileClick = useCallback(
    (node: FileTreeNode) => {
      const graphNode = nodes.find((n) => n.id === node.path);
      if (graphNode) {
        selectNode(graphNode);
      }
    },
    [nodes, selectNode]
  );

  // Flatten tree respecting expanded state with performance partition
  const flatNodes = useMemo(() => {
    const result: FlatNode[] = [];
    const walk = (items: FileTreeNode[], depth: number) => {
      for (const item of items) {
        if (result.length >= 600) return;

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
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md select-none">
      {/* Search & Actions Bar */}
      <div className="px-3 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              <Search className="w-3 h-3 text-white/30 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md py-1.5 pl-8 pr-7 text-[10px] font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2 flex items-center text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={toggleAll}
            title={expandedDirs.size > 0 ? "Collapse All" : "Expand All"}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.05] transition-all shrink-0"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10">
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

        {flatNodes.length >= 600 && (
          <div className="px-4 py-2 border-t border-white/[0.03] text-center select-none bg-zinc-950/40">
            <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">
              [Manifest partition capped at 600 items]
            </span>
          </div>
        )}

        {flatNodes.length === 0 && !isLoading && (
          <div className="px-6 py-12 text-center space-y-3">
            <div className="w-8 h-8 border border-white/5 mx-auto flex items-center justify-center opacity-30 rounded">
              <Search className="w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/30">No matching files found</p>
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
  const ext = node.name.split('.').pop()?.toLowerCase() || '';
  const colorScheme = getExtensionColor(ext);

  return (
    <button
      onClick={() => (isDir ? onToggle(node.path) : onClick(node))}
      className={`relative w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all group ${isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.02]'
        }`}
      style={{ paddingLeft: `${depth * 14 + 14}px` }}
    >
      {/* Selection Left Accent */}
      {isSelected && (
        <div className="absolute left-0 top-0 w-[2px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
      )}

      {/* Directory Arrow / File Extension Dot */}
      <div className="flex items-center justify-center w-3.5 shrink-0">
        {isDir ? (
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`} />
          </motion.div>
        ) : (
          <div
            className="w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125"
            style={{
              backgroundColor: colorScheme.bg,
              boxShadow: `0 0 6px ${colorScheme.glow}`,
            }}
          />
        )}
      </div>

      {/* Item Name */}
      <span
        className={`text-[10px] font-mono tracking-tight truncate transition-colors ${isSelected
            ? 'text-white font-bold'
            : isDir
              ? 'text-white/70 font-semibold group-hover:text-white'
              : 'text-white/50 group-hover:text-white/90'
          }`}
      >
        {node.name}
      </span>

      {/* File Size */}
      {!isDir && node.size && (
        <span className={`ml-auto text-[8px] font-mono shrink-0 transition-opacity ${isSelected ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'}`}>
          {node.size < 1024 ? `${node.size}B` : `${(node.size / 1024).toFixed(0)}KB`}
        </span>
      )}
    </button>
  );
}
