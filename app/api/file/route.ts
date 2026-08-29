/**
 * API Route: GET /api/file
 * Fetches individual file content or image data from a repository.
 * Query params: owner, repo, path
 */

import { NextRequest } from 'next/server';
import { fetchFileContent } from '@/lib/github';
import { globalCache } from '@/lib/cache';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { CACHE_TTL } from '@/lib/constants/limits';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo || !path) {
    return apiError('Missing owner, repo, or path query parameter', 400);
  }

  const cacheKey = `file:${owner.toLowerCase()}/${repo.toLowerCase()}:${path}`;

  try {
    const fileData = await globalCache.getOrSet(cacheKey, CACHE_TTL.FILE, async () => {
      return await fetchFileContent(owner, repo, path);
    });

    return apiSuccess({ ...fileData, path });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
