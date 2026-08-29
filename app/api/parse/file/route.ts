/**
 * API Route: GET /api/parse/file
 * On-demand Just-in-Time (JIT) AST import parsing for a single file.
 * Query params: owner, repo, path
 */

import { NextRequest } from 'next/server';
import { fetchFileContent } from '@/lib/github';
import { parseImports } from '@/lib/parser';
import { globalCache } from '@/lib/cache';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { CACHE_TTL } from '@/lib/constants/limits';

export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo || !path) {
    return apiError('Missing owner, repo, or path query parameters', 400);
  }

  const cacheKey = `parsefile:${owner.toLowerCase()}/${repo.toLowerCase()}:${path}`;

  try {
    const edges = await globalCache.getOrSet(cacheKey, CACHE_TTL.PARSED_FILE, async () => {
      const fileData = await fetchFileContent(owner, repo, path);
      return parseImports(path, fileData.content);
    });

    return apiSuccess({ edges });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
