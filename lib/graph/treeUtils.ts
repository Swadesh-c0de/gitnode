/**
 * GitNode — File Tree Traversal & O(depth) Search Algorithms
 */

import type { FileTreeNode } from '@/types/github';

export interface FlattenedTreeNode {
  node: FileTreeNode;
  depth: number;
  parentPath: string;
}

/**
 * Recursively flatten a nested FileTreeNode hierarchy into a 1D list with depth tracking.
 */
export function flattenTree(
  tree: FileTreeNode[],
  parentPath = '',
  depth = 0
): FlattenedTreeNode[] {
  const result: FlattenedTreeNode[] = [];
  for (const item of tree) {
    result.push({ node: item, depth, parentPath });
    if (item.children?.length) {
      result.push(...flattenTree(item.children, item.path, depth + 1));
    }
  }
  return result;
}

/**
 * Find a specific node in a nested FileTreeNode hierarchy using directory path segments (O(depth) lookup).
 * Avoids O(N) full-tree recursive flattening.
 * @param tree - Root array of file tree nodes
 * @param path - Target path string (e.g. "src/components/Button.tsx")
 */
export function findNodeByPath(tree: FileTreeNode[], path: string): FileTreeNode | null {
  if (!path) return null;
  const parts = path.split('/');
  let currentChildren = tree;
  let result: FileTreeNode | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const found = currentChildren.find((n) => n.name === part);
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
