/**
 * GitNode — Go Import Parser
 */

import type { RawImportMatch } from '@/types/parser';

/**
 * Parse Go single and block import declarations.
 */
export function parseGoImports(content: string): RawImportMatch[] {
  const results: RawImportMatch[] = [];

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
