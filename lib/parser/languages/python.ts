/**
 * GitNode — Python Import Parser
 */

import type { RawImportMatch } from '@/types/parser';

/**
 * Parse Python import and from ... import statements.
 */
export function parsePythonImports(content: string): RawImportMatch[] {
  const results: RawImportMatch[] = [];

  // 1. from x.y import z (handles relative imports .models, ..services)
  const fromPattern = /from\s+([\w.]+)\s+import\s+/g;
  let match: RegExpExecArray | null;
  while ((match = fromPattern.exec(content)) !== null) {
    if (match[1]) {
      results.push({ path: match[1], raw: match[0] });
    }
  }

  // 2. import x, y as z (handles multiple imports, aliases, and indented lines)
  const importPattern = /(?:^|\n)\s*import\s+([^\n#;]+)/g;
  while ((match = importPattern.exec(content)) !== null) {
    const rawLine = match[0];
    const modules = match[1].split(',');
    for (const mod of modules) {
      const cleanMod = mod.trim().split(/\s+as\s+/)[0].trim();
      if (cleanMod) {
        results.push({ path: cleanMod, raw: rawLine });
      }
    }
  }

  return results;
}
