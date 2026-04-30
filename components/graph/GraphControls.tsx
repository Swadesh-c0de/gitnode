'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRepoStore } from '@/store/repoStore';

/**
 * GraphControls — Filter panel for the graph canvas.
 */
export default function GraphControls() {
  const filters = useRepoStore((s) => s.filters);
  const setFilters = useRepoStore((s) => s.setFilters);
  const nodes = useRepoStore((s) => s.nodes);

  const fileCount = nodes.filter((n) => n.type === 'file').length;
  const folderCount = nodes.filter((n) => n.type === 'folder').length;

  const extensions = Array.from(
    new Set(
      nodes
        .filter((n) => n.type === 'file')
        .map((n) => (n.data as { extension?: string }).extension || '')
        .filter(Boolean)
    )
  ).sort();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-24 left-10 z-20 w-72 bg-black/80 backdrop-blur-3xl border border-white/[0.05] shadow-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/[0.05]">
        <span className="text-[11px] font-black tracking-[0.4em] text-white/20 uppercase">Control_Panel</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
          <div className="px-4 py-3 bg-black">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase block mb-1">Nodes</span>
            <span className="text-xl font-mono text-white/60">{fileCount}</span>
          </div>
          <div className="px-4 py-3 bg-black text-right">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase block mb-1">Layers</span>
            <span className="text-xl font-mono text-white/60">{folderCount}</span>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-[0.3em] text-white/10 uppercase block mb-3">Visibility</span>
          <ToggleRow
            label="Files"
            active={filters.showFiles}
            onChange={() => setFilters({ showFiles: !filters.showFiles })}
          />
          <ToggleRow
            label="Folders"
            active={filters.showFolders}
            onChange={() => setFilters({ showFolders: !filters.showFolders })}
          />
          <ToggleRow
            label="Dependencies"
            active={filters.showExternalDeps}
            onChange={() => setFilters({ showExternalDeps: !filters.showExternalDeps })}
          />
        </div>

        {/* Depth Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/10 uppercase">Depth</span>
            <span className="text-[10px] font-mono text-white/60">{filters.maxDepth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            value={filters.maxDepth}
            onChange={(e) => setFilters({ maxDepth: parseInt(e.target.value) })}
            className="w-full h-px appearance-none bg-white/10 accent-white/40 cursor-crosshair"
          />
        </div>

        {/* Extension Matrix */}
        {extensions.length > 0 && (
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/10 uppercase">Extensions</span>
            <div className="flex flex-wrap gap-1.5">
              {extensions.slice(0, 10).map((ext) => {
                const isActive = filters.fileTypes.length === 0 || filters.fileTypes.includes(ext);
                return (
                  <button
                    key={ext}
                    onClick={() => {
                      if (filters.fileTypes.length === 0) {
                        setFilters({ fileTypes: [ext] });
                      } else if (filters.fileTypes.includes(ext)) {
                        const next = filters.fileTypes.filter((t) => t !== ext);
                        setFilters({ fileTypes: next });
                      } else {
                        setFilters({ fileTypes: [...filters.fileTypes, ext] });
                      }
                    }}
                    className={`px-2 py-1 border text-[7px] font-black uppercase tracking-[0.1em] transition-all ${isActive
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/5 text-white/10 hover:border-white/20'
                      }`}
                  >
                    {ext}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ToggleRow({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between py-4 border-b border-white/[0.03] group text-left"
    >
      <span className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all ${active ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>
        {label}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full transition-all ${active ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/5'}`} />
    </button>
  );
}
