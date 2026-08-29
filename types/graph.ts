/**
 * GitNode — Visual Graph Domain Types
 */

/** Base Node interface for graph visualization */
export interface Node<T = Record<string, unknown>, U = string> {
  id: string;
  type?: U;
  data: T;
  position?: { x: number; y: number };
}

/** Base Edge interface for graph visualization */
export interface Edge<T = Record<string, unknown>> {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: T;
}

/** Shared base data for all graph nodes */
export interface BaseNodeData {
  label: string;
  filePath: string;
  type: 'file' | 'folder';
  [key: string]: unknown;
}

/** Data attached to a file node in the graph */
export interface FileNodeData extends BaseNodeData {
  extension: string;
  size?: number;
  type: 'file';
  color: string;
  glowColor: string;
}

/** Data attached to a folder node in the graph */
export interface FolderNodeData extends BaseNodeData {
  type: 'folder';
  fileCount: number;
}

/** Graph node representing a file */
export type FileGraphNode = Node<FileNodeData, 'file' | 'dot' | 'cyber'>;

/** Graph node representing a directory */
export type FolderGraphNode = Node<FolderNodeData, 'folder' | 'cyber'>;

/** Union of all graph node types */
export type GraphNode = FileGraphNode | FolderGraphNode;

/** Edge metadata representing an import dependency */
export interface GraphEdgeData {
  edgeType: 'local' | 'external';
  [key: string]: unknown;
}

/** Graph edge representing a dependency connection */
export type GraphEdge = Edge<GraphEdgeData>;

/** Supported visualization layout engines */
export type ViewMode = 'constellation' | 'tree';

/** Filter options for the graph viewport */
export interface GraphFilters {
  showFiles: boolean;
  showFolders: boolean;
  showExternalDeps: boolean;
  fileTypes: string[];
  maxDepth: number;
  searchQuery: string;
}
