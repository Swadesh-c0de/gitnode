import { NextRequest, NextResponse } from 'next/server';
import { fetchFileContent } from '@/lib/github';
import { parseImports } from '@/lib/parseImports';
import type { AppError } from '@/types';

export const maxDuration = 10; // Simple, lightweight lookup

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo || !path) {
    return NextResponse.json(
      { error: 'Missing owner, repo, or path query parameters' },
      { status: 400 }
    );
  }

  try {
    // Fetch only the single file's content
    const content = await fetchFileContent(owner, repo, path);
    // Parse the file imports dynamically
    const edges = parseImports(path, content);

    return NextResponse.json({ edges });
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
    return NextResponse.json(
      { error: 'Failed to retrieve or parse file content' },
      { status: 500 }
    );
  }
}
