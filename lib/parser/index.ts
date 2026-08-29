/**
 * GitNode — Multi-Language Import & Dependency Parser
 */

import type { ImportEdge, RawImportMatch } from '@/types/parser';
import { detectLanguage, classifyImport } from './detector';
import { parseJSImports } from './languages/javascript';
import { parsePythonImports } from './languages/python';
import { parseRustImports } from './languages/rust';
import { parseGoImports } from './languages/go';
import { parseJavaImports } from './languages/java';

export * from './detector';
export * from './languages/javascript';
export * from './languages/python';
export * from './languages/rust';
export * from './languages/go';
export * from './languages/java';

/**
 * Parse import statements from source code and return deduplicated import edges.
 * @param filePath - The path of the source file
 * @param content - The file's source code content
 * @returns Array of ImportEdge objects with source, target, and classification type
 */
export function parseImports(filePath: string, content: string): ImportEdge[] {
  const language = detectLanguage(filePath);
  if (!language) return [];

  let rawImports: RawImportMatch[] = [];

  try {
    switch (language) {
      case 'javascript':
      case 'typescript':
        rawImports = parseJSImports(content);
        break;
      case 'python':
        rawImports = parsePythonImports(content);
        break;
      case 'rust':
        rawImports = parseRustImports(content);
        break;
      case 'go':
        rawImports = parseGoImports(content);
        break;
      case 'java':
      case 'kotlin':
        rawImports = parseJavaImports(content);
        break;
    }
  } catch (error) {
    console.warn(`[GitNode Parser] Failed to parse imports for ${filePath}:`, error);
    return [];
  }

  // Deduplicate by target path
  const seen = new Set<string>();
  const edges: ImportEdge[] = [];

  for (const imp of rawImports) {
    if (!seen.has(imp.path)) {
      seen.add(imp.path);
      edges.push({
        source: filePath,
        target: imp.path,
        type: classifyImport(imp.path, language),
      });
    }
  }

  return edges;
}
