/**
 * RepoLens — Graph Builder
 * Converts a file tree into React Flow nodes and edges using dagre for auto-layout.
 */

import type { FileTreeNode, GraphNode, GraphEdge, ImportEdge, GraphFilters } from '@/types';
import { getExtensionColor } from '@/types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;
const FOLDER_PADDING = 40;

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

function countFiles(node: FileTreeNode): number {
  if (node.type === 'file') return 1;
  return node.children?.reduce((s, c) => s + countFiles(c), 0) ?? 0;
}

// Layout is now handled by d3-force physics in hooks/useForceLayout.ts

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
  maxNodes = 500
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const flatItems = flattenTree(fileTree);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const maxDepth = filters?.maxDepth ?? 10;
  const showFiles = filters?.showFiles ?? true;
  const showFolders = filters?.showFolders ?? true;
  const fileTypes = filters?.fileTypes ?? [];
  const showExternalDeps = filters?.showExternalDeps ?? false;
  let count = 0;

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

  // Remove structural hierarchy edges entirely
  // (We no longer connect parentPath -> item.path)

  for (const imp of importEdges) {
    if (imp.type === 'external' && !showExternalDeps) continue;
    const targetId = resolveImportTarget(imp.target, imp.source, nodeIds);
    if (targetId && nodeIds.has(imp.source) && nodeIds.has(targetId)) {
      edges.push({
        id: `i-${imp.source}-${targetId}`, source: imp.source, target: targetId,
        type: 'animated',
        style: { strokeWidth: 1.5 },
        data: { edgeType: imp.type },
      });
    }
  }

  return { nodes, edges };
}

/** Get summary statistics about the built graph */
export function getGraphStats(nodes: GraphNode[], edges: GraphEdge[]) {
  const fileNodes = nodes.filter((n) => n.type === 'file');
  const folderNodes = nodes.filter((n) => n.type === 'folder');
  const importEdges = edges.filter((e) => e.id.startsWith('i-'));
  const extCounts: Record<string, number> = {};
  for (const n of fileNodes) {
    const ext = (n.data as { extension?: string }).extension || 'other';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }
  return { totalFiles: fileNodes.length, totalFolders: folderNodes.length, totalEdges: importEdges.length, extensionCounts: extCounts };
}
