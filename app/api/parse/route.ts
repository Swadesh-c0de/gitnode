/**
 * API Route: GET /api/parse
 * Bulk zipball parser for small/medium repositories with Scale-Free bypass safeguard (>100MB).
 * Query params: owner, repo, branch
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseImports, detectLanguage } from '@/lib/parser';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { SCALE_FREE_SIZE_THRESHOLD_KB, ZIP_PARSER_BATCH_SIZE } from '@/lib/constants/limits';
import type { ImportEdge } from '@/types/parser';

export const maxDuration = 60; // Allow more time for medium repos on serverless platforms

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') || 'main';

  if (!owner || !repo) {
    return apiError('Missing owner or repo query parameter', 400);
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitNode-App',
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    let targetBranch = branch;

    // 0. Check repository size and default branch from GitHub metadata
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoRes = await fetch(repoUrl, { headers });
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      const sizeKB = repoData.size || 0;
      if (repoData.default_branch) {
        targetBranch = repoData.default_branch;
      }

      // If repo size > 100,000 KB (100MB), activate Scale-Free bypass mode
      if (sizeKB > SCALE_FREE_SIZE_THRESHOLD_KB) {
        console.warn(`[Scale-Free] Bypassing zipball parsing for massive repo: ${owner}/${repo} (${sizeKB} KB)`);
        return apiSuccess({ edges: [], isScaleFree: true });
      }
    }

    // 1. Fetch zipball from GitHub
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${targetBranch}`;
    const response = await fetch(zipUrl, { headers });

    if (!response.ok) {
      // Fallback branch if specified branch fails
      const fallbackBranch = targetBranch === 'main' ? 'master' : 'main';
      const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${fallbackBranch}`;
      const fallbackResponse = await fetch(fallbackUrl, { headers });
      if (!fallbackResponse.ok) {
        return apiError('Failed to download repository zipball', fallbackResponse.status);
      }
      return await processZipball(fallbackResponse);
    }

    return await processZipball(response);
  } catch (error) {
    return handleApiError(error);
  }
}

async function processZipball(response: Response): Promise<NextResponse> {
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const edges: ImportEdge[] = [];
  const entriesToProcess: { path: string; entry: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    // Strip top-level GitHub owner-repo-sha prefix
    const parts = relativePath.split('/');
    parts.shift();
    const actualPath = parts.join('/');

    if (!actualPath) return;

    const lang = detectLanguage(actualPath);
    if (lang) {
      entriesToProcess.push({ path: actualPath, entry: zipEntry });
    }
  });

  // Process in batches to avoid memory spikes
  for (let i = 0; i < entriesToProcess.length; i += ZIP_PARSER_BATCH_SIZE) {
    const batch = entriesToProcess.slice(i, i + ZIP_PARSER_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ path, entry }) => {
        try {
          const content = await entry.async('string');
          return parseImports(path, content);
        } catch {
          return [];
        }
      })
    );

    for (const fileEdges of batchResults) {
      edges.push(...fileEdges);
    }
  }

  return apiSuccess({ edges });
}
