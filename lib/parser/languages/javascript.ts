/**
 * GitNode — JavaScript / TypeScript Import Parser
 */

import type { RawImportMatch } from '@/types/parser';

/**
 * Parse JavaScript/TypeScript import statements (ESM, CommonJS, dynamic imports).
 */
export function parseJSImports(content: string): RawImportMatch[] {
  const results: RawImportMatch[] = [];
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
