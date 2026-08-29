/**
 * API Route: GET /api/repo
 * Fetches repository metadata, languages, and contributors from GitHub.
 * Query params: owner, repo
 */

import { NextRequest } from 'next/server';
import { fetchRepoMetadata, fetchLanguages, fetchContributors } from '@/lib/github';
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

  const cacheKey = `repo:${owner.toLowerCase()}/${repo.toLowerCase()}`;

  try {
    const data = await globalCache.getOrSet(cacheKey, CACHE_TTL.REPO, async () => {
      const [metadata, languages, contributors] = await Promise.all([
        fetchRepoMetadata(owner, repo),
        fetchLanguages(owner, repo),
        fetchContributors(owner, repo),
      ]);
      return { metadata, languages, contributors };
    });

    return apiSuccess(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
