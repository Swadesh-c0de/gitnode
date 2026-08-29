/**
 * GitNode — Import & AST Parsing Domain Types
 */

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

/** Raw parsed import statement match */
export interface RawImportMatch {
  path: string;
  raw: string;
}
