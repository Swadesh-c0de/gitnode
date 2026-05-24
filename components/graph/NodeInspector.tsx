"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useRepoStore } from "@/store/repoStore";
import type { GraphNode } from "@/types";

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function NodeInspector({ sidebarOpen, setSidebarOpen, sidebarWidth }: { sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void, sidebarWidth: number }) {
  const selectedNode = useRepoStore((s) => s.selectedNode);
  const selectNode = useRepoStore((s) => s.selectNode);
  const setSidebarTab = useRepoStore((s) => s.setSidebarTab);
  const edges = useRepoStore((s) => s.edges);
  const nodes = useRepoStore((s) => s.nodes);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!selectedNode) return null;

  const data = selectedNode.data as any;
  const label = data.label || "UNKNOWN";
  const type = selectedNode.type || "node";
  
  const outboundEdges = edges.filter((e) => e.source === selectedNode.id);
  const inboundEdges = edges.filter((e) => e.target === selectedNode.id);
  const totalSynapses = outboundEdges.length + inboundEdges.length;

  const imports = outboundEdges
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter(Boolean) as GraphNode[];
    
  const importedBy = inboundEdges
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter(Boolean) as GraphNode[];

  const handleExplore = () => {
    setSidebarOpen(true);
    setSidebarTab('preview');
  };

  const dirPath = data.filePath ? data.filePath.split('/').slice(0, -1).join('/') + '/' : '';
  const nodeColor = data.color || '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: isMobile ? 0 : (sidebarOpen ? -(sidebarWidth + 20) : 0)
      }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`absolute z-40 pointer-events-auto transition-all duration-200
        ${isMobile 
          ? 'bottom-4 inset-x-4 w-auto' 
          : 'bottom-6 right-6 w-80'
        }
      `}
    >
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 p-4 rounded-xl shadow-2xl relative select-none">
        {/* Header section with path and close button */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="min-w-0">
            {dirPath && (
              <span className="text-[10px] font-mono text-zinc-500 tracking-wide block truncate">
                {dirPath}
              </span>
            )}
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 truncate mt-0.5">
              <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: nodeColor }} />
              <span className="truncate">{label}</span>
            </h3>
          </div>
          <button 
            onClick={() => selectNode(null)} 
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Metadata horizontal row */}
        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-zinc-400 font-mono mb-4 border-b border-zinc-900 pb-3">
          <span className="uppercase text-zinc-500">{type}</span>
          <span className="text-zinc-800">•</span>
          <span>{formatBytes(data.size)}</span>
          {totalSynapses > 0 && (
            <>
              <span className="text-zinc-800">•</span>
              <span>{totalSynapses} link{totalSynapses !== 1 && 's'}</span>
            </>
          )}
        </div>

        {/* Dynamic connection paths */}
        {totalSynapses > 0 && (
          <div className="space-y-3 mb-4 max-h-32 overflow-y-auto pr-0.5 scrollbar-thin">
            {imports.length > 0 && (
              <div>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Imports</span>
                <div className="flex flex-wrap gap-1.5">
                  {imports.map((impNode) => {
                    const impData = impNode.data as any;
                    return (
                      <button
                        key={impNode.id}
                        onClick={() => selectNode(impNode)}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-900/60 border border-zinc-800/50 text-[10px] text-zinc-300 hover:text-white transition-colors font-mono truncate max-w-[130px] flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: impData.color || '#475569' }} />
                        <span className="truncate">{impData.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {importedBy.length > 0 && (
              <div>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Imported By</span>
                <div className="flex flex-wrap gap-1.5">
                  {importedBy.map((impNode) => {
                    const impData = impNode.data as any;
                    return (
                      <button
                        key={impNode.id}
                        onClick={() => selectNode(impNode)}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-900/60 border border-zinc-800/50 text-[10px] text-zinc-300 hover:text-white transition-colors font-mono truncate max-w-[130px] flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: impData.color || '#475569' }} />
                        <span className="truncate">{impData.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explore Button */}
        <button 
          onClick={handleExplore}
          className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors flex items-center justify-center gap-1 shrink-0"
        >
          <span>Explore Source</span>
          <ChevronRight size={14} className="text-zinc-600" />
        </button>
      </div>
    </motion.div>
  );
}
