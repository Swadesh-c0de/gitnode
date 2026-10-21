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

  let normalizedPath = importPath;

  // Normalize Python relative dot-imports
  if (sourcePath.endsWith('.py')) {
    const dotMatch = normalizedPath.match(/^(\.+)(.*)$/);
    if (dotMatch) {
      const dotCount = dotMatch[1].length;
      const rest = dotMatch[2].replace(/\./g, '/');
      const prefix = dotCount === 1 ? './' : '../'.repeat(dotCount - 1);
      normalizedPath = rest ? `${prefix}${rest}` : (dotCount === 1 ? '.' : prefix.slice(0, -1));
    }
  }

  // Normalize Rust crate/self/super/mod imports
  if (sourcePath.endsWith('.rs')) {
    if (normalizedPath.startsWith('crate::')) {
      const sub = normalizedPath.replace(/^crate::/, '').replace(/::/g, '/');
      const segments = sub.split('/');
      while (segments.length > 0) {
        const candidate = `src/${segments.join('/')}`;
        for (const ext of EXTENSIONS) {
          if (nodeIds.has(candidate + ext)) return candidate + ext;
        }
        segments.pop();
      }
    } else if (normalizedPath.startsWith('self::')) {
      normalizedPath = './' + normalizedPath.replace(/^self::/, '').replace(/::/g, '/');
    } else if (normalizedPath.startsWith('super::')) {
      normalizedPath = '../' + normalizedPath.replace(/^super::/, '').replace(/::/g, '/');
    } else if (!normalizedPath.includes('/') && !normalizedPath.includes('::') && !normalizedPath.startsWith('.')) {
      normalizedPath = `./${normalizedPath}`;
    }
  }

  if (nodeIds.has(normalizedPath)) return normalizedPath;

  // Direct check with extension candidates
  for (const ext of EXTENSIONS) {
    if (nodeIds.has(normalizedPath + ext)) return normalizedPath + ext;
  }

  // Handle path aliases: @/*, ~/*, @src/*
  if (normalizedPath.startsWith('@/') || normalizedPath.startsWith('~/') || normalizedPath.startsWith('@src/')) {
    const stripped = normalizedPath.replace(/^(@\/|~\/|@src\/)/, '');
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
  if (normalizedPath.startsWith('.')) {
    const sourceDir = sourcePath.split('/').slice(0, -1).join('/');
    const parts = normalizedPath.split('/');
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
