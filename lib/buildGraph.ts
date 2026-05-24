/**
 * RepoLens — Graph Builder
 * Converts a file tree into React Flow nodes and edges using dagre for auto-layout.
 */

import type { FileTreeNode, GraphNode, GraphEdge, ImportEdge, GraphFilters } from '@/types';
import { getExtensionColor } from '@/types';

function flattenTree(
  tree: FileTreeNode[],
  parentPath = '',
  depth = 0
): { node: FileTreeNode; depth: number; parentPath: string }[] {
  const result: { node: FileTreeNode; depth: number; parentPath: string }[] = [];
  for (const item of tree) {
    result.push({ node: item, depth, parentPath });
    if (item.children?.length) {
      result.push(...flattenTree(item.children, item.path, depth + 1));
    }
  }
  return result;
}

// Find a single node in the nested tree by splitting path directories (O(depth) lookup)
function findNodeByPath(tree: FileTreeNode[], path: string): FileTreeNode | null {
  if (!path) return null;
  const parts = path.split('/');
  let currentChildren = tree;
  let result: FileTreeNode | null = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const found = currentChildren.find(n => n.name === part);
    if (!found) return null;
    if (isLast) {
      result = found;
      break;
    }
    if (found.type === 'directory') {
      currentChildren = found.children || [];
    } else {
      return null;
    }
  }
  return result;
}

function resolveImportTarget(importPath: string, sourcePath: string, nodeIds: Set<string>): string | null {
  if (nodeIds.has(importPath)) return importPath;
  if (importPath.startsWith('.')) {
    const sourceDir = sourcePath.split('/').slice(0, -1).join('/');
    const parts = importPath.split('/');
    const resolved: string[] = sourceDir ? sourceDir.split('/') : [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') resolved.pop();
      else resolved.push(part);
    }
    const rp = resolved.join('/');
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
      if (nodeIds.has(rp + ext)) return rp + ext;
    }
  }
  return null;
}

/**
 * Build React Flow nodes and edges from a file tree and import edges.
 */
export function buildGraph(
  fileTree: FileTreeNode[],
  importEdges: ImportEdge[] = [],
  filters?: GraphFilters,
  maxNodes = 500,
  isScaleFree = false,
  selectedNodeId: string | null = null
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const maxDepth = filters?.maxDepth ?? 10;
  const showFiles = filters?.showFiles ?? true;
  const showFolders = filters?.showFolders ?? true;
  const fileTypes = filters?.fileTypes ?? [];
  const showExternalDeps = filters?.showExternalDeps ?? false;
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
      activeDirNode = { path: '', name: 'root', type: 'directory', children: fileTree } as any;
    }

    // Add direct file children of the active directory
    if (activeDirNode && activeDirNode.children) {
      activeDirNode.children.forEach(child => {
        if (child.type === 'file') {
          filesToInclude.push(child);
        }
      });
    }

    // Add all dynamically connected files
    connectedFilePaths.forEach(path => {
      if (filesToInclude.some(f => f.path === path)) return;
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
        id: item.path, type: 'cyber', position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: { label: item.name, filePath: item.path, extension: ext, size: item.size, type: 'file', color: colors.bg, glowColor: colors.glow },
      });
      nodeIds.add(item.path);
      count++;
    }
  } else {
    // For smaller/medium repositories: Fallback to full tree flattening
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
          id: item.path, type: 'cyber', position: { x: Math.random() * 500, y: Math.random() * 500 },
          data: { label: item.name, filePath: item.path, extension: ext, size: item.size, type: 'file', color: colors.bg, glowColor: colors.glow },
        });
        nodeIds.add(item.path);
        count++;
      }
    }
  }

  // Resolve import links
  for (const imp of importEdges) {
    if (imp.type === 'external' && !showExternalDeps) continue;
    const targetId = resolveImportTarget(imp.target, imp.source, nodeIds);
    if (targetId && nodeIds.has(imp.source) && nodeIds.has(targetId)) {
      edges.push({
        id: `i-${imp.source}-${targetId}`, source: imp.source, target: targetId,
        type: 'animated',
        data: { edgeType: imp.type },
      });
    }
  }

  return { nodes, edges };
}
