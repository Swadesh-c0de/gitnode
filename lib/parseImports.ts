/**
 * RepoLens — Import/Require Parser
 * Extracts import dependency edges from source code using regex patterns.
 * Supports: JavaScript/TypeScript, Python, Rust, Go, Java/Kotlin
 */

import type { ImportEdge, ParseableLanguage } from '@/types';

/**
 * Determine the language of a file based on its extension.
 * @param filename - The filename or path
 * @returns The parseable language, or null if unsupported
 */
export function detectLanguage(filename: string): ParseableLanguage | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'typescript';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'kt':
    case 'kts':
      return 'kotlin';
    default:
      return null;
  }
}

/**
 * Check whether an import path is a local (relative) import or an external package.
 * @param importPath - The import path string
 * @param language - The source language
 * @returns 'local' or 'external'
 */
function classifyImport(importPath: string, language: ParseableLanguage): 'local' | 'external' {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return importPath.startsWith('.') || importPath.startsWith('/') ? 'local' : 'external';
    case 'python':
      return importPath.startsWith('.') ? 'local' : 'external';
    case 'rust':
      return importPath.startsWith('crate::') || importPath.startsWith('self::') || importPath.startsWith('super::')
        ? 'local'
        : 'external';
    case 'go':
      // Go local imports typically contain the module path
      return importPath.includes('/') && !importPath.includes('.') ? 'local' : 'external';
    case 'java':
    case 'kotlin':
      return 'external'; // Java/Kotlin imports are always fully qualified
    default:
      return 'external';
  }
}

/**
 * Parse JavaScript/TypeScript import statements.
 */
function parseJSImports(content: string): { path: string; raw: string }[] {
  const results: { path: string; raw: string }[] = [];
  const patterns = [
    // import x from 'y' | import 'y' | import { x } from 'y'
    /import\s+(?:(?:[\w*{}\s,]+)\s+from\s+)?['"]([^'"]+)['"]/g,
    // export { x } from 'y' | export * from 'y'
    /export\s+(?:(?:[\w*{}\s,]+)\s+from\s+)?['"]([^'"]+)['"]/g,
    // require('y')
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // dynamic import('y')
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        results.push({ path: match[1], raw: match[0] });
      }
    }
  }

  return results;
}

/**
 * Parse Python import statements.
 */
function parsePythonImports(content: string): { path: string; raw: string }[] {
  const results: { path: string; raw: string }[] = [];
  const patterns = [
    // from x import y | from x import *
    /from\s+([\w.]+)\s+import\s+/g,
    // import x | import x.y.z
    /^import\s+([\w.]+)/gm,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        results.push({ path: match[1], raw: match[0] });
      }
    }
  }

  return results;
}

/**
 * Parse Rust use/mod statements.
 */
function parseRustImports(content: string): { path: string; raw: string }[] {
  const results: { path: string; raw: string }[] = [];
  const patterns = [
    // use crate::module | use std::io
    /use\s+([\w:]+(?:::\w+)*)/g,
    // mod module
    /mod\s+(\w+)\s*;/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        results.push({ path: match[1], raw: match[0] });
      }
    }
  }

  return results;
}

/**
 * Parse Go import statements.
 */
function parseGoImports(content: string): { path: string; raw: string }[] {
  const results: { path: string; raw: string }[] = [];

  // Single import: import "fmt"
  const singlePattern = /import\s+"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = singlePattern.exec(content)) !== null) {
    if (match[1]) results.push({ path: match[1], raw: match[0] });
  }

  // Block import: import ( "fmt" "os" )
  const blockPattern = /import\s*\(([\s\S]*?)\)/g;
  while ((match = blockPattern.exec(content)) !== null) {
    const block = match[1];
    const linePattern = /(?:\w+\s+)?"([^"]+)"/g;
    let lineMatch: RegExpExecArray | null;
    while ((lineMatch = linePattern.exec(block)) !== null) {
      if (lineMatch[1]) results.push({ path: lineMatch[1], raw: lineMatch[0] });
    }
  }

  return results;
}

/**
 * Parse Java/Kotlin import statements.
 */
function parseJavaImports(content: string): { path: string; raw: string }[] {
  const results: { path: string; raw: string }[] = [];
  const pattern = /import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) {
      results.push({ path: match[1], raw: match[0] });
    }
  }

  return results;
}

/**
 * Parse import statements from source code and return import edges.
 * @param filePath - The path of the source file
 * @param content - The file's source code content
 * @returns Array of import edges with source, target, and type
 */
export function parseImports(filePath: string, content: string): ImportEdge[] {
  const language = detectLanguage(filePath);
  if (!language) return [];

  let rawImports: { path: string; raw: string }[] = [];

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
    console.warn(`Failed to parse imports for ${filePath}:`, error);
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
