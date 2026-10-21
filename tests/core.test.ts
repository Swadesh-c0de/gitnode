/**
 * GitNode — Core Domain Logic Verification Test Suite
 * Validates parsers, graph builder, stack detector, caching, and utilities.
 */

import { parseImports, detectLanguage, classifyImport } from '../lib/parser';
import { detectTechStack, detectFromPackageJson, detectFromRequirements } from '../lib/detector';
import { resolveImportTarget } from '../lib/utils/path';
import { formatBytes, formatNumber, getAspectRatio } from '../lib/utils/formatters';
import { MemoryCache } from '../lib/cache/memoryCache';
import { buildGraph, findNodeByPath, flattenTree } from '../lib/graph';
import type { FileTreeNode } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 Running GitNode Core Verification Suite...\n');

  // ─── 1. Parser & Language Detection ─────────────────────────────────────────
  console.log('1. Import Parsers & Language Detection');

  assert(detectLanguage('src/index.ts') === 'typescript', 'Detects TypeScript');
  assert(detectLanguage('main.py') === 'python', 'Detects Python');
  assert(detectLanguage('lib.rs') === 'rust', 'Detects Rust');
  assert(detectLanguage('server.go') === 'go', 'Detects Go');
  assert(detectLanguage('App.java') === 'java', 'Detects Java');
  assert(detectLanguage('readme.md') === null, 'Ignores non-code extensions');
  assert(classifyImport('./components/Button', 'typescript') === 'local', 'Classifies local import');

  // TypeScript / JavaScript
  const tsCode = `
    import React, { useState } from 'react';
    import { Button } from './components/Button';
    import type { User } from '@/types/user';
    const utils = require('../utils/helpers');
    const dynamicModule = import('./lazyModule');
  `;
  const tsImports = parseImports('src/App.tsx', tsCode);
  assert(tsImports.some(i => i.target === 'react' && i.type === 'external'), 'TS: Extracts external package import');
  assert(tsImports.some(i => i.target === './components/Button' && i.type === 'local'), 'TS: Extracts relative import');
  assert(tsImports.some(i => i.target === '@/types/user' && i.type === 'local'), 'TS: Extracts alias import');
  assert(tsImports.some(i => i.target === '../utils/helpers' && i.type === 'local'), 'TS: Extracts require import');
  assert(tsImports.some(i => i.target === './lazyModule' && i.type === 'local'), 'TS: Extracts dynamic import');

  // Python
  const pyCode = `
    import os, sys
    import numpy as np
    from .models import User
    from ..services.auth import login
  `;
  const pyImports = parseImports('app/main.py', pyCode);
  assert(pyImports.some(i => i.target === 'os' && i.type === 'external'), 'Python: Extracts standard import');
  assert(pyImports.some(i => i.target === 'numpy' && i.type === 'external'), 'Python: Extracts 3rd-party import');
  assert(pyImports.some(i => i.target === '.models' && i.type === 'local'), 'Python: Extracts local relative import');
  assert(pyImports.some(i => i.target === '..services.auth' && i.type === 'local'), 'Python: Extracts parent relative import');

  // Rust
  const rsCode = `
    use std::collections::HashMap;
    use crate::models::user::User;
    mod parser;
  `;
  const rsImports = parseImports('src/main.rs', rsCode);
  assert(rsImports.some(i => i.target === 'std::collections::HashMap' && i.type === 'external'), 'Rust: Extracts std use');
  assert(rsImports.some(i => i.target === 'crate::models::user::User' && i.type === 'local'), 'Rust: Extracts crate:: local use');
  assert(rsImports.some(i => i.target === 'parser' && i.type === 'local'), 'Rust: Extracts mod declaration');

  // Go
  const goCode = `
    package main
    import (
      "fmt"
      "net/http"
      "github.com/gin-gonic/gin"
    )
  `;
  const goImports = parseImports('main.go', goCode);
  assert(goImports.some(i => i.target === 'fmt' && i.type === 'external'), 'Go: Extracts single stdlib import');
  assert(goImports.some(i => i.target === 'github.com/gin-gonic/gin' && i.type === 'external'), 'Go: Extracts external package');

  // ─── 2. Path & Alias Resolution ─────────────────────────────────────────────
  console.log('\n2. Path & Alias Resolution');

  const knownNodes = new Set([
    'src/index.ts',
    'src/components/Button.tsx',
    'src/utils/helpers.ts',
    'lib/cache.ts',
    'types/index.ts',
  ]);

  const resolvedAlias = resolveImportTarget('@/components/Button', 'src/index.ts', knownNodes);
  assert(resolvedAlias === 'src/components/Button.tsx', 'Resolves @/ alias with extension match');

  const resolvedRelative = resolveImportTarget('./components/Button', 'src/index.ts', knownNodes);
  assert(resolvedRelative === 'src/components/Button.tsx', 'Resolves relative ./ path');

  const resolvedParent = resolveImportTarget('../utils/helpers', 'src/components/Button.tsx', knownNodes);
  assert(resolvedParent === 'src/utils/helpers.ts', 'Resolves parent ../ path');

  // ─── 3. Tech Stack Detection ────────────────────────────────────────────────
  console.log('\n3. Tech Stack Detection');

  const mockPackageJson = JSON.stringify({
    dependencies: {
      next: '^14.2.0',
      react: '^18.3.0',
      '@prisma/client': '^5.10.0',
    },
    devDependencies: {
      typescript: '^5.4.0',
      tailwindcss: '^3.4.0',
    },
  });

  const detectedFromPkg = detectFromPackageJson(mockPackageJson);
  assert(detectedFromPkg.some(t => t.name === 'Next.js'), 'Detects Next.js from package.json');
  assert(detectedFromPkg.some(t => t.name === 'React'), 'Detects React from package.json');
  assert(detectedFromPkg.some(t => t.name === 'Prisma'), 'Detects Prisma from package.json');
  assert(detectedFromPkg.some(t => t.name === 'Tailwind CSS'), 'Detects Tailwind from package.json');
  assert(detectFromRequirements('flask==2.0.1\nrequests>=2.25.0').some(t => t.name === 'Flask'), 'Detects Flask from requirements.txt');

  const mockFiles = {
    'package.json': mockPackageJson,
    'Dockerfile': 'FROM node:18-alpine',
    'Cargo.toml': '[package]\nname = "rust-app"',
  };
  const stack = detectTechStack(mockFiles);
  assert(stack.some(t => t.name === 'Docker'), 'Detects Docker from Dockerfile');
  assert(stack.some(t => t.name === 'Rust'), 'Detects Rust from Cargo.toml');

  // ─── 4. In-Memory Cache with TTL ────────────────────────────────────────────
  console.log('\n4. In-Memory Cache Engine');

  const cache = new MemoryCache(3);
  cache.set('key1', 'val1', 1000);
  cache.set('key2', 'val2', 1000);
  cache.set('key3', 'val3', 1000);

  assert(cache.get('key1') === 'val1', 'Gets unexpired cache item');

  // Capacity eviction (key1 was refreshed by get, so key2 is the least recently used item)
  cache.set('key4', 'val4', 1000);
  assert(cache.get('key2') === null, 'Evicts oldest item when max capacity is reached');
  assert(cache.get('key4') === 'val4', 'Stores newest item properly');

  // getOrSet
  let fetchCount = 0;
  const res1 = await cache.getOrSet('dynKey', 1000, async () => { fetchCount++; return 'fetchedVal'; });
  const res2 = await cache.getOrSet('dynKey', 1000, async () => { fetchCount++; return 'fetchedVal'; });
  assert(res1 === 'fetchedVal' && res2 === 'fetchedVal' && fetchCount === 1, 'getOrSet calls fetcher only once');

  // ─── 5. Graph Synthesis & Tree Algorithms ───────────────────────────────────
  console.log('\n5. Graph Synthesis & Tree Algorithms');

  const mockTree: FileTreeNode[] = [
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      sha: '1',
      children: [
        { name: 'index.ts', path: 'src/index.ts', type: 'file', sha: '2', extension: 'ts', size: 120 },
        {
          name: 'components',
          path: 'src/components',
          type: 'directory',
          sha: '3',
          children: [
            { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file', sha: '4', extension: 'tsx', size: 240 },
          ],
        },
      ],
    },
    { name: 'package.json', path: 'package.json', type: 'file', sha: '5', extension: 'json', size: 500 },
  ];

  const foundNode = findNodeByPath(mockTree, 'src/components/Button.tsx');
  assert(foundNode !== null && foundNode.name === 'Button.tsx', 'findNodeByPath locates nested file node in O(depth)');

  const flat = flattenTree(mockTree);
  assert(flat.length === 5, 'flattenTree correctly flattens nested hierarchy');

  const graphResult = buildGraph(mockTree, [
    { source: 'src/index.ts', target: './components/Button', type: 'local' },
  ]);

  assert(graphResult.nodes.length === 3, 'buildGraph creates file nodes correctly');
  assert(graphResult.edges.length === 1, 'buildGraph resolves and creates import edge correctly');
  assert(graphResult.edges[0].source === 'src/index.ts' && graphResult.edges[0].target === 'src/components/Button.tsx', 'Edge targets resolved file path');

  // Scale-Free local partitioning mode
  const scaleFreeResult = buildGraph(
    mockTree,
    [{ source: 'src/index.ts', target: 'src/components/Button.tsx', type: 'local' }],
    undefined,
    500,
    true,
    'src/index.ts'
  );
  assert(scaleFreeResult.nodes.length > 0, 'Scale-free mode synthesizes active partition correctly');

  // ─── 6. Data Formatters ─────────────────────────────────────────────────────
  console.log('\n6. Data Formatters');

  assert(formatBytes(500) === '500 B', 'Formats bytes');
  assert(formatBytes(1024) === '1 KB', 'Formats kilobytes');
  assert(formatBytes(1024 * 1024 * 5.5) === '5.5 MB', 'Formats megabytes');
  assert(formatNumber(1500) === '1.5K', 'Formats number in thousands');
  assert(formatNumber(2500000) === '2.5M', 'Formats number in millions');
  assert(getAspectRatio(1920, 1080) === '16:9', 'Calculates 16:9 aspect ratio');
  assert(getAspectRatio(800, 800) === '1:1', 'Calculates 1:1 aspect ratio');

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
