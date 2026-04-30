/**
 * API Route: GET /api/repo
 * Fetches repository metadata from GitHub.
 * Query params: owner, repo
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoMetadata, fetchLanguages, fetchContributors } from '@/lib/github';
import type { AppError } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing owner or repo query parameter' },
      { status: 400 }
    );
  }

  try {
    const [metadata, languages, contributors] = await Promise.all([
      fetchRepoMetadata(owner, repo),
      fetchLanguages(owner, repo),
      fetchContributors(owner, repo),
    ]);

    return NextResponse.json({ metadata, languages, contributors });
  } catch (error: unknown) {
    const appError = error as AppError;
    if (appError.type === 'not_found') {
      return NextResponse.json({ error: appError.message }, { status: 404 });
    }
    if (appError.type === 'rate_limit') {
      return NextResponse.json(
        { error: appError.message, retryAfter: appError.retryAfter },
        { status: 429 }
      );
    }
    if (appError.type === 'private_repo') {
      return NextResponse.json({ error: appError.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
