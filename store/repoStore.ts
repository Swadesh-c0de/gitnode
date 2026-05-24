/**
 * RepoLens — Zustand Store
 * Global state management for repository data, graph state, and UI.
 */

import { create } from 'zustand';
import type {
  RepoState,
  RepoMetadata,
  FileTreeNode,
  LanguageStats,
  Contributor,
  TechStackItem,
  GraphNode,
  GraphEdge,
  GraphFilters,
  AppError,
  ImportEdge,
} from '@/types';

const DEFAULT_FILTERS: GraphFilters = {
  showFiles: true,
  showFolders: true,
  showExternalDeps: false,
  fileTypes: [],
  maxDepth: 10,
  searchQuery: '',
};

export const useRepoStore = create<RepoState>((set) => ({
  // Data
  owner: null,
  repo: null,
  metadata: null,
  fileTree: [],
  languages: {},
  contributors: [],
  techStack: [],
  nodes: [],
  edges: [],
  importEdges: [],
  isScaleFree: false,
  parsedFiles: [],

  // UI State
  viewMode: 'tree',
  viewModeTransitioning: false,
  selectedNode: null,
  selectedFilePath: null,
  fileContent: null,
  isLoadingContent: false,
  sidebarTab: 'structure',
  filters: DEFAULT_FILTERS,

  // Loading & Error
  isLoading: false,
  loadingMessage: '',
  error: null,

  // Actions
  setRepo: (owner: string, repo: string) => set({ owner, repo }),

  setMetadata: (metadata: RepoMetadata) => set({ metadata }),

  setFileTree: (fileTree: FileTreeNode[]) => set({ fileTree }),

  setLanguages: (languages: LanguageStats) => set({ languages }),

  setContributors: (contributors: Contributor[]) => set({ contributors }),

  setTechStack: (techStack: TechStackItem[]) => set({ techStack }),

  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => set({ nodes, edges }),

  selectNode: (node: GraphNode | null) => {
    set({
      selectedNode: node,
      selectedFilePath: node ? (node.data as { filePath?: string }).filePath || null : null,
      fileContent: null,
      sidebarTab: node ? 'preview' : 'structure',
    });

    if (!node || (node.data as any).type !== 'file') return;

    const state = useRepoStore.getState();
    const filePath = node.id;

    if (state.isScaleFree && !state.parsedFiles.includes(filePath)) {
      const owner = state.owner;
      const repo = state.repo;

      if (!owner || !repo) return;

      fetch(`/api/parse/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(filePath)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to parse file imports');
        })
        .then((data) => {
          if (!data.edges) return;

          const currentImportEdges = useRepoStore.getState().importEdges;
          const newEdges = data.edges.filter((ne: any) => 
            !currentImportEdges.some((ce) => ce.source === ne.source && ce.target === ne.target)
          );

          set({
            importEdges: newEdges.length > 0 ? [...currentImportEdges, ...newEdges] : currentImportEdges,
            parsedFiles: [...state.parsedFiles, filePath]
          });
        })
        .catch((err) => console.error("On-demand import parse error:", err));
    }
  },

  setFileContent: (content: string | null) =>
    set({ fileContent: content, isLoadingContent: false }),

  setSidebarTab: (tab: 'structure' | 'preview' | 'stats') => set({ sidebarTab: tab }),
  
  setViewMode: (mode: 'constellation' | 'tree') => {
    set({ viewModeTransitioning: true });
    set({ viewMode: mode });
    setTimeout(() => {
      set({ viewModeTransitioning: false });
    }, 500);
  },

  setFilters: (filters: Partial<GraphFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setLoading: (isLoading: boolean, loadingMessage?: string) =>
    set({ isLoading, loadingMessage: loadingMessage || '' }),

  setError: (error: AppError | null) => set({ error, isLoading: false }),

  reset: () =>
    set({
      owner: null,
      repo: null,
      metadata: null,
      fileTree: [],
      languages: {},
      contributors: [],
      techStack: [],
      nodes: [],
      edges: [],
      importEdges: [],
      isScaleFree: false,
      parsedFiles: [],
      selectedNode: null,
      selectedFilePath: null,
      fileContent: null,
      isLoadingContent: false,
      sidebarTab: 'structure',
      viewMode: 'tree',
      viewModeTransitioning: false,
      filters: DEFAULT_FILTERS,
      isLoading: false,
      loadingMessage: '',
      error: null,
    }),
}));

// Performance-optimized selectors for production
export const selectMetadata = (state: RepoState) => state.metadata;
export const selectViewMode = (state: RepoState) => state.viewMode;
export const selectIsLoading = (state: RepoState) => state.isLoading;
export const selectFilters = (state: RepoState) => state.filters;
export const selectNodes = (state: RepoState) => state.nodes;
export const selectEdges = (state: RepoState) => state.edges;
export const selectImportEdges = (state: RepoState) => state.importEdges;
export const selectViewModeTransitioning = (state: RepoState) => state.viewModeTransitioning;

