'use client';

import React, { useCallback, useMemo } from 'react';
import ConstellationGraph from './ConstellationGraph';
import TreeGraph from './TreeGraph';
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
  const viewMode = useRepoStore((s) => s.viewMode);

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
      <GraphControls />

      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {viewMode === 'constellation' ? (
            <motion.div
              key="constellation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <ConstellationGraph
                nodes={graphNodes}
                edges={graphEdges}
                onNodeClick={onNodeSelect}
                selectedNodeId={selectedNode?.id}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tree"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <TreeGraph
                fileTree={fileTree}
                onNodeClick={onNodeSelect}
                selectedNodeId={selectedNode?.id}
                maxDepth={filters.maxDepth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Node Inspector */}
      <AnimatePresence>
        {selectedNode && <NodeInspector sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarWidth={sidebarWidth} />}
      </AnimatePresence>

    </div>
  );
}
