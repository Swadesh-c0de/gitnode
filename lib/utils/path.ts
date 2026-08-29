/**
 * GitNode — Path & Module Resolution Utilities
 */

const EXTENSIONS = [
  '',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
  '.py', '.rs', '.go', '.json',
  '/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/index.mjs',
  '/__init__.py', '/mod.rs'
];

/**
 * Resolve an import string (relative, absolute, or aliased) to an existing graph node ID.
 * @param importPath - The raw import specifier (e.g. "@/components/Button", "../utils", "./types")
 * @param sourcePath - The file path containing the import
 * @param nodeIds - Set of all known file node IDs in the graph
 * @returns The matched file path or null
 */
export function resolveImportTarget(
  importPath: string,
  sourcePath: string,
  nodeIds: Set<string>
): string | null {
  if (nodeIds.has(importPath)) return importPath;

  // Direct check with extension candidates
  for (const ext of EXTENSIONS) {
    if (nodeIds.has(importPath + ext)) return importPath + ext;
  }

  // Handle path aliases: @/*, ~/*, @src/*
  if (importPath.startsWith('@/') || importPath.startsWith('~/') || importPath.startsWith('@src/')) {
    const stripped = importPath.replace(/^(@\/|~\/|@src\/)/, '');
    const aliasCandidates = [
      stripped,
      `src/${stripped}`,
      `app/${stripped}`,
      `lib/${stripped}`,
      `components/${stripped}`,
    ];

    for (const candidate of aliasCandidates) {
      for (const ext of EXTENSIONS) {
        if (nodeIds.has(candidate + ext)) return candidate + ext;
      }
    }
  }

  // Handle relative imports: ./, ../
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
    for (const ext of EXTENSIONS) {
      if (nodeIds.has(rp + ext)) return rp + ext;
    }
  }

  return null;
}
