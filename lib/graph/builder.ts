/**
 * GitNode — Graph Builder Engine
 * Converts file tree structures and import dependencies into visual graph nodes and edges.
 * Supports Scale-Free O(depth) local partitioning and standard full-tree generation.
 */

import type {
  FileTreeNode,
  GraphNode,
  GraphEdge,
  ImportEdge,
  GraphFilters,
} from '@/types';
import { getExtensionColor } from '@/lib/constants/colors';
import { DEFAULT_MAX_GRAPH_NODES, DEFAULT_MAX_DEPTH } from '@/lib/constants/limits';
import { resolveImportTarget } from '@/lib/utils/path';
import { flattenTree, findNodeByPath } from './treeUtils';

export interface GraphBuildResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Build graph nodes and edges from a file tree and parsed import edges.
 * @param fileTree - The root FileTreeNode array
 * @param importEdges - Parsed dependency connections
 * @param filters - Active UI viewport filters
 * @param maxNodes - Upper bound of nodes to synthesize (default: 500)
 * @param isScaleFree - Whether scale-free local partitioning mode is active
 * @param selectedNodeId - The currently selected node path (used in scale-free mode)
 */
export function buildGraph(
  fileTree: FileTreeNode[],
  importEdges: ImportEdge[] = [],
  filters?: GraphFilters,
  maxNodes = DEFAULT_MAX_GRAPH_NODES,
  isScaleFree = false,
  selectedNodeId: string | null = null
): GraphBuildResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const maxDepth = filters?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const showFiles = filters?.showFiles ?? true;
  const showFolders = filters?.showFolders ?? true;
  const fileTypes = filters?.fileTypes ?? [];
  const showExternalDeps = filters?.showExternalDeps ?? true;
  let count = 0;

  if (isScaleFree) {
    let activeDirPath = '';
    const connectedFilePaths = new Set<string>();
    let activeDirNode: FileTreeNode | null = null;
    const filesToInclude: FileTreeNode[] = [];

    if (selectedNodeId) {
      const parts = selectedNodeId.split('/');
      activeDirPath = parts.slice(0, -1).join('/');
      connectedFilePaths.add(selectedNodeId);

      // Map dynamic synapses of the active node
      importEdges.forEach((edge) => {
        if (edge.source === selectedNodeId) connectedFilePaths.add(edge.target);
        if (edge.target === selectedNodeId) connectedFilePaths.add(edge.source);
      });

      // Find the parent folder node directly using division indices
      activeDirNode = activeDirPath ? findNodeByPath(fileTree, activeDirPath) : null;
    } else {
      // If no node is selected, activeDirNode is virtual root
      activeDirNode = { path: '', name: 'root', type: 'directory', children: fileTree } as FileTreeNode;
    }

    // Add direct file children of the active directory
    if (activeDirNode && activeDirNode.children) {
      activeDirNode.children.forEach((child) => {
        if (child.type === 'file') {
          filesToInclude.push(child);
        }
      });
    }

    // Add all dynamically connected files
    connectedFilePaths.forEach((path) => {
      if (filesToInclude.some((f) => f.path === path)) return;
      const found = findNodeByPath(fileTree, path);
      if (found && found.type === 'file') {
        filesToInclude.push(found);
      }
    });

    // Map files to GraphNode objects (Instant lookups, zero flat recursion!)
    for (const item of filesToInclude) {
      if (count >= maxNodes) break;
      if (fileTypes.length > 0 && !fileTypes.includes(item.extension || '')) continue;

      const ext = item.extension || '';
      const colors = getExtensionColor(ext);
      nodes.push({
        id: item.path,
        type: 'cyber',
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          label: item.name,
          filePath: item.path,
          extension: ext,
          size: item.size,
          type: 'file',
          color: colors.bg,
          glowColor: colors.glow,
        },
      });
      nodeIds.add(item.path);
      count++;
    }
  } else {
    // For smaller/medium repositories: Standard full tree traversal
    const flatItems = flattenTree(fileTree);
    for (const { node: item, depth } of flatItems) {
      if (count >= maxNodes || depth > maxDepth) continue;
      if (item.type === 'file' && !showFiles) continue;
      if (item.type === 'directory' && !showFolders) continue;
      if (item.type === 'file' && fileTypes.length > 0 && !fileTypes.includes(item.extension || '')) continue;

      if (item.type === 'file') {
        const ext = item.extension || '';
        const colors = getExtensionColor(ext);
        nodes.push({
          id: item.path,
          type: 'cyber',
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          data: {
            label: item.name,
            filePath: item.path,
            extension: ext,
            size: item.size,
            type: 'file',
            color: colors.bg,
            glowColor: colors.glow,
          },
        });
        nodeIds.add(item.path);
        count++;
      }
    }
  }

  if (!showExternalDeps) return { nodes, edges };

  // Resolve import links
  for (const imp of importEdges) {
    if (imp.type === 'external' && !showExternalDeps) continue;
    const targetId = resolveImportTarget(imp.target, imp.source, nodeIds);
    if (targetId && nodeIds.has(imp.source) && nodeIds.has(targetId)) {
      edges.push({
        id: `i-${imp.source}-${targetId}`,
        source: imp.source,
        target: targetId,
        type: 'animated',
        data: { edgeType: imp.type },
      });
    }
  }

  return { nodes, edges };
}
