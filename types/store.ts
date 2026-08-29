/**
 * GitNode — Zustand Store State & Actions Types
 */

import type { RepoMetadata, FileTreeNode, LanguageStats, Contributor } from './github';
import type { GraphNode, GraphEdge, GraphFilters, ViewMode } from './graph';
import type { ImportEdge } from './parser';
import type { TechStackItem } from './techStack';
import type { AppError } from './error';

export type SidebarTab = 'structure' | 'preview' | 'stats';

export interface RepoStateData {
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
  isScaleFree: boolean;
  parsedFiles: string[];
}

export interface RepoUIState {
  viewMode: ViewMode;
  viewModeTransitioning: boolean;
  selectedNode: GraphNode | null;
  selectedFilePath: string | null;
  fileContent: string | null;
  isLoadingContent: boolean;
  sidebarTab: SidebarTab;
  filters: GraphFilters;
}

export interface RepoStatusState {
  isLoading: boolean;
  loadingMessage: string;
  error: AppError | null;
}

export interface RepoActions {
  setRepo: (owner: string, repo: string) => void;
  setMetadata: (metadata: RepoMetadata) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  setLanguages: (languages: LanguageStats) => void;
  setContributors: (contributors: Contributor[]) => void;
  setTechStack: (stack: TechStackItem[]) => void;
  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  selectNode: (node: GraphNode | null) => void;
  fetchFileImports: (filePath: string) => Promise<void>;
  setFileContent: (content: string | null) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: AppError | null) => void;
  reset: () => void;
}

/** Complete Zustand application state */
export interface RepoState extends RepoStateData, RepoUIState, RepoStatusState, RepoActions {}
