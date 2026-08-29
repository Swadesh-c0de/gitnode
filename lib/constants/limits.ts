/**
 * GitNode — System Limits & Performance Thresholds
 */

/** Repository size threshold (KB) above which Scale-Free bypass mode activates (100MB) */
export const SCALE_FREE_SIZE_THRESHOLD_KB = 100_000;

/** Maximum nodes rendered in FileTree safeguard */
export const MAX_FILE_TREE_NODES_SAFEGUARD = 600;

/** Default maximum graph nodes to build in memory */
export const DEFAULT_MAX_GRAPH_NODES = 500;

/** Default maximum tree depth */
export const DEFAULT_MAX_DEPTH = 10;

/** Batch size when processing unzipped repository files */
export const ZIP_PARSER_BATCH_SIZE = 50;

/** Default API timeouts (ms) */
export const API_TIMEOUT_MS = 15_000;

/** Cache TTL durations (ms) */
export const CACHE_TTL = {
  FILE: 30 * 60 * 1000,       // 30 minutes
  TREE: 15 * 60 * 1000,       // 15 minutes
  REPO: 15 * 60 * 1000,       // 15 minutes
  PARSED_FILE: 30 * 60 * 1000 // 30 minutes
} as const;
