/**
 * RepoLens — TypeScript Interfaces
 * All shared types for the application.
 */

import type { Node, Edge } from '@xyflow/react';

// ─── GitHub API Types ────────────────────────────────────────────────────────

/** Repository metadata returned from GitHub API */
export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  size: number;
  topics: string[];
  isPrivate: boolean;
  htmlUrl: string;
}

/** A single file or directory node from the GitHub tree API */
export interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  sha: string;
  children?: FileTreeNode[];
  extension?: string;
  content?: string;
}

/** Language distribution from GitHub API */
export interface LanguageStats {
  [language: string]: number;
}

/** GitHub contributor info */
export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
}

// ─── Import Parser Types ─────────────────────────────────────────────────────

/** A single import edge extracted from source code */
export interface ImportEdge {
  /** The file that contains the import statement */
  source: string;
  /** The imported module or file path */
  target: string;
  /** Whether the import is local (relative path) or external (npm/pip package) */
  type: 'local' | 'external';
}

/** Supported languages for import parsing */
export type ParseableLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'kotlin';

// ─── Graph Types ─────────────────────────────────────────────────────────────

/** Data attached to a file node in the React Flow graph */
export interface FileNodeData {
  label: string;
  filePath: string;
  extension: string;
  size?: number;
  type: 'file';
  color: string;
  glowColor: string;
  [key: string]: unknown;
}

/** Data attached to a folder node in the React Flow graph */
export interface FolderNodeData {
  label: string;
  filePath: string;
  type: 'folder';
  fileCount: number;
  [key: string]: unknown;
}

/** A React Flow node for a file */
export type FileGraphNode = Node<FileNodeData, 'file' | 'dot' | 'cyber'>;

/** A React Flow node for a folder */
export type FolderGraphNode = Node<FolderNodeData, 'folder' | 'cyber'>;

/** Union of all graph node types */
export type GraphNode = FileGraphNode | FolderGraphNode;

/** A React Flow edge representing an import dependency */
export interface GraphEdgeData {
  edgeType: 'local' | 'external';
  [key: string]: unknown;
}

export type GraphEdge = Edge<GraphEdgeData>;

// ─── Tech Stack Detection Types ──────────────────────────────────────────────

/** A detected technology in the repository */
export interface TechStackItem {
  name: string;
  icon: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'language' | 'tool';
  version?: string;
}

// ─── Store Types ─────────────────────────────────────────────────────────────

/** Filter options for the graph view */
export interface GraphFilters {
  showFiles: boolean;
  showFolders: boolean;
  showExternalDeps: boolean;
  fileTypes: string[];
  maxDepth: number;
  searchQuery: string;
}

/** Application state managed by Zustand */
export interface RepoState {
  // Data
  owner: string | null;
  repo: string | null;
  metadata: RepoMetadata | null;
  fileTree: FileTreeNode[];
  languages: LanguageStats;
  contributors: Contributor[];
  techStack: TechStackItem[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  importEdges: ImportEdge[];

  // UI State
  selectedNode: GraphNode | null;
  selectedFilePath: string | null;
  fileContent: string | null;
  isLoadingContent: boolean;
  sidebarTab: 'structure' | 'preview' | 'stats';
  filters: GraphFilters;

  // Loading & Error
  isLoading: boolean;
  loadingMessage: string;
  error: AppError | null;

  // Actions
  setRepo: (owner: string, repo: string) => void;
  setMetadata: (metadata: RepoMetadata) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  setLanguages: (languages: LanguageStats) => void;
  setContributors: (contributors: Contributor[]) => void;
  setTechStack: (stack: TechStackItem[]) => void;
  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  selectNode: (node: GraphNode | null) => void;
  setFileContent: (content: string | null) => void;
  setSidebarTab: (tab: 'structure' | 'preview' | 'stats') => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: AppError | null) => void;
  reset: () => void;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

/** Structured application error */
export interface AppError {
  type: 'not_found' | 'rate_limit' | 'private_repo' | 'parse_error' | 'network' | 'unknown';
  message: string;
  retryAfter?: number; // seconds until rate limit resets
}

// ─── Extension Color Map ─────────────────────────────────────────────────────

/** Color mapping for file extensions */
export const EXTENSION_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  ts: { bg: '#3178c6', glow: '#3178c640', text: '#93c5fd' },
  tsx: { bg: '#3178c6', glow: '#3178c640', text: '#93c5fd' },
  js: { bg: '#f7df1e', glow: '#f7df1e40', text: '#fde68a' },
  jsx: { bg: '#f7df1e', glow: '#f7df1e40', text: '#fde68a' },
  py: { bg: '#3572A5', glow: '#3572A540', text: '#6ee7b7' },
  rs: { bg: '#dea584', glow: '#dea58440', text: '#fdba74' },
  go: { bg: '#00ADD8', glow: '#00ADD840', text: '#67e8f9' },
  java: { bg: '#b07219', glow: '#b0721940', text: '#fdba74' },
  kt: { bg: '#A97BFF', glow: '#A97BFF40', text: '#c4b5fd' },
  css: { bg: '#e34c8f', glow: '#e34c8f40', text: '#f9a8d4' },
  scss: { bg: '#e34c8f', glow: '#e34c8f40', text: '#f9a8d4' },
  json: { bg: '#f97316', glow: '#f9731640', text: '#fdba74' },
  md: { bg: '#6b7280', glow: '#6b728040', text: '#9ca3af' },
  html: { bg: '#e34f26', glow: '#e34f2640', text: '#fca5a5' },
  yml: { bg: '#cb171e', glow: '#cb171e40', text: '#fca5a5' },
  yaml: { bg: '#cb171e', glow: '#cb171e40', text: '#fca5a5' },
  toml: { bg: '#9c4221', glow: '#9c422140', text: '#fdba74' },
  default: { bg: '#475569', glow: '#47556940', text: '#94a3b8' },
};

/**
 * Get the color scheme for a given file extension.
 * @param ext - File extension without the dot
 */
export function getExtensionColor(ext: string): { bg: string; glow: string; text: string } {
  return EXTENSION_COLORS[ext.toLowerCase()] || EXTENSION_COLORS.default;
}
