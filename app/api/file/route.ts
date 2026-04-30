/**
 * API Route: GET /api/file
 * Fetches individual file content from a repository.
 * Query params: owner, repo, path
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchFileContent } from '@/lib/github';
import type { AppError } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo || !path) {
    return NextResponse.json(
      { error: 'Missing owner, repo, or path query parameter' },
      { status: 400 }
    );
  }

  try {
    const content = await fetchFileContent(owner, repo, path);
    return NextResponse.json({ content, path });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
