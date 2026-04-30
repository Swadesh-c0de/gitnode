'use client';

import React, { useCallback, useMemo } from 'react';
import ConstellationGraph from './ConstellationGraph';
import GraphControls from './GraphControls';
import NodeInspector from './NodeInspector';
import { useRepoStore } from '@/store/repoStore';
import { buildGraph } from '@/lib/buildGraph';
import type { GraphNode } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

export default function RepoGraph({ sidebarOpen, setSidebarOpen, sidebarWidth }: { sidebarOpen: boolean, setSidebarOpen: (o: boolean) => void, sidebarWidth: number }) {
  const fileTree = useRepoStore((s) => s.fileTree);
  const importEdges = useRepoStore((s) => s.importEdges);
  const filters = useRepoStore((s) => s.filters);
  const setGraphStore = useRepoStore((s) => s.setGraph);
  const selectNode = useRepoStore((s) => s.selectNode);
  const selectedNode = useRepoStore((s) => s.selectedNode);

  // Build graph from file tree
  const { graphNodes, graphEdges } = useMemo(() => {
    if (!fileTree.length) return { graphNodes: [], graphEdges: [] };
    const result = buildGraph(fileTree, importEdges, filters, 500);
    return { graphNodes: result.nodes, graphEdges: result.edges };
  }, [fileTree, importEdges, filters]);

  // Handle node selection from store update
  const onNodeSelect = useCallback((node: GraphNode | null) => {
    selectNode(node);
  }, [selectNode]);

  // Keep store in sync
  React.useEffect(() => {
    setGraphStore(graphNodes as GraphNode[], graphEdges);
  }, [graphNodes, graphEdges, setGraphStore]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Architectural Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '100px 100px', backgroundPosition: 'center center' }}
      />
      {/* Subtle Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <GraphControls />

      <div className="absolute inset-0 z-0">
        <ConstellationGraph
          nodes={graphNodes}
          edges={graphEdges}
          onNodeClick={onNodeSelect}
          selectedNodeId={selectedNode?.id}
        />
      </div>

      {/* Floating Node Inspector */}
      <AnimatePresence>
        {selectedNode && <NodeInspector sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarWidth={sidebarWidth} />}
      </AnimatePresence>

      {/* Precision Crosshair Framing */}
      <div className="absolute inset-0 pointer-events-none m-8 mix-blend-screen">
        {/* Top Left */}
        <div className="absolute top-0 left-0 w-12 h-[1px] bg-white/30" />
        <div className="absolute top-0 left-0 w-[1px] h-12 bg-white/30" />
        <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-white/50" />

        {/* Top Right */}
        <div className="absolute top-0 right-0 w-12 h-[1px] bg-white/30" />
        <div className="absolute top-0 right-0 w-[1px] h-12 bg-white/30" />
        <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/50" />

        {/* Bottom Left */}
        <div className="absolute bottom-0 left-0 w-12 h-[1px] bg-white/30" />
        <div className="absolute bottom-0 left-0 w-[1px] h-12 bg-white/30" />
        <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-white/50" />

        {/* Bottom Right */}
        <div className="absolute bottom-0 right-0 w-12 h-[1px] bg-white/30" />
        <div className="absolute bottom-0 right-0 w-[1px] h-12 bg-white/30" />
        <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-white/50" />

        {/* Center Coordinates (Subtle) */}
        <div className="absolute top-1/2 left-0 w-4 h-[1px] bg-white/20 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-4 h-[1px] bg-white/20 -translate-y-1/2" />
        <div className="absolute top-0 left-1/2 w-[1px] h-4 bg-white/20 -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-[1px] h-4 bg-white/20 -translate-x-1/2" />
      </div>
    </div>
  );
}
