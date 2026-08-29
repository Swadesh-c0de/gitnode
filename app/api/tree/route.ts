/**
 * API Route: GET /api/tree
 * Fetches the recursive file tree for a repository.
 * Query params: owner, repo
 */

import { NextRequest } from 'next/server';
import { fetchFileTree } from '@/lib/github';
import { globalCache } from '@/lib/cache';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { CACHE_TTL } from '@/lib/constants/limits';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return apiError('Missing owner or repo query parameter', 400);
  }

  const cacheKey = `tree:${owner.toLowerCase()}/${repo.toLowerCase()}`;

  try {
    const tree = await globalCache.getOrSet(cacheKey, CACHE_TTL.TREE, async () => {
      return await fetchFileTree(owner, repo);
    });

    return apiSuccess({ tree });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
