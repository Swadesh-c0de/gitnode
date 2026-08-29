"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight, Copy, Check, FileCode, CornerDownRight } from "lucide-react";
import { useRepoStore } from "@/store/repoStore";
import type { GraphNode } from "@/types";
import { formatBytes } from "@/lib/utils";

export default function NodeInspector({ sidebarOpen, setSidebarOpen, sidebarWidth }: { sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void, sidebarWidth: number }) {
  const selectedNode = useRepoStore((s) => s.selectedNode);
  const selectNode = useRepoStore((s) => s.selectNode);
  const setSidebarTab = useRepoStore((s) => s.setSidebarTab);
  const edges = useRepoStore((s) => s.edges);
  const nodes = useRepoStore((s) => s.nodes);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.filePath) {
      navigator.clipboard.writeText(data.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dirPath = data.filePath ? data.filePath.split('/').slice(0, -1).join('/') + '/' : '';
  const nodeColor = data.color || '#3b82f6';
  const ext = data.extension || (data.filePath ? data.filePath.split('.').pop() : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        x: isMobile ? 0 : (sidebarOpen ? -(sidebarWidth + 16) : 0)
      }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`absolute z-30 pointer-events-auto transition-all duration-300
        ${isMobile
          ? 'bottom-3 inset-x-3 w-auto'
          : 'bottom-4 right-4 w-76'
        }
      `}
    >
      <div className="bg-zinc-950/85 backdrop-blur-2xl border border-white/[0.08] p-3.5 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] relative select-none">
        {/* Header section with path and close button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            {dirPath && (
              <div className="flex items-center gap-1 group/path cursor-pointer" onClick={handleCopyPath} title="Click to copy full path">
                <span className="text-[9px] font-mono text-zinc-500 tracking-tight truncate group-hover/path:text-zinc-300 transition-colors">
                  {dirPath}
                </span>
                {copied ? (
                  <Check size={10} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={9} className="text-zinc-600 group-hover/path:text-zinc-400 shrink-0 opacity-0 group-hover/path:opacity-100 transition-opacity" />
                )}
              </div>
            )}
            <h3 className="text-xs font-bold text-white flex items-center gap-2 truncate mt-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                style={{ color: nodeColor, backgroundColor: nodeColor }}
              />
              <span className="truncate">{label}</span>
            </h3>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors shrink-0"
            title="Close Inspector"
          >
            <X size={13} />
          </button>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[8.5px] font-mono mb-3">
          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 uppercase font-semibold">
            {ext ? ext.toUpperCase() : type}
          </span>
          {data.size !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 font-semibold">
              {formatBytes(data.size)}
            </span>
          )}
          {totalSynapses > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 font-semibold">
              {totalSynapses} link{totalSynapses !== 1 && 's'}
            </span>
          )}
        </div>

        {/* Dynamic connection pills */}
        {totalSynapses > 0 && (
          <div className="space-y-2 mb-3 max-h-28 overflow-y-auto pr-0.5 scrollbar-thin">
            {imports.length > 0 && (
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Dependencies</span>
                <div className="flex flex-wrap gap-1">
                  {imports.map((impNode) => {
                    const impData = impNode.data as any;
                    return (
                      <button
                        key={impNode.id}
                        onClick={() => selectNode(impNode)}
                        className="px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[9px] text-zinc-300 hover:text-white transition-colors font-mono truncate max-w-[120px] flex items-center gap-1"
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
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Imported By</span>
                <div className="flex flex-wrap gap-1">
                  {importedBy.map((impNode) => {
                    const impData = impNode.data as any;
                    return (
                      <button
                        key={impNode.id}
                        onClick={() => selectNode(impNode)}
                        className="px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[9px] text-zinc-300 hover:text-white transition-colors font-mono truncate max-w-[120px] flex items-center gap-1"
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

        {/* Explore Source Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExplore}
          className="w-full py-1.5 px-3 rounded-lg bg-white text-zinc-950 text-[11px] font-bold tracking-tight hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FileCode size={12} className="text-zinc-700" />
          <span>Explore Source</span>
          <ChevronRight size={12} className="text-zinc-600" />
        </motion.button>
      </div>
    </motion.div>
  );
}
