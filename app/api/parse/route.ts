import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseImports, detectLanguage } from '@/lib/parseImports';
import type { ImportEdge } from '@/types';

export const maxDuration = 60; // Allow more time for large repos (if deployed to Vercel)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') || 'main'; // default to main if not provided

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo query parameter' }, { status: 400 });
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
    // 1. Fetch the zipball from GitHub
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
    const response = await fetch(zipUrl, { headers });

    if (!response.ok) {
      if (response.status === 404) {
         // Try 'master' branch if 'main' fails
         if (branch === 'main') {
            const masterUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/master`;
            const masterResponse = await fetch(masterUrl, { headers });
            if (!masterResponse.ok) {
              return NextResponse.json({ error: 'Failed to download repository zipball' }, { status: masterResponse.status });
            }
            return await processZipball(masterResponse);
         }
      }
      return NextResponse.json({ error: 'Failed to download repository zipball' }, { status: response.status });
    }

    return await processZipball(response);
  } catch (error) {
    console.error('Failed to parse repository:', error);
    return NextResponse.json({ error: 'Internal server error during parsing' }, { status: 500 });
  }
}

async function processZipball(response: Response) {
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const edges: ImportEdge[] = [];
  
  // Extract files in parallel
  const filePromises: Promise<void>[] = [];
  
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    // The zip root contains a folder named like `owner-repo-sha/`. We need to strip it.
    const parts = relativePath.split('/');
    parts.shift(); // Remove the root folder
    const actualPath = parts.join('/');
    
    if (!actualPath) return;

    const lang = detectLanguage(actualPath);
    if (lang) {
      filePromises.push(
        zipEntry.async('string').then((content) => {
          const fileEdges = parseImports(actualPath, content);
          edges.push(...fileEdges);
        })
      );
    }
  });

  await Promise.all(filePromises);

  return NextResponse.json({ edges });
}
