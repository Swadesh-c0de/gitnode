"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRepoStore } from "@/store/repoStore";
import SlotCounter from "@/components/ui/SlotCounter";

/**
 * NodeInspector — Simple detail view for the selected node.
 */
export default function NodeInspector({ sidebarOpen, setSidebarOpen, sidebarWidth }: { sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void, sidebarWidth: number }) {
  const selectedNode = useRepoStore((s) => s.selectedNode);
  const selectNode = useRepoStore((s) => s.selectNode);
  const setSidebarTab = useRepoStore((s) => s.setSidebarTab);
  const edges = useRepoStore((s) => s.edges);

  if (!selectedNode) return null;

  const data = selectedNode.data as any;
  const label = data.label || "UNKNOWN";
  const type = selectedNode.type || "node";
  
  const synapses = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  ).length;

  const handleExplore = () => {
    setSidebarOpen(true);
    setSidebarTab('preview');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: 0 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: sidebarOpen ? -(sidebarWidth + 20) : -10 
      }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-12 right-0 w-72 z-50 pointer-events-auto"
    >
      <div className="bg-black/80 backdrop-blur-3xl border border-white/[0.05] p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[9px] font-black tracking-[0.8em] text-white/20 uppercase">Identity</span>
          <button 
            onClick={() => selectNode(null)} 
            className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="text-sm font-black tracking-widest text-white uppercase mb-5 truncate">
          {label}
        </h3>

        <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 mb-5">
          <div className="p-3 bg-black/40">
            <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase block mb-1">Type</span>
            <span className="text-[11px] font-mono text-white/60">{type.toUpperCase()}</span>
          </div>
          <div className="p-3 bg-black/40">
            <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase block mb-1">Synapses</span>
            <div className="text-[11px] font-mono text-white/60">
                <SlotCounter value={synapses} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
            <button 
                onClick={handleExplore}
                className="px-6 py-2 border border-white/5 text-[8px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white hover:bg-white/[0.02] transition-all"
            >
                Explore_Data
            </button>
        </div>
      </div>
    </motion.div>
  );
}
