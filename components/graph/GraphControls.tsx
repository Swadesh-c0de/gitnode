'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRepoStore } from '@/store/repoStore';
import { ChevronUp, Eye, Sliders, Layers } from 'lucide-react';

/**
 * GraphControls — Filter panel for the graph canvas with holographic aesthetics.
 */
export default function GraphControls() {
  const filters = useRepoStore((s) => s.filters);
  const setFilters = useRepoStore((s) => s.setFilters);
  const nodes = useRepoStore((s) => s.nodes);
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 bg-black/60 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden transition-all duration-500
        ${isMobile 
          ? 'top-24 left-4 right-4 w-auto' 
          : 'top-24 left-6 w-72'
        }
      `}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-40 rounded-xl" />

      {/* Header Panel */}
      <div 
        className="relative z-10 px-5 py-3 border-b border-white/[0.06] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.01] transition-colors" 
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase">Console_Menu</span>
        </div>
        <motion.button 
          animate={{ rotate: isMinimized ? 180 : 0 }}
          className="text-white/30 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5"
        >
          <ChevronUp size={12} />
        </motion.button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="p-5 space-y-5">
              {/* Layout Engine Toggle */}
              <div className="space-y-2">
                <span className="text-[7.5px] font-black tracking-[0.3em] text-white/30 uppercase block">Layout Engine</span>
                <div className="flex bg-white/[0.02] border border-white/[0.06] p-1 rounded-lg relative overflow-hidden">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] transition-all rounded-md relative z-10 ${
                      viewMode === 'tree' ? 'text-black font-black' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {viewMode === 'tree' && (
                      <motion.div layoutId="activeEngine" className="absolute inset-0 bg-white rounded-md z-[-1]" />
                    )}
                    Tree Layout
                  </button>
                  <button
                    onClick={() => setViewMode('constellation')}
                    className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] transition-all rounded-md relative z-10 ${
                      viewMode === 'constellation' ? 'text-black font-black' : 'text-white/40 hover:text-white'
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
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="w-3 h-3 text-white/30" />
                  <span className="text-[7.5px] font-black tracking-[0.3em] text-white/30 uppercase block">Filters</span>
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
                    label="Dependencies"
                    active={filters.showExternalDeps}
                    onChange={() => setFilters({ showExternalDeps: !filters.showExternalDeps })}
                  />
                )}
              </div>

              {/* Depth Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[7.5px] font-black tracking-[0.3em] text-white/30 uppercase">
                    {viewMode === 'tree' ? 'Expansion Depth' : 'Depth Boundary'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white/80 border border-white/5 bg-white/[0.01] px-1.5 py-0.5 rounded">{filters.maxDepth}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={filters.maxDepth}
                  onChange={(e) => setFilters({ maxDepth: parseInt(e.target.value) })}
                  className="w-full h-[1px] bg-white/10 appearance-none outline-none accent-white/80 cursor-pointer rounded"
                />
              </div>

              {/* Extension Matrix */}
              {extensions.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-white/30" />
                    <span className="text-[7.5px] font-black tracking-[0.3em] text-white/30 uppercase">Extensions Matrix</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-none">
                    {extensions.slice(0, 15).map((ext) => {
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
                          className={`px-2 py-1 border text-[7px] font-black uppercase tracking-[0.1em] rounded transition-all ${isActive
                            ? 'border-white/30 bg-white/10 text-white shadow-[0_0_8px_rgba(255,255,255,0.05)]'
                            : 'border-white/5 text-white/20 hover:border-white/20 hover:text-white/40'
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
      className="w-full flex items-center justify-between py-2.5 border-b border-white/[0.03] group text-left relative overflow-hidden"
    >
      <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>
        {label}
      </span>
      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${
        active 
          ? 'border-white bg-white shadow-[0_0_6px_rgba(255,255,255,0.3)]' 
          : 'border-white/15 bg-transparent'
      }`}>
        {active && <div className="w-1.5 h-1.5 rounded-sm bg-black" />}
      </div>
    </button>
  );
}
