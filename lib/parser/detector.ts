/**
 * GitNode — Parser Language & Import Classification Detectors
 */

import type { ParseableLanguage } from '@/types/parser';

/**
 * Determine the parseable programming language of a file based on its extension.
 * @param filename - The filename or path
 * @returns The ParseableLanguage or null if unsupported
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
 * Classify whether an import path is a local (relative/internal) import or an external third-party package.
 * @param importPath - The import target specifier string
 * @param language - The source language
 */
export function classifyImport(importPath: string, language: ParseableLanguage): 'local' | 'external' {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('@/') || importPath.startsWith('~/')
        ? 'local'
        : 'external';
    case 'python':
      return importPath.startsWith('.') ? 'local' : 'external';
    case 'rust':
      return importPath.startsWith('crate::') ||
        importPath.startsWith('self::') ||
        importPath.startsWith('super::') ||
        !importPath.includes('::')
        ? 'local'
        : 'external';
    case 'go':
      return importPath.includes('/') && !importPath.includes('.') ? 'local' : 'external';
    case 'java':
    case 'kotlin':
      return 'external'; // Java/Kotlin imports are fully qualified
    default:
      return 'external';
  }
}
