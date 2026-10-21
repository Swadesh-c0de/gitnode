'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRepoStore } from '@/store/repoStore';
import { ChevronUp, Eye, Sliders, Layers } from 'lucide-react';
import { flattenTree } from '@/lib/graph/treeUtils';

/**
 * GraphControls — Filter panel for the graph canvas with holographic aesthetics.
 */
export default function GraphControls() {
  const filters = useRepoStore((s) => s.filters);
  const setFilters = useRepoStore((s) => s.setFilters);
  const fileTree = useRepoStore((s) => s.fileTree);
  const viewMode = useRepoStore((s) => s.viewMode);
  const setViewMode = useRepoStore((s) => s.setViewMode);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsMinimized(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const extensions = React.useMemo(() => {
    const flat = flattenTree(fileTree);
    return Array.from(
      new Set(
        flat
          .filter((item) => item.node.type === 'file' && item.node.extension)
          .map((item) => item.node.extension!)
      )
    ).sort();
  }, [fileTree]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 bg-zinc-950/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.85)] rounded-xl overflow-hidden transition-all duration-300 select-none
        ${isMobile
          ? 'top-20 inset-x-3 w-auto'
          : 'top-20 md:top-24 left-3 md:left-4 w-68'
        }
      `}
    >
      {/* Header Panel */}
      <div
        className="relative z-10 px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3 h-3 text-white/40" />
          <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/60 uppercase">Controls</span>
        </div>
        <motion.button
          animate={{ rotate: isMinimized ? 180 : 0 }}
          className="text-white/40 hover:text-white transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-white/5"
        >
          <ChevronUp size={11} />
        </motion.button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="p-3.5 space-y-3.5">
              {/* Layout Engine Toggle */}
              <div className="space-y-1.5">
                <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest block">Layout Mode</span>
                <div className="flex bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg relative overflow-hidden">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex-1 py-1 text-[8px] font-mono font-bold uppercase tracking-wider transition-all rounded-md relative z-10 ${viewMode === 'tree' ? 'text-black font-black' : 'text-white/40 hover:text-white'
                      }`}
                  >
                    {viewMode === 'tree' && (
                      <motion.div layoutId="activeEngine" className="absolute inset-0 bg-white rounded-md z-[-1]" />
                    )}
                    Tree
                  </button>
                  <button
                    onClick={() => setViewMode('constellation')}
                    className={`flex-1 py-1 text-[8px] font-mono font-bold uppercase tracking-wider transition-all rounded-md relative z-10 ${viewMode === 'constellation' ? 'text-black font-black' : 'text-white/40 hover:text-white'
                      }`}
                  >
                    {viewMode === 'constellation' && (
                      <motion.div layoutId="activeEngine" className="absolute inset-0 bg-white rounded-md z-[-1]" />
                    )}
                    Constellation
                  </button>
                </div>
              </div>

              {/* Visibility Section */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="w-2.5 h-2.5 text-white/30" />
                  <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest block">Filters</span>
                </div>
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
                {viewMode === 'constellation' && (
                  <ToggleRow
                    label="Imports"
                    active={filters.showExternalDeps}
                    onChange={() => setFilters({ showExternalDeps: !filters.showExternalDeps })}
                  />
                )}
              </div>

              {/* Depth Section */}
              <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">
                    {viewMode === 'tree' ? 'Tree Depth' : 'Simulation Depth'}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-white/80 border border-white/5 bg-white/[0.02] px-1.5 py-0.2 rounded">
                    {filters.maxDepth}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={filters.maxDepth}
                  onChange={(e) => setFilters({ maxDepth: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white/10 appearance-none outline-none accent-white cursor-pointer rounded"
                />
              </div>

              {/* Extension Matrix */}
              {extensions.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-2.5 h-2.5 text-white/30" />
                      <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">Extensions</span>
                    </div>
                    {filters.fileTypes.length > 0 && (
                      <button
                        onClick={() => setFilters({ fileTypes: [] })}
                        className="text-[7.5px] font-mono text-white/40 hover:text-white uppercase underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-0.5 scrollbar-thin">
                    {extensions.slice(0, 16).map((ext) => {
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
                          className={`px-1.5 py-0.5 border text-[7.5px] font-mono uppercase rounded transition-all ${isActive
                              ? 'border-white/30 bg-white/15 text-white shadow-sm'
                              : 'border-white/5 text-white/20 hover:border-white/20 hover:text-white/50'
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
        )}
      </AnimatePresence>
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
      className="w-full flex items-center justify-between py-1.5 border-b border-white/[0.02] group text-left"
    >
      <span className={`text-[8.5px] font-mono transition-colors ${active ? 'text-white/90' : 'text-white/30 group-hover:text-white/60'}`}>
        {label}
      </span>
      <div className={`w-3 h-3 border rounded flex items-center justify-center transition-all ${active
          ? 'border-white bg-white shadow-sm'
          : 'border-white/15 bg-transparent'
        }`}>
        {active && <div className="w-1 h-1 rounded-sm bg-black" />}
      </div>
    </button>
  );
}
