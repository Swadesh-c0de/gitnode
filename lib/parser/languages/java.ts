/**
 * GitNode — Java & Kotlin Import Parser
 */

import type { RawImportMatch } from '@/types/parser';

/**
 * Parse Java and Kotlin import declarations.
 */
export function parseJavaImports(content: string): RawImportMatch[] {
  const results: RawImportMatch[] = [];
  const pattern = /import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) {
      results.push({ path: match[1], raw: match[0] });
    }
  }

  return results;
}
