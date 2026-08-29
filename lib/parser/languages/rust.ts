/**
 * GitNode — Rust Use & Mod Parser
 */

import type { RawImportMatch } from '@/types/parser';

/**
 * Parse Rust use and mod module declarations.
 */
export function parseRustImports(content: string): RawImportMatch[] {
  const results: RawImportMatch[] = [];
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
